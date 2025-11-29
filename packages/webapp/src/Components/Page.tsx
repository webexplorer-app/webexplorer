import type { ComponentProps } from "react";

export interface PageProps extends ComponentProps<"div"> { }

export function Page(props: PageProps) {
  const { children, className, ...rest } = props;

  return <div className={className} style={{ minHeight: '100vh' }} {...rest}>{children}</div>;
}
