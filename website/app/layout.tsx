import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sky Movie | Your Personal Cinema, Perfected",
  description:
    "The premium media manager for the cinematic connoisseur. Scan local collections, automate metadata, and experience your library in stunning 4K HDR.",
  metadataBase: new URL("https://github.com/hisham-pp/sky-movie"),
  icons: {
    icon: '/icon.svg',
    shortcut: '/icon.svg',
    apple: '/icon.svg',
  },
  openGraph: {
    title: "Sky Movie | Your Personal Cinema, Perfected",
    description:
      "The premium media manager for the cinematic connoisseur. Scan local collections, automate metadata, and experience your library in stunning 4K HDR.",
    images: ["/sky-movie-preview.png"]
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@600;700;800&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  );
}
