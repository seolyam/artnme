"use client";

import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Printer, Shirt, Gift, MonitorPlay } from "lucide-react";
import { motion, Variants } from "framer-motion";

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

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
    },
  },
};

const itemVariants: Variants = {
  hidden: { y: 40, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { duration: 0.6, ease: "easeOut" } },
};

export function Services() {
  return (
    <section id="services" className="py-20 bg-muted/30">
      <div className="container mx-auto px-4 md:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">Our Core Services</h2>
          <p className="text-muted-foreground text-lg">
            We deliver exceptional print and design solutions customized to your business or exact personal needs.
          </p>
        </div>
        
        <motion.div 
          className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: false, amount: 0.2 }}
        >
          {services.map((service) => {
            const Icon = service.icon;
            return (
              <motion.div 
                key={service.title} 
                variants={itemVariants}
                whileHover={{ y: -8, scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                <Card className="h-full border-border/50 bg-background hover:shadow-xl hover:shadow-red-500/10 transition-all hover:border-red-500/30 group relative overflow-hidden">
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
