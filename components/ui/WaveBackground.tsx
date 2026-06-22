export default function WaveBackground() {
  return (
    <svg
      className="absolute inset-0 w-full h-full opacity-[0.07] pointer-events-none"
      viewBox="0 0 1200 200"
      preserveAspectRatio="none"
      aria-hidden
    >
      <path
        d="M0,100 C200,40 400,160 600,100 C800,40 1000,160 1200,100 L1200,200 L0,200 Z"
        fill="#3d7ab5"
      >
        <animate
          attributeName="d"
          dur="8s"
          repeatCount="indefinite"
          values="
            M0,100 C200,40 400,160 600,100 C800,40 1000,160 1200,100 L1200,200 L0,200 Z;
            M0,120 C200,60 400,140 600,80 C800,20 1000,140 1200,80 L1200,200 L0,200 Z;
            M0,100 C200,40 400,160 600,100 C800,40 1000,160 1200,100 L1200,200 L0,200 Z
          "
        />
      </path>
      <path
        d="M0,130 C300,70 500,180 700,130 C900,80 1100,170 1200,130 L1200,200 L0,200 Z"
        fill="#7ec8a0"
        opacity="0.5"
      >
        <animate
          attributeName="d"
          dur="11s"
          repeatCount="indefinite"
          values="
            M0,130 C300,70 500,180 700,130 C900,80 1100,170 1200,130 L1200,200 L0,200 Z;
            M0,150 C300,90 500,160 700,110 C900,60 1100,150 1200,110 L1200,200 L0,200 Z;
            M0,130 C300,70 500,180 700,130 C900,80 1100,170 1200,130 L1200,200 L0,200 Z
          "
        />
      </path>
    </svg>
  );
}
