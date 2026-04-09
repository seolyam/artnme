"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";

export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <>
      <nav className="fixed top-0 w-full z-50 bg-gradient-to-b from-[#131313] via-[#131313]/80 to-transparent">
        <div className="flex justify-between items-center px-6 md:px-8 py-6 max-w-full mx-auto">
          <Link href="/" className="relative z-50 flex items-center h-10 w-10">
            <img src="/images/art-n-me-logo.jpg" alt="Art 'n Me Logo" className="h-full w-full object-contain" />
          </Link>
          
          <div className="hidden md:flex gap-8 items-center">
            <Link
              href="/"
              className="text-white hover:text-[#E31E24] transition-colors font-headline tracking-tight"
            >
              Home
            </Link>
            <Link
              href="/products"
              className="text-white hover:text-[#E31E24] transition-colors font-headline tracking-tight"
            >
              Products
            </Link>
            <Link
              href="/products/custom-jerseys"
              className="text-white hover:text-[#E31E24] transition-colors font-headline tracking-tight"
            >
              Jerseys
            </Link>
            <Link
              href="/contact"
              className="text-white hover:text-[#E31E24] transition-colors font-headline tracking-tight"
            >
              Contact
            </Link>
          </div>
          
          <div className="hidden md:block">
            <Link href="/quote" className="bg-[#E31E24] text-white px-6 py-2 font-bold uppercase tracking-widest text-xs hover:bg-white hover:text-[#E31E24] transition-all duration-300 scale-95 active:scale-90 font-headline">
              Get a Quote
            </Link>
          </div>

          <button 
            className="md:hidden text-white relative z-50 p-2"
            onClick={toggleMobileMenu}
            aria-label="Toggle Navigation"
          >
            {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-[#131313] flex flex-col items-center justify-center space-y-8 md:hidden">
            <Link
              href="/"
              onClick={toggleMobileMenu}
              className="text-3xl font-black text-white hover:text-[#E31E24] uppercase italic font-headline tracking-tight"
            >
              Home
            </Link>
            <Link
              href="/products"
              onClick={toggleMobileMenu}
              className="text-3xl font-black text-white hover:text-[#E31E24] uppercase italic font-headline tracking-tight"
            >
              Products
            </Link>
            <Link
              href="/products/custom-jerseys"
              onClick={toggleMobileMenu}
              className="text-3xl font-black text-white hover:text-[#E31E24] uppercase italic font-headline tracking-tight"
            >
              Jerseys
            </Link>
            <Link
              href="/contact"
              onClick={toggleMobileMenu}
              className="text-3xl font-black text-white hover:text-[#E31E24] uppercase italic font-headline tracking-tight"
            >
              Contact
            </Link>
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
