import React from "react";
import { css } from "@emotion/react";

const footerStyle = css`
  text-align: center;
  padding: 15px;
  margin-top: 20px;
  font-family: "Press Start 2P", cursive;
  font-size: 10px;
  color: rgb(182, 225, 255);
  background-color: #1f1f1f;

  @media (min-width: 768px) {
    font-size: 12px;
    padding: 20px;
  }
`;

const linkStyle = css`
  color: #ffcb05;
  text-decoration: none;
  &:hover {
    text-decoration: underline;
  }
`;

const linkContainerStyle = css`
  display: flex;
  justify-content: center;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
`;

const separatorStyle = css`
  color: rgb(182, 225, 255);
`;

const Footer = () => {
  return (
    <footer css={footerStyle}>
      <div css={linkContainerStyle}>
        <span>Made by youngtai</span>
        <span css={separatorStyle}>|</span>
        <a
          href="https://github.com/youngtai/pokedex"
          target="_blank"
          rel="noopener noreferrer"
          css={linkStyle}
        >
          GitHub
        </a>
        <span css={separatorStyle}>|</span>
        <a
          href="https://twitter.com/youngtaiahn"
          target="_blank"
          rel="noopener noreferrer"
          css={linkStyle}
        >
          X
        </a>
      </div>
    </footer>
  );
};

export default Footer;
