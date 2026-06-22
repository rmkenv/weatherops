import { LOCATIONS } from "@/lib/constants";
import { fetchWeather } from "@/services/weather/client";
import { fetchAlerts } from "@/services/alerts/client";
import WeatherDashboard from "@/components/WeatherDashboard";

// Revalidate page every 15 minutes (ISR)
export const revalidate = 900;

export default async function Home() {
  // Parallel fetch all locations server-side
  const results = await Promise.allSettled(
    LOCATIONS.map(async (loc) => ({
      loc,
      weather: await fetchWeather(loc.lat, loc.lon),
      alerts:  await fetchAlerts(loc.lat, loc.lon),
    }))
  );

  const initialData = results
    .filter((r): r is PromiseFulfilledResult<{
      loc: typeof LOCATIONS[number];
      weather: Awaited<ReturnType<typeof fetchWeather>>;
      alerts:  Awaited<ReturnType<typeof fetchAlerts>>;
    }> => r.status === "fulfilled")
    .map((r) => r.value);

  return <WeatherDashboard initialData={initialData} />;
}
