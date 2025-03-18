import React, { useRef, useEffect } from "react";
import { css, keyframes } from "@emotion/react";
import { theme } from "../theme";

const pulseRecording = keyframes`
  0% {
    box-shadow: 0 0 0 0 rgba(231, 76, 60, 0.7);
  }
  70% {
    box-shadow: 0 0 0 10px rgba(231, 76, 60, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(231, 76, 60, 0);
  }
`;

const speechControlsStyle = css`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: 10px;
`;

const speechButtonStyle = css`
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1.2rem;
  padding: 5px;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.2);
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  user-select: none;
  touch-action: none;
  transition: transform 0.1s, background-color 0.2s;

  &:active:not(:disabled) {
    transform: scale(0.95);
    background-color: ${theme.colors.pokedexLightRed};
  }

  &.speaking {
    background-color: rgba(255, 0, 0, 0.2);
  }

  &.listening {
    background-color: ${theme.colors.pokedexLightRed};
    animation: ${pulseRecording} 1.5s infinite;
  }

  &.processing {
    background-color: ${theme.colors.pokedexYellow};
    cursor: wait;
  }
`;

export default function SpeechControls({
  isSpeaking,
  onSpeak,
  onStop,
  isListening,
  isProcessing,
  onStartListening,
  onStopListening,
}) {
  const micButtonRef = useRef(null);
  const isMouseDownRef = useRef(false);

  useEffect(() => {
    const micButton = micButtonRef.current;

    if (!micButton) return;
    const handleMouseDown = (e) => {
      if (!isProcessing && !isListening) {
        isMouseDownRef.current = true;
        onStartListening();
        e.preventDefault();
      }
    };

    const handleMouseUp = (e) => {
      if (isMouseDownRef.current) {
        isMouseDownRef.current = false;
        if (isListening) {
          onStopListening();
        }
        e.preventDefault();
      }
    };

    const handleTouchStart = (e) => {
      if (!isProcessing && !isListening) {
        isMouseDownRef.current = true;
        onStartListening();
        e.preventDefault();
      }
    };

    const handleTouchEnd = (e) => {
      if (isMouseDownRef.current) {
        isMouseDownRef.current = false;
        if (isListening) {
          onStopListening();
        }
        e.preventDefault();
      }
    };

    const handleMouseLeave = (e) => {
      if (isMouseDownRef.current && isListening) {
        isMouseDownRef.current = false;
        onStopListening();
        e.preventDefault();
      }
    };

    const handleContextMenu = (e) => {
      if (isListening || isMouseDownRef.current) {
        e.preventDefault();
        return false;
      }
    };

    micButton.addEventListener("mousedown", handleMouseDown);
    micButton.addEventListener("mouseup", handleMouseUp);
    micButton.addEventListener("mouseleave", handleMouseLeave);
    micButton.addEventListener("touchstart", handleTouchStart, {
      passive: false,
    });
    micButton.addEventListener("touchend", handleTouchEnd, { passive: false });
    micButton.addEventListener("contextmenu", handleContextMenu);
    return () => {
      micButton.removeEventListener("mousedown", handleMouseDown);
      micButton.removeEventListener("mouseup", handleMouseUp);
      micButton.removeEventListener("mouseleave", handleMouseLeave);
      micButton.removeEventListener("touchstart", handleTouchStart);
      micButton.removeEventListener("touchend", handleTouchEnd);
      micButton.removeEventListener("contextmenu", handleContextMenu);
    };
  }, [isListening, isProcessing, onStartListening, onStopListening]);

  return (
    <div css={speechControlsStyle}>
      <button
        onClick={isSpeaking ? onStop : onSpeak}
        css={speechButtonStyle}
        className={isSpeaking ? "speaking" : ""}
        title={isSpeaking ? "Stop reading" : "Read aloud"}
        disabled={isProcessing}
      >
        <span
          role="img"
          aria-label={isSpeaking ? "Stop reading" : "Read aloud"}
        >
          {isSpeaking ? "🔇" : "🔈"}
        </span>
      </button>

      <button
        ref={micButtonRef}
        css={speechButtonStyle}
        className={isListening ? "listening" : isProcessing ? "processing" : ""}
        title={isProcessing ? "Processing speech..." : "Push and hold to talk"}
        disabled={isProcessing}
      >
        <span
          role="img"
          aria-label={
            isListening
              ? "Recording"
              : isProcessing
              ? "Processing"
              : "Push to talk"
          }
        >
          {isListening ? "🔴" : isProcessing ? "⏳" : "🎤"}
        </span>
      </button>
    </div>
  );
}
