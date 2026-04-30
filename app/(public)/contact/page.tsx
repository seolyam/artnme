"use client";

import { Mail, Phone, MapPin, Send } from "lucide-react";

export default function Contact() {
  return (
    <main className="pt-32 pb-24 px-6 md:px-12 bg-background min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
          {/* Left Column: Contact Information */}
          <div className="lg:col-span-5 space-y-12">
            <div className="space-y-4">
              <span className="text-primary-container font-headline font-bold uppercase tracking-[0.3em] text-sm">
                Get in Touch
              </span>
              <h1 className="text-6xl md:text-8xl font-headline font-black text-on-surface dark:text-white leading-[0.9] tracking-tighter uppercase italic">
                CONTACT
                <br />
                <span className="text-primary-container">US.</span>
              </h1>
              <p className="text-on-surface-variant max-w-md text-lg leading-relaxed pt-4 font-light">
                Have a project in mind or need a custom printing solution? Reach
                out to our studio and let's create something exceptional
                together.
              </p>
            </div>

            <div className="space-y-8 pt-8 border-l-2 border-primary-container/20 pl-8">
              <div className="flex items-start gap-6 group">
                <div className="bg-surface-container-high p-4 group-hover:bg-primary-container transition-colors duration-500">
                  <MapPin className="text-primary-container group-hover:text-on-primary-container transition-colors" />
                </div>
                <div>
                  <h3 className="text-on-surface dark:text-white font-headline font-bold text-xl uppercase tracking-widest">
                    Location
                  </h3>
                  <p className="text-on-surface-variant mt-1">
                    Silay City, Negros Occidental
                  </p>
                  <p className="text-on-surface-variant text-sm mt-1 opacity-60">
                    Philippines, 6116
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-6 group">
                <div className="bg-surface-container-high p-4 group-hover:bg-primary-container transition-colors duration-500">
                  <Phone className="text-primary-container group-hover:text-on-primary-container transition-colors" />
                </div>
                <div>
                  <h3 className="text-on-surface dark:text-white font-headline font-bold text-xl uppercase tracking-widest">
                    Phone
                  </h3>
                  <p className="text-on-surface-variant mt-1">0968 329 2779</p>
                  <p className="text-on-surface-variant text-sm mt-1 opacity-60">
                    Direct Line / WhatsApp
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-6 group">
                <div className="bg-surface-container-high p-4 group-hover:bg-primary-container transition-colors duration-500">
                  <Mail className="text-primary-container group-hover:text-on-primary-container transition-colors" />
                </div>
                <div>
                  <h3 className="text-on-surface dark:text-white font-headline font-bold text-xl uppercase tracking-widest">
                    Email
                  </h3>
                  <p className="text-on-surface-variant mt-1">
                    hello@artnme.com
                  </p>
                  <p className="text-on-surface-variant text-sm mt-1 opacity-60">
                    General Inquiries
                  </p>
                </div>
              </div>
            </div>

            <div className="hidden lg:block relative pt-12 overflow-hidden group">
              <div className="absolute inset-0 bg-primary-container/10 -translate-x-full group-hover:translate-x-0 transition-transform duration-700"></div>
              <img
                className="w-full contrast-125 opacity-40 hover:opacity-100 transition-all duration-700 pointer-events-none"
                alt="Studio Detail"
                src="https://res.cloudinary.com/djdifarti/image/upload/SPJ_ccdj1e"
              />
            </div>
          </div>

          {/* Right Column: Contact Form */}
          <div className="lg:col-span-7 bg-surface-container-low p-8 md:p-12 relative overflow-hidden border border-outline-variant/30 dark:border-white/5 shadow-2xl">
            <div className="absolute top-0 right-0 w-32 h-1 bg-primary-container"></div>
            <div className="absolute top-0 right-0 w-1 h-32 bg-primary-container"></div>

            <form className="space-y-12" onSubmit={(e) => e.preventDefault()}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2 group">
                  <label className="text-xs font-bold uppercase tracking-widest text-primary-container/60 group-focus-within:text-primary-container transition-colors">
                    Your Name
                  </label>
                  <input
                    className="w-full bg-transparent border-0 border-b border-outline-variant/40 dark:border-white/10 px-0 py-4 focus:border-primary-container focus:outline-none transition-all text-on-surface dark:text-white font-headline tracking-wide text-lg"
                    placeholder="ALEX MERCER"
                    type="text"
                  />
                </div>
                <div className="space-y-2 group">
                  <label className="text-xs font-bold uppercase tracking-widest text-primary-container/60 group-focus-within:text-primary-container transition-colors">
                    Email Address
                  </label>
                  <input
                    className="w-full bg-transparent border-0 border-b border-outline-variant/40 dark:border-white/10 px-0 py-4 focus:border-primary-container focus:outline-none transition-all text-on-surface dark:text-white font-headline tracking-wide text-lg"
                    placeholder="ALEX@EXAMPLE.COM"
                    type="email"
                  />
                </div>
              </div>

              <div className="space-y-2 group">
                <label className="text-xs font-bold uppercase tracking-widest text-primary-container/60 group-focus-within:text-primary-container transition-colors">
                  Subject
                </label>
                <input
                  className="w-full bg-transparent border-0 border-b border-outline-variant/40 dark:border-white/10 px-0 py-4 focus:border-primary-container focus:outline-none transition-all text-on-surface dark:text-white font-headline tracking-wide text-lg"
                  placeholder="PROJECT INQUIRY"
                  type="text"
                />
              </div>

              <div className="space-y-2 group">
                <label className="text-xs font-bold uppercase tracking-widest text-primary-container/60 group-focus-within:text-primary-container transition-colors">
                  Your Message
                </label>
                <textarea
                  className="w-full bg-transparent border-0 border-b border-outline-variant/40 dark:border-white/10 px-0 py-4 focus:border-primary-container focus:outline-none transition-all text-on-surface dark:text-white font-body text-sm min-h-[150px] resize-none"
                  placeholder="TELL US ABOUT YOUR VISION..."
                  rows={4}
                ></textarea>
              </div>

              <div className="pt-8">
                <button
                  className="w-full bg-primary-container py-6 group relative overflow-hidden transition-all active:scale-[0.98] border border-primary-container"
                  type="submit"
                >
                  <div className="relative z-10 flex items-center justify-center gap-4">
                    <span className="font-headline font-black text-2xl tracking-tighter italic uppercase text-on-primary-container group-hover:tracking-[0.1em] transition-all">
                      Send Message
                    </span>
                    <Send className="w-6 h-6 text-on-primary-container group-hover:translate-x-2 transition-transform" />
                  </div>
                  <div className="absolute inset-0 bg-white translate-y-full group-hover:translate-y-0 transition-transform duration-500 mix-blend-overlay"></div>
                </button>
                <p className="text-[10px] text-center text-on-surface-variant mt-6 uppercase tracking-[0.3em] opacity-40">
                  We typically respond within 12 production hours.
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Map Section */}
      <section className="mt-32 w-full h-[500px] contrast-125 opacity-50 hover:opacity-100 transition-opacity relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background z-10 pointer-events-none"></div>
        <img
          className="w-full h-full object-cover"
          alt="Map of Silay City"
          src="https://res.cloudinary.com/djdifarti/image/upload/TAYCO_REUNION_qv6bqr"
        />
        <div className="absolute inset-0 flex items-center justify-center z-20">
          <div className="bg-primary-container text-on-primary-container px-12 py-6 font-headline font-black uppercase italic text-3xl shadow-2xl skew-x-[-12deg]">
            VISIT THE STUDIO
          </div>
        </div>
      </section>
    </main>
  );
}
