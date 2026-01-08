import React, { StrictMode } from "react";
import { BrowserRouter } from "react-router-dom";
import App from "./App";

import { createRoot } from "react-dom/client";
import "./index.css"; // get general styling

// Set background image
document.body.style.backgroundImage = "url('/background.png')";
document.body.style.backgroundRepeat = "no-repeat";
document.body.style.backgroundPosition = "center center";
document.body.style.backgroundAttachment = "fixed";
document.body.style.backgroundSize = "cover";

const root = createRoot(document.getElementById("root"));
root.render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
);
