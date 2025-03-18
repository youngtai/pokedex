import React from "react";
import LoadingAnimation from "./LoadingAnimation";
import PokemonDisplay from "./PokemonDisplay";
import { getCurrentSprite } from "../utils/spriteUtils";
import styled from "@emotion/styled";
import { theme } from "../theme";

const PokedexLeftContainer = styled.div`
  flex: 1;
  background-color: ${theme.colors.pokedexRed};
  border-radius: 15px 5px 5px 15px;
  box-shadow: -5px 5px 10px rgba(0, 0, 0, 0.3);
  overflow: hidden;
  position: relative;
  z-index: 2;
`;

const TopSection = styled.div`
  display: flex;
  align-items: center;
  padding: 15px;
  border-bottom: 3px solid ${theme.colors.pokedexDarkRed};
`;

const Light = styled.div`
  position: relative;
  border-radius: 50%;

  &.blue {
    width: ${(props) => (props.small ? "40px" : "60px")};
    height: ${(props) => (props.small ? "40px" : "60px")};
    background-color: ${theme.colors.pokedexBlue};
    border: 5px solid white;
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.3),
      inset 0 0 10px rgba(255, 255, 255, 0.5);
    margin-right: auto;

    &::after {
      content: "";
      position: absolute;
      width: 20px;
      height: 20px;
      background-color: rgba(255, 255, 255, 0.6);
      border-radius: 50%;
      top: 5px;
      left: 5px;
    }
  }

  &.small {
    width: ${(props) => (props.small ? "15px" : "20px")};
    height: ${(props) => (props.small ? "15px" : "20px")};
    border: 2px solid rgba(0, 0, 0, 0.2);
    margin-left: 10px;

    &::after {
      content: "";
      position: absolute;
      width: 6px;
      height: 6px;
      background-color: rgba(255, 255, 255, 0.6);
      border-radius: 50%;
      top: 2px;
      left: 2px;
    }
  }

  &.red {
    background-color: ${theme.colors.pokedexLightRed};
  }
  &.yellow {
    background-color: ${theme.colors.pokedexYellow};
  }
  &.green {
    background-color: ${theme.colors.pokedexGreen};
  }
`;

const ScreenContainer = styled.div`
  padding: 20px;
  background-color: ${theme.colors.pokedexRed};
  display: flex;
  flex-direction: column;
  height: calc(100% - 93px);
`;

const Screen = styled.div`
  background-color: ${theme.colors.screenBg};
  border-radius: 10px;
  border: 15px solid ${theme.colors.screenBorder};
  height: 320px;
  overflow: hidden;
  position: relative;
  box-shadow: inset 0 0 10px rgba(0, 0, 0, 0.3);
  flex-grow: 1;

  @media (max-width: ${theme.breakpoints.mobile}) {
    height: 250px;
    border-width: 10px;
  }
`;

const LeftScreenContent = styled.div`
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  position: relative;
  padding: 5px;
`;

const Controls = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 0 10px;
`;

const DPad = styled.div`
  width: ${({ small }) => (small ? "100px" : "120px")};
  height: ${({ small }) => (small ? "100px" : "120px")};
  display: flex;
  flex-direction: column;
  justify-content: center;

  .d-pad-row {
    display: flex;
    justify-content: center;

    .d-pad-btn {
      width: ${({ small }) => (small ? "20px" : "30px")};
      height: ${({ small }) => (small ? "20px" : "30px")};
      background-color: ${theme.colors.pokedexBlack};
      border-radius: 5px;

      &.up,
      &.down {
        margin: 0 20px;
      }

      &.left {
        border-top-left-radius: 5px;
        border-bottom-left-radius: 5px;
      }

      &.right {
        border-top-right-radius: 5px;
        border-bottom-right-radius: 5px;
      }
    }
  }
`;

export default function PokedexLeft({
  loading,
  currentPokemon,
  currentSpriteIndex,
}) {
  const isSmallScreen = window.innerWidth <= parseInt(theme.breakpoints.mobile);

  return (
    <PokedexLeftContainer>
      <TopSection>
        <Light className="blue" small={isSmallScreen} />
        <Light className="small red" small={isSmallScreen} />
        <Light className="small yellow" small={isSmallScreen} />
        <Light className="small green" small={isSmallScreen} />
      </TopSection>

      <ScreenContainer>
        <Screen>
          {loading ? (
            <LoadingAnimation />
          ) : (
            <LeftScreenContent>
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
            </LeftScreenContent>
          )}
        </Screen>
        <Controls>
          <div
            style={{
              background: "green",
              width: 120,
              height: 60,
              borderRadius: 8,
              border: "2px solid black",
            }}
          />

          <DPad small={isSmallScreen}>
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
          </DPad>
        </Controls>
      </ScreenContainer>
    </PokedexLeftContainer>
  );
}
