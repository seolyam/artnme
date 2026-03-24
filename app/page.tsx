import { Metadata } from "next";
import { Navbar } from "@/components/marketing/Navbar";
import { Hero } from "@/components/marketing/Hero";
import { Services } from "@/components/marketing/Services";
import { About } from "@/components/marketing/About";
import { CTA } from "@/components/marketing/CTA";
import { Footer } from "@/components/marketing/Footer";

export const metadata: Metadata = {
  title: "Art 'n Me | Where Creativity Belongs",
  description: "Silay City's premier destination for high-quality tarpaulins, custom apparel, personalized corporate giveaways, and expert layout & design.",
};

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans selection:bg-red-200 selection:text-red-900">
      <Navbar />
      <main className="flex-1">
        <Hero />
        <Services />
        <About />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}
