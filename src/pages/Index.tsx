import HeroSection from "@/components/landing/HeroSection";
import ProblemsVsSolutionsSection from "@/components/landing/ProblemsVsSolutionsSection";
import HowItWorksSection from "@/components/landing/HowItWorksSection";
import BenefitsSection from "@/components/landing/BenefitsSection";
import DualCTASection from "@/components/landing/DualCTASection";
import ReadyToAdvertiseSection from "@/components/landing/ReadyToAdvertiseSection";
import FAQSection from "@/components/landing/FAQSection";
import { FooterSection } from "@/components/landing/FinalCTASection";

const Index = () => {
  return (
    <main className="min-h-screen">
      <HeroSection />
      <ProblemsVsSolutionsSection />
      <HowItWorksSection />
      <BenefitsSection />
      <DualCTASection />
      <ReadyToAdvertiseSection />
      <FAQSection />
      <FooterSection />
    </main>
  );
};

export default Index;
