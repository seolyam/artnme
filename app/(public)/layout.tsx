import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { SiteTour } from "@/components/tour/site-tour";

export default function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <Navbar />
      <div className="flex-grow">
        {children}
      </div>
      <Footer />
      <SiteTour />
    </>
  );
}
