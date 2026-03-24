"use client";

import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, ImageIcon } from "lucide-react";

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-background pt-16 md:pt-24 pb-32">
      <div className="container mx-auto px-4 md:px-8">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-8 items-center">
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="flex flex-col justify-center space-y-8"
          >
            <div className="space-y-4">
              <div className="inline-flex items-center rounded-full border border-red-200 bg-red-50 px-3 py-1 text-sm font-medium text-red-800 dark:border-red-800/30 dark:bg-red-900/20 dark:text-red-300">
                <span className="flex h-2 w-2 rounded-full bg-red-600 mr-2"></span>
                Where Creativity Belongs 🎨
              </div>
              <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl xl:text-6xl text-foreground">
                Bring Your <span className="text-red-600">Ideas</span> to Life.
              </h1>
              <p className="max-w-[1.5xl] text-lg text-muted-foreground sm:text-xl leading-relaxed">
                Silay City&apos;s premier destination for high-quality tarpaulins, custom apparel, and personalized corporate giveaways. Let us craft exactly what you need.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button asChild size="lg" className="bg-red-600 hover:bg-red-700 text-white shadow-lg text-md h-12 px-8">
                <Link href="#contact" className="gap-2">
                  Get a Free Quote <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="border-border text-foreground hover:bg-muted text-md h-12 px-8">
                <Link href="#services">
                  View Our Services
                </Link>
              </Button>
            </div>
          </motion.div>
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mx-auto w-full max-w-[500px] lg:max-w-none"
          >
            <div className="aspect-square relative rounded-3xl overflow-hidden shadow-2xl bg-gradient-to-tr from-rose-100 to-red-50 dark:from-rose-950/40 dark:to-red-900/20 flex items-center justify-center border border-border/50">
               {/* Note: User requested placeholder for massive beautiful hero image */}
               <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
               <div className="relative flex flex-col items-center text-red-600/40 dark:text-red-500/30">
                 <ImageIcon className="w-32 h-32 mb-4" />
                 <span className="font-semibold text-xl">Stunning Hero Image</span>
               </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
