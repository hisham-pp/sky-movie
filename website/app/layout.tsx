import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sky Movie",
  description:
    "A local-first desktop movie and TV library manager for scanning, organizing, playing, backing up, and syncing personal media collections.",
  metadataBase: new URL("https://github.com/hisham-pp/sky-movie"),
  openGraph: {
    title: "Sky Movie",
    description:
      "Scan folders, organize metadata, play local media, keep progress, and sync your collection without a backend account.",
    images: ["/sky-movie-preview.png"]
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
