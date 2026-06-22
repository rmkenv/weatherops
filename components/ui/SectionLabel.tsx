export default function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="mono text-horizon text-[10px] tracking-[2px] uppercase mb-2 border-b border-slate pb-1">
      {children}
    </div>
  );
}
