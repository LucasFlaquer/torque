import type { JSX, ReactNode } from "react";

interface CodeProps {
  readonly children: ReactNode;
  readonly className?: string;
}

export function Code({ children, className }: CodeProps): JSX.Element {
  return <code className={className}>{children}</code>;
}
