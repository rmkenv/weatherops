import type { WeatherResponse } from "@/services/weather/types";
import type { UnitSystem } from "@/lib/units";
import { cToF, displayTemp } from "@/lib/units";
import { getWmo } from "@/lib/constants";
import Sparkline from "@/components/ui/Sparkline";
import SectionLabel from "@/components/ui/SectionLabel";

interface Props { wx: WeatherResponse; units: UnitSystem }

export default function HourlyTab({ wx, units }: Props) {
  const now   = new Date();
  const hours = wx.hourly.time
    .map((t, i) => ({ t, i }))
    .filter(({ t }) => new Date(t) >= now)
    .slice(0, 24);

  const temps48  = wx.hourly.temperature_2m.slice(0, 48).map(cToF);
  const pops48   = wx.hourly.precipitation_probability.slice(0, 48);
  const tempMin  = Math.min(...temps48).toFixed(0);
  const tempMax  = Math.max(...temps48).toFixed(0);
  const popPeak  = Math.max(...pops48);

  return (
    <div>
      <SectionLabel>Next 24 Hours</SectionLabel>
      <div className="overflow-x-auto pb-2 mb-5" style={{ scrollbarWidth: "thin" }}>
        <div className="flex gap-1.5" style={{ minWidth: "max-content", paddingBottom: 2 }}>
          {hours.map(({ t, i }) => {
            const wmo  = getWmo(wx.hourly.weather_code[i]);
            const temp = displayTemp(wx.hourly.temperature_2m[i], units);
            const pop  = wx.hourly.precipitation_probability[i];
            const hr   = new Date(t).getHours();
            const lbl  = hr === 0 ? "12a" : hr < 12 ? `${hr}a` : hr === 12 ? "12p" : `${hr - 12}p`;
            return (
              <div
                key={t}
                className={`bg-slate rounded-md px-2.5 py-2 text-center min-w-[56px] border-b-2 transition-colors hover:bg-steel/60 ${pop > 40 ? "border-lime" : "border-transparent"}`}
              >
                <div className="text-fog text-[10px] mb-1">{lbl}</div>
                <div className="text-xl leading-none mb-1">{wmo.icon}</div>
                <div className="mono text-paper text-sm font-bold">{temp}</div>
                {pop > 10 && (
                  <div className="mono text-lime text-[10px] mt-1">{pop}%</div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <SectionLabel>Temperature Trend (48h)</SectionLabel>
      <div className="bg-slate rounded-lg px-4 pt-3 pb-4 mb-4">
        <Sparkline values={temps48} color="#f0a500" width={600} height={56} />
        <div className="flex justify-between mt-2">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-0.5 bg-amber rounded" />
            <span className="mono text-fog text-[10px]">Temperature °F</span>
          </div>
          <span className="mono text-fog text-[10px]">
            {tempMin}° – {tempMax}°F range
          </span>
        </div>
      </div>

      <SectionLabel>Precip Probability (48h)</SectionLabel>
      <div className="bg-slate rounded-lg px-4 pt-3 pb-4">
        <Sparkline values={pops48} color="#7ec8a0" width={600} height={56} />
        <div className="flex justify-between mt-2">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-0.5 bg-lime rounded" />
            <span className="mono text-fog text-[10px]">Probability of Precipitation %</span>
          </div>
          <span className="mono text-fog text-[10px]">
            Peak: <span className={popPeak > 60 ? "text-amber" : "text-lime"}>{popPeak}%</span>
          </span>
        </div>
      </div>
    </div>
  );
}
