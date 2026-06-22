import { NextRequest, NextResponse } from "next/server";
import { fetchWeather } from "@/services/weather/client";
import { fetchAlerts }  from "@/services/alerts/client";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lat   = parseFloat(searchParams.get("lat")   ?? "");
  const lon   = parseFloat(searchParams.get("lon")   ?? "");
  const model = searchParams.get("model") ?? "best_match";

  if (isNaN(lat) || isNaN(lon)) {
    return NextResponse.json({ error: "lat and lon required" }, { status: 400 });
  }
  try {
    const [weather, alerts] = await Promise.all([
      fetchWeather(lat, lon, model),
      fetchAlerts(lat, lon),
    ]);
    return NextResponse.json(
      { weather, alerts },
      { headers: { "Cache-Control": "public, s-maxage=900, stale-while-revalidate=1800" } }
    );
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 502 });
  }
}
