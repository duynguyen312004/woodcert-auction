import { CategoriesSection } from "./components/CategoriesSection";
import { FeaturedAuctionsSection } from "./components/FeaturedAuctionsSection";
import { HomeHero } from "./components/HomeHero";
import { HowItWorksSection } from "./components/HowItWorksSection";
import { TrustStatsBar } from "./components/TrustStatsBar";
import { WoodCertShowcase } from "./components/WoodCertShowcase";
import { ArtisanShowcase } from "./components/ArtisanShowcase";

export function HomePage() {
  return (
    <div className="w-full">
      <HomeHero />
      <TrustStatsBar />
      <FeaturedAuctionsSection />
      <WoodCertShowcase />
      <CategoriesSection />
      <ArtisanShowcase />
      <HowItWorksSection />
    </div>
  );
}
