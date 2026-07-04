import { useEffect, useState } from 'react';

interface Props {
  visible: boolean;
}

export function LoadingScreen({ visible }: Props) {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    if (!visible) {
      const timer = setTimeout(() => setHidden(true), 600);
      return () => clearTimeout(timer);
    }
  }, [visible]);

  if (hidden) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#111317',
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.5s ease',
        pointerEvents: visible ? 'all' : 'none',
      }}
    >
      <svg width="56" height="56" viewBox="0 0 56 56" fill="none" style={{ marginBottom: 24 }}>
        <rect width="56" height="56" rx="14" fill="#1e2024" />
        <path
          d="M14 20C14 18.3431 15.3431 17 17 17H26L32 23H39C40.6569 23 42 24.3431 42 26V38C42 39.6569 40.6569 41 39 41H17C15.3431 41 14 39.6569 14 38V20Z"
          fill="#89ceff"
          opacity="0.15"
        />
        <path
          d="M24 33L30 29L24 25V33Z"
          fill="#89ceff"
        />
      </svg>

      <span style={{ color: '#e2e2e8', fontSize: 18, fontWeight: 600, letterSpacing: 0.3 }}>
        Sky Movie
      </span>

      <div
        style={{
          marginTop: 28,
          width: 160,
          height: 2,
          background: '#1e2024',
          borderRadius: 2,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            background: '#89ceff',
            borderRadius: 2,
            animation: 'sky-loading-bar 1.4s ease-in-out infinite',
          }}
        />
      </div>

      <style>{`
        @keyframes sky-loading-bar {
          0%   { width: 0%;   margin-left: 0%; }
          50%  { width: 60%;  margin-left: 20%; }
          100% { width: 0%;   margin-left: 100%; }
        }
      `}</style>
    </div>
  );
}
