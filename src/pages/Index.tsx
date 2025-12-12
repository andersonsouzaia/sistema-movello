import HeroSection from "@/components/landing/HeroSection";
import ProblemsVsSolutionsSection from "@/components/landing/ProblemsVsSolutionsSection";
import HowItWorksSection from "@/components/landing/HowItWorksSection";
import TestimonialsSection from "@/components/landing/TestimonialsSection";
import BenefitsSection from "@/components/landing/BenefitsSection";
import DualCTASection from "@/components/landing/DualCTASection";
import FAQSection from "@/components/landing/FAQSection";
import { FinalCTASection, FooterSection } from "@/components/landing/FinalCTASection";

const Index = () => {
  return (
    <main className="min-h-screen">
      <HeroSection />
      <ProblemsVsSolutionsSection />
      <HowItWorksSection />
      <TestimonialsSection />
      <BenefitsSection />
      <DualCTASection />
      <FAQSection />
      <FinalCTASection />
      <FooterSection />
    </main>
  );
};

export default Index;
