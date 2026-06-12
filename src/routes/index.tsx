import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: Dashboard,
});

function Dashboard() {
  return (
    <div className="flex h-full items-center justify-center">
      Welcome to AutoSub Agent
    </div>
  );
}
