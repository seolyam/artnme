"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { TEXT_COLOR_CHOICES, useCustomizer } from "./CustomizerProvider";

/**
 * Lets the customer type a word (team name, jersey number, ...) and project
 * it onto the shirt as a new text layer.
 */
export function TextAdder() {
  const { addTextAsset } = useCustomizer();
  const [text, setText] = useState("");
  const [color, setColor] = useState<string>(TEXT_COLOR_CHOICES[2].hex);

  const canSubmit = text.trim().length > 0;

  const handleSubmit = () => {
    if (!canSubmit) return;
    addTextAsset(text, color);
    setText("");
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleSubmit();
            }
          }}
          placeholder="Team name, number..."
          maxLength={24}
          aria-label="Text to print on the shirt"
          className="h-auto border-outline-variant/20 bg-surface-container-high px-4 py-3 font-headline text-sm font-bold uppercase tracking-tight text-on-surface placeholder:font-normal placeholder:normal-case placeholder:text-on-surface-variant/60 focus-visible:border-primary-container focus-visible:ring-primary-container/40 dark:text-white"
        />
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!canSubmit}
          aria-label="Add text layer"
          className="flex shrink-0 items-center gap-1 bg-primary-container px-4 font-headline text-xs font-black uppercase tracking-widest text-on-primary-container transition-all hover:brightness-110 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <span className="material-symbols-outlined text-base">add</span>
          Add
        </button>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-[10px] uppercase tracking-widest text-on-surface-variant">
          Ink
        </span>
        {TEXT_COLOR_CHOICES.map((choice) => {
          const isActive = color === choice.hex;
          return (
            <button
              key={choice.hex}
              type="button"
              onClick={() => setColor(choice.hex)}
              title={choice.name}
              aria-label={`Text color ${choice.name}`}
              className={cn(
                "h-6 w-6 border transition-transform hover:scale-110 active:scale-95",
                isActive
                  ? "border-primary-container ring-2 ring-primary-container ring-offset-2 ring-offset-background"
                  : "border-outline-variant/30",
              )}
              style={{ backgroundColor: choice.hex }}
            />
          );
        })}
      </div>
    </div>
  );
}
