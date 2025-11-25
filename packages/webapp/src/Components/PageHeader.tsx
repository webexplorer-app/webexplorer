import type { ComponentProps } from "react";
import { Container } from "./Container";
import { makeStyles } from "@fluentui/react-components";

const useStyles = makeStyles({
  pageHeader: {
    position: "sticky",
    top: "0",
    zIndex: "100",
    boxShadow: "0 1px 1px var(--secondary)",
    backgroundColor: "white",
    "& .container": {
      display: "flex",
      alignItems: "center",
      padding: "0.5rem 1rem",
    },
  },
});

export interface PageHeaderProps extends ComponentProps<"div"> { }

export function PageHeader(props: PageHeaderProps) {
  const { children } = props;
  const styles = useStyles();

  return (
    <div className={styles.pageHeader}>
      <Container>{children}</Container>
    </div>
  );
}
