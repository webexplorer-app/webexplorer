import type { ComponentProps, ReactNode } from "react";
import {
  Dialog as FluentDialog,
  DialogSurface,
  DialogTitle,
  DialogBody,
  DialogActions,
  DialogContent,
  type DialogOpenChangeData,
  type DialogOpenChangeEvent,
} from "@fluentui/react-components";

export interface DialogProps {
  isVisible: boolean;
  onOpenChange?: (open: boolean) => void;
  children: ReactNode;
  className?: string;
}

export function Dialog(props: DialogProps) {
  const { className, isVisible, children, onOpenChange } = props;

  return (
    <FluentDialog open={isVisible} onOpenChange={(_event: DialogOpenChangeEvent, data: DialogOpenChangeData) => onOpenChange?.(data.open)}>
      <DialogSurface className={className}>
        <DialogBody>{children}</DialogBody>
      </DialogSurface>
    </FluentDialog>
  );
}

type DialogHeaderProps = ComponentProps<"div">;

export function DialogHeader(props: DialogHeaderProps) {
  return <DialogTitle>{props.children}</DialogTitle>;
}

type DialogMainProps = ComponentProps<"div">;

export function DialogMain(props: DialogMainProps) {
  return <DialogContent>{props.children}</DialogContent>;
}

type DialogFooterProps = ComponentProps<"div">;

export function DialogFooter(props: DialogFooterProps) {
  return <DialogActions>{props.children}</DialogActions>;
}
