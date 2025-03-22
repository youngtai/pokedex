import { css } from "@emotion/react";

const faqStyle = css`
  color: rgb(226, 226, 226);
  padding: 20px;
  background-color: rgb(49, 49, 49);
  border-radius: 10px;
  margin-top: 20px;
  max-width: 1000px;
  width: 100%;

  h2 {
    font-family: "Press Start 2P", cursive;
    font-size: 24px;
    margin-bottom: 20px;
    text-align: center;
  }

  h3 {
    font-family: sans-serif;
    font-size: 16px;
    margin-top: 15px;
    margin-bottom: 10px;
  }

  p,
  ul {
    font-family: sans-serif;
    font-size: 12px;
    line-height: 1.5;
    margin-bottom: 15px;
  }

  ul {
    padding-left: 20px;
    list-style-type: disc;
  }

  li {
    margin-bottom: 5px;
  }

  strong {
    font-weight: bold;
  }
`;

export default function FAQ() {
  return (
    <div css={faqStyle}>
      <h2>FAQ</h2>
      <h3>What is this?</h3>
      <p>A Pokédex that can answer your Pokémon questions!</p>

      <h3>How do I interact with the Pokédex?</h3>
      <p>There are three modes of input:</p>
      <ul>
        <li>
          <strong>Text:</strong> Type questions into the input field and hit
          "SEARCH".
        </li>
        <li>
          <strong>Voice:</strong> Press and hold the circular black button until
          you see blinking, then ask a question.
        </li>
        <li>
          <strong>Image:</strong> Press the small red button to open your camera
          and take a photo of a Pokémon!
        </li>
      </ul>
      <p>Choose the mode that suits you best to interact with the Pokédex!</p>

      <h3>Why did you make this?</h3>
      <p>
        My son is obsessed with Pokémon and I thought he would like having a
        functioning Pokédex. We don't have specialized hardware yet, but this is
        a start.
      </p>

      <h3>Is this official or affiliated with Pokémon in any way?</h3>
      <p>No, this is for fun and again, mostly for my son.</p>
    </div>
  );
}
