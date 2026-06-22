"use client";
import { useState } from "react";
import { FORECAST_MODELS, type ForecastModel } from "@/lib/constants";

interface Props {
  value: string;
  onChange: (modelId: string) => void;
}

export default function ModelSelector({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const current = FORECAST_MODELS.find((m) => m.id === value) ?? FORECAST_MODELS[0];

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((p) => !p)}
        className="mono text-[10px] tracking-widest bg-slate border border-steel text-fog rounded px-3 py-1 hover:border-horizon transition-colors flex items-center gap-2"
      >
        <span className="text-horizon">MODEL</span>
        <span className="text-paper font-bold">{current.shortLabel}</span>
        <span className="text-steel">{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 z-50 bg-navy border border-steel rounded-lg shadow-2xl w-80">
          <div className="px-3 py-2 border-b border-steel">
            <div className="mono text-[9px] text-horizon tracking-widest">SELECT FORECAST MODEL</div>
          </div>
          {FORECAST_MODELS.map((m) => (
            <button
              key={m.id}
              onClick={() => { onChange(m.id); setOpen(false); }}
              className={`w-full text-left px-3 py-2.5 border-b border-steel/50 last:border-0 hover:bg-slate transition-colors ${value === m.id ? "bg-steel/30" : ""}`}
            >
              <div className="flex items-center justify-between mb-0.5">
                <span className={`mono text-xs font-bold ${value === m.id ? "text-horizon" : "text-paper"}`}>
                  {m.shortLabel}
                  {value === m.id && <span className="text-lime ml-2">✓</span>}
                </span>
                <span className="mono text-[9px] text-steel">{m.resolution}</span>
              </div>
              <div className="text-fog text-[11px]">{m.label}</div>
              <div className="text-steel text-[10px] mt-0.5">{m.description}</div>
            </button>
          ))}
        </div>
      )}

      {/* backdrop */}
      {open && (
        <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
      )}
    </div>
  );
}
