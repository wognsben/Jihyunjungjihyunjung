export const Footer = () => {
  return (
    <footer className="py-16 md:py-20">
      <p 
        className="text-[10px] md:text-[11px] text-center font-mono tracking-wider"
        style={{
          color: 'var(--premium-black)',
          opacity: 0.25,
          letterSpacing: '0.05em',
        }}
      >
        © 2026 Jihyun Jung. All rights reserved.
      </p>

      <style>{`
        footer {
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }
      `}</style>
    </footer>
  );
};