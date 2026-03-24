"use client";

import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Printer, Shirt, Gift, MonitorPlay } from "lucide-react";
import { motion } from "framer-motion";
import { fadeSlideUp, staggerContainer, viewportConfig } from "@/lib/animations";

const services = [
  {
    title: "Large Format Printing",
    description: "High-resolution tarpaulins, banners, and stickers that grab attention both indoors and outdoors.",
    icon: Printer,
  },
  {
    title: "Custom Apparel",
    description: "Premium T-shirts, polo shirts, uniforms, and full-sublimation jersey printing for any occasion.",
    icon: Shirt,
  },
  {
    title: "Personalized Souvenirs",
    description: "Custom mugs, lanyards, PVC IDs, tumblers, and corporate giveaways crafted specifically for you.",
    icon: Gift,
  },
  {
    title: "Digital Services",
    description: "Professional layout and design services to ensure your brand stands out with crisp, clean art.",
    icon: MonitorPlay,
  },
];

export function Services() {
  return (
    <section id="services" className="py-20 relative z-10">
      <div className="container mx-auto px-4 md:px-8">
        <motion.div 
          className="text-center max-w-2xl mx-auto mb-16"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={viewportConfig}
        >
          <motion.h2 variants={fadeSlideUp} className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
            Our Core Services
          </motion.h2>
          <motion.p variants={fadeSlideUp} className="text-muted-foreground text-lg cursor-default">
            We deliver exceptional print and design solutions customized to your business or exact personal needs.
          </motion.p>
        </motion.div>
        
        <motion.div 
          className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={viewportConfig}
        >
          {services.map((service) => {
            const Icon = service.icon;
            return (
              <motion.div 
                key={service.title} 
                variants={fadeSlideUp}
                whileHover={{ y: -8, scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                <Card className="h-full border-border/50 bg-background/80 backdrop-blur-sm hover:shadow-xl hover:shadow-red-500/10 transition-all hover:border-red-500/30 group relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-orange-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                  <CardHeader className="relative">
                    <div className="h-12 w-12 rounded-xl bg-red-100 dark:bg-red-900/40 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                      <Icon className="h-6 w-6 text-red-600 dark:text-red-500" />
                    </div>
                    <CardTitle className="text-xl mb-2">{service.title}</CardTitle>
                    <CardDescription className="text-base leading-relaxed">
                      {service.description}
                    </CardDescription>
                  </CardHeader>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
