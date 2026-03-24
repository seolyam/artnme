"use client";

import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { fadeSlideUp, staggerContainer, viewportConfig } from "@/lib/animations";

export function CTA() {
  return (
    <section id="contact" className="py-20 relative overflow-hidden z-10 w-[95%] mx-auto rounded-3xl my-12 bg-red-600 dark:bg-red-700 shadow-2xl">
      {/* Subtle pattern overlay */}
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 rounded-3xl pointer-events-none" />
      
      <div className="container relative mx-auto px-4 md:px-8 z-10">
        <motion.div 
          className="max-w-3xl mx-auto text-center space-y-8"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={viewportConfig}
        >
          <motion.h2 variants={fadeSlideUp} className="text-3xl md:text-5xl font-extrabold text-white tracking-tight">
            Ready to bring your ideas to life?
          </motion.h2>
          <motion.p variants={fadeSlideUp} className="text-red-100 text-lg md:text-xl font-medium max-w-2xl mx-auto">
            Let&apos;s discuss your next printing project. Reach out to our team today for inquiries, quotes, and expert design advice.
          </motion.p>
          <motion.div variants={fadeSlideUp} className="pt-4 flex justify-center">
            <Button 
              asChild 
              size="lg" 
              className="bg-white text-red-600 hover:bg-red-50 hover:text-red-700 font-bold text-lg h-14 px-8 shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all rounded-full"
            >
              <Link href="https://m.me/ArtnMeOfficial" target="_blank" className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5" />
                Message us on Facebook
              </Link>
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
