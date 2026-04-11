import MarketingNav from "@/components/marketing/MarketingNav";
import Hero from "@/components/marketing/Hero";
import TrustStrip from "@/components/marketing/TrustStrip";
import Features from "@/components/marketing/Features";
import WhySection from "@/components/marketing/WhySection";
import Preview from "@/components/marketing/Preview";
import MarketingFooter from "@/components/marketing/MarketingFooter";

export default function LandingPage() {
  return (
    <main className="min-h-screen">
      <MarketingNav />
      <Hero />
      <TrustStrip />
      <Features />
      <WhySection />
      <Preview />
      <MarketingFooter />
    </main>
  );
}
