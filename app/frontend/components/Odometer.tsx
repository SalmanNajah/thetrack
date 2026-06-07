import { motion } from "motion/react";

const DIGIT_WIDTHS: Record<string, string> = {
  "0": "0.68em",
  "1": "0.5em",
};
const DEFAULT_DIGIT_WIDTH = "0.6em";

function Digit({ char }: { char: string }) {
  if (isNaN(Number(char))) {
    return (
      <span className="inline-block h-[1em] leading-none select-none align-bottom">
        {char}
      </span>
    );
  }
  const num = Number(char);
  const width = DIGIT_WIDTHS[char] ?? DEFAULT_DIGIT_WIDTH;
  return (
    <span
      className="relative inline-block h-[1em] overflow-hidden leading-none select-none align-bottom"
      style={{ width }}
    >
      <motion.span
        initial={false}
        animate={{ y: `-${num * 10}%` }}
        transition={{ type: "spring", stiffness: 100, damping: 20, mass: 0.8 }}
        className="absolute inset-x-0 top-0 flex flex-col h-[1000%]"
      >
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
          <span
            key={n}
            className="h-[10%] flex items-center justify-center leading-none select-none shrink-0"
          >
            {n}
          </span>
        ))}
      </motion.span>
    </span>
  );
}

interface OdometerProps {
  value: string | number;
}

export function Odometer({ value }: OdometerProps) {
  const str =
    typeof value === "number"
      ? Math.round(value).toLocaleString("en-IN")
      : value.toString();
  const chars = str.split("");

  return (
    <span className="inline-flex leading-none select-none h-[1em] items-center">
      {chars.map((char, i) => (
        <Digit key={i} char={char} />
      ))}
    </span>
  );
}
