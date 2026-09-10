import { buttonVariants } from "../design/button-variants";
import { ExternalLink, type ExternalLinkProps } from "./external-link";

export function ButtonLink({ className, ...props }: ExternalLinkProps) {
  return (
    <ExternalLink
      {...props}
      className={buttonVariants({
        variant: "primary",
        size: "lg",
        className,
      })}
    />
  );
}
