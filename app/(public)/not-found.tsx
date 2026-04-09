import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center gap-8 px-4 text-center py-48 bg-background min-h-screen">
      <div className="flex h-24 w-24 items-center justify-center rounded-none bg-surface-container-high overflow-hidden">
        <img src="/images/art-n-me-logo.jpg" alt="Logo" className="h-full w-full object-cover" />
      </div>
      <div className="space-y-4">
        <h1 className="text-8xl font-black font-headline tracking-tighter uppercase italic text-white">404</h1>
        <p className="text-xl text-on-surface-variant font-light max-w-md mx-auto">
          The page you are looking for does not exist on this substrate.
        </p>
      </div>
      <Link href="/" className="bg-[#E31E24] text-white px-10 py-5 font-bold uppercase tracking-widest hover:brightness-110 transition-all font-headline mt-8">
        Return Home
      </Link>
    </div>
  );
}
