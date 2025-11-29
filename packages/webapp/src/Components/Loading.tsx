import { Localized } from "@fluent/react";
import "./Loading.css";

export function Loading() {
  return (
    <div className="loading">
      <div className="loading-spinner"></div>
      <Localized id="loading">
        <label>Loading</label>
      </Localized>
    </div>
  );
}
