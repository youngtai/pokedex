import React from "react";
import ReactMarkdown from "react-markdown";
import SectionTabs from "./SectionTabs";
import SpeechControls from "./SpeechControls";

export default function PokedexRight({
  structuredData,
  activeSection,
  handleSectionChange,
  displayText,
  input,
  setInput,
  handleSubmit,
  loading,
  displayRef,
  contentRef,
  selectSectionText,
  isSpeaking,
  voiceOptions,
  selectedVoice,
  setSelectedVoice,
  speakCurrentSection,
  stopSpeaking,
}) {
  // Helper function to safely render structured content
  const renderStructuredContent = () => {
    if (
      !structuredData ||
      !structuredData.sections ||
      !structuredData.sections.length
    ) {
      return <ReactMarkdown>{displayText || ""}</ReactMarkdown>;
    }

    // Make sure activeSection is valid
    const validIndex = Math.min(
      activeSection,
      structuredData.sections.length - 1
    );
    const section = structuredData.sections[validIndex];

    if (!section) {
      return <ReactMarkdown>{displayText || ""}</ReactMarkdown>;
    }

    return (
      <div className="structured-content">
        <h2>{section.title}</h2>
        <div ref={contentRef}>
          <ReactMarkdown>{section.content || ""}</ReactMarkdown>
        </div>
      </div>
    );
  };

  return (
    <div className="pokedex-right">
      <div className="pokedex-right-top">
        <div className="small-light green"></div>

        <SpeechControls
          isSpeaking={isSpeaking}
          voiceOptions={voiceOptions}
          selectedVoice={selectedVoice}
          setSelectedVoice={setSelectedVoice}
          onSpeak={speakCurrentSection}
          onStop={stopSpeaking}
          onSelectText={selectSectionText}
        />
      </div>

      <div className="pokedex-right-screen-container">
        <SectionTabs
          sections={structuredData?.sections}
          activeSection={activeSection}
          handleSectionChange={handleSectionChange}
        />

        <div className="pokedex-right-screen">
          <div className="right-screen-content" ref={displayRef}>
            {renderStructuredContent()}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="pokedex-input-area">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask Pokédex..."
            disabled={loading}
            className="pokedex-input"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="pokedex-button"
          >
            SEARCH
          </button>
        </form>
      </div>
    </div>
  );
}
