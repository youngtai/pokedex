import React from "react";
import { css } from "@emotion/react";
import { getCurrentSprite } from "../utils/spriteUtils";

const noPokemonContainerStyle = (theme) => css`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: ${theme.colors.pokedexBlack};
  opacity: 0.6;
`;

const pokeballIconStyle = (theme) => css`
  width: 80px;
  height: 80px;
  background: linear-gradient(
    to bottom,
    ${theme.colors.pokedexRed} 0%,
    ${theme.colors.pokedexRed} 50%,
    white 50%,
    white 100%
  );
  border-radius: 50%;
  border: 5px solid ${theme.colors.pokedexBlack};
  position: relative;
  margin-bottom: 20px;

  &::before {
    content: "";
    width: 20px;
    height: 20px;
    background-color: white;
    border: 5px solid ${theme.colors.pokedexBlack};
    border-radius: 50%;
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
  }
`;

const displayContainerStyle = css`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: center;
  height: 100%;
  width: 100%;
  padding: 10px;
`;

const spriteContainerStyle = css`
  width: 100%;
  height: 70%;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  margin-bottom: 15px;
  background-color: rgba(255, 255, 255, 0.3);
  border-radius: 10px;
  box-shadow: inset 0 0 10px rgba(0, 0, 0, 0.1);
`;

const pokemonSpriteStyle = (theme) => css`
  max-width: 85%;
  max-height: 85%;
  width: auto;
  height: auto;
  object-fit: contain;
  image-rendering: pixelated;
  transform: scale(2);
  image-rendering: -moz-crisp-edges;
  image-rendering: -webkit-crisp-edges;
  image-rendering: pixelated;

  @media (max-width: ${theme.breakpoints.mobile}) {
    max-width: 80%;
    max-height: 80%;
  }
`;

const nameBannerStyle = (theme) => css`
  background-color: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 5px 15px;
  border-radius: 15px;
  margin-top: 15px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 80%;
  max-width: 250px;

  @media (max-width: ${theme.breakpoints.mobile}) {
    width: 90%;
  }
`;

const pokemonNameStyle = (theme) => css`
  margin: 0;
  font-size: 18px;
  text-transform: capitalize;
  font-family: ${theme.fonts.pixel};

  @media (max-width: ${theme.breakpoints.mobile}) {
    font-size: 14px;
  }
`;

const pokemonIdStyle = (theme) => css`
  font-family: ${theme.fonts.pixel};
  font-size: 14px;
  color: #ffcc00;

  @media (max-width: ${theme.breakpoints.mobile}) {
    font-size: 12px;
  }
`;

export default function PokemonDisplay({ pokemon }) {
  if (!pokemon) {
    return (
      <div css={noPokemonContainerStyle}>
        <div css={pokeballIconStyle} />
      </div>
    );
  }

  return (
    <div css={displayContainerStyle}>
      <div css={spriteContainerStyle}>
        {getCurrentSprite(pokemon, 0) && (
          <img
            css={pokemonSpriteStyle}
            src={getCurrentSprite(pokemon, 0)}
            alt={`${pokemon.name || "Pokémon"} sprite`}
          />
        )}
      </div>
      <div css={nameBannerStyle}>
        <h2 css={pokemonNameStyle}>{pokemon.name || "Unknown"}</h2>
        <span css={pokemonIdStyle}>
          #{(pokemon.id || 0).toString().padStart(3, "0")}
        </span>
      </div>
    </div>
  );
}
