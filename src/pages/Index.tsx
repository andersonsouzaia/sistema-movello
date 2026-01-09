import HeroSection from "@/components/landing/HeroSection";
import StatsSection from "@/components/landing/StatsSection";
import ProblemsVsSolutionsSection from "@/components/landing/ProblemsVsSolutionsSection";
import HowItWorksSection from "@/components/landing/HowItWorksSection";
import BenefitsSection from "@/components/landing/BenefitsSection";
import TestimonialsSection from "@/components/landing/TestimonialsSection";
import DualCTASection from "@/components/landing/DualCTASection";
import ReadyToAdvertiseSection from "@/components/landing/ReadyToAdvertiseSection";
import FAQSection from "@/components/landing/FAQSection";
import { FooterSection } from "@/components/landing/FinalCTASection";

const Index = () => {
  return (
    <main className="min-h-screen">
      <HeroSection />
      <StatsSection />
      <ProblemsVsSolutionsSection />
      <BenefitsSection />
      <TestimonialsSection />
      <HowItWorksSection />
      <DualCTASection />
      <ReadyToAdvertiseSection />
      <FAQSection />
      <FooterSection />
    </main>
  );
};

export default Index;
