import { createRoot, Root } from "react-dom/client";
import App from "./App";

declare global {
  interface Window {
    __reactRoot?: Root;
  }
}

const container = document.getElementById("root");
if (container) {
  if (!window.__reactRoot) {
    window.__reactRoot = createRoot(container);
  }
  window.__reactRoot.render(<App />);
}
