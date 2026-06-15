import { Button } from "@/components/ui/button";
import { ArrowRight, Terminal, CheckCircle2 } from "lucide-react";
import { Link } from "@tanstack/react-router";

export function HeroSection() {
  return (
    <section className="mx-auto max-w-7xl px-6 pt-32 pb-24 md:pt-40 md:pb-32">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div className="flex flex-col items-start space-y-8 max-w-2xl">
          <h1 className="text-5xl md:text-6xl font-medium tracking-tight text-zinc-100 leading-[1.1]">
            Set the rules once. <br className="hidden md:block" />
            Let the agent execute.
          </h1>

          <p className="text-lg text-zinc-400 leading-relaxed max-w-[45ch]">
            Grant a time-limited spending permission to your AI agent. It
            autonomously executes recurring USDC payments via the 1Shot relayer
            without requiring further signatures.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <Link to="/dashboard">
              <Button
                size="lg"
                className="bg-zinc-100 text-zinc-950 hover:bg-white h-12 px-6"
              >
                Launch Agent
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>

        <div className="hidden lg:block">
          <div className="aspect-square rounded-2xl border border-zinc-800 bg-zinc-900/50 flex items-center justify-center p-8 relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.05),transparent_50%)]" />
            <div className="relative w-full max-w-sm space-y-4 font-mono text-xs text-zinc-500">
              <div className="flex items-center gap-2 text-zinc-400">
                <Terminal className="h-4 w-4" />
                <span>agent.execute(delegation)</span>
              </div>
              <div className="border-l border-zinc-800 pl-4 space-y-2">
                <p className="text-emerald-500">{"{"}</p>
                <p className="pl-4">"recipient": "0xNetflix...",</p>
                <p className="pl-4">"amount": "5 USDC",</p>
                <p className="pl-4">"interval": "1 week",</p>
                <p className="pl-4">"status": "authorized"</p>
                <p className="text-emerald-500">{"}"}</p>
              </div>
              <div className="flex items-center gap-2 pt-2 text-zinc-300">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                <span>Tx confirmed: 0x8a7f...9b2e</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
