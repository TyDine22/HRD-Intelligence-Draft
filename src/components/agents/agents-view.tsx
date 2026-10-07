"use client";

import * as React from "react";
import { BoltIcon, CalendarDaysIcon, CheckCircleIcon, ExclamationCircleIcon, PlayIcon, ArrowPathIcon } from "@heroicons/react/24/outline";

import { PageHeader } from "@/components/shared/page-header";
import { KpiCard } from "@/components/shared/kpi-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAppStore } from "@/lib/store/app-store";
import { useToast } from "@/hooks/use-toast";
import { formatDateTime } from "@/lib/utils/format";
import type { Agent } from "@/lib/data/types";
import { cn } from "@/lib/utils";

function AgentCard({ agent, onToggle, onRun }: { agent: Agent; onToggle: (v: boolean) => void; onRun: () => void }) {
  const running = agent.runs.some((r) => r.status === "running");
  const last = agent.runs[0];
  return (
    <div className={cn("bg-card flex flex-col rounded-xl border p-5 shadow-sm", !agent.enabled && "opacity-70")}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className={cn("flex size-10 items-center justify-center rounded-lg", agent.kind === "scheduled" ? "bg-primary/10 text-primary" : "bg-warning-bg text-warning-text")}>
            {agent.kind === "scheduled" ? <CalendarDaysIcon className="size-5" /> : <BoltIcon className="size-5" />}
          </div>
          <div>
            <p className="font-semibold">{agent.name}</p>
            <p className="text-muted-foreground text-xs">{agent.kind === "scheduled" ? agent.schedule : `Trigger: ${agent.trigger}`}</p>
          </div>
        </div>
        <Switch checked={agent.enabled} onCheckedChange={onToggle} aria-label={`Enable ${agent.name}`} />
      </div>
      <p className="mt-3 text-sm">{agent.description}</p>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {agent.outputs.map((o) => <Badge key={o} variant="secondary" className="font-normal">{o}</Badge>)}
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
        <div>
          <p className="text-muted-foreground">Last run</p>
          <p className="flex items-center gap-1 font-medium">
            {last?.status === "failed" ? <ExclamationCircleIcon className="text-destructive size-3.5" /> : last?.status === "running" ? <ArrowPathIcon className="text-primary size-3.5 animate-spin" /> : <CheckCircleIcon className="text-success size-3.5" />}
            {formatDateTime(agent.lastRun)}
          </p>
        </div>
        <div>
          <p className="text-muted-foreground">Next run</p>
          <p className="font-medium">{agent.kind === "scheduled" ? formatDateTime(agent.nextRun) : "On event"}</p>
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between border-t pt-3">
        <p className="text-muted-foreground truncate text-xs">{last?.summary}</p>
        <Button size="sm" variant="outline" onClick={onRun} disabled={running || !agent.enabled}>
          {running ? <ArrowPathIcon className="animate-spin" /> : <PlayIcon />} {running ? "Running" : "Run now"}
        </Button>
      </div>
    </div>
  );
}

export function AgentsView() {
  const { agents, toggleAgent, runAgent } = useAppStore();
  const { toast } = useToast();
  const scheduled = agents.filter((a) => a.kind === "scheduled");
  const triggered = agents.filter((a) => a.kind === "trigger");
  const allRuns = agents.flatMap((a) => a.runs.map((r) => ({ ...r, agent: a.name }))).sort((a, b) => (a.startedAt < b.startedAt ? 1 : -1));
  const failures = allRuns.filter((r) => r.status === "failed").length;

  const run = (a: Agent) => {
    runAgent(a.id);
    toast({ title: `${a.name} started`, description: "The agent is running in the background. Outputs will appear in the run history." });
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Autonomous AI agents" description="Background automation that runs on a timer or when a specific event happens, powered by the local LLM." />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Active agents" value={`${agents.filter((a) => a.enabled).length} / ${agents.length}`} icon={<BoltIcon />} tone="primary" />
        <KpiCard label="Scheduled" value={scheduled.length} hint="run on a timer" icon={<CalendarDaysIcon />} />
        <KpiCard label="Trigger-based" value={triggered.length} hint="run on events" tone="warning" />
        <KpiCard label="Runs (30 days)" value={allRuns.length} hint={failures ? `${failures} failed` : "no failures"} tone={failures ? "danger" : "success"} />
      </div>

      <Tabs defaultValue="agents">
        <TabsList>
          <TabsTrigger value="agents">Agents</TabsTrigger>
          <TabsTrigger value="history">Run history</TabsTrigger>
        </TabsList>
        <TabsContent value="agents" className="space-y-6 pt-2">
          <section>
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold"><CalendarDaysIcon className="text-primary size-4" /> Scheduled agents · run on a timer</h2>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {scheduled.map((a) => <AgentCard key={a.id} agent={a} onToggle={(v) => toggleAgent(a.id, v)} onRun={() => run(a)} />)}
            </div>
          </section>
          <section>
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold"><BoltIcon className="text-warning size-4" /> Trigger-based agents · run when an event happens</h2>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {triggered.map((a) => <AgentCard key={a.id} agent={a} onToggle={(v) => toggleAgent(a.id, v)} onRun={() => run(a)} />)}
            </div>
          </section>
        </TabsContent>
        <TabsContent value="history" className="pt-2">
          <div className="bg-card rounded-xl border shadow-sm">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Started</TableHead>
                  <TableHead>Agent</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Summary</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allRuns.map((r) => (
                  <TableRow key={`${r.agent}-${r.id}`}>
                    <TableCell className="text-xs">{formatDateTime(r.startedAt)}</TableCell>
                    <TableCell className="font-medium">{r.agent}</TableCell>
                    <TableCell><Badge variant={r.status === "success" ? "success" : r.status === "failed" ? "danger" : "info"} className="capitalize">{r.status}</Badge></TableCell>
                    <TableCell className="text-muted-foreground text-xs whitespace-normal">{r.summary}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
