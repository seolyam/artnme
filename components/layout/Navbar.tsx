"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";

import { ThemeToggle } from "@/components/theme-toggle";

export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const getLinkClass = (href: string) => {
    const isActive =
      pathname === href ||
      (href !== "/" && pathname?.startsWith(`${href}/`));

    return isActive
      ? "font-headline tracking-tight text-primary-container"
      : "font-headline tracking-tight text-on-surface hover:text-primary-container transition-colors";
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <>
      <nav className="fixed top-0 w-full z-50 bg-linear-to-b from-background via-background/90 to-transparent backdrop-blur-sm">
        <div className="flex justify-between items-center px-6 md:px-8 py-6 max-w-full mx-auto">
          <Link href="/" className="relative z-50 flex items-center h-10 w-10">
            <img
              src="/images/art-n-me-logo.jpg"
              alt="Art 'n Me Logo"
              className="h-full w-full object-contain"
            />
          </Link>

          <div className="hidden md:flex gap-8 items-center">
            <Link href="/" className={getLinkClass("/")}>
              Home
            </Link>
            <Link href="/portfolio" className={getLinkClass("/portfolio")}>
              Portfolio
            </Link>
            <Link href="/contact" className={getLinkClass("/contact")}>
              Contact
            </Link>
          </div>

          <div className="hidden md:flex items-center gap-3">
            <ThemeToggle />
            <Link
              href="/quote"
              className="bg-[#E31E24] text-white px-6 py-2 font-bold uppercase tracking-widest text-xs hover:bg-white hover:text-[#E31E24] transition-all duration-300 scale-95 active:scale-90 font-headline"
            >
              Get a Quote
            </Link>
          </div>

          <button
            className="md:hidden text-on-surface relative z-50 p-2"
            onClick={toggleMobileMenu}
            aria-label="Toggle Navigation"
          >
            {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-surface flex flex-col items-center justify-center space-y-8 md:hidden">
          <Link
            href="/"
            onClick={toggleMobileMenu}
            className="text-3xl font-black text-on-surface hover:text-primary-container uppercase italic font-headline tracking-tight"
          >
            Home
          </Link>
          <Link
            href="/portfolio"
            onClick={toggleMobileMenu}
            className="text-3xl font-black text-on-surface hover:text-primary-container uppercase italic font-headline tracking-tight"
          >
            Portfolio
          </Link>
          <Link
            href="/contact"
            onClick={toggleMobileMenu}
            className="text-3xl font-black text-on-surface hover:text-primary-container uppercase italic font-headline tracking-tight"
          >
            Contact
          </Link>
          <ThemeToggle />
          <Link
            href="/quote"
            onClick={toggleMobileMenu}
            className="bg-[#E31E24] text-white px-8 py-4 font-bold uppercase tracking-widest text-sm hover:bg-white hover:text-[#E31E24] transition-all duration-300 font-headline mt-8"
          >
            Get a Quote
          </Link>
        </div>
      )}
    </>
  );
}
