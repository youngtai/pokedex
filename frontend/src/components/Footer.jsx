import React from "react";
import { css } from "@emotion/react";

const footerStyle = css`
  text-align: center;
  padding: 20px;
  margin-top: 20px;
  font-family: "Press Start 2P", cursive;
  font-size: 12px;
  color: rgb(182, 225, 255);
  background-color: #1f1f1f;
`;

const linkStyle = css`
  color: #ffcb05;
  text-decoration: none;
  &:hover {
    text-decoration: underline;
  }
`;

const Footer = () => {
  return (
    <footer css={footerStyle}>
      <p>
        Made by youngtai |{" "}
        <a
          href="https://github.com/youngtai/pokedex"
          target="_blank"
          rel="noopener noreferrer"
          css={linkStyle}
        >
          GitHub
        </a>{" "}
        |{" "}
        <a
          href="https://twitter.com/youngtaiahn"
          target="_blank"
          rel="noopener noreferrer"
          css={linkStyle}
        >
          X
        </a>
      </p>
    </footer>
  );
};

export default Footer;
