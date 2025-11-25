import type { ComponentProps } from "react";
import { makeStyles } from "@fluentui/react-components";

const useStyles = makeStyles({
  pageTitle: {
    flex: "1",
    margin: "0",
    textAlign: "left",
    fontSize: "1rem",
  },
});

export interface PageTitleProps extends ComponentProps<"h4"> {
  title: string;
}

export function PageTitle(props: PageTitleProps) {
  const { title } = props;
  const styles = useStyles();
  return <h4 className={styles.pageTitle}>{title}</h4>;
}
