import React, { useState } from "react";
import { detectFakeNews } from "./api";

export default function App() {
  const [text, setText] = useState("");
  const [result, setResult] = useState("");

  const handleSubmit = async () => {
    const detection = await detectFakeNews(text);
    setResult(detection);
  };

  return (
    <div>
      <h1>Fake News Detection</h1>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Enter news text here"
      />
      <button onClick={handleSubmit}>Detect</button>
      {result && (
        <div>
          <h2>Result:</h2>
          <p>{result}</p>
        </div>
      )}
    </div>
  );
}
