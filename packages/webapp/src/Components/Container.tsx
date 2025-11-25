import type { ComponentProps } from "react";
import { makeStyles } from "@fluentui/react-components";

const useStyles = makeStyles({
  container: {
    display: "block",
    margin: "0 auto",
    width: "100%",
    maxWidth: "96rem",
  },
});

export interface ContainerProps extends ComponentProps<"div"> { }

export function Container(props: ContainerProps) {
  const styles = useStyles();
  return <div className={styles.container}>{props.children}</div>;
}
