import { lazy, Suspense } from "react";
import { useReducedMotion } from "framer-motion";

import { CTASection } from "@/components/landing/cta-section";
import { FAQSection } from "@/components/landing/faq-section";
import { FeaturesSection } from "@/components/landing/features-section";
import { GetStartedSection } from "@/components/landing/get-started-section";
import { HeroSection } from "@/components/landing/hero-section";
import { ProductShowcase } from "@/components/landing/product-showcase";
import { TestimonialsSection } from "@/components/landing/testimonials-section";
import { useMediaQuery } from "@/hooks/use-media-query";

const RepoRain = lazy(() => import("@/components/landing/repo-rain"));

export function Home() {
  const prefersReduced = useReducedMotion();
  const isMobile = useMediaQuery("(max-width: 767px)");

  return (
    <>
      {!prefersReduced && !isMobile && (
        <Suspense fallback={null}>
          <RepoRain />
        </Suspense>
      )}
      <HeroSection />
      <ProductShowcase />
      <FeaturesSection />
      <TestimonialsSection />
      <GetStartedSection />
      <FAQSection />
      <CTASection />
    </>
  );
}
