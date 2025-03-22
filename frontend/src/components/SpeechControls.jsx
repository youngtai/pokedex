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
  cursor: pointer;
  border-radius: 50%;
  background-color: ${theme.colors.pokedexBlack};
  width: 48px;
  height: 48px;
  user-select: none;
  touch-action: none;
  transition: transform 0.1s, background-color 0.1s;

  &:active:not(:disabled) {
    transform: scale(0.95);
  }

  &.listening {
    background-color: ${theme.colors.pokedexBlack};
    animation: ${pulseRecording} 1.5s infinite;
  }

  &.processing {
    cursor: wait;
  }
`;

export default function SpeechControls({
  isListening,
  isProcessing,
  onStartListening,
  onStopListening,
}) {
  const micButtonRef = useRef(null);
  const isMouseDownRef = useRef(false);
  const timeoutRef = useRef(null);
  const MIN_PRESS_DURATION = 1000; // 1 second minimum press duration

  useEffect(() => {
    const micButton = micButtonRef.current;

    if (!micButton) return;

    const handleMouseDown = (e) => {
      if (!isProcessing && !isListening) {
        isMouseDownRef.current = true;
        // Start a timer to check if the press is long enough
        timeoutRef.current = setTimeout(() => {
          // Only start listening after the minimum duration
          onStartListening();
        }, MIN_PRESS_DURATION);

        e.preventDefault();
      }
    };

    const handleMouseUp = (e) => {
      if (isMouseDownRef.current) {
        isMouseDownRef.current = false;
        clearTimeout(timeoutRef.current);

        // If we've been listening (press was long enough), stop listening
        if (isListening) {
          onStopListening();
        }
        // If the press was too short, do nothing (ignore the press)

        e.preventDefault();
      }
    };

    const handleTouchStart = (e) => {
      handleMouseDown(e);
    };

    const handleTouchEnd = (e) => {
      handleMouseUp(e);
    };

    const handleMouseLeave = (e) => {
      if (isMouseDownRef.current) {
        handleMouseUp(e);
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

    // Add global mouseup for cases where the user releases outside the button
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      micButton.removeEventListener("mousedown", handleMouseDown);
      micButton.removeEventListener("mouseup", handleMouseUp);
      micButton.removeEventListener("mouseleave", handleMouseLeave);
      micButton.removeEventListener("touchstart", handleTouchStart);
      micButton.removeEventListener("touchend", handleTouchEnd);
      micButton.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("mouseup", handleMouseUp);

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isListening, isProcessing, onStartListening, onStopListening]);

  return (
    <div css={speechControlsStyle}>
      <button
        ref={micButtonRef}
        css={speechButtonStyle}
        className={isListening ? "listening" : isProcessing ? "processing" : ""}
        title={
          isProcessing
            ? "Processing speech..."
            : "Press and hold for longer than 1 second to talk"
        }
        disabled={isProcessing}
        type="button"
      >
        <span
          role="img"
          aria-label={
            isListening
              ? "Recording"
              : isProcessing
              ? "Processing"
              : "Press and hold for longer than 1 second to talk"
          }
        />
      </button>
    </div>
  );
}
