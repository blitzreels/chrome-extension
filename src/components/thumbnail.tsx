import { useState } from "react";

export function Thumbnail({
  src,
  className,
}: {
  src: string | null;
  className: string;
}) {
  const [failed, setFailed] = useState<string | null>(null);
  if (!src || failed === src) return null;
  return (
    <img
      src={src}
      alt=""
      className={className}
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
      onError={() => setFailed(src)}
    />
  );
}
