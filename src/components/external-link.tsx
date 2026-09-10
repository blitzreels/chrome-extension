import type { ComponentProps, ReactNode } from "react";

export type ExternalLinkProps = Omit<
  ComponentProps<"a">,
  "href" | "target" | "rel" | "children"
> & {
  href: string;
  children: ReactNode;
};

export function ExternalLink(props: ExternalLinkProps) {
  return <a {...props} target="_blank" rel="noopener noreferrer" />;
}
