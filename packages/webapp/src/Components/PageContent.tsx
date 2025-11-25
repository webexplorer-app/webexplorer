import type { ComponentProps } from "react";
import { Container } from "./Container";

export interface PageContentProps extends ComponentProps<"div"> { }

export function PageContent(props: PageContentProps) {
  const { children } = props;

  return (
    <div className="page__content">
      <Container>{children}</Container>
    </div>
  );
}
