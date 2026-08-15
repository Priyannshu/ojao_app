import type { Metadata } from "next";
import { Hero } from "@/components/sections/Hero";
import { Problem } from "@/components/sections/Problem";
import { Journey } from "@/components/sections/Journey";
import { SkipTheWait } from "@/components/sections/SkipTheWait";
import { Simulator } from "@/components/sections/Simulator";
import { ForHospitals, Segments } from "@/components/sections/ForHospitals";
import { Trust, Faq } from "@/components/sections/Trust";
import { FinalCta } from "@/components/sections/FinalCta";
import { HOME_FAQS } from "@/content/faq";
import { pageMetadata } from "@/lib/metadata";
import { SITE } from "@/lib/site";
import {
  FaqSchema,
  SoftwareApplicationSchema,
} from "@/components/seo/JsonLd";

export const metadata: Metadata = pageMetadata({
  title: "ojao — Digital Patient Flow & Virtual Queue for Healthcare",
  description: SITE.description,
  path: "/",
});

export default function Home() {
  return (
    <>
      <Hero />
      <Problem />
      <Journey />
      <SkipTheWait />
      <Simulator />
      <ForHospitals />
      <Segments />
      <Trust />
      <Faq />
      <FinalCta />

      <FaqSchema items={HOME_FAQS} />
      <SoftwareApplicationSchema />
    </>
  );
}
