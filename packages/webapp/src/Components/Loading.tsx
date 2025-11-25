import { Localized } from "@fluent/react";
import { Spinner, makeStyles } from "@fluentui/react-components";

const useStyles = makeStyles({
  loading: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "1rem",
    padding: "1rem",
    textAlign: "center",
  },
});

export function Loading() {
  const styles = useStyles();
  return (
    <div className={styles.loading}>
      <Spinner size="extra-large" />
      <Localized id="loading">
        <label>Loading</label>
      </Localized>
    </div>
  );
}
