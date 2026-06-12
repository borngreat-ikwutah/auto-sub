import { ChatInterface } from "@/components/features/ChatInterface";
import { ActiveDelegations } from "@/components/features/ActiveDelegations";

export function AppPreviewSection() {
  return (
    <section className="border-t border-zinc-900 bg-zinc-950/50">
      <div className="mx-auto max-w-7xl px-6 py-24 md:py-32">
        <div className="mb-16 max-w-2xl">
          <h2 className="text-3xl font-medium tracking-tight text-zinc-100 mb-4">
            Command your subscription lifecycle.
          </h2>
          <p className="text-zinc-400 leading-relaxed max-w-[65ch]">
            Chat with the AI to create, modify, and monitor your recurring
            payments. The agent translates your intent into structured actions
            within your approved budget.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <ChatInterface />
          <ActiveDelegations />
        </div>
      </div>
    </section>
  );
}
