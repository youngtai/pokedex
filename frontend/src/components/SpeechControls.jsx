import React from "react";

export default function SpeechControls({
  isSpeaking,
  voiceOptions,
  selectedVoice,
  setSelectedVoice,
  onSpeak,
  onStop,
  onSelectText,
}) {
  return (
    <div className="speech-controls">
      {/* Toggle TTS button */}
      <button
        onClick={isSpeaking ? onStop : onSpeak}
        className={`speech-button ${isSpeaking ? "speaking" : ""}`}
        title={isSpeaking ? "Stop reading" : "Read aloud"}
      >
        <span
          role="img"
          aria-label={isSpeaking ? "Stop reading" : "Read aloud"}
        >
          {isSpeaking ? "🔇" : "🔈"}
        </span>
      </button>

      {/* Select text button */}
      <button
        onClick={onSelectText}
        className="select-text-button"
        title="Select text (for browser read-aloud)"
      >
        <span role="img" aria-label="Select text">
          📋
        </span>
      </button>

      {/* Button to show voice options if available */}
      {voiceOptions.length > 0 && (
        <select
          value={selectedVoice ? selectedVoice.name : ""}
          onChange={(e) => {
            const voice = voiceOptions.find((v) => v.name === e.target.value);
            if (voice) setSelectedVoice(voice);
          }}
          className="voice-select"
          title="Select voice"
        >
          {voiceOptions.map((voice) => (
            <option key={voice.name} value={voice.name}>
              {voice.name}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}
