import { css, keyframes } from "@emotion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import usePokemonCry from "../hooks/usePokemonCry";
import { theme } from "../theme";
import { getCurrentSprite } from "../utils/spriteUtils";
import CameraView from "./CameraView";
import LoadingAnimation from "./LoadingAnimation";
import PokemonDisplay from "./PokemonDisplay";
import SpeechControls from "./SpeechControls";

const pokedexLeftContainerStyle = css`
  flex: 1;
  background-color: ${theme.colors.pokedexRed};
  border-radius: 15px 5px 5px 15px;
  box-shadow: -5px 5px 10px rgba(0, 0, 0, 0.3);
  overflow: hidden;
  position: relative;
  z-index: 2;
`;

const topSectionStyle = css`
  display: flex;
  align-items: center;
  padding: 15px;
  border-bottom: 3px solid ${theme.colors.pokedexDarkRed};
`;

const createPulseKeyframes = (color) => keyframes`
  0%, 100% { background-color: ${theme.colors[color]}; scale: 1; }
  50% { 
  background-color: ${getLighterColor(theme.colors[color])}; 
  scale: 1.1;
  }
`;

const getLighterColor = (rgb) => {
  // Extract RGB values
  let [r, g, b] = rgb.match(/\d+/g).map(Number);

  // Increase brightness
  r = Math.min(255, r + 100);
  g = Math.min(255, g + 100);
  b = Math.min(255, b + 100);

  // Return new RGB string
  return `rgb(${r}, ${g}, ${b})`;
};

const lightStyle = (color, size, isSmall, isBlinking, blinkDelay = 0) => css`
  position: relative;
  border-radius: 50%;
  width: ${isSmall ? size.small : size.large}px;
  height: ${isSmall ? size.small : size.large}px;
  background-color: ${theme.colors[color]};
  ${color === "pokedexBlue" &&
  css`
    border: 5px solid white;
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.3),
      inset 0 0 10px rgba(255, 255, 255, 0.5);
    margin-right: auto;
    animation: ${isBlinking
      ? css`
          ${createPulseKeyframes("pokedexBlue")} 0.8s infinite
        `
      : "none"};
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
  `}
  ${color !== "pokedexBlue" &&
  css`
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
    animation: ${isBlinking
      ? css`
          ${createPulseKeyframes(color)} 0.8s infinite ${blinkDelay}s
        `
      : "none"};
  `}
`;

const screenContainerStyle = css`
  padding: 20px;
  background-color: ${theme.colors.pokedexRed};
  display: flex;
  flex-direction: column;
  height: calc(100% - 93px);
`;

const screenStyle = css`
  background-color: ${theme.colors.screenBg};
  border-radius: 18px;
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

const leftScreenContentStyle = css`
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  position: relative;
  padding: 5px;
`;

const controlsStyle = css`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 0 10px;
`;

const dPadStyle = (isSmall) => css`
  width: ${isSmall ? "100px" : "120px"};
  height: ${isSmall ? "100px" : "120px"};
  display: flex;
  flex-direction: column;
  justify-content: center;

  .d-pad-row {
    display: flex;
    justify-content: center;

    .d-pad-btn {
      width: ${isSmall ? "20px" : "30px"};
      height: ${isSmall ? "20px" : "30px"};
      background-color: ${theme.colors.pokedexBlack};
      border-radius: 5px;

      &.up,
      &.down {
        margin: 0 20px;
      }

      &.left {
        border-top-left-radius: 5px;
        border-bottom-left-radius: 5px;
        cursor: pointer;
      }

      &.right {
        border-top-right-radius: 5px;
        border-bottom-right-radius: 5px;
        cursor: pointer;
      }
    }
  }
`;

const pokemonImageDisplayStyle = css`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  height: 100%;
`;

const spriteContainerStyle = css`
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
`;

const pokemonMainSpriteStyle = (scale, opacity) => css`
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  transform: scale(${scale});
  opacity: ${opacity};
  transition: transform 0.3s ease-in-out, opacity 0.3s ease-in-out;
`;

const pokemonNameBannerStyle = css`
  background-color: rgba(0, 0, 0, 0.5);
  color: white;
  width: 100%;
  padding: 8px 10px;
  border-radius: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-family: ${theme.fonts.pixel};
  font-size: 1rem;
  text-transform: uppercase;
`;

const pokemonNameStyle = css`
  margin: 0;
  font-size: 1.2rem;
  text-transform: capitalize;
`;

const pokemonIdStyle = css`
  font-size: 1rem;
`;

const capturedImageStyle = css`
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
`;

export default function PokedexLeft({
  loading,
  currentPokemon,
  currentSpriteIndex,
  isListening,
  isSpeaking,
  isProcessing,
  startListening,
  stopListening,
  cycleSprite,
  isCameraActive,
  setIsCameraActive,
  onImageCapture,
  capturedImage,
  isAnalyzingImage,
}) {
  const isSmallScreen = window.innerWidth <= parseInt(theme.breakpoints.mobile);
  const spriteContainerRef = useRef(null);
  const spriteRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const [spriteScale, setSpriteScale] = useState(1);
  const [spriteOpacity, setSpriteOpacity] = useState(0);

  const { crySoundLoaded, playCry } = usePokemonCry(
    currentPokemon?.cry_url,
    currentPokemon?.cry_url_backup
  );

  const calculateSpriteScale = useCallback(() => {
    if (spriteContainerRef.current && spriteRef.current) {
      const containerWidth = spriteContainerRef.current.offsetWidth;
      const containerHeight = spriteContainerRef.current.offsetHeight;
      const spriteWidth = spriteRef.current.naturalWidth;
      const spriteHeight = spriteRef.current.naturalHeight;

      if (spriteWidth === 0 || spriteHeight === 0) {
        setTimeout(calculateSpriteScale, 50);
        return;
      }

      const scaleX = (containerWidth * 0.8) / spriteWidth;
      const scaleY = (containerHeight * 0.8) / spriteHeight;
      const scale = Math.min(scaleX, scaleY);

      setSpriteScale(scale);
      setTimeout(() => setSpriteOpacity(1), 50);
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (mediaStreamRef.current) {
      console.log("Stopping camera");
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
  }, []);

  useEffect(() => {
    calculateSpriteScale();
    window.addEventListener("resize", calculateSpriteScale);

    return () => {
      window.removeEventListener("resize", calculateSpriteScale);
    };
  }, [calculateSpriteScale]);

  useEffect(() => {
    setSpriteOpacity(0);
    calculateSpriteScale();
  }, [currentPokemon, currentSpriteIndex, calculateSpriteScale]);

  const handleToggleCamera = () => {
    setIsCameraActive(!isCameraActive);
  };

  const handleImageCapture = (file) => {
    onImageCapture(file);
  };

  return (
    <div css={pokedexLeftContainerStyle}>
      <div css={topSectionStyle}>
        <div
          css={lightStyle(
            "pokedexBlue",
            { small: 40, large: 60 },
            isSmallScreen,
            isSpeaking
          )}
        />
        <div
          css={lightStyle(
            "pokedexLightRed",
            { small: 15, large: 20 },
            isSmallScreen,
            isProcessing || loading,
            0
          )}
        />
        <div
          css={lightStyle(
            "pokedexYellow",
            { small: 15, large: 20 },
            isSmallScreen,
            isProcessing || loading,
            0.2
          )}
        />
        <div
          css={lightStyle(
            "pokedexGreen",
            { small: 15, large: 20 },
            isSmallScreen,
            isProcessing || loading,
            0.4
          )}
        />
      </div>

      <div css={screenContainerStyle}>
        <div css={screenStyle}>
          {loading || isAnalyzingImage ? (
            <LoadingAnimation />
          ) : isCameraActive ? (
            <CameraView
              onCapture={handleImageCapture}
              mediaStreamRef={mediaStreamRef}
              stopCamera={stopCamera}
            />
          ) : capturedImage ? (
            <div css={leftScreenContentStyle}>
              <img
                src={URL.createObjectURL(capturedImage)}
                alt="Captured Pokemon"
                css={capturedImageStyle}
              />
            </div>
          ) : (
            <div css={leftScreenContentStyle}>
              {currentPokemon ? (
                <div css={pokemonImageDisplayStyle}>
                  <div css={spriteContainerStyle} ref={spriteContainerRef}>
                    {getCurrentSprite(currentPokemon, currentSpriteIndex) && (
                      <img
                        ref={spriteRef}
                        css={pokemonMainSpriteStyle(spriteScale, spriteOpacity)}
                        src={getCurrentSprite(
                          currentPokemon,
                          currentSpriteIndex
                        )}
                        alt={`${currentPokemon.name || "Pokémon"} sprite`}
                        onLoad={calculateSpriteScale}
                      />
                    )}
                  </div>
                  <div css={pokemonNameBannerStyle}>
                    <h2 css={pokemonNameStyle}>
                      {currentPokemon.name || "Unknown"}
                    </h2>
                    <span css={pokemonIdStyle}>
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
        <div css={controlsStyle}>
          <div
            css={css`
              display: flex;
              flex-direction: column;
              justify-content: start;
              height: 80%;
            `}
          >
            <SpeechControls
              isListening={isListening}
              isProcessing={isProcessing}
              onStartListening={startListening}
              onStopListening={stopListening}
            />
          </div>
          <div
            css={css`
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              height: 100%;
            `}
          >
            <div
              css={css`
                display: flex;
                flex-direction: row;
              `}
            >
              <button
                css={css`
                  width: 50px;
                  height: 10px;
                  border-radius: 4px;
                  background: rgb(171, 10, 10);
                  cursor: pointer;
                `}
                title={isCameraActive ? "Close camera" : "Take a photo"}
                onClick={handleToggleCamera}
                disabled={isAnalyzingImage}
              />
              <div
                css={css`
                  width: 30px;
                `}
              />
              <button
                css={css`
                  width: 50px;
                  height: 10px;
                  border-radius: 4px;
                  background: rgb(39, 58, 183);
                  cursor: pointer;
                `}
                onClick={!crySoundLoaded || !currentPokemon ? null : playCry}
                title="Play Pokémon cry"
              />
            </div>
            <div
              css={css`
                height: 20px;
              `}
            />
            <div
              css={css`
                background: ${isListening
                  ? "rgb(146, 226, 159)"
                  : "rgb(81, 173, 96)"};
                width: 120px;
                height: 70px;
                border-radius: 8px;
                border: 2px solid black;
                animation: ${isListening ? "blink 1s infinite" : "none"};

                @keyframes blink {
                  0% {
                    opacity: 1;
                  }
                  50% {
                    opacity: 0.5;
                  }
                  100% {
                    opacity: 1;
                  }
                }
              `}
            />
          </div>

          <div css={dPadStyle(isSmallScreen)}>
            <div className="d-pad-row">
              <button className="d-pad-btn up" />
            </div>
            <div className="d-pad-row">
              <button
                className="d-pad-btn left"
                onClick={!currentPokemon ? null : () => cycleSprite("left")}
                title="Cycle Pokémon sprite"
              />
              <button className="d-pad-btn center" />
              <button
                className="d-pad-btn right"
                onClick={!currentPokemon ? null : () => cycleSprite("right")}
                title="Cycle Pokémon sprite"
              />
            </div>
            <div className="d-pad-row">
              <button className="d-pad-btn down" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
