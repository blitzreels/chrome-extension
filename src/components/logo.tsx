import { useId } from "react";

export function Logo() {
  const id = useId();
  return (
    <svg
      width="28"
      height="22"
      viewBox="0 0 240 174"
      fill="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient
          id={`${id}-a`}
          x1="239.358"
          y1="0"
          x2="83.0826"
          y2="136.936"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#004E30" />
          <stop offset="1" stopColor="#17FFA6" />
        </linearGradient>
        <linearGradient
          id={`${id}-b`}
          x1="275.782"
          y1="0"
          x2="119.507"
          y2="136.936"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#004E30" />
          <stop offset="1" stopColor="#17FFA6" />
        </linearGradient>
        <clipPath id={`${id}-clip`}>
          <path d="M239.358 0H0L144.04 173.763H216.494C229.121 173.763 239.358 163.526 239.358 150.899V0Z" />
        </clipPath>
      </defs>
      <g clipPath={`url(#${id}-clip)`}>
        <path
          d="M239.358 0H0L144.04 173.763H216.494C229.121 173.763 239.358 163.526 239.358 150.899V0Z"
          fill={`url(#${id}-a)`}
        />
        <path
          d="M275.782 0H36.4241L182.12 173.763H252.918C265.545 173.763 275.782 163.526 275.782 150.899V0Z"
          fill={`url(#${id}-b)`}
        />
        <path
          d="M262.773 -88.0391H23.4155L169.111 85.7238H239.91C252.537 85.7238 262.773 75.4874 262.773 62.8602V-88.0391Z"
          fill={`url(#${id}-a)`}
        />
      </g>
    </svg>
  );
}
