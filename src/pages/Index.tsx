import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { HeroSection } from "@/components/home/HeroSection";
import { WhySection } from "@/components/home/WhySection";
import { HowItWorksSection } from "@/components/home/HowItWorksSection";
import { PlansSection } from "@/components/home/PlansSection";
import { SecuritySection } from "@/components/home/SecuritySection";
import { CTASection } from "@/components/home/CTASection";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <HeroSection />
        <WhySection />
        <HowItWorksSection />
        <PlansSection />
        <SecuritySection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
