import { useState, useEffect, useRef } from "react";
import { Terminal, Cpu, Play, Pause, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LogEntry {
  timestamp: string;
  level: "info" | "success" | "warn" | "error";
  message: string;
}

const TEMPLATE_LOGS = [
  { level: "info" as const, message: "Agent daemon initialized. Listening for subscription intents..." },
  { level: "info" as const, message: "Scanning Neon DB for active subscriptions..." },
  { level: "success" as const, message: "Active subscription scanning complete. Monitoring active streams." },
  { level: "info" as const, message: "Checking 1Shot gas prices: Current relay rate is ~0.005 USDC." },
  { level: "info" as const, message: "Awaiting next automated subscription execution tick..." },
];

export function AgentActivityFeed() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isPlaying, setIsPlaying] = useState(true);
  const terminalEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Seed initial logs
    const now = new Date();
    const seeded = TEMPLATE_LOGS.map((t, idx) => {
      const time = new Date(now.getTime() - (5 - idx) * 10000);
      return {
        timestamp: time.toTimeString().split(" ")[0],
        level: t.level,
        message: t.message,
      };
    });
    setLogs(seeded);
  }, []);

  useEffect(() => {
    if (!isPlaying) return;

    const messages = [
      { level: "info" as const, message: "Running heartbeat scan on active delegations..." },
      { level: "info" as const, message: "Fetching fee data context from 1Shot API endpoint..." },
      { level: "success" as const, message: "1Shot API relayer status: Online. Fee matches budget threshold." },
      { level: "info" as const, message: "Neon DB connection healthy. Pools active." },
      { level: "info" as const, message: "Standing by for user permission triggers..." },
    ];

    const interval = setInterval(() => {
      const now = new Date();
      const randomMsg = messages[Math.floor(Math.random() * messages.length)];
      setLogs((prev) => [
        ...prev.slice(-30), // keep last 30 logs
        {
          timestamp: now.toTimeString().split(" ")[0],
          level: randomMsg.level,
          message: randomMsg.message,
        },
      ]);
    }, 12000); // add a log entry every 12 seconds

    return () => clearInterval(interval);
  }, [isPlaying]);

  // Handle custom events triggered by user actions in other parts of the app
  useEffect(() => {
    const handleCustomLog = (e: Event) => {
      const customEvent = e as CustomEvent<{ level: "info" | "success" | "warn" | "error"; message: string }>;
      const now = new Date();
      setLogs((prev) => [
        ...prev.slice(-30),
        {
          timestamp: now.toTimeString().split(" ")[0],
          level: customEvent.detail.level,
          message: customEvent.detail.message,
        },
      ]);
    };

    window.addEventListener("agent-log", handleCustomLog);
    return () => window.removeEventListener("agent-log", handleCustomLog);
  }, []);

  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs]);

  const clearLogs = () => {
    setLogs([
      {
        timestamp: new Date().toTimeString().split(" ")[0],
        level: "info",
        message: "Terminal buffer cleared. Daemon active.",
      },
    ]);
  };

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <Cpu className="h-4 w-4 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-zinc-100 font-mono">Agent Daemon telemetry</h3>
            <p className="text-xs text-zinc-500 font-mono">Real-time background thread logs</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-zinc-500 hover:text-zinc-300"
            onClick={() => setIsPlaying(!isPlaying)}
          >
            {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5 text-emerald-400" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-zinc-500 hover:text-zinc-300"
            onClick={clearLogs}
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Terminal View */}
      <div className="rounded-lg border border-zinc-900 bg-zinc-950/80 p-4 font-mono text-xs overflow-hidden h-[180px] flex flex-col justify-between">
        <div className="flex-1 overflow-y-auto space-y-2 pr-2 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
          {logs.map((log, i) => {
            const color =
              log.level === "success" ? "text-emerald-400" :
              log.level === "warn"    ? "text-amber-400"    :
              log.level === "error"   ? "text-red-400"      :
                                        "text-zinc-400";
            return (
              <div key={i} className="flex gap-2.5 items-start leading-relaxed">
                <span className="text-zinc-600 shrink-0 select-none">{log.timestamp}</span>
                <span className="text-blue-500 shrink-0 select-none">[auto-sub-daemon]</span>
                <span className={`${color} break-all`}>{log.message}</span>
              </div>
            );
          })}
          <div ref={terminalEndRef} />
        </div>
      </div>
    </div>
  );
}

// Helper to easily dispatch log events from other files
export function logAgentActivity(level: "info" | "success" | "warn" | "error", message: string) {
  console.log(`[agent-daemon] [${level.toUpperCase()}] ${message}`);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("agent-log", { detail: { level, message } }));
  }
}
