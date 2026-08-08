import { Baloo_2 } from "next/font/google";

const baloo = Baloo_2({ subsets: ["latin"], weight: ["800"] });

export function Logo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 310 96"
      className={className}
      role="img"
      aria-label="Casulo"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* thread */}
      <path
        d="M37,22 C34,14 29,10 21,9"
        fill="none"
        stroke="#000"
        strokeWidth="4"
        strokeLinecap="round"
      />
      {/* leaf */}
      <path
        d="M21,9 C26,4 15,1 9,7 C6,11 13,13 21,9 Z"
        fill="#fff"
        stroke="#000"
        strokeWidth="4"
        strokeLinejoin="round"
      />
      {/* cocoon body */}
      <path
        d="M37,22 C52,22 62,40 62,58 C62,78 52,94 37,94 C22,94 12,78 12,58 C12,40 22,22 37,22 Z"
        fill="#fff"
        stroke="#000"
        strokeWidth="4"
        strokeLinejoin="round"
      />
      {/* silk wrap bands */}
      <path
        d="M14,42 Q37,34 60,42"
        fill="none"
        stroke="#000"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M12,58 Q37,50 62,58"
        fill="none"
        stroke="#000"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M14,74 Q37,82 60,74"
        fill="none"
        stroke="#000"
        strokeWidth="3"
        strokeLinecap="round"
      />
      {/* wordmark */}
      <text
        x="76"
        y="74"
        className={baloo.className}
        fontSize="58"
        fontWeight="800"
        fill="#fff"
        stroke="#000"
        strokeWidth="4"
        strokeLinejoin="round"
        paintOrder="stroke fill"
      >
        casulo
      </text>
    </svg>
  );
}
