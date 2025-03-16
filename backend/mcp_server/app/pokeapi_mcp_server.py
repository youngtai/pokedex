import httpx
import logging
import sys
from mcp.server.fastmcp import FastMCP

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("pokeapi-mcp-server")
mcp = FastMCP("pokeapi")

POKEAPI_BASE = "https://pokeapi.co/api/v2"


async def make_request(url: str) -> dict:
    """Make a request to the PokeAPI with error handling."""
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(url)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logger.error(f"An error occurred: {e}", file=sys.stderr)
    return None


@mcp.tool()
async def get_basic_pokemon_data(pokemon_name: str) -> dict:
    """Get basic data for a pokemon by name.
    Args:
         pokemon_name (str): The name of the pokemon to get data for.
    Returns:
         dict: The basic data for the pokemon.
    """
    data = await make_request(f"{POKEAPI_BASE}/pokemon/{pokemon_name}")
    if not data:
        return {"error": "Pokemon not found"}

    # Extract only essential data
    essential_data = {
        "id": data.get("id"),
        "name": data.get("name"),
        "height": data.get("height"),
        "weight": data.get("weight"),
        "types": [t["type"]["name"] for t in data.get("types", [])],
        "abilities": [a["ability"]["name"] for a in data.get("abilities", [])],
        "base_stats": {
            stat["stat"]["name"]: stat["base_stat"] for stat in data.get("stats", [])
        },
        "sprite_url": data.get("sprites", {}).get("front_default"),
    }

    return essential_data


if __name__ == "__main__":
    logger.info("Starting PokeAPI MCP server")
    mcp.run(transport="stdio")
