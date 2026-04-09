export default function ProductsCatalog() {
  return (
    <main className="pt-32 pb-20 px-8 max-w-screen-2xl mx-auto min-h-screen">
      <div className="flex flex-col lg:flex-row gap-12">
        <aside className="w-full lg:w-72 flex-shrink-0">
          <div className="sticky top-32 space-y-12">
            <div>
              <h2 className="font-headline text-3xl font-bold uppercase italic tracking-tighter mb-8 border-l-4 border-primary-container pl-4">Filters</h2>
              <div className="space-y-8">
                <div>
                  <label className="font-headline text-xs uppercase tracking-[0.2em] text-on-surface-variant mb-4 block">Printing Type</label>
                  <div className="flex flex-col gap-3">
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <input className="w-5 h-5 bg-surface-container-high border-none text-primary-container focus:ring-0 focus:ring-offset-0" type="checkbox" />
                      <span className="text-sm uppercase tracking-widest group-hover:text-primary-container transition-colors">Sublimation</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <input className="w-5 h-5 bg-surface-container-high border-none text-primary-container focus:ring-0 focus:ring-offset-0" type="checkbox" />
                      <span className="text-sm uppercase tracking-widest group-hover:text-primary-container transition-colors">Silk Screen</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <input className="w-5 h-5 bg-surface-container-high border-none text-primary-container focus:ring-0 focus:ring-offset-0" type="checkbox" />
                      <span className="text-sm uppercase tracking-widest group-hover:text-primary-container transition-colors">Vinyl</span>
                    </label>
                  </div>
                </div>
                <div>
                  <label className="font-headline text-xs uppercase tracking-[0.2em] text-on-surface-variant mb-4 block">Material Finish</label>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-4 py-2 bg-surface-container-highest text-xs uppercase tracking-widest cursor-pointer hover:bg-primary-container transition-all">Matte</span>
                    <span className="px-4 py-2 bg-primary-container text-xs uppercase tracking-widest cursor-pointer">Gloss</span>
                    <span className="px-4 py-2 bg-surface-container-highest text-xs uppercase tracking-widest cursor-pointer hover:bg-primary-container transition-all">Metallic</span>
                    <span className="px-4 py-2 bg-surface-container-highest text-xs uppercase tracking-widest cursor-pointer hover:bg-primary-container transition-all">Neon</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-8 bg-surface-container-low border-t-2 border-primary-container">
              <p className="font-headline text-sm font-bold uppercase italic mb-2">Need a Custom Size?</p>
              <p className="text-xs text-on-surface-variant leading-relaxed mb-4">We offer tailor-made dimensions for unique branding needs.</p>
              <a className="text-primary-container text-xs font-bold uppercase tracking-widest flex items-center gap-2 hover:translate-x-2 transition-transform" href="#">
                Message Us <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </a>
            </div>
          </div>
        </aside>
        <section className="flex-grow">
          <header className="mb-16">
            <h1 className="font-headline text-6xl md:text-8xl font-black uppercase italic tracking-tighter leading-none mb-4">
              Product <span className="text-stroke-primary">- Catalog</span>
            </h1>
            <p className="font-body text-on-surface-variant text-lg max-w-xl">
              High-precision printing across textile, ceramic, and vinyl. Engineered for impact, built to last.
            </p>
          </header>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-white/5">
            <div className="group relative aspect-[4/5] bg-surface-container-low overflow-hidden">
              <img className="absolute inset-0 w-full h-full object-cover grayscale group-hover:grayscale-0 group-hover:scale-105 transition-all duration-700 opacity-60 group-hover:opacity-100" alt="Textile" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBfQ7paclwwOhk5tW72a_I4YoG-kPLSm32DJ3qhtK9r8eadXYVSzG-vnjAloTr-qZ6658qDhtcC70O9d5q7vocCfCXsT-f-Ygr7ikGTuk6KmFwY-UtHVC3Ohl4euJOw2rkPUBLTBcztRaAoIQJIihCuIQptc0RMLBBu0YPpXRpbE2p_rmlERWS9cwRuwBCiul36JC0803IODYfXeH7seBRC5jQWSYPkVE8vwWRE4a2ZA2scmCMo2ZOZvhWcHEKNxkQQz2PNEk18VBw" />
              <div className="absolute inset-0 bg-gradient-to-t from-surface via-transparent to-transparent"></div>
              <div className="absolute bottom-10 left-10 right-10">
                <span className="text-primary-container font-headline text-xs uppercase tracking-[0.3em] font-bold block mb-2">01 — Textile</span>
                <h3 className="font-headline text-4xl font-black uppercase italic tracking-tighter mb-4">Custom T-Shirts</h3>
                <button className="px-6 py-2 border border-white/20 text-xs uppercase tracking-widest font-bold group-hover:bg-white group-hover:text-surface transition-all">Explore Category</button>
              </div>
            </div>
            <div className="group relative aspect-[4/5] bg-surface-container-low overflow-hidden">
              <img className="absolute inset-0 w-full h-full object-cover grayscale group-hover:grayscale-0 group-hover:scale-105 transition-all duration-700 opacity-60 group-hover:opacity-100" alt="Ceramic" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCOPJWOX-wWu6YJDbUboExwPknugPikcWv7TP1swP1RHo8Cz4SilScALtxDrZerWojkfXGxBwib_oc4ogZu7tKAD-su0-hJ3peueaI8x0d6On5dm5DdhzrCfxOl5CH513KregtF2J8EZg26dI14vgQ4LKfWGA2g-G83TY66-TInXRD3aKtb5ILE_mf6Q_TFyuzJx1rN4vpv_VZgCBPMWQsdrJ2CrPsM0ZgXQZMy_FY0jOMyxF5ikAtdiBiahlL20n2yXIPS1BgvV48" />
              <div className="absolute inset-0 bg-gradient-to-t from-surface via-transparent to-transparent"></div>
              <div className="absolute bottom-10 left-10 right-10">
                <span className="text-primary-container font-headline text-xs uppercase tracking-[0.3em] font-bold block mb-2">02 — Ceramic</span>
                <h3 className="font-headline text-4xl font-black uppercase italic tracking-tighter mb-4">Premium Mugs</h3>
                <button className="px-6 py-2 border border-white/20 text-xs uppercase tracking-widest font-bold group-hover:bg-white group-hover:text-surface transition-all">Explore Category</button>
              </div>
            </div>
            <div className="group relative aspect-[4/5] bg-surface-container-low overflow-hidden">
              <img className="absolute inset-0 w-full h-full object-cover grayscale group-hover:grayscale-0 group-hover:scale-105 transition-all duration-700 opacity-60 group-hover:opacity-100" alt="Vinyl" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBN7gdJPJR0HF69Yzs3_gIzxCDQP0E9nQbi5ykeBt94HLGsn_eVGVNftBgyGu_GCfgpK2KLr8lOvm5MPGN8eXnxZmz1HZywUsvrmK380kjWhKZg5hGcy_T-QGg9oJ67ORfzgc1U25W-EEwhUdcySGGslNTEowURv2zDhlGbKCJiwIx42Pe98W8mBOenRTXG3dmJ2LczvKUs8nrtHYuiYigPeq4EHBVh9uVpsO23b6PyjXdPb26yc84HbLuz0ZzfLhntl4AitiT1bOA" />
              <div className="absolute inset-0 bg-gradient-to-t from-surface via-transparent to-transparent"></div>
              <div className="absolute bottom-10 left-10 right-10">
                <span className="text-primary-container font-headline text-xs uppercase tracking-[0.3em] font-bold block mb-2">03 — Vinyl</span>
                <h3 className="font-headline text-4xl font-black uppercase italic tracking-tighter mb-4">Vinyl Stickers</h3>
                <button className="px-6 py-2 border border-white/20 text-xs uppercase tracking-widest font-bold group-hover:bg-white group-hover:text-surface transition-all">Explore Category</button>
              </div>
            </div>
            <div className="group relative aspect-[4/5] bg-surface-container-low overflow-hidden">
              <img className="absolute inset-0 w-full h-full object-cover grayscale group-hover:grayscale-0 group-hover:scale-105 transition-all duration-700 opacity-60 group-hover:opacity-100" alt="Sportswear" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDNWlpmslOYvTklLzWm8O3JJ65mJI869Bz0s2Myg5IraLqbiczIjy2rkbdhNKMqwJGHHH_j4tbnTRNtf_spGZxn9CRG7ZsTHE6EbRZmpsTF37uZMv8hL8EG9fM5rMB-8-DwsUjHebMyf-gkLo0uXGFnYiRlRupb7s-4UOt2zVB1LqRENOlgd4Q0_eEu_s3pU-e2M2oWdX5uBvMbdS2KhwNY_0lYmxuQNGX8Mt74fDeImhjaZaKb_p_r4eZYEz_AzddH_hK7axk2iUg" />
              <div className="absolute inset-0 bg-gradient-to-t from-surface via-transparent to-transparent"></div>
              <div className="absolute bottom-10 left-10 right-10">
                <span className="text-primary-container font-headline text-xs uppercase tracking-[0.3em] font-bold block mb-2">04 — Sportswear</span>
                <h3 className="font-headline text-4xl font-black uppercase italic tracking-tighter mb-4">Sublimation Jerseys</h3>
                <button className="px-6 py-2 border border-white/20 text-xs uppercase tracking-widest font-bold group-hover:bg-white group-hover:text-surface transition-all">Explore Category</button>
              </div>
            </div>
          </div>
          <div className="mt-20 p-12 bg-surface-container-high relative overflow-hidden">
            <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
              <div>
                <h2 className="font-headline text-3xl font-black uppercase italic tracking-tighter mb-2">Don't see what you need?</h2>
                <p className="font-body text-on-surface-variant">We handle bulk orders and custom printing substrates upon request.</p>
              </div>
              <button className="bg-primary-container text-white px-10 py-4 uppercase font-black italic tracking-widest hover:scale-105 transition-transform">
                Request Custom Job
              </button>
            </div>
            <div className="absolute top-0 right-0 opacity-10 pointer-events-none">
              <span className="font-headline text-[12rem] font-black italic select-none leading-none -translate-y-10 block">ART</span>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
