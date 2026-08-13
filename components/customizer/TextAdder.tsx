"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { TEXT_COLOR_CHOICES, FONT_CHOICES, useCustomizer } from "./CustomizerProvider";

/**
 * Lets the customer type a word (team name, jersey number, ...) and project
 * it onto the shirt as a new text layer.
 */
export function TextAdder() {
  const { addTextAsset } = useCustomizer();
  const [text, setText] = useState("");
  const [color, setColor] = useState<string>(TEXT_COLOR_CHOICES[2].hex);
  const [font, setFont] = useState<string>(FONT_CHOICES[0]);

  const canSubmit = text.trim().length > 0;

  const handleSubmit = () => {
    if (!canSubmit) return;
    addTextAsset(text, color, font);
    setText("");
  };

  return (
    <div className="space-y-4 border border-outline-variant/20 bg-surface-container-high p-4">
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
          className="h-auto border-outline-variant/20 bg-surface-container-lowest px-4 py-3 font-headline text-sm font-bold uppercase tracking-tight text-on-surface placeholder:font-normal placeholder:normal-case placeholder:text-on-surface-variant/60 focus-visible:border-primary-container focus-visible:ring-primary-container/40 dark:text-white"
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

      <div className="grid grid-cols-2 gap-4">
        {/* Font Selection */}
        <div className="space-y-2">
          <span className="font-headline text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
            Font
          </span>
          <select
            value={font}
            onChange={(e) => setFont(e.target.value)}
            className="w-full border border-outline-variant/20 bg-surface-container-lowest px-2 py-2 text-xs text-on-surface focus:border-primary-container focus:outline-none"
          >
            {FONT_CHOICES.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
        </div>

        {/* Color Selection */}
        <div className="space-y-2">
          <span className="font-headline text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
            Ink Color
          </span>
          <div className="flex flex-wrap items-center gap-2">
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
            
            <div className="relative ml-1 h-6 w-6 shrink-0 overflow-hidden rounded-full border border-outline-variant/30 transition-transform hover:scale-110">
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="absolute -left-2 -top-2 h-10 w-10 cursor-pointer p-0 opacity-0"
                title="Custom color"
              />
              <div 
                className="h-full w-full pointer-events-none flex items-center justify-center text-white mix-blend-difference"
                style={{ backgroundColor: color }}
              >
                <span className="material-symbols-outlined text-[12px]">palette</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
