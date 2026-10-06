import { BoltIcon, ChartBarSquareIcon, ShieldCheckIcon, SparklesIcon } from "@heroicons/react/24/outline";

const FEATURES = [
  { icon: ChartBarSquareIcon, title: "Dashboard & analytics", text: "KPI cards, attendance trends and at-risk tracking." },
  { icon: SparklesIcon, title: "AI chatbot (RAG + local LLM)", text: "Ask questions over authorised HRD data and documents." },
  { icon: BoltIcon, title: "Autonomous agents", text: "Weekly summaries, feedback reports and alumni refresh." },
  { icon: ShieldCheckIcon, title: "Role-based access", text: "Keycloak OIDC for Admins and Instructors." },
];

export function AuthFeatureList() {
  return (
    <ul className="mt-8 grid gap-4 sm:grid-cols-2">
      {FEATURES.map((f) => (
        <li key={f.title} className="flex gap-3 rounded-lg border border-white/10 bg-white/5 p-3 backdrop-blur-sm">
          <f.icon className="text-sidebar-primary mt-0.5 size-5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-white">{f.title}</p>
            <p className="text-xs text-white/60">{f.text}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}
