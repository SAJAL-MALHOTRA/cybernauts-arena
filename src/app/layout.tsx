import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CYBERNAUTS ARENA | Esports Tournament Platform",
  description: "Real-time 1v1 cybersecurity and engineering championship tournament system.",
  icons: {
    icon: "/favicon.ico",
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
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </head>
      <body>{children}</body>
    </html>
  );
}
