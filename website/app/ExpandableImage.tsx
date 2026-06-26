'use client';

import { useState, useEffect } from "react";

export function ExpandableImage({
  src,
  alt,
  className,
  wrapperClassName,
}: {
  src: string;
  alt: string;
  className?: string;
  wrapperClassName?: string;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <>
      <div
        className={`relative group cursor-zoom-in ${wrapperClassName ?? ''}`}
        onClick={() => setOpen(true)}
      >
        <img src={src} alt={alt} className={className} />
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20">
          <div className="w-12 h-12 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center border border-white/20">
            <span className="material-symbols-outlined text-white text-2xl">zoom_in</span>
          </div>
        </div>
      </div>

      {open && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 md:p-10"
          onClick={() => setOpen(false)}
        >
          <button
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
            onClick={() => setOpen(false)}
            aria-label="Close"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
          <img
            src={src}
            alt={alt}
            className="max-w-full max-h-full rounded-xl shadow-2xl object-contain"
            onClick={e => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}
