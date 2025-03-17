import React from "react";
import { getCurrentSprite } from "../utils/spriteUtils";

export default function PokemonDisplay({ pokemon }) {
  if (!pokemon) {
    return (
      <div className="no-pokemon-selected">
        <div className="pokeball-icon"></div>
        <p>No Pokémon data available</p>
      </div>
    );
  }

  return (
    <div className="pokemon-image-display">
      <div className="sprite-container">
        {getCurrentSprite(pokemon, 0) && (
          <img
            src={getCurrentSprite(pokemon, 0)}
            alt={`${pokemon.name || "Pokémon"} sprite`}
            className="pokemon-main-sprite"
          />
        )}
      </div>
      <div className="pokemon-name-banner">
        <h2>{pokemon.name || "Unknown"}</h2>
        <span>#{(pokemon.id || 0).toString().padStart(3, "0")}</span>
      </div>
    </div>
  );
}
