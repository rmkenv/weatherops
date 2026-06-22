import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "WeatherOps · IQSpatial",
  description:
    "Open-source weather intelligence platform — forecasts, NWS alerts, agro-climate metrics. No API key required.",
  keywords: ["weather", "open-meteo", "NWS", "degree days", "agriculture", "geospatial"],
  authors: [{ name: "IQSpatial", url: "https://iqspatial.com" }],
  openGraph: {
    title: "WeatherOps · IQSpatial",
    description: "Free, open-source weather intelligence for operators.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Share+Tech+Mono&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  );
}
