import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const siteUrl = "https://sky-movie-website.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Sky Movie - Desktop Movie and TV Show Library Manager",
    template: "%s | Sky Movie",
  },
  description:
    "Organize your movie and TV show collection, manage playlists and watch history, download supported YouTube videos with yt-dlp, and play media using mpv.",
  keywords: [
    "movie library manager",
    "desktop movie organizer",
    "local movie library manager",
    "movie and TV show collection manager",
    "desktop media player with movie management",
    "YouTube video downloader for desktop using yt-dlp",
    "Electron movie management application",
    "movie playlist and watch history manager",
    "Linux movie management software",
    "Windows movie library app",
    "macOS movie collection software",
    "local-first movie organizer",
    "open source movie library manager",
    "libmpv desktop player",
    "SQLite movie manager"
  ],
  authors: [{ name: "hisham-pp", url: "https://github.com/hisham-pp" }],
  creator: "hisham-pp",
  publisher: "Sky Movie",
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: "/favicon.png",
    shortcut: "/favicon.png",
    apple: "/favicon.png",
  },
  openGraph: {
    title: "Sky Movie - Desktop Movie and TV Show Library Manager",
    description:
      "Organize your movie and TV show collection, manage playlists and watch history, download supported YouTube videos with yt-dlp, and play media using mpv.",
    url: siteUrl,
    siteName: "Sky Movie",
    images: [
      {
        url: "/sky-movie-preview.png",
        width: 1200,
        height: 630,
        alt: "Sky Movie - Desktop Movie and TV Show Library Manager",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Sky Movie - Desktop Movie and TV Show Library Manager",
    description:
      "Organize your movie and TV show collection, manage playlists and watch history, download supported YouTube videos with yt-dlp, and play media using mpv.",
    images: ["/sky-movie-preview.png"],
    creator: "@hisham_pp",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: "google090c2fff4064a9a5",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "SoftwareApplication",
        "@id": `${siteUrl}/#software`,
        name: "Sky Movie",
        description:
          "A local-first desktop application for organizing movie and TV show collections, tracking watch history, creating playlists, downloading supported YouTube videos via yt-dlp, and playing high-fidelity video via native libmpv.",
        url: siteUrl,
        applicationCategory: "MultimediaApplication",
        operatingSystem: "Windows 10+, macOS 11+, Linux (Ubuntu, Debian, Fedora, Arch)",
        softwareVersion: "0.10.11",
        license: "https://opensource.org/licenses/MIT",
        downloadUrl: "https://github.com/hisham-pp/sky-movie/releases",
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "USD",
        },
        author: {
          "@type": "Person",
          name: "hisham-pp",
          url: "https://github.com/hisham-pp",
        },
        featureList: [
          "Local-first SQLite storage with zero remote server dependency",
          "Fast directory scanning for movies and TV shows",
          "Automated TMDB metadata, poster, and backdrop fetching",
          "Hardware-accelerated video playback powered by native libmpv",
          "4K UHD, HDR10+, and Dolby Vision video playback",
          "Audio boost up to 200% with real-time on-screen volume display",
          "Intuitive mouse and keyboard gesture controls",
          "Supported YouTube video downloading via yt-dlp",
          "Embedded torrent client with multi-provider search",
          "Custom playlists and automatic watch progress tracking",
          "Fuzzy library search modal with Ctrl+K shortcut"
        ],
        screenshot: [
          `${siteUrl}/screen-shots/main-screen.png`,
          `${siteUrl}/screen-shots/movie-detail-playback.png`,
          `${siteUrl}/screen-shots/playlist-view.png`,
          `${siteUrl}/screen-shots/torrent-search-results.png`,
        ],
      },
      {
        "@type": "WebSite",
        "@id": `${siteUrl}/#website`,
        url: siteUrl,
        name: "Sky Movie",
        description:
          "Official website for Sky Movie, the free and open-source desktop movie and TV show library manager.",
        publisher: {
          "@id": `${siteUrl}/#organization`,
        },
      },
      {
        "@type": "Organization",
        "@id": `${siteUrl}/#organization`,
        name: "Sky Movie Project",
        url: siteUrl,
        logo: `${siteUrl}/sky-movie-logo.svg`,
        sameAs: ["https://github.com/hisham-pp/sky-movie"],
      },
    ],
  };

  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@600;700;800&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </head>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
