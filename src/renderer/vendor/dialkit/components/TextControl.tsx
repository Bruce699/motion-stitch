import { useLayoutEffect, useRef } from "react";
import { observeTextSize } from "../text-autosize";

interface TextControlProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onInteractionStart?: () => void;
  onInteractionEnd?: () => void;
}

export function TextControl({
  label,
  value,
  onChange,
  placeholder,
  onInteractionStart,
  onInteractionEnd,
}: TextControlProps) {
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const sizeRef = useRef<ReturnType<typeof observeTextSize> | undefined>(
    undefined,
  );
  useLayoutEffect(() => {
    sizeRef.current = observeTextSize(inputRef.current!);
    return () => sizeRef.current?.destroy();
  }, []);
  useLayoutEffect(() => sizeRef.current?.update(), [value, placeholder]);

  return (
    <label className="dialkit-text-control">
      <span className="dialkit-text-label">{label}</span>
      <textarea
        ref={inputRef}
        rows={1}
        maxLength={4000}
        onFocus={onInteractionStart}
        onBlur={onInteractionEnd}
        className="dialkit-text-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </label>
  );
}
