import React from "react";
import ReactDOMServer from "react-dom/server";
import Hello from "./hello";

export function App() {
  return (
    <div>
      App
      <Hello />
    </div>
  );
}

export function render(url, context) {
  console.log("url, context", url, context);
  return ReactDOMServer.renderToString(React.createElement(App, null));
}
