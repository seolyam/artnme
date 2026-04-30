import Link from "next/link";

export default function Footer() {
  return (
    <footer className="w-full border-t border-outline-variant/20 bg-surface-container-lowest">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 px-12 py-16 w-full items-start">
        <div>
          <div className="mb-4 h-12 w-12">
            <img
              src="/images/art-n-me-logo.jpg"
              alt="Art 'n Me Logo"
              className="h-full w-full object-contain"
            />
          </div>
          <p className="text-on-surface-variant text-sm font-body uppercase tracking-widest max-w-xs leading-relaxed">
            Digital printing sanctuary in the heart of Silay City. We turn ideas
            into substrate.
          </p>
        </div>
        <div className="flex flex-col gap-4">
          <span className="text-primary-container font-body text-sm uppercase tracking-widest font-bold">
            Connect
          </span>
          <Link
            href="https://www.facebook.com/ArtnMeOfficial"
            target="_blank"
            rel="noopener noreferrer"
            className="text-on-surface-variant hover:text-primary-container transition-colors font-body text-sm uppercase tracking-widest"
          >
            Facebook
          </Link>
          <Link
            href="#"
            className="text-on-surface-variant hover:text-primary-container transition-colors font-body text-sm uppercase tracking-widest"
          >
            Instagram
          </Link>
          <Link
            href="#"
            className="text-on-surface-variant hover:text-primary-container transition-colors font-body text-sm uppercase tracking-widest"
          >
            WhatsApp
          </Link>
        </div>
        <div className="flex flex-col gap-4">
          <span className="text-primary-container font-body text-sm uppercase tracking-widest font-bold">
            Visit Us
          </span>
          <a 
            href="https://maps.app.goo.gl/KA781unxzKKvwnMh6" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-on-surface-variant font-body text-sm uppercase tracking-widest hover:text-primary-container transition-colors"
          >
            Location: Silay City, Negros Occidental
          </a>
          <div className="mt-8 text-[10px] text-on-surface-variant/70 font-body uppercase tracking-[0.3em]">
            © 2024 Art 'n Me Digital Printing. Silay City.
          </div>
          <div className="mt-4">
            <Link
              href="/login"
              className="text-[9px] text-on-surface-variant/60 hover:text-primary-container uppercase tracking-[0.5em] transition-colors"
            >
              Employee Access / Node Login
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
