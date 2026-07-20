"use client";

import { Mail, Phone, MapPin, MessageSquare } from "lucide-react";

export default function Contact() {
  return (
    <main className="pt-32 pb-24 px-6 md:px-12 bg-background min-h-screen">
      <div className="max-w-3xl mx-auto">
        <div>
          {/* Contact Information */}
          <div className="flex flex-col items-center text-center space-y-16">
            <div className="space-y-4 flex flex-col items-center">
              <span className="text-primary-container font-headline font-bold uppercase tracking-[0.3em] text-sm">
                Get in Touch
              </span>
              <h1 className="text-6xl md:text-8xl font-headline font-black text-on-surface dark:text-white leading-[0.9] tracking-tighter uppercase italic">
                CONTACT
                <br />
                <span className="text-primary-container">US.</span>
              </h1>
              <p className="text-on-surface-variant max-w-lg text-lg leading-relaxed pt-4 font-light">
                Have a project in mind or need a custom printing solution? Reach
                out to our studio and let&apos;s create something exceptional
                together.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 w-full max-w-2xl text-left pt-8">
              <div className="flex items-start gap-6 group">
                <div className="bg-surface-container-high p-4 group-hover:bg-primary-container transition-colors duration-500 shrink-0">
                  <MapPin className="text-primary-container group-hover:text-on-primary-container transition-colors" />
                </div>
                <div>
                <a 
                  href="https://maps.app.goo.gl/KA781unxzKKvwnMh6" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="hover:opacity-80 transition-opacity"
                >
                  <h3 className="text-on-surface dark:text-white font-headline font-bold text-xl uppercase tracking-widest">
                    Location
                  </h3>
                  <p className="text-on-surface-variant mt-1">
                    Silay City, Negros Occidental
                  </p>
                  <p className="text-on-surface-variant text-sm mt-1 opacity-60">
                    Philippines, 6116
                  </p>
                </a>
                </div>
              </div>

              <div className="flex items-start gap-6 group">
                <div className="bg-surface-container-high p-4 group-hover:bg-primary-container transition-colors duration-500 shrink-0">
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
                <div className="bg-surface-container-high p-4 group-hover:bg-primary-container transition-colors duration-500 shrink-0">
                  <Mail className="text-primary-container group-hover:text-on-primary-container transition-colors" />
                </div>
                <div>
                  <h3 className="text-on-surface dark:text-white font-headline font-bold text-xl uppercase tracking-widest">
                    Email
                  </h3>
                  <p className="text-on-surface-variant mt-1">
                    artinme03@gmail.com
                  </p>
                  <p className="text-on-surface-variant text-sm mt-1 opacity-60">
                    General Inquiries
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-6 group">
                <div className="bg-surface-container-high p-4 group-hover:bg-primary-container transition-colors duration-500 shrink-0">
                  <MessageSquare className="text-primary-container group-hover:text-on-primary-container transition-colors" />
                </div>
                <div>
                  <h3 className="text-on-surface dark:text-white font-headline font-bold text-xl uppercase tracking-widest">
                    Messenger
                  </h3>
                  <a 
                    href="https://www.facebook.com/ArtnMeOfficial" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-on-surface-variant mt-1 hover:text-primary-container transition-colors block"
                  >
                    Art &apos;n Me Digital Printing Services and Studios
                  </a>
                  <p className="text-on-surface-variant text-sm mt-1 opacity-60">
                    Official Facebook Page
                  </p>
                </div>
              </div>
            </div>

            <div className="w-full relative pt-12 overflow-hidden group">
              <div className="absolute inset-0 bg-primary-container/10 -translate-x-full group-hover:translate-x-0 transition-transform duration-700"></div>
              <img
                className="w-full contrast-125 opacity-40 hover:opacity-100 transition-all duration-700 pointer-events-none"
                alt="Studio Detail"
                src={`${process.env.NEXT_PUBLIC_CLOUDINARY_URL}/SPJ_ccdj1e`}
              />
            </div>
          </div>

        </div>
      </div>

      <a 
        href="https://maps.app.goo.gl/KA781unxzKKvwnMh6" 
        target="_blank" 
        rel="noopener noreferrer"
        className="mt-32 w-full h-[500px] contrast-125 opacity-50 hover:opacity-100 transition-opacity relative overflow-hidden block"
      >
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background z-10 pointer-events-none"></div>
        <img
          className="w-full h-full object-cover"
          alt="Map of Silay City"
          src={`${process.env.NEXT_PUBLIC_CLOUDINARY_URL}/TAYCO_REUNION_qv6bqr`}
        />
        <div className="absolute inset-0 flex items-center justify-center z-20">
          <div className="bg-primary-container text-on-primary-container px-12 py-6 font-headline font-black uppercase italic text-3xl shadow-2xl skew-x-[-12deg] group-hover:scale-105 transition-transform">
            VISIT THE STUDIO
          </div>
        </div>
      </a>
    </main>
  );
}
