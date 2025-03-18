// frontend/src/components/PokemonDisplay.jsx
import React from "react";
import styled from "@emotion/styled";
import { getCurrentSprite } from "../utils/spriteUtils";

const NoPokemonContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: ${(props) => props.theme.colors.pokedexBlack};
  opacity: 0.6;
`;

const PokeballIcon = styled.div`
  width: 80px;
  height: 80px;
  background: linear-gradient(
    to bottom,
    ${(props) => props.theme.colors.pokedexRed} 0%,
    ${(props) => props.theme.colors.pokedexRed} 50%,
    white 50%,
    white 100%
  );
  border-radius: 50%;
  border: 5px solid ${(props) => props.theme.colors.pokedexBlack};
  position: relative;
  margin-bottom: 20px;

  &::before {
    content: "";
    width: 20px;
    height: 20px;
    background-color: white;
    border: 5px solid ${(props) => props.theme.colors.pokedexBlack};
    border-radius: 50%;
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
  }
`;

const DisplayContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: center;
  height: 100%;
  width: 100%;
  padding: 10px;
`;

const SpriteContainer = styled.div`
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

const PokemonSprite = styled.img`
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

  @media (max-width: ${(props) => props.theme.breakpoints.mobile}) {
    max-width: 80%;
    max-height: 80%;
  }
`;

const NameBanner = styled.div`
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

  @media (max-width: ${(props) => props.theme.breakpoints.mobile}) {
    width: 90%;
  }
`;

const PokemonName = styled.h2`
  margin: 0;
  font-size: 18px;
  text-transform: capitalize;
  font-family: ${(props) => props.theme.fonts.pixel};

  @media (max-width: ${(props) => props.theme.breakpoints.mobile}) {
    font-size: 14px;
  }
`;

const PokemonId = styled.span`
  font-family: ${(props) => props.theme.fonts.pixel};
  font-size: 14px;
  color: #ffcc00;

  @media (max-width: ${(props) => props.theme.breakpoints.mobile}) {
    font-size: 12px;
  }
`;

export default function PokemonDisplay({ pokemon }) {
  if (!pokemon) {
    return (
      <NoPokemonContainer>
        <PokeballIcon />
        <p>No Pokémon data available</p>
      </NoPokemonContainer>
    );
  }

  return (
    <DisplayContainer>
      <SpriteContainer>
        {getCurrentSprite(pokemon, 0) && (
          <PokemonSprite
            src={getCurrentSprite(pokemon, 0)}
            alt={`${pokemon.name || "Pokémon"} sprite`}
          />
        )}
      </SpriteContainer>
      <NameBanner>
        <PokemonName>{pokemon.name || "Unknown"}</PokemonName>
        <PokemonId>#{(pokemon.id || 0).toString().padStart(3, "0")}</PokemonId>
      </NameBanner>
    </DisplayContainer>
  );
}
