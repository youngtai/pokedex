import React, { useRef, useEffect } from "react";

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
    <div className="speech-controls">
      <button
        onClick={isSpeaking ? onStop : onSpeak}
        className={`speech-button ${isSpeaking ? "speaking" : ""}`}
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
        className={`speech-button push-to-talk ${
          isListening ? "listening" : isProcessing ? "processing" : ""
        }`}
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
