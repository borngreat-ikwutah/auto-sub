import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/components/layout/Navbar";
import { HeroSection } from "@/components/landing/HeroSection";

export const Route = createFileRoute("/")({
  component: LandingPage,
});

function LandingPage() {
  return (
    <div className="min-h-dvh bg-zinc-950 text-zinc-50 font-sans selection:bg-zinc-800">
      <Navbar />
      <main>
        <HeroSection />
      </main>
    </div>
  );
}
