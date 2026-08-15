import { Hero } from "@/components/sections/Hero";
import { Problem } from "@/components/sections/Problem";
import { Journey } from "@/components/sections/Journey";
import { SkipTheWait } from "@/components/sections/SkipTheWait";
import { Simulator } from "@/components/sections/Simulator";
import { ForHospitals, Segments } from "@/components/sections/ForHospitals";
import { Trust, Faq } from "@/components/sections/Trust";
import { FinalCta } from "@/components/sections/FinalCta";
import { HOME_FAQS } from "@/content/faq";
import {
  FaqSchema,
  SoftwareApplicationSchema,
} from "@/components/seo/JsonLd";

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
