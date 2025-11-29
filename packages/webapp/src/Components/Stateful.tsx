import type { ComponentProps } from "react";
import { Loading } from "./Loading";
import { Localized } from "@fluent/react";
import "./Stateful.css";

export enum State {
  Initial,
  Loading,
  Failure,
  Success,
}

export interface StatefulProps extends ComponentProps<"div"> {
  state: State;
}

export function Stateful(props: StatefulProps) {
  const { state, children } = props;

  let content = null;
  switch (state) {
    case State.Initial:
      content = <Loading />;
      break;
    case State.Loading:
      content = <Loading />;
      break;
    case State.Success:
      content = children;
      break;
    case State.Failure:
      content = (
        <div className="message-bar error">
          <div className="message-bar-body">
            <Localized id="loading-failure">
              <span>Loading failed</span>
            </Localized>
          </div>
        </div>
      );
      break;
  }

  return <div className="stateful">{content}</div>;
}
