import { useRef } from "react";

type OTPInputProps = {
  value: string;
  onChange: (value: string) => void;
};

export function OTPInput({ value, onChange }: OTPInputProps) {
  const inputs = useRef<Array<HTMLInputElement | null>>([]);
  const chars = value.padEnd(6, " ").slice(0, 6).split("");

  return (
    <div className="flex gap-2">
      {chars.map((char, index) => (
        <input
          key={index}
          ref={(node) => {
            inputs.current[index] = node;
          }}
          className="focus-ring h-12 w-12 rounded-md border border-mid-gray/40 text-center text-h3"
          maxLength={1}
          value={char.trim()}
          onChange={(event) => {
            const next = value.split("");
            next[index] = event.target.value.replace(/\D/g, "").slice(0, 1);
            const joined = next.join("").slice(0, 6);
            onChange(joined);
            if (event.target.value && index < 5) {
              inputs.current[index + 1]?.focus();
            }
          }}
          onPaste={(event) => {
            const text = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
            onChange(text);
          }}
        />
      ))}
    </div>
  );
}
