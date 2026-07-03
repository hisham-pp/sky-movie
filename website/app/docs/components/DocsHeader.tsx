import Link from "next/link";

export function DocsHeader() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-surface/40 flex justify-between items-center px-8 lg:px-16 h-20 border-b border-white/5">
      <div className="flex items-center gap-4">
        <Link href="/" className="font-display-lg text-2xl text-primary tracking-tight hover:opacity-80 transition-opacity">
          Sky Movie
        </Link>
        <span className="text-white/20">/</span>
        <span className="text-secondary text-sm font-medium">Documentation</span>
      </div>
      <Link
        href="/"
        className="px-5 py-2 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 text-primary font-label-md transition-all flex items-center gap-2 text-sm"
      >
        <span className="material-symbols-outlined text-sm">arrow_back</span>
        Back to Home
      </Link>
    </header>
  );
}
