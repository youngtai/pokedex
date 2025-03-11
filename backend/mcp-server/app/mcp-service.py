from typing import Any
import httpx
from mcp.server.fastmcp import FastMCP

mcp = FastMCP(name="pokeapi-mcp", host="127.0.0.1", port=8000)

POKEAPI_BASE = "https://pokeapi.co/api/v2"

async def make_request(url: str) -> dict[str, Any] | None:
    """Make a request to the PokeAPI with error handling."""
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(url)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            print(f"An error occurred: {e}")
    return None


@mcp.tool()
async def get_pokemon(name: str) -> dict[str, Any] | None:
    """Get Pokemon information by name."""
    url = f"{POKEAPI_BASE}/pokemon/{name}"
    data = await make_request(url)

    if not data:
        return "Unable to get Pokemon data, or not found."
    return data


if __name__ == "__main__":
    mcp.run(transport="sse")
