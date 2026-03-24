import Link from "next/link";
import Image from "next/image";
import { Facebook, MapPin, Phone } from "lucide-react";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative z-10 pt-16 pb-8">
      <div className="container mx-auto px-4 md:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8 mb-12">
          
          <div className="space-y-4">
            <Link href="/" className="inline-flex items-center gap-2 transition-opacity hover:opacity-80">
              <Image src="/images/art-n-me-logo.jpg" alt="Art 'n Me Logo" width={32} height={32} className="rounded-md object-cover overflow-hidden" />
              <span className="text-2xl font-black tracking-tighter text-red-600 dark:text-red-500">
                Art &apos;n Me
              </span>
            </Link>
            <p className="text-muted-foreground max-w-xs">
              Where Creativity Belongs 🎨<br />
              High-quality prints, custom apparel, and digital services in Silay City.
            </p>
          </div>

          <div className="space-y-4">
            <h4 className="text-lg font-bold text-foreground">Contact Us</h4>
            <ul className="space-y-3 text-muted-foreground">
              <li className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <span>Corner Matagoy St., Brgy. Rizal,<br />Silay City, Philippines</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-red-600 shrink-0" />
                <span>0968 329 2779</span>
              </li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="text-lg font-bold text-foreground">Follow Us</h4>
            <div className="flex gap-4">
              <a 
                href="https://facebook.com/ArtnMeOfficial" 
                target="_blank" 
                rel="noreferrer"
                className="w-10 h-10 rounded-full bg-muted flex items-center justify-center hover:bg-red-100 hover:text-red-600 transition-colors text-muted-foreground"
              >
                <Facebook className="w-5 h-5" />
                <span className="sr-only">Facebook</span>
              </a>
            </div>
          </div>

        </div>

        <div className="pt-8 border-t border-border/50 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground text-center md:text-left">
            &copy; {currentYear} Art &apos;n Me Digital Printing Services and Studios. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-xs text-muted-foreground hover:underline hover:text-[#DC2626] transition-colors">
              Employee Portal
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
