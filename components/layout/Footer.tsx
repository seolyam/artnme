import Link from "next/link";

export default function Footer() {
  return (
    <footer className="w-full border-t border-white/5 bg-[#131313] dark:bg-[#131313]">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 px-12 py-16 w-full items-start">
        <div>
          <div className="text-xl font-bold text-white font-body mb-4 uppercase tracking-widest">
            Art 'n Me
          </div>
          <p className="text-white/40 text-sm font-body uppercase tracking-widest max-w-xs leading-relaxed">
            Digital printing sanctuary in the heart of Silay City. We turn ideas into substrate.
          </p>
        </div>
        <div className="flex flex-col gap-4">
          <span className="text-[#E31E24] font-body text-sm uppercase tracking-widest font-bold">
            Connect
          </span>
          <Link href="#" className="text-white/40 hover:text-[#E31E24] transition-colors font-body text-sm uppercase tracking-widest">
            Facebook
          </Link>
          <Link href="#" className="text-white/40 hover:text-[#E31E24] transition-colors font-body text-sm uppercase tracking-widest">
            Instagram
          </Link>
          <Link href="#" className="text-white/40 hover:text-[#E31E24] transition-colors font-body text-sm uppercase tracking-widest">
            WhatsApp
          </Link>
        </div>
        <div className="flex flex-col gap-4">
          <span className="text-[#E31E24] font-body text-sm uppercase tracking-widest font-bold">
            Visit Us
          </span>
          <span className="text-white/40 font-body text-sm uppercase tracking-widest">
            Location: Silay City, Negros Occidental
          </span>
          <div className="mt-8 text-[10px] text-white/20 font-body uppercase tracking-[0.3em]">
            © 2024 Art 'n Me Digital Printing. Silay City.
          </div>
          <div className="mt-4">
            <Link href="/login" className="text-[9px] text-white/10 hover:text-primary-container uppercase tracking-[0.5em] transition-colors">
              Employee Access / Node Login
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
