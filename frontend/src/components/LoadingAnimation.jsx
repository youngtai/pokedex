import React from "react";
import { css } from "@emotion/react";

const loadingContainerStyle = css`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100%;
`;

const pokeballSpinnerStyle = (theme) => css`
  width: 80px;
  height: 80px;
  background: linear-gradient(
    to bottom,
    ${theme.colors.pokedexLightRed} 0%,
    ${theme.colors.pokedexLightRed} 50%,
    white 50%,
    white 100%
  );
  border-radius: 50%;
  border: 5px solid ${theme.colors.pokedexBlack};
  position: relative;
  animation: rotate 2s infinite linear;

  &:before {
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

  @keyframes rotate {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
`;

export default function LoadingAnimation() {
  return (
    <div css={loadingContainerStyle}>
      <div css={pokeballSpinnerStyle} />
    </div>
  );
}
