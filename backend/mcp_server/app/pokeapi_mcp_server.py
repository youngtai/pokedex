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

    # Removed unused species_data variable

    # Extract sprites and organize them
    sprites = data.get("sprites", {})
    all_sprites = {
        "default": sprites.get("front_default"),
        "shiny": sprites.get("front_shiny"),
        "female": sprites.get("front_female"),
        "shiny_female": sprites.get("front_shiny_female"),
        "back_default": sprites.get("back_default"),
        "back_shiny": sprites.get("back_shiny"),
        "back_female": sprites.get("back_female"),
        "back_shiny_female": sprites.get("back_shiny_female"),
    }

    # Filter out None values
    all_sprites = {k: v for k, v in all_sprites.items() if v}

    # Get animated versions if available (from versions.generation-v.black-white.animated)
    animated_sprites = {}
    try:
        animated = (
            sprites.get("versions", {})
            .get("generation-v", {})
            .get("black-white", {})
            .get("animated", {})
        )
        if animated:
            animated_sprites = {
                "animated_front": animated.get("front_default"),
                "animated_front_shiny": animated.get("front_shiny"),
                "animated_back": animated.get("back_default"),
                "animated_back_shiny": animated.get("back_shiny"),
                "animated_front_female": animated.get("front_female"),
                "animated_front_shiny_female": animated.get("front_shiny_female"),
                "animated_back_female": animated.get("back_female"),
                "animated_back_shiny_female": animated.get("back_shiny_female"),
            }
            # Filter out None values
            animated_sprites = {k: v for k, v in animated_sprites.items() if v}
    except Exception as e:
        logger.error(f"Error getting animated sprites: {e}")

    # Essential data with enhanced sprites and cry
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
        "sprites": all_sprites,
        "animated_sprites": animated_sprites,
        "default_sprite": sprites.get("front_default"),
        # Add cry URL
        "cry_url": f"https://play.pokemonshowdown.com/audio/cries/{data.get('name').lower()}.mp3",
        # Alternate cry source
        "cry_url_backup": f"https://projectpokemon.org/images/normal-sprite/cries/{data.get('id')}.ogg",
    }

    return essential_data


if __name__ == "__main__":
    logger.info("Starting PokeAPI MCP server")
    mcp.run(transport="stdio")
