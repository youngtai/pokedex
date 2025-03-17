export function getAvailableSpriteKeys(pokemon) {
  if (!pokemon) return [];

  const sprites = pokemon.sprites || {};
  const animatedSprites = pokemon.animated_sprites || {};

  // Get all keys with non-null values
  const spriteKeys = [];

  // Add animated sprite keys
  Object.keys(animatedSprites).forEach((key) => {
    if (animatedSprites[key]) {
      spriteKeys.push(key);
    }
  });

  // Add regular sprite keys if not already included
  Object.keys(sprites).forEach((key) => {
    if (sprites[key] && !spriteKeys.includes(key)) {
      spriteKeys.push(key);
    }
  });

  return spriteKeys;
}

export function getCurrentSprite(pokemon, currentSpriteIndex) {
  if (!pokemon) return null;

  // Safely access sprite properties
  const sprites = pokemon.sprites || {};
  const animatedSprites = pokemon.animated_sprites || {};

  // Prioritize animated front_default sprite if available
  if (animatedSprites.front_default) {
    return animatedSprites.front_default;
  }

  // If no animated front_default, check for any animated sprite
  const animatedKeys = Object.keys(animatedSprites);
  if (animatedKeys.length > 0) {
    const firstValidAnimated = animatedKeys.find(
      (key) => animatedSprites[key]
    );
    if (firstValidAnimated) {
      return animatedSprites[firstValidAnimated];
    }
  }

  // Fallback to static front_default sprite
  if (sprites.front_default) {
    return sprites.front_default;
  }

  // Get all available sprites and select current one
  const spriteKeys = getAvailableSpriteKeys(pokemon);
  if (spriteKeys.length === 0) return null;

  // Make sure currentSpriteIndex is valid
  const validIndex = Math.min(currentSpriteIndex, spriteKeys.length - 1);
  const currentKey = spriteKeys[validIndex];

  // Check if it's in animated sprites or regular sprites
  return animatedSprites[currentKey] || sprites[currentKey] || null;
}
