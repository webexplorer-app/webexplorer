import type { ComponentProps, ReactNode } from "react";
import "./Dialog.css";

export interface DialogProps {
  isVisible: boolean;
  onOpenChange?: (open: boolean) => void;
  children: ReactNode;
  className?: string;
}

export function Dialog(props: DialogProps) {
  const { className, isVisible, children, onOpenChange } = props;

  if (!isVisible) return null;

  return (
    <div className="dialog-overlay" onClick={() => onOpenChange?.(false)}>
      <div className={`dialog-surface ${className || ''}`} onClick={(e) => e.stopPropagation()}>
        <div className="dialog-body">{children}</div>
      </div>
    </div>
  );
}

type DialogHeaderProps = ComponentProps<"div">;

export function DialogHeader(props: DialogHeaderProps) {
  return <div className="dialog-title">{props.children}</div>;
}

type DialogMainProps = ComponentProps<"div">;

export function DialogMain(props: DialogMainProps) {
  return <div className="dialog-content">{props.children}</div>;
}

type DialogFooterProps = ComponentProps<"div">;

export function DialogFooter(props: DialogFooterProps) {
  return <div className="dialog-actions">{props.children}</div>;
}
