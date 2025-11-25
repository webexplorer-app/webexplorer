import {
  type ComponentProps,
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import { makeStyles } from "@fluentui/react-components";
import wabt from "wabt";

const useStyles = makeStyles({
  wasmViewer: {
    "& p": {
      padding: "1rem",
      whiteSpace: "pre",
    },
  },
});

type PromiseValue<T> = T extends Promise<infer U> ? U : void;

type WabtModule = PromiseValue<ReturnType<typeof wabt>>;

export const WabtContext = createContext<{
  module: WabtModule | undefined;
}>({ module: undefined });

export function WabtContextProvider(props: ComponentProps<"div">) {
  const [module, setModule] = useState<WabtModule | undefined>();

  useEffect(() => {
    async function init() {
      const module = await wabt();
      setModule(module);
    }

    if (!module) {
      init();
    }
  }, [module, setModule]);

  return (
    <WabtContext.Provider value={{ module }}>
      {props.children}
    </WabtContext.Provider>
  );
}

export interface WasmViewerProps {
  file: File;
}

export function WasmViewerInner(props: WasmViewerProps) {
  const { file } = props;
  const { module } = useContext(WabtContext);
  const [code, setCode] = useState("");

  useEffect(() => {
    function init() {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as ArrayBuffer;
        const mod = module?.readWasm(new Uint8Array(result), {
          readDebugNames: true,
        });
        if (mod) {
          setCode(mod?.toText({
            foldExprs: false,
            inlineExport: false
          }));
        }
      };

      reader.readAsArrayBuffer(file);
    }

    init();
  }, [module, file]);

  const styles = useStyles();

  return (
    <div className={styles.wasmViewer}>
      <p>{code}</p>
    </div>
  );
}

export function WasmViewer(props: WasmViewerProps) {
  return (
    <WabtContextProvider>
      <WasmViewerInner {...props} />
    </WabtContextProvider>
  );
}

export default WasmViewer;
