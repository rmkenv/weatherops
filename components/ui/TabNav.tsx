import type { Tab } from "@/lib/constants";
import { TABS } from "@/lib/constants";

interface Props {
  tabs: typeof TABS;
  active: Tab;
  alertCount: number;
  onChange: (t: Tab) => void;
}

export default function TabNav({ tabs, active, alertCount, onChange }: Props) {
  return (
    <nav className="border-b border-slate px-5 flex gap-0">
      {tabs.map((t) => (
        <button
          key={t}
          onClick={() => onChange(t)}
          className={`
            mono text-[10px] tracking-widest uppercase px-3.5 py-2.5 border-b-2 transition-colors flex items-center gap-1
            ${active === t
              ? "border-horizon text-paper"
              : "border-transparent text-fog hover:text-paper"}
          `}
        >
          {t === "alerts" && alertCount > 0 && (
            <span className="text-amber">▲</span>
          )}
          {t}
          {t === "alerts" && alertCount > 0 && (
            <span className="bg-amber text-navy rounded text-[9px] px-1 font-bold">
              {alertCount}
            </span>
          )}
        </button>
      ))}
    </nav>
  );
}
