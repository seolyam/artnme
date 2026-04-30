export default function Quote() {
  return (
    <>
      <main className="pt-32 pb-24 px-6 md:px-12">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
            {/* Left Column: Branding & Contact Info */}
            <div className="lg:col-span-5 space-y-12">
              <div className="space-y-4">
                <span className="text-primary-container font-headline font-bold uppercase tracking-[0.3em] text-sm">
                  Initiate Project
                </span>
                <h1 className="text-6xl md:text-8xl font-headline font-black text-on-surface dark:text-white leading-[0.9] tracking-tighter">
                  GET A<br />
                  <span className="text-primary-container">QUOTE.</span>
                </h1>
                <p className="text-on-surface-variant max-w-md text-lg leading-relaxed pt-4">
                  Transforming your vision into high-definition reality. Provide
                  your specifications below, and our master printers will
                  architect your masterpiece.
                </p>
              </div>
              <div className="space-y-8 pt-8">
                <div className="flex items-start gap-6 group">
                  <div className="bg-surface-container-high p-4">
                    <span className="material-symbols-outlined text-primary-container">
                      location_on
                    </span>
                  </div>
                  <div>
                    <h3 className="text-on-surface dark:text-white font-headline font-bold text-xl uppercase tracking-widest">
                      Silay City
                    </h3>
                    <p className="text-on-surface-variant mt-1">
                      Negros Occidental, Philippines
                    </p>
                    <p className="text-on-surface-variant text-sm mt-2 opacity-60">
                      HQ &amp; Production Floor
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-6 group">
                  <div className="bg-surface-container-high p-4">
                    <span className="material-symbols-outlined text-primary-container">
                      call
                    </span>
                  </div>
                  <div>
                    <h3 className="text-on-surface dark:text-white font-headline font-bold text-xl uppercase tracking-widest">
                      0968 329 2779
                    </h3>
                    <p className="text-on-surface-variant mt-1">
                      Direct Production Line
                    </p>
                    <p className="text-on-surface-variant text-sm mt-2 opacity-60">
                      Mon - Sat: 9AM - 6PM
                    </p>
                  </div>
                </div>
              </div>
              {/* Decorative Graphic */}
              <div className="hidden lg:block relative pt-12">
                <div className="absolute -top-4 -left-4 w-32 h-32 border-l-4 border-t-4 border-primary-container opacity-20"></div>
                <img
                  className="w-full contrast-125 transition-all duration-700"
                  alt="Industrial digital printing press"
                  src="NEXT_PUBLIC_CLOUDINARY_URL_REMOVED/image/upload/EL_TURO_JERSEY_hwpjf4"
                />
              </div>
            </div>
            {/* Right Column: The Form */}
            <div className="lg:col-span-7 bg-surface-container-low p-8 md:p-12 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-1/2 h-1 bg-primary-container"></div>
              <form className="space-y-10">
                {/* Section 1: Identity */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2 group">
                    <label className="text-xs font-bold uppercase tracking-widest text-primary-container">
                      Full Name
                    </label>
                    <input
                      className="w-full bg-surface-container-high border-0 border-b border-outline-variant/40 dark:border-white/10 px-0 py-4 focus:border-b-2 focus:border-primary-container focus:outline-none transition-all text-on-surface dark:text-white font-headline tracking-wide"
                      placeholder="ALEX MERCER"
                      type="text"
                    />
                  </div>
                  <div className="space-y-2 group">
                    <label className="text-xs font-bold uppercase tracking-widest text-primary-container">
                      Contact Email/Phone
                    </label>
                    <input
                      className="w-full bg-surface-container-high border-0 border-b border-outline-variant/40 dark:border-white/10 px-0 py-4 focus:border-b-2 focus:border-primary-container focus:outline-none transition-all text-on-surface dark:text-white font-headline tracking-wide"
                      placeholder="+63 9XX XXX XXXX"
                      type="text"
                    />
                  </div>
                </div>
                {/* Section 2: Specification */}
                <div className="space-y-6">
                  <label className="text-xs font-bold uppercase tracking-widest text-primary-container">
                    Select Substrate / Item Type
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <label className="cursor-pointer group">
                      <input
                        className="hidden peer"
                        name="item_type"
                        type="radio"
                        defaultChecked
                      />
                      <div className="p-4 border border-outline-variant/40 dark:border-white/5 bg-surface-container peer-checked:bg-primary-container peer-checked:text-on-primary-container transition-all text-center">
                        <span className="block font-headline font-bold text-sm tracking-tighter">
                          T-SHIRT
                        </span>
                      </div>
                    </label>
                    <label className="cursor-pointer group">
                      <input
                        className="hidden peer"
                        name="item_type"
                        type="radio"
                      />
                      <div className="p-4 border border-outline-variant/40 dark:border-white/5 bg-surface-container peer-checked:bg-primary-container peer-checked:text-on-primary-container transition-all text-center">
                        <span className="block font-headline font-bold text-sm tracking-tighter">
                          MUG
                        </span>
                      </div>
                    </label>
                    <label className="cursor-pointer group">
                      <input
                        className="hidden peer"
                        name="item_type"
                        type="radio"
                      />
                      <div className="p-4 border border-outline-variant/40 dark:border-white/5 bg-surface-container peer-checked:bg-primary-container peer-checked:text-on-primary-container transition-all text-center">
                        <span className="block font-headline font-bold text-sm tracking-tighter">
                          BANNER
                        </span>
                      </div>
                    </label>
                    <label className="cursor-pointer group">
                      <input
                        className="hidden peer"
                        name="item_type"
                        type="radio"
                      />
                      <div className="p-4 border border-outline-variant/40 dark:border-white/5 bg-surface-container peer-checked:bg-primary-container peer-checked:text-on-primary-container transition-all text-center">
                        <span className="block font-headline font-bold text-sm tracking-tighter">
                          OTHER
                        </span>
                      </div>
                    </label>
                  </div>
                </div>
                {/* Section 3: Quantity & Description */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-end">
                  <div className="md:col-span-1 space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-primary-container">
                      Quantity
                    </label>
                    <input
                      className="w-full bg-surface-container-high border-0 border-b border-outline-variant/40 dark:border-white/10 px-0 py-4 focus:border-b-2 focus:border-primary-container focus:outline-none text-on-surface dark:text-white font-headline text-2xl"
                      placeholder="01"
                      type="number"
                    />
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-primary-container">
                      Project Details
                    </label>
                    <textarea
                      className="w-full bg-surface-container-high border-0 border-b border-outline-variant/40 dark:border-white/10 px-0 py-4 focus:border-b-2 focus:border-primary-container focus:outline-none text-on-surface dark:text-white font-body text-sm"
                      placeholder="COLORS, FINISH, DEADLINE..."
                      rows={1}
                    ></textarea>
                  </div>
                </div>
                {/* Section 4: File Upload */}
                <div className="space-y-4">
                  <label className="text-xs font-bold uppercase tracking-widest text-primary-container">
                    Asset Depository
                  </label>
                  <div className="border-2 border-dashed border-outline-variant/40 dark:border-white/10 bg-surface-container-high p-12 text-center group hover:border-primary-container transition-colors cursor-pointer">
                    <span className="material-symbols-outlined text-4xl text-on-surface/30 dark:text-white/20 group-hover:text-primary-container transition-colors mb-4">
                      cloud_upload
                    </span>
                    <p className="text-on-surface dark:text-white font-headline font-bold">
                      UPLOAD YOUR DESIGN
                    </p>
                    <p className="text-on-surface-variant text-xs mt-2 uppercase tracking-widest">
                      AI, PSD, PDF, OR HIGH-RES PNG (MAX 50MB)
                    </p>
                  </div>
                </div>
                {/* Action */}
                <div className="pt-8">
                  <button
                    className="w-full bg-primary-container py-6 group relative overflow-hidden transition-all active:scale-[0.98]"
                    type="submit"
                  >
                    <span className="relative z-10 font-headline font-black text-2xl tracking-tighter italic uppercase text-on-primary-container group-hover:tracking-[0.1em] transition-all">
                      Submit Inquiry
                    </span>
                    <div className="absolute inset-0 bg-white translate-y-full group-hover:translate-y-0 transition-transform duration-300 mix-blend-overlay"></div>
                  </button>
                  <p className="text-[10px] text-center text-on-surface-variant mt-4 uppercase tracking-[0.2em] opacity-40">
                    Estimate generation usually takes 1-2 production hours.
                  </p>
                </div>
              </form>
            </div>
          </div>
        </div>
      </main>

      {/* Map Section */}
      <section className="w-full h-[400px] contrast-125 opacity-50 hover:opacity-100 transition-opacity relative">
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background z-10 pointer-events-none"></div>
        <img
          className="w-full h-full object-cover"
          alt="Map of Silay City"
          src="NEXT_PUBLIC_CLOUDINARY_URL_REMOVED/image/upload/STE_-_JADE_y9vxos"
        />
        <div className="absolute inset-0 flex items-center justify-center z-20">
          <div className="bg-primary-container text-on-primary-container px-8 py-4 font-headline font-black uppercase italic text-2xl">
            Find Us In Silay
          </div>
        </div>
      </section>
    </>
  );
}
