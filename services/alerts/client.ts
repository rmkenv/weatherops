export interface NwsAlert {
  id: string;
  event: string;
  headline: string;
  description: string;
  severity: "Extreme" | "Severe" | "Moderate" | "Minor" | "Unknown";
  urgency: string;
  certainty: string;
  onset: string | null;
  ends: string | null;
  areaDesc: string;
}

export async function fetchAlerts(
  lat: number,
  lon: number
): Promise<NwsAlert[]> {
  try {
    const res = await fetch(
      `https://api.weather.gov/alerts/active?point=${lat},${lon}&limit=10`,
      {
        headers: { "User-Agent": "WeatherOps/1.0 (iqspatial.com)" },
        next: { revalidate: 300 }, // 5-min ISR
      }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return (data.features ?? []).map(
      (f: {
        id: string;
        properties: {
          event: string;
          headline: string;
          description: string;
          severity: NwsAlert["severity"];
          urgency: string;
          certainty: string;
          onset: string | null;
          ends: string | null;
          areaDesc: string;
        };
      }) => ({
        id:          f.id,
        event:       f.properties.event,
        headline:    f.properties.headline,
        description: f.properties.description,
        severity:    f.properties.severity,
        urgency:     f.properties.urgency,
        certainty:   f.properties.certainty,
        onset:       f.properties.onset,
        ends:        f.properties.ends,
        areaDesc:    f.properties.areaDesc,
      })
    );
  } catch {
    return [];
  }
}

export const SEVERITY_COLORS: Record<string, string> = {
  Extreme:  "#ff4444",
  Severe:   "#f0a500",
  Moderate: "#7ec8a0",
  Minor:    "#3d7ab5",
  Unknown:  "#b8c8d8",
};
