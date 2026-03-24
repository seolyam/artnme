"use client";

import { Clock, Droplet, Store } from "lucide-react";
import { motion } from "framer-motion";

const features = [
  {
    icon: Clock,
    title: "Fast Turnaround Times",
    description: "We value your time. Our streamlined processes ensure your orders are completed efficiently without compromising on quality.",
  },
  {
    icon: Droplet,
    title: "Premium Quality Inks & Materials",
    description: "We use only top-tier materials and vibrant, long-lasting inks to make sure your prints stay vivid and durable.",
  },
  {
    icon: Store,
    title: "Local Silay City Roots",
    description: "As a proudly family-owned, local business, we genuinely care about serving our community with reliable, personal service.",
  },
];

export function About() {
  return (
    <section id="about" className="py-24 bg-background">
      <div className="container mx-auto px-4 md:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl font-bold sm:text-4xl mb-6">Why Choose Art &apos;n Me?</h2>
            <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
              We&apos;re not just another print shop. We are your creative partners right here in Silay City. Whether you&apos;re a business looking to scale your brand presence or an individual seeking a personalized item, we deliver excellence every step of the way.
            </p>
            
            <div className="space-y-8">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <motion.div 
                    key={index} 
                    className="flex items-start gap-4"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.15, duration: 0.5 }}
                  >
                    <div className="mt-1 bg-red-100 dark:bg-red-900/30 p-3 rounded-xl">
                      <Icon className="w-6 h-6 text-red-600 dark:text-red-500" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                      <p className="text-muted-foreground">{feature.description}</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative"
          >
            <div className="aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl bg-muted/50 border border-border/50 flex flex-col items-center justify-center p-8 text-center bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950/20 dark:to-orange-950/10">
               {/* Decorative elements representing quality and speed */}
               <div className="grid grid-cols-2 gap-4 w-full h-full p-4">
                 <div className="bg-white/60 dark:bg-background/40 rounded-2xl border border-white/20 shadow-sm flex items-center justify-center">
                   <div className="w-16 h-16 rounded-full bg-red-100/80 dark:bg-red-900/40" />
                 </div>
                 <div className="bg-red-600/10 dark:bg-red-500/10 rounded-2xl border border-red-500/20 shadow-sm flex items-center justify-center translate-y-8">
                   <div className="w-20 h-4 rounded-full bg-red-600/30 dark:bg-red-500/30" />
                 </div>
                 <div className="bg-white/60 dark:bg-background/40 rounded-2xl border border-white/20 shadow-sm flex items-center justify-center -translate-y-8">
                   <div className="w-12 h-12 rounded-lg bg-orange-100 dark:bg-orange-900/40" />
                 </div>
                 <div className="bg-white/60 dark:bg-background/40 rounded-2xl border border-white/20 shadow-sm flex items-center justify-center">
                   <div className="space-y-2 w-1/2">
                    <div className="w-full h-2 rounded-full bg-muted-foreground/30" />
                    <div className="w-4/5 h-2 rounded-full bg-muted-foreground/30" />
                    <div className="w-full h-2 rounded-full bg-muted-foreground/30" />
                   </div>
                 </div>
               </div>
               <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                 <div className="bg-background/80 backdrop-blur-sm px-6 py-3 rounded-full border border-border shadow-lg">
                   <span className="font-bold tracking-wider text-red-600 dark:text-red-500">TRUSTED LOCALLY</span>
                 </div>
               </div>
            </div>
            
            {/* Decorative background blur */}
            <div className="absolute -z-10 -bottom-10 -right-10 w-64 h-64 bg-red-600/20 blur-3xl rounded-full" />
            <div className="absolute -z-10 -top-10 -left-10 w-64 h-64 bg-orange-500/10 blur-3xl rounded-full" />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
