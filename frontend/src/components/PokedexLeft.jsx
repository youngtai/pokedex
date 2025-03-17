import React from "react";
import LoadingAnimation from "./LoadingAnimation";
import PokemonDisplay from "./PokemonDisplay";
import { getCurrentSprite } from "../utils/spriteUtils";

export default function PokedexLeft({
  loading,
  currentPokemon,
  currentSpriteIndex,
  crySoundLoaded,
  playCry,
  cycleSprite,
}) {
  return (
    <div className="pokedex-left">
      <div className="pokedex-left-top">
        <div className="blue-light"></div>
        <div className="small-light red"></div>
        <div className="small-light yellow"></div>
      </div>

      <div className="pokedex-left-screen-container">
        <div className="pokedex-left-screen">
          {loading ? (
            <LoadingAnimation />
          ) : (
            <div className="left-screen-content">
              {currentPokemon ? (
                <div className="pokemon-image-display">
                  <div className="sprite-container">
                    {getCurrentSprite(currentPokemon, currentSpriteIndex) && (
                      <img
                        src={getCurrentSprite(
                          currentPokemon,
                          currentSpriteIndex
                        )}
                        alt={`${currentPokemon.name || "Pokémon"} sprite`}
                        className="pokemon-main-sprite"
                      />
                    )}
                  </div>
                  <div className="pokemon-name-banner">
                    <h2>{currentPokemon.name || "Unknown"}</h2>
                    <span>
                      #{(currentPokemon.id || 0).toString().padStart(3, "0")}
                    </span>
                  </div>
                </div>
              ) : (
                <PokemonDisplay pokemon={null} />
              )}
            </div>
          )}
        </div>
        <div className="pokedex-left-controls">
          <button
            onClick={playCry}
            disabled={!crySoundLoaded || !currentPokemon}
            className="cry-button"
            title="Play Pokémon cry"
          >
            <span role="img" aria-label="Sound">
              🔊
            </span>
          </button>
          <div className="d-pad">
            <div className="d-pad-row">
              <div className="d-pad-btn up"></div>
            </div>
            <div className="d-pad-row">
              <div className="d-pad-btn left"></div>
              <div className="d-pad-btn center"></div>
              <div className="d-pad-btn right"></div>
            </div>
            <div className="d-pad-row">
              <div className="d-pad-btn down"></div>
            </div>
          </div>
          <button
            onClick={cycleSprite}
            className="sprite-button"
            disabled={!currentPokemon}
            title="Change sprite view"
          >
            <span role="img" aria-label="Image">
              🔄
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
