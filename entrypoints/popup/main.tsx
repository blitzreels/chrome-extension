import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "../../src/styles.css";
import { PopupApp } from "../../src/popup/popup-app";

const mount = document.getElementById("root");
if (!mount) throw new Error("Popup root is missing");

createRoot(mount).render(
  <StrictMode>
    <PopupApp />
  </StrictMode>,
);
