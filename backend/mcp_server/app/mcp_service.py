# backend/mcp_server/app/mcp_service.py
from mcp.server.fastmcp import FastMCP
import httpx
import sys

mcp = FastMCP(name="pokeapi-mcp")

POKEAPI_BASE = "https://pokeapi.co/api/v2"

async def make_request(url: str):
    """Make a request to the PokeAPI with error handling."""
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(url)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            print(f"An error occurred: {e}", file=sys.stderr)
    return None

@mcp.resource("pokeapi://pokemon/{name}")
async def pokemon_resource(name: str) -> str:
    """Get Pokemon details as a resource."""
    data = await make_request(f"{POKEAPI_BASE}/pokemon/{name}")
    if not data:
        return "Pokemon not found"

    types = ", ".join([t["type"]["name"] for t in data["types"]])
    abilities = ", ".join([a["ability"]["name"] for a in data["abilities"]])

    return f"""
# {data['name'].title()} (#{data['id']})

## Basic Info
- **Height**: {data['height'] / 10} m
- **Weight**: {data['weight'] / 10} kg
- **Types**: {types}
- **Base Experience**: {data['base_experience']}

## Abilities
{abilities}

## Stats
{", ".join([f"{stat['stat']['name']}: {stat['base_stat']}" for stat in data['stats']])}
"""

@mcp.tool()
async def search_pokemon(name: str) -> dict:
    """Search for a Pokemon by name or id."""
    print(f"Searching for Pokemon: {name}", file=sys.stderr)
    url = f"{POKEAPI_BASE}/pokemon/{name.lower()}"
    data = await make_request(url)

    if not data:
        return {"error": "Pokemon not found"}

    return {
        "id": data["id"],
        "name": data["name"],
        "types": [t["type"]["name"] for t in data["types"]],
        "height": data["height"] / 10,
        "weight": data["weight"] / 10,
        "abilities": [a["ability"]["name"] for a in data["abilities"]],
        "stats": {stat["stat"]["name"]: stat["base_stat"] for stat in data["stats"]},
        "sprites": {
            "front": data["sprites"]["front_default"],
            "back": data["sprites"]["back_default"]
        }
    }

@mcp.tool()
async def get_pokemon_by_type(type_name: str, limit: int = 10) -> dict:
    """Get Pokemon of a specific type."""
    url = f"{POKEAPI_BASE}/type/{type_name.lower()}"
    data = await make_request(url)

    if not data:
        return {"error": "Type not found"}

    pokemon_list = data["pokemon"][:limit]
    result = []

    for p in pokemon_list:
        pokemon_name = p["pokemon"]["name"]
        pokemon_url = p["pokemon"]["url"]
        pokemon_id = pokemon_url.split("/")[-2]
        result.append({
            "id": pokemon_id,
            "name": pokemon_name
        })

    return {
        "type": type_name,
        "pokemon": result,
        "count": len(result)
    }

@mcp.tool()
async def compare_pokemon(pokemon1: str, pokemon2: str) -> dict:
    """Compare two Pokemon side by side."""
    data1 = await make_request(f"{POKEAPI_BASE}/pokemon/{pokemon1.lower()}")
    data2 = await make_request(f"{POKEAPI_BASE}/pokemon/{pokemon2.lower()}")

    if not data1 or not data2:
        return {"error": "One or both Pokemon not found"}

    comparison = {
        "pokemon": [
            {
                "id": data1["id"],
                "name": data1["name"],
                "types": [t["type"]["name"] for t in data1["types"]],
                "height": data1["height"] / 10,
                "weight": data1["weight"] / 10,
                "base_experience": data1["base_experience"],
                "stats": {stat["stat"]["name"]: stat["base_stat"] for stat in data1["stats"]}
            },
            {
                "id": data2["id"],
                "name": data2["name"],
                "types": [t["type"]["name"] for t in data2["types"]],
                "height": data2["height"] / 10,
                "weight": data2["weight"] / 10,
                "base_experience": data2["base_experience"],
                "stats": {stat["stat"]["name"]: stat["base_stat"] for stat in data2["stats"]}
            }
        ]
    }

    return comparison

@mcp.prompt()
def pokedex_lookup() -> str:
    """Prompt for looking up Pokemon information."""
    return """
    I want to learn about a specific Pokemon. Please search the PokeAPI for detailed information.

    Pokemon Name: {{name}}

    Please include:
    - Basic information (type, height, weight)
    - Abilities
    - Base stats
    - Evolution information if available
    """

if __name__ == "__main__":
    print("Starting MCP server with stdio transport", file=sys.stderr)
    mcp.run()
