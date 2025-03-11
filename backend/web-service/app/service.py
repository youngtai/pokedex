# backend/web-service/app/service.py
from typing import Dict, List, Optional, Any, Tuple
import os
import json
import asyncio
import logging
from litestar import Litestar, get, post, Request
from litestar.response import Response
from litestar.static_files import create_static_files_router
from litestar.datastructures import State
from litestar.events import listener
import uvicorn
import httpx
from litestar.di import Provide
from contextlib import asynccontextmanager

# Import MCP client libraries
from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client
import mcp.types as types

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("pokeapi-web")

# Global variables
client_session = None
mcp_connected = False
mcp_task = None
connection_lock = asyncio.Lock()

# Configure MCP server parameters
stdio_params = StdioServerParameters(
    command="python",
    args=["-m", "backend.mcp_server.app.mcp_service"],
    env=None
)

async def connect_to_mcp_server():
    """Connect to the MCP server and maintain the connection."""
    global client_session, mcp_connected
    
    while True:
        if client_session is not None and mcp_connected:
            # Connection already established, no need to reconnect
            await asyncio.sleep(5)
            continue
            
        logger.info("Connecting to MCP server...")
        try:
            async with stdio_client(stdio_params) as (read_stream, write_stream):
                async with ClientSession(read_stream, write_stream) as session:            
                    await session.initialize()
                    logger.info("MCP connection initialized successfully")
                
                    # Store the session for future use
                    client_session = session
                    mcp_connected = True
                
                    # Keep the connection alive
                    while True:
                        try:
                            # Periodically check if the connection is still valid
                            await asyncio.sleep(10)
                            await session.list_tools()
                        except Exception as e:
                            logger.error(f"MCP connection error: {e}")
                            client_session = None
                            mcp_connected = False
                            break
        except Exception as e:
            logger.error(f"Failed to connect to MCP server: {e}")
            client_session = None
            mcp_connected = False
            # Wait before retrying
            await asyncio.sleep(5)

@asynccontextmanager
async def get_mcp_client():
    """Context manager to access the MCP client."""
    global client_session, mcp_connected, mcp_task
    
    # Start the connection task if it's not already running
    if mcp_task is None or mcp_task.done():
        mcp_task = asyncio.create_task(connect_to_mcp_server())
    
    # Wait for connection to be established
    for _ in range(10):  # Try for up to 10 seconds
        if client_session is not None and mcp_connected:
            break
        await asyncio.sleep(1)
    
    if client_session is None:
        raise RuntimeError("Could not connect to MCP server")
    
    try:
        yield client_session
    except Exception as e:
        logger.error(f"Error while using MCP client: {e}")
        # Don't reset global state here, let the connection task handle reconnection

@get("/service/healthcheck")
async def healthcheck() -> Dict[str, str]:
    return {"message": "Welcome to the PokeAPI MCP Client!"}

@get("/service/pokemon/{name:str}")
async def get_pokemon(name: str) -> Dict[str, Any]:
    """Get Pokemon information using the MCP server."""
    try:
        async with get_mcp_client() as session:
            result = await session.call_tool("search_pokemon", arguments={"name": name})
            return {"data": result}
    except Exception as e:
        logger.error(f"Error in get_pokemon: {e}")
        return {"error": str(e)}

@get("/service/pokemon/type/{type_name:str}")
async def get_pokemon_by_type(type_name: str, limit: int = 10) -> Dict[str, Any]:
    try:
        async with get_mcp_client() as session:
            result = await session.call_tool("get_pokemon_by_type", arguments={
                "type_name": type_name, 
                "limit": limit
            })
            return {"data": result}
    except Exception as e:
        logger.error(f"Error in get_pokemon_by_type: {e}")
        return {"error": str(e)}

@get("/service/compare/{pokemon1:str}/{pokemon2:str}")
async def compare_pokemon(pokemon1: str, pokemon2: str) -> Dict[str, Any]:
    """Compare two Pokemon using the MCP server."""
    try:
        async with get_mcp_client() as session:
            result = await session.call_tool("compare_pokemon", arguments={
                "pokemon1": pokemon1, 
                "pokemon2": pokemon2
            })
            return {"data": result}
    except Exception as e:
        logger.error(f"Error in compare_pokemon: {e}")
        return {"error": str(e)}

@get("/service/prompts")
async def get_prompts() -> Dict[str, Any]:
    """Get available prompts from the MCP server."""
    try:
        async with get_mcp_client() as session:
            prompts = await session.list_prompts()
            return {"prompts": prompts}
    except Exception as e:
        logger.error(f"Error in get_prompts: {e}")
        return {"error": str(e)}

@get("/service/status")
async def status() -> Response:
    """Check status of the web service and MCP server."""
    # Check MCP server status
    mcp_ok = False
    tools_info = []
    
    try:
        async with get_mcp_client() as session:
            tools = await session.list_tools()
            mcp_ok = True
            tools_info = [tool.name for tool in tools]
            logger.info(f"MCP server is operational. Available tools: {tools_info}")
    except Exception as e:
        logger.error(f"Error checking MCP status: {e}")
        mcp_ok = False

    return Response(
        content={
            "web_service": "operational",
            "mcp_server": "operational" if mcp_ok else "unreachable",
            "tools": tools_info if mcp_ok else []
        },
        status_code=200 if mcp_ok else 207,  # 207 Multi-Status
        media_type="application/json"
    )

# Define startup listener to establish connection
@listener("startup")
async def startup_handler() -> None:
    global mcp_task
    # Start the connection task
    if mcp_task is None or mcp_task.done():
        mcp_task = asyncio.create_task(connect_to_mcp_server())
        logger.info("Started MCP connection task")

# Define shutdown listener
@listener("shutdown")
async def cleanup_handler() -> None:
    global client_session, mcp_connected, mcp_task
    
    logger.info("Shutting down MCP client connection")
    
    if mcp_task and not mcp_task.done():
        mcp_task.cancel()
        try:
            await mcp_task
        except asyncio.CancelledError:
            pass
    
    client_session = None
    mcp_connected = False
    logger.info("MCP client connection terminated")

static_files_router = create_static_files_router(
            directories=["frontend/dist"],
            path="/",
            html_mode=True,
            name="frontend-artifact",
            include_in_schema=False
        )

app = Litestar(
    route_handlers=[
        healthcheck,
        get_pokemon,
        get_pokemon_by_type,
        compare_pokemon,
        get_prompts,
        status,
        static_files_router,
    ],
    debug=True,
    listeners=[startup_handler, cleanup_handler],
)

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8080)
