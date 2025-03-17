import React from "react";

export default function SectionTabs({
  sections,
  activeSection,
  handleSectionChange,
}) {
  if (!sections || sections.length <= 1) return null;

  return (
    <div className="section-tabs">
      {sections.map((section, index) => (
        <button
          key={`section-${index}`}
          className={`section-tab ${activeSection === index ? "active" : ""}`}
          onClick={() => handleSectionChange(index)}
        >
          {section.title || `Section ${index + 1}`}
        </button>
      ))}
    </div>
  );
}
