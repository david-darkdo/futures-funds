import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { PlansSection } from "@/components/home/PlansSection";

export default function Plans() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-20">
        <PlansSection />
      </main>
      <Footer />
    </div>
  );
}
