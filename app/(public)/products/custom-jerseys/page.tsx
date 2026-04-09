export default function CustomJerseys() {
  return (
    <main className="pt-24">
      {/* Hero Section */}
      <section className="relative min-h-[921px] flex flex-col md:flex-row items-stretch overflow-hidden">
        {/* Left: Imagery */}
        <div className="w-full md:w-3/5 relative h-[500px] md:h-auto overflow-hidden bg-surface-container-low">
          <img className="w-full h-full object-cover" alt="Jersey" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBntgpUvolRTln5VUpHXgeo2_U_IejPi4b8NM7gHsVVTgGBDQSEUSFl7j18hrlx5yXyz4hcBFmuzNOGI1l2SqmK-_T9Z9lZut3GfbcRfwacGUNzfkF4ArXBSCEnAhR7fbCgS0z9z9NFuqPDfG2oZNVwSNgVdIA5cvXvOSQGczhgOpGR0J7bwxE3vgHiP8H1dxaU7-ukRB2eVyM_2PuCvQ_hKRvR0iLp9W9u8BQ6Ux0NRzB6F0ID7NMRg3QrvreSlUP6ojJSQDP52zU" />
          {/* Floating Decorative Elements */}
          <div className="absolute bottom-12 right-0 bg-primary-container p-6 translate-x-1/4 md:translate-x-0">
            <span className="block text-4xl font-black text-on-primary-container italic font-headline">ELITE SERIES</span>
            <span className="block text-xs uppercase tracking-[0.3em] font-bold mt-1 text-on-primary-container">2024 COLLECTION</span>
          </div>
        </div>
        {/* Right: Product Info */}
        <div className="w-full md:w-2/5 p-8 md:p-16 flex flex-col justify-center bg-surface-container-lowest">
          <div className="space-y-2 mb-8">
            <span className="text-primary-container font-black tracking-widest uppercase text-sm">Category / Apparel</span>
            <h1 className="text-6xl md:text-8xl font-black font-headline leading-[0.85] tracking-tighter uppercase italic">
              Full <br />Sublimation <br /><span className="text-primary-container">Jersey</span>
            </h1>
          </div>
          <p className="text-on-surface-variant text-lg max-w-md mb-12 font-light leading-relaxed">
            Unleash your team's identity with zero color limitations. Our sublimation process binds ink directly into the fibers for a design that will never crack, peel, or fade.
          </p>
          <div className="grid grid-cols-2 gap-4 mb-12">
            <div className="bg-surface-container p-4">
              <span className="text-xs uppercase text-primary tracking-widest block mb-1">Turnaround</span>
              <span className="text-xl font-bold font-headline">10-14 DAYS</span>
            </div>
            <div className="bg-surface-container p-4">
              <span className="text-xs uppercase text-primary tracking-widest block mb-1">Min. Order</span>
              <span className="text-xl font-bold font-headline">12 PIECES</span>
            </div>
          </div>
          <button className="w-full bg-primary-container text-on-primary-container py-6 text-xl font-black uppercase tracking-widest hover:translate-y-[-4px] transition-transform duration-300 shadow-xl shadow-primary-container/20">
            Start Your Design
          </button>
        </div>
      </section>

      {/* Product Specs Bento */}
      <section className="px-8 md:px-16 py-24 bg-surface">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-black font-headline uppercase mb-16 italic underline decoration-primary-container decoration-4 underline-offset-8">Technical Specs</h2>
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 h-auto md:h-[600px]">
            {/* Fabric Quality */}
            <div className="md:col-span-7 bg-surface-container-high p-12 flex flex-col justify-between relative overflow-hidden">
              <div className="z-10">
                <h3 className="text-3xl font-black font-headline uppercase mb-4">Ultra-Dry Fabric</h3>
                <p className="text-on-surface-variant max-w-sm">Premium 160GSM micro-mesh technology. Breathable, moisture-wicking, and engineered for high-intensity performance in any climate.</p>
              </div>
              <div className="flex gap-4 z-10">
                <div className="flex items-center gap-2 bg-surface p-2 px-4">
                  <span className="material-symbols-outlined text-primary">air</span>
                  <span className="text-xs font-bold uppercase tracking-wider">Breathable</span>
                </div>
                <div className="flex items-center gap-2 bg-surface p-2 px-4">
                  <span className="material-symbols-outlined text-primary">opacity</span>
                  <span className="text-xs font-bold uppercase tracking-wider">Fast Dry</span>
                </div>
              </div>
              <span className="absolute -right-12 -bottom-12 text-[200px] font-black text-white/5 font-headline italic">INK</span>
            </div>

            {/* Sizing */}
            <div className="md:col-span-5 bg-primary-container p-12 text-on-primary-container">
              <h3 className="text-3xl font-black font-headline uppercase mb-8">Sizing Matrix</h3>
              <div className="space-y-4">
                <div className="flex justify-between border-b border-on-primary-container/20 pb-2">
                  <span className="font-bold">XS - XL</span>
                  <span>Standard Fit</span>
                </div>
                <div className="flex justify-between border-b border-on-primary-container/20 pb-2">
                  <span className="font-bold">2XL - 5XL</span>
                  <span>Oversize Available</span>
                </div>
                <div className="flex justify-between border-b border-on-primary-container/20 pb-2">
                  <span className="font-bold">KIDS</span>
                  <span>Custom Patterns</span>
                </div>
              </div>
              <p className="mt-12 text-sm opacity-80 italic">*Contact us for specific measurements and customized pattern adjustments.</p>
            </div>

            {/* Design Process */}
            <div className="md:col-span-12 bg-surface-container-highest p-12 flex flex-col md:flex-row items-center gap-12">
              <div className="md:w-1/3">
                <h3 className="text-3xl font-black font-headline uppercase mb-4 leading-tight">The Precision <br />Process</h3>
              </div>
              <div className="md:w-2/3 grid grid-cols-1 sm:grid-cols-3 gap-8">
                <div className="space-y-2">
                  <span className="text-4xl font-black text-primary/50 font-headline">01</span>
                  <h4 className="font-bold uppercase tracking-widest">Vector Design</h4>
                  <p className="text-sm text-on-surface-variant">Our artists transform your vision into print-ready vector graphics.</p>
                </div>
                <div className="space-y-2">
                  <span className="text-4xl font-black text-primary/50 font-headline">02</span>
                  <h4 className="font-bold uppercase tracking-widest">Heat Press</h4>
                  <p className="text-sm text-on-surface-variant">200°C sublimation ensures ink bonds deep into the fabric structure.</p>
                </div>
                <div className="space-y-2">
                  <span className="text-4xl font-black text-primary/50 font-headline">03</span>
                  <h4 className="font-bold uppercase tracking-widest">Precision Sew</h4>
                  <p className="text-sm text-on-surface-variant">Expert tailoring for reinforced seams and industrial strength.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Cross-sell Section */}
      <section className="px-8 md:px-16 py-24 bg-surface-container-low">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-end mb-16">
            <h2 className="text-4xl font-black font-headline uppercase italic">Complete The Kit</h2>
            <p className="text-on-surface-variant font-bold tracking-[0.2em] uppercase text-xs">Bundle &amp; Save 15%</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="group relative aspect-[16/9] overflow-hidden bg-surface">
              <img className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700" alt="Matching Caps" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCAiqnE8ON-p2vOKzZpnQDaxtxS8tyvEiKV4ntXwP4N6mMpWy0HXZ_7Dep1C-WZPfKX-iZ8ApTZdzrQl4qpQ7G8XV4Pnsen9WZw3bIkS_Cue4h6487PmptGuMAUF89eqjHBHxnv5S2fwpmUyA5vJlFWos00gdwX24vJJB2lB4Lv3W5SjIxjJbN8Y_C2tcTFZPrwsUThn-Gsb-GUy-8TnuvCo3d8YYitaqDazt03gqLgl7I8ZgK-gsPgIXmHFMRjkMLrjEgcB4KbGgE" />
              <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent opacity-60"></div>
              <div className="absolute bottom-8 left-8">
                <h3 className="text-3xl font-black font-headline uppercase">Matching Caps</h3>
                <p className="text-primary-container font-bold">STARTING AT $15.00</p>
                <button className="mt-4 flex items-center gap-2 text-sm uppercase tracking-widest font-bold group-hover:text-primary-container transition-colors">
                  Add to kit <span className="material-symbols-outlined">trending_flat</span>
                </button>
              </div>
            </div>
            <div className="group relative aspect-[16/9] overflow-hidden bg-surface">
              <img className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700" alt="Team Stickers" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDPaJTFjrOOCG5IXb01NlrkFtk0T83sdpwjx3b9MCcdHmt53GGvP9dd2I84fVX09LQkcA5NmGaGEND5-MCQkJwQo9-oKaisooM-Cj_LPMiAyUEBfFRfzDofbu61QemvlXSjSgmE-1Da_0M2KOtjqik2r4dkUo6UWaTWyVLHircXgByaWIFLqlVHIxej0QvdH03enK5DtbCMTclx8oOQUGRQSqh_qEbQuqoEosnylCiBaIi_GtyeQTS2A0N6Z4ttEHDcu50jcAz5A_U" />
              <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent opacity-60"></div>
              <div className="absolute bottom-8 left-8">
                <h3 className="text-3xl font-black font-headline uppercase">Team Stickers</h3>
                <p className="text-primary-container font-bold">PACKS FROM $25.00</p>
                <button className="mt-4 flex items-center gap-2 text-sm uppercase tracking-widest font-bold group-hover:text-primary-container transition-colors">
                  Add to kit <span className="material-symbols-outlined">trending_flat</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
