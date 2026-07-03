import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sky Movie | Your Personal Cinema, Perfected",
  description:
    "The premium media manager for the cinematic connoisseur. Scan local collections, automate metadata, and experience your library in stunning 4K HDR with a native libmpv player.",
  keywords: [
    "media manager",
    "movie organizer",
    "video player",
    "media library",
    "4K HDR",
    "libmpv player",
    "torrent client",
    "movie collection",
    "desktop media player",
    "open source media player",
    "macOS media player",
    "Windows media player",
    "Linux media player"
  ],
  authors: [{ name: "hisham-pp" }],
  creator: "hisham-pp",
  publisher: "Sky Movie",
  metadataBase: new URL("https://sky-movie.app"),
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: '/favicon.png',
    shortcut: '/favicon.png',
    apple: '/favicon.png',
  },
  openGraph: {
    title: "Sky Movie | Your Personal Cinema, Perfected",
    description:
      "The premium media manager for the cinematic connoisseur. Scan local collections, automate metadata, and experience your library in stunning 4K HDR with a native libmpv player.",
    url: "https://sky-movie.app",
    siteName: "Sky Movie",
    images: [
      {
        url: "/sky-movie-preview.png",
        width: 1200,
        height: 630,
        alt: "Sky Movie - Premium Media Manager"
      }
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Sky Movie | Your Personal Cinema, Perfected",
    description:
      "The premium media manager for the cinematic connoisseur. Scan local collections, automate metadata, and experience your library in stunning 4K HDR with a native libmpv player.",
    images: ["/sky-movie-preview.png"],
    creator: "@hisham_pp",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: "your-google-verification-code",
  },
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "Sky Movie",
    "description": "The premium media manager for the cinematic connoisseur. Scan local collections, automate metadata, and experience your library in stunning 4K HDR with a native libmpv player.",
    "url": "https://sky-movie.app",
    "applicationCategory": "MultimediaApplication",
    "operatingSystem": "macOS, Windows, Linux",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    },
    "author": {
      "@type": "Person",
      "name": "hisham-pp",
      "url": "https://github.com/hisham-pp"
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.8",
      "ratingCount": "100"
    },
    "featureList": [
      "Instant folder scanning",
      "Automated metadata fetching",
      "4K & HDR support",
      "Native libmpv player",
      "Gesture controls",
      "Built-in torrent manager",
      "Multi-provider search",
      "Keyboard shortcuts",
      "Audio boost up to 200%",
      "Variable speed playback"
    ]
  };

  return (
    <html lang="en" className="dark">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@600;700;800&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
