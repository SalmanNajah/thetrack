type RedactBarProps = {
  width?: string;
  height?: string;
  className?: string;
};

export function RedactBar({
  width = "w-16",
  height = "h-3.5",
  className = "",
}: RedactBarProps) {
  return (
    <span
      className={`inline-block bg-neutral-900 select-none align-middle  ${width} ${height} ${className}`}
    />
  );
}
