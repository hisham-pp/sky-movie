'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';

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

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, close]);

  return (
    <>
      <div
        className={`relative group cursor-zoom-in ${wrapperClassName ?? ''}`}
        onClick={() => setOpen(true)}
      >
        <Image src={src} alt={alt} width={1920} height={1080} className={className} priority />
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 rounded-inherit">
          <div className="w-10 h-10 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center border border-white/20">
            <span className="material-symbols-outlined text-white text-xl">zoom_in</span>
          </div>
        </div>
      </div>

      {open && <ImageModal src={src} alt={alt} onClose={close} />}
    </>
  );
}

export function ImageModal({ src, alt, onClose }: { src: string; alt: string; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-10"
      style={{ background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}
    >
      <button
        className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full flex items-center justify-center text-white transition-colors"
        style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.15)' }}
        onClick={onClose}
        aria-label="Close"
      >
        <span className="material-symbols-outlined text-xl">close</span>
      </button>
      <Image
        src={src}
        alt={alt}
        width={1920}
        height={1080}
        className="max-w-full max-h-full rounded-2xl shadow-2xl object-contain"
        style={{ maxHeight: 'calc(100vh - 80px)', width: 'auto', height: 'auto' }}
        onClick={e => e.stopPropagation()}
        draggable={false}
        priority
      />
    </div>
  );
}
