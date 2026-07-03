const FAQ_ITEMS = [
  {
    question: "My movie matched the wrong TMDB entity or year",
    answer: (
      <>
        Open the <strong>Unrecognized Drawer</strong> (under the status bar or library section), search for the correct movie, and select it manually. Sky Movie will re-associate the file instantly and delete any empty duplicate movie entries.
      </>
    ),
  },
  {
    question: "A file in my library says \"Unrecognized\" and is in the Unrecognized list",
    answer: (
      <>
        This happens if the filename has no release year or season indicator (confidence below 0.5). You can link it manually using the Search bar in the Unrecognized Drawer.
      </>
    ),
  },
  {
    question: "No posters or backdrops appear after scanning",
    answer: (
      <>
        This means no TMDB API key is configured, or the key is invalid. Go to <strong className="text-white">Settings → Metadata</strong>, verify your key, then re-run the scan or manually apply metadata from the movie detail page.
      </>
    ),
  },
  {
    question: "TV show episodes are all grouped under Season 1",
    answer: (
      <>
        Your filenames are missing the <code className="text-xs bg-white/5 px-1 rounded font-mono">S01E01</code> pattern. Sky Movie falls back to Season 1 / Episode 1 when no season tag is detected. Rename your files to include the season/episode code and re-scan.
      </>
    ),
  },
  {
    question: "I want to move my library to a new machine",
    answer: (
      <>
        Use <strong className="text-white">Settings → Backups → Download Backup File</strong> to export your library database. Install Sky Movie on the new machine, import the backup, then update the library folder paths to match the new location and run a scan to re-verify files.
      </>
    ),
  },
];

export function TroubleshootingSection() {
  return (
    <section id="troubleshooting" className="scroll-mt-28 space-y-6">
      <div className="border-b border-white/5 pb-4">
        <h2 className="text-2xl lg:text-3xl text-white font-bold tracking-tight mb-2">Troubleshooting</h2>
        <p className="text-secondary text-sm">Encountered an issue? Here's how to resolve common matching bugs.</p>
      </div>

      <div className="space-y-4">
        {FAQ_ITEMS.map(({ question, answer }) => (
          <div key={question} className="glass-panel p-6 rounded-2xl space-y-2">
            <h4 className="font-bold text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-orange-400"></span>
              {question}
            </h4>
            <p className="text-secondary text-sm leading-relaxed">{answer}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
