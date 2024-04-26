import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App, { AppEvent } from "./App";
import { Channel } from "./Utils/channel";

const channel = new Channel<AppEvent>();

const root =
  ReactDOM.createRoot(
    document.getElementById("root") as HTMLElement
  );

root.render(
  <React.StrictMode>
    <App channel={channel} />
  </React.StrictMode>
)
