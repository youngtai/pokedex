from typing import Optional
from contextlib import AsyncExitStack
import logging
from typing import Dict, Any
from litestar import Litestar, post
from litestar.response import Response
import uvicorn
from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client
from openai import OpenAI
from dotenv import load_dotenv
import json
from anthropic import Anthropic
from litestar.static_files import create_static_files_router

load_dotenv()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("pokeapi-web-server")


class MCPClient:
    def __init__(self):
        self.session: Optional[ClientSession] = None
        self.exit_stack = AsyncExitStack()
        self.openai = OpenAI()
        self.anthropic = Anthropic()

    async def get_session(self):
        if self.session is None:
            await self.initialize_session()
        return self.session

    async def initialize_session(self):
        server_params = StdioServerParameters(
            command="python",
            args=["-m", "backend.mcp_server.app.pokeapi_mcp_server"],
            env=None,
        )

        self.stdio, self.write = await self.exit_stack.enter_async_context(
            stdio_client(server_params)
        )
        self.session = await self.exit_stack.enter_async_context(
            ClientSession(self.stdio, self.write)
        )

        await self.session.initialize()

        tools = await self.session.list_tools()
        logger.info(
            f"Connected to server with tools: {', '.join([tool.name for tool in tools.tools])}"
        )
        resources = await self.session.list_resources()
        logger.info(
            f"Connected to server with resources: {', '.join([resource.name for resource in resources.resources])}"
        )

    async def process_query(self, query: str) -> str:
        """Process a query using the OpenAI API and MCP tools"""
        messages = [{"role": "user", "content": query}]

        logger.info(f"messages: {json.dumps(messages)}")

        try:
            response = await self.session.list_tools()
            available_tools = [
                {
                    "type": "function",
                    "name": tool.name,
                    "description": tool.description,
                    "parameters": tool.inputSchema,
                }
                for tool in response.tools
            ]

            completion = self.openai.responses.create(
                model="gpt-4o-mini", input=messages, tools=available_tools
            )

            logger.debug(f"completion: {json.dumps(completion.to_dict(), indent=2)}")

            if completion.output and hasattr(completion.output[0], "name"):
                tool_call = completion.output[0]
                messages.append(tool_call)

                function_name = tool_call.name
                function_args = json.loads(tool_call.arguments)
                logger.info(f"Calling tool {function_name} with args {function_args}")
                result = await self.session.call_tool(function_name, function_args)
                logger.debug(f"Result: {result.model_dump_json()}")
                messages.append(
                    {
                        "type": "function_call_output",
                        "call_id": tool_call.call_id,
                        "output": result.content[0].text,
                    }
                )

                final_response = self.openai.responses.create(
                    model="gpt-4o-mini", input=messages
                )

                return final_response.output_text
            else:
                logger.info("Model responded directly without using tools")
                return completion.output[0].content[0].text
        except Exception as e:
            logger.error(f"Error in process_query: {e}")
            return f"An error occurred while processing your query: {str(e)}"


mcp_client = MCPClient()
mcp_task = None


@post("/service/pokemon/chat")
async def pokedex_chat(data: Dict[str, str]) -> Dict[str, Any]:
    try:
        query = data.get("query", "")
        if not query:
            return Response(
                content={"error": "You need to ask something."},
                status_code=404,
                media_type="application/json",
            )
        response = await mcp_client.process_query(query)
        return Response(
            content={"data": response}, status_code=200, media_type="application/json"
        )
    except Exception as e:
        logger.error(f"There was an error chatting with Pokedex: {e}")


async def startup() -> None:
    logger.info("Running app starup")
    await mcp_client.initialize_session()


async def cleanup() -> None:
    await mcp_client.cleanup()
    mcp_client = None
    logger.info("MCP client connection terminated")


static_files_router = create_static_files_router(
    directories=["frontend/dist"],
    path="/",
    html_mode=True,
    name="frontend-artifact",
    include_in_schema=False,
)

app = Litestar(
    route_handlers=[pokedex_chat, static_files_router],
    debug=True,
    on_startup=[startup],
    on_shutdown=[cleanup],
)

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8080)
