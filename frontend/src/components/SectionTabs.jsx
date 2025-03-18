import React from "react";
import styled from "@emotion/styled";
import { theme } from "../theme";

const TabsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  margin-bottom: 10px;
  padding: 0 5px;
`;

const TabButton = styled.button`
  background-color: #ddd;
  border: 1px solid #999;
  border-radius: 5px 5px 0 0;
  padding: 5px 10px;
  font-size: 0.8rem;
  cursor: pointer;
  flex-grow: 1;
  text-transform: uppercase;
  font-weight: bold;
  color: #444;
  transition: background-color 0.2s;
  font-family: ${theme.fonts.pixel};

  &.active {
    background-color: ${theme.colors.pokedexLightRed};
    color: white;
    border-color: ${theme.colors.pokedexDarkRed};
  }

  &:hover:not(.active) {
    background-color: #eee;
  }
`;

export default function SectionTabs({
  sections,
  activeSection,
  handleSectionChange,
}) {
  if (!sections || sections.length <= 1) return null;

  return (
    <TabsContainer>
      {sections.map((section, index) => (
        <TabButton
          key={`section-${index}`}
          className={activeSection === index ? "active" : ""}
          onClick={() => handleSectionChange(index)}
        >
          {section.title || `Section ${index + 1}`}
        </TabButton>
      ))}
    </TabsContainer>
  );
}
