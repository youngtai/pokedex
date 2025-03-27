import datetime
import logging
import sys

import httpx
from backend.db.database import get_db_session, init_db
from backend.db.models.pokemon_cache import PokemonCache
from mcp.server.fastmcp import FastMCP
from sqlalchemy import select

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("pokeapi-mcp-server")
mcp = FastMCP("pokeapi")

POKEAPI_BASE = "https://pokeapi.co/api/v2"

# Initialize database connection
DATABASE_INITIALIZED = False


async def ensure_db_initialized():
    """Make sure the database is initialized."""
    global DATABASE_INITIALIZED
    if not DATABASE_INITIALIZED:
        await init_db()
        DATABASE_INITIALIZED = True


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
    # Ensure DB connection is initialized
    await ensure_db_initialized()

    # Normalize the pokemon name (lowercase, replace spaces with hyphens)
    pokemon_name = pokemon_name.lower().replace(" ", "-")

    # Check if we have a valid cached entry in the database
    cached_data = None
    need_refresh = False

    async with get_db_session() as session:
        try:
            query = select(PokemonCache).where(
                PokemonCache.pokemon_name == pokemon_name
            )
            result = await session.execute(query)
            cache_entry = result.scalars().first()

            if cache_entry:
                logger.info(f"Found cached data for {pokemon_name}")

                # Check if the cache entry is expired (older than 7 days)
                if cache_entry.is_expired():
                    logger.info(
                        f"Cached data for {pokemon_name} is expired, refreshing..."
                    )
                    need_refresh = True
                else:
                    cached_data = cache_entry.data
            else:
                logger.info(f"No cached data found for {pokemon_name}")
                need_refresh = True

        except Exception as e:
            logger.error(f"Error retrieving from cache: {e}")
            need_refresh = True

    # If we need to refresh or don't have cached data, fetch it from the API
    if need_refresh or not cached_data:
        data = await make_request(f"{POKEAPI_BASE}/pokemon/{pokemon_name}")
        if not data:
            return {"error": "Pokemon not found"}

        # Process the data
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

        # Get animated versions if available
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

        # Build the essential data
        essential_data = {
            "id": data.get("id"),
            "name": data.get("name"),
            "height": data.get("height"),
            "weight": data.get("weight"),
            "types": [t["type"]["name"] for t in data.get("types", [])],
            "abilities": [a["ability"]["name"] for a in data.get("abilities", [])],
            "base_stats": {
                stat["stat"]["name"]: stat["base_stat"]
                for stat in data.get("stats", [])
            },
            "sprites": all_sprites,
            "animated_sprites": animated_sprites,
            "default_sprite": sprites.get("front_default"),
            "cry_url": f"https://play.pokemonshowdown.com/audio/cries/{data.get('name').lower()}.mp3",
            "cry_url_backup": f"https://projectpokemon.org/images/normal-sprite/cries/{data.get('id')}.ogg",
        }

        async with get_db_session() as session:
            try:
                if need_refresh and cache_entry:
                    cache_entry.data = essential_data
                    cache_entry.last_updated = datetime.datetime.now()
                    session.add(cache_entry)
                else:
                    new_cache_entry = PokemonCache(
                        pokemon_id=essential_data["id"],
                        pokemon_name=essential_data["name"],
                        data=essential_data,
                        last_updated=datetime.datetime.now(),
                    )
                    session.add(new_cache_entry)

                await session.commit()
                logger.info(f"Successfully cached data for {pokemon_name}")

                return essential_data

            except Exception as e:
                logger.error(f"Error caching Pokemon data: {e}")
                await session.rollback()
                # If caching fails, still return the fetched data
                return essential_data

    return cached_data


@mcp.tool()
async def list_cached_pokemon() -> dict:
    """Get a list of all Pokemon data stored in the cache.

    Returns:
        dict: Information about the cached Pokemon data.
    """
    await ensure_db_initialized()

    try:
        async with get_db_session() as session:
            query = select(PokemonCache)
            result = await session.execute(query)
            cache_entries = result.scalars().all()

            pokemon_list = [
                {
                    "id": entry.pokemon_id,
                    "name": entry.pokemon_name,
                    "last_updated": entry.last_updated.isoformat()
                    if entry.last_updated
                    else None,
                    "is_expired": entry.is_expired(),
                }
                for entry in cache_entries
            ]

            return {"count": len(pokemon_list), "pokemon": pokemon_list}

    except Exception as e:
        logger.error(f"Error listing cached Pokemon: {e}")
        return {"error": str(e), "count": 0, "pokemon": []}


if __name__ == "__main__":
    logger.info("Starting PokeAPI MCP server")
    mcp.run(transport="stdio")
