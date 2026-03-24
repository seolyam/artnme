"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { UserCircle } from "lucide-react";

export function Navbar() {
  return (
    <motion.header 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
      className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm"
    >
      <div className="container mx-auto px-4 md:px-8 flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center space-x-2 transition-opacity hover:opacity-80">
          <Image src="/images/art-n-me-logo.jpg" alt="Art 'n Me Logo" width={40} height={40} className="rounded-md object-cover overflow-hidden" />
          <span className="text-2xl font-black tracking-tighter text-red-600 dark:text-red-500">
            Art &apos;n Me
          </span>
        </Link>
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
          <Link href="#services" className="text-foreground/80 hover:text-red-600 transition-colors">Services</Link>
          <Link href="#about" className="text-foreground/80 hover:text-red-600 transition-colors">About Us</Link>
        </nav>
        <div className="flex items-center gap-4">
          <Button asChild variant="ghost" size="icon" className="text-muted-foreground hover:text-[#DC2626] hover:bg-transparent">
            <Link href="/login" title="Staff Gateway">
              <UserCircle className="w-5 h-5" />
              <span className="sr-only">Staff Login</span>
            </Link>
          </Button>
          <Button asChild className="bg-red-600 hover:bg-red-700 text-white font-semibold shadow-md active:scale-95 transition-all">
            <Link href="https://m.me/ArtnMeOfficial" target="_blank">Inquire Now</Link>
          </Button>
        </div>
      </div>
    </motion.header>
  );
}
