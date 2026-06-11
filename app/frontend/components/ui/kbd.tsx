import * as React from "react";
import { classNames } from "@/lib/utils";

interface KbdProps extends React.HTMLAttributes<HTMLElement> {}

const Kbd = React.forwardRef<HTMLElement, KbdProps>(
  ({ className, ...props }, ref) => {
    return (
      <kbd
        ref={ref}
        className={classNames(
          "pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border border-tt-border bg-tt-bg px-1.5 font-mono text-[10px] font-medium text-tt-text-secondary",
          className,
        )}
        {...props}
      />
    );
  },
);
Kbd.displayName = "Kbd";

export { Kbd };
