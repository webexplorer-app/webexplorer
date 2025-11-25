import type { ComponentProps } from "react";
import { makeStyles } from "@fluentui/react-components";

const useStyles = makeStyles({
  page: {
    minHeight: "100vh",
  },
});

export interface PageProps extends ComponentProps<"div"> { }

export function Page(props: PageProps) {
  const { children } = props;
  const styles = useStyles();

  return <div className={styles.page}>{children}</div>;
}
