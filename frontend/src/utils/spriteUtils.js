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

  if (spriteKeys.length === 0) {
    // Add regular sprite keys if there are no animated ones
    Object.keys(sprites).forEach((key) => {
      if (sprites[key] && !spriteKeys.includes(key)) {
        spriteKeys.push(key);
      }
    });
  }

  return spriteKeys;
}

export function getCurrentSprite(pokemon, currentSpriteIndex) {
  if (!pokemon) return null;

  // Get all available sprite keys
  const spriteKeys = getAvailableSpriteKeys(pokemon);
  if (spriteKeys.length === 0) return null;

  // Make sure currentSpriteIndex is valid
  const validIndex = Math.min(
    Math.max(0, currentSpriteIndex),
    spriteKeys.length - 1
  );
  const currentKey = spriteKeys[validIndex];

  // Safely access sprite properties
  const sprites = pokemon.sprites || {};
  const animatedSprites = pokemon.animated_sprites || {};

  // Return the animated version if available, otherwise the static version
  return animatedSprites[currentKey] || sprites[currentKey] || null;
}
