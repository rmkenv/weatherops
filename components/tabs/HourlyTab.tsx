import type { WeatherResponse } from "@/services/weather/types";
import type { UnitSystem } from "@/lib/units";
import { cToF, displayTemp } from "@/lib/units";
import { getWmo } from "@/lib/constants";
import Sparkline from "@/components/ui/Sparkline";
import SectionLabel from "@/components/ui/SectionLabel";

interface Props { wx: WeatherResponse; units: UnitSystem }

export default function HourlyTab({ wx, units }: Props) {
  const now   = new Date();
  const hours = wx.hourly.time.map((t, i) => ({ t, i })).filter(({ t }) => new Date(t) >= now).slice(0, 24);
  return (
    <div>
      <SectionLabel>Next 24 Hours</SectionLabel>
      <div className="overflow-x-auto pb-1 mb-5">
        <div className="flex gap-1.5" style={{ minWidth: "max-content" }}>
          {hours.map(({ t, i }) => {
            const wmo  = getWmo(wx.hourly.weather_code[i]);
            const temp = displayTemp(wx.hourly.temperature_2m[i], units);
            const pop  = wx.hourly.precipitation_probability[i];
            const hr   = new Date(t).getHours();
            const lbl  = hr === 0 ? "12a" : hr < 12 ? `${hr}a` : hr === 12 ? "12p" : `${hr - 12}p`;
            return (
              <div key={t} className={`bg-slate rounded-md px-2.5 py-2 text-center min-w-[52px] border-b-2 ${pop > 40 ? "border-lime" : "border-transparent"}`}>
                <div className="text-fog text-[10px]">{lbl}</div>
                <div className="text-lg my-1">{wmo.icon}</div>
                <div className="mono text-paper text-sm font-bold">{temp}</div>
                {pop > 10 && <div className="text-lime text-[10px] mt-0.5">{pop}%</div>}
              </div>
            );
          })}
        </div>
      </div>
      <SectionLabel>Temperature Trend (48h)</SectionLabel>
      <div className="bg-slate rounded-lg px-4 py-3 mb-4">
        <Sparkline values={wx.hourly.temperature_2m.slice(0, 48).map(cToF)} color="#f0a500" width={600} />
        <div className="text-fog text-[10px] mt-1">
          {Math.min(...wx.hourly.temperature_2m.slice(0,48).map(cToF)).toFixed(0)}\u00b0F \u2014 {Math.max(...wx.hourly.temperature_2m.slice(0,48).map(cToF)).toFixed(0)}\u00b0F
        </div>
      </div>
      <SectionLabel>Precip Probability (48h)</SectionLabel>
      <div className="bg-slate rounded-lg px-4 py-3">
        <Sparkline values={wx.hourly.precipitation_probability.slice(0, 48)} color="#7ec8a0" width={600} />
        <div className="text-fog text-[10px] mt-1">Peak: {Math.max(...wx.hourly.precipitation_probability.slice(0, 48))}%</div>
      </div>
    </div>
  );
}
