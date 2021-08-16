import React from "react";
import ReactDom from "react-dom";
import Hello from "./hello";
export default function App() {
  return (
    <div>
      App111
      <Hello />
    </div>
  );
}
ReactDom.render(<App />, document.getElementById("root"));
