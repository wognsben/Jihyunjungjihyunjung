export const Footer = () => {
  return (
    <footer className="py-16 md:py-20">
      <p 
        className="text-left md:text-center tracking-wider text-[12px] font-[SansSerif]"
        style={{
          color: 'var(--premium-black)',
          opacity:0.75,
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