export function IntroductionSection() {
  return (
    <section id="introduction" className="scroll-mt-28 space-y-6">
      <div className="p-1.5 px-4 bg-primary/10 border border-primary/20 rounded-full inline-flex items-center gap-2 text-primary font-semibold text-xs tracking-wider uppercase">
        <span className="w-2 h-2 bg-primary rounded-full animate-pulse"></span>
        Library Guide
      </div>
      <h1 className="font-display-lg text-4xl lg:text-5xl leading-tight tracking-tight text-white font-bold">
        Organizing Your <span className="gradient-text">Sky Movie Library</span>
      </h1>
      <p className="text-secondary text-base lg:text-lg leading-relaxed">
        Sky Movie features an advanced, multi-threaded parser that runs in your local environment. It extracts titles, years, season numbers, and episode tags from your file structures to find matches on TMDB automatically.
      </p>
      <p className="text-secondary text-base leading-relaxed">
        This guide details the recommended formats to ensure 100% automatic match rates on the first scan, preventing the need for manual linking or duplicates.
      </p>

      {/* App Preview Screenshot */}
      <div className="rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
        <img
          src="/screen-shots/movies-list.png"
          alt="Sky Movie library view showing movies with poster art and metadata"
          className="w-full object-cover"
        />
      </div>
    </section>
  );
}
