import React from "react";
import styled from "@emotion/styled";

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100%;
`;

const PokeballSpinner = styled.div`
  width: 80px;
  height: 80px;
  background: linear-gradient(
    to bottom,
    ${(props) => props.theme.colors.pokedexLightRed} 0%,
    ${(props) => props.theme.colors.pokedexLightRed} 50%,
    white 50%,
    white 100%
  );
  border-radius: 50%;
  border: 5px solid ${(props) => props.theme.colors.pokedexBlack};
  position: relative;
  animation: rotate 2s infinite linear;

  &:before {
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

  @keyframes rotate {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
`;

const LoadingText = styled.p`
  margin-top: 20px;
  font-family: ${(props) => props.theme.fonts.pixel};
  font-size: 14px;
  color: ${(props) => props.theme.colors.pokedexBlack};
`;

export default function LoadingAnimation() {
  return (
    <LoadingContainer>
      <PokeballSpinner />
      <LoadingText>Searching Pokédex database...</LoadingText>
    </LoadingContainer>
  );
}
