"use client";

import type { MouseEventHandler, ReactNode } from "react";

interface ButtonProps {
  readonly children: ReactNode;
  readonly className?: string;
  readonly onClick?: MouseEventHandler<HTMLButtonElement>;
}

export function Button({ children, className, onClick }: ButtonProps) {
  return (
    <button className={className} onClick={onClick} type="button">
      {children}
    </button>
  );
}
