import type { ComponentProps, ReactNode } from "react";
import { buttonVariants } from "../design/button-variants";

type ButtonProps = Omit<ComponentProps<"button">, "children"> & {
  children: ReactNode;
  variant: "primary" | "secondary" | "ghost";
};

export function Button({ variant, className, ...props }: ButtonProps) {
  return (
    <button
      type="button"
      {...props}
      className={buttonVariants({ variant, size: "lg", className })}
    />
  );
}
