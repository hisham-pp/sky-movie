import type { Metadata } from "next";
import { DocsHeader } from "./components/DocsHeader";
import { DocsSidebar } from "./components/DocsSidebar";
import { IntroductionSection } from "./components/sections/IntroductionSection";
import { GettingStartedSection } from "./components/sections/GettingStartedSection";
import { NamingConventionsSection } from "./components/sections/NamingConventionsSection";
import { FolderStructuresSection } from "./components/sections/FolderStructuresSection";
import { MatchingStrategiesSection } from "./components/sections/MatchingStrategiesSection";
import { MetadataTmdbSection } from "./components/sections/MetadataTmdbSection";
import { PlaylistsSection } from "./components/sections/PlaylistsSection";
import { SettingsReferenceSection } from "./components/sections/SettingsReferenceSection";
import { TroubleshootingSection } from "./components/sections/TroubleshootingSection";
import { PlayerSkinsSection } from "./components/sections/PlayerSkinsSection";
import { LinuxInstallationSection } from "./components/sections/LinuxInstallationSection";

export const metadata: Metadata = {
  title: "Documentation & Setup Guide | Sky Movie",
  description:
    "Complete documentation for Sky Movie. Learn how to configure movie and TV libraries, file naming conventions, TMDB metadata matching, Linux installation, and player skins.",
  alternates: {
    canonical: "/docs",
  },
  openGraph: {
    title: "Sky Movie Documentation - Library Setup & Installation Guide",
    description:
      "Complete documentation for Sky Movie. Learn how to configure movie and TV libraries, file naming conventions, TMDB metadata matching, Linux installation, and player skins.",
    url: "https://sky-movie-website.vercel.app/docs",
  },
};

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    {
      "@type": "ListItem",
      position: 1,
      name: "Home",
      item: "https://sky-movie-website.vercel.app",
    },
    {
      "@type": "ListItem",
      position: 2,
      name: "Documentation",
      item: "https://sky-movie-website.vercel.app/docs",
    },
  ],
};

export default function DocsPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <DocsHeader />

      {/* Main Layout */}
      <div className="min-h-screen bg-[#0F1115] text-[#e2e2e8] pt-28 pb-20 px-8 lg:px-16 max-w-7xl mx-auto flex flex-col lg:flex-row gap-12">
        <DocsSidebar />

        {/* Documentation Content Area */}
        <main className="flex-1 max-w-4xl space-y-16">
          <IntroductionSection />
          <GettingStartedSection />
          <NamingConventionsSection />
          <FolderStructuresSection />
          <MatchingStrategiesSection />
          <MetadataTmdbSection />
          <PlaylistsSection />
          <SettingsReferenceSection />
          <TroubleshootingSection />
          <PlayerSkinsSection />
          <LinuxInstallationSection />
        </main>
      </div>
    </>
  );
}
