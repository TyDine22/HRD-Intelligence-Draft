"use client";

import * as React from "react";
import { CalendarDaysIcon, PencilSquareIcon, PlusIcon, TrashIcon, TrophyIcon, UsersIcon } from "@heroicons/react/24/outline";

import { KpiCard } from "@/components/shared/kpi-card";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CardField, CardFields, CardGrid, RecordCard, ViewToggle, useViewMode } from "@/components/shared/view-toggle";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAppStore } from "@/lib/store/app-store";
import { useToast } from "@/hooks/use-toast";
import { STUDENTS } from "@/lib/data/students";
import { ALLOWANCE_MONTHS, memberPrize, ordinal, teamPrize } from "@/lib/data/allowances";
import { formatCurrency, formatDate, formatMonth } from "@/lib/utils/format";
import type { ChallengeTeam } from "@/lib/data/types";
import { cn } from "@/lib/utils";

const RANK_OPTIONS: { value: string; label: string }[] = [
  { value: "none", label: "Not placed" },
  { value: "1", label: "1st place" },
  { value: "2", label: "2nd place" },
  { value: "3", label: "3rd place" },
];

export function CodingChallengePanel() {
  const { challenge, updateChallenge } = useAppStore();
  const [view, setView] = useViewMode("challenge-teams");
  const { toast } = useToast();
  const [editing, setEditing] = React.useState<ChallengeTeam | null>(null);
  const [isNew, setIsNew] = React.useState(false);
  const [draftName, setDraftName] = React.useState("");
  const [draftMembers, setDraftMembers] = React.useState<string[]>([]);
  const [memberQuery, setMemberQuery] = React.useState("");

  const studentMap = React.useMemo(() => new Map(STUDENTS.map((s) => [s.id, s])), []);
  const eligible = React.useMemo(() => STUDENTS.filter((s) => s.status === "active" && s.generation === 13), []);
  const assigned = React.useMemo(() => {
    const map = new Map<string, string>();
    challenge.teams.forEach((t) => t.memberIds.forEach((id) => map.set(id, t.id)));
    return map;
  }, [challenge.teams]);

  const winners = challenge.teams.filter((t) => t.rank);
  const totalPayout = winners.reduce((acc, t) => acc + memberPrize(t, challenge) * t.memberIds.length, 0);
  const participants = challenge.teams.reduce((acc, t) => acc + t.memberIds.length, 0);

  const setReward = (place: 1 | 2 | 3, amount: number) =>
    updateChallenge((prev) => ({ ...prev, rewards: prev.rewards.map((r) => (r.place === place ? { ...r, amount } : r)) }));

  const setRank = (teamId: string, value: string) => {
    const rank = value === "none" ? null : (Number(value) as 1 | 2 | 3);
    updateChallenge((prev) => ({
      ...prev,
      teams: prev.teams.map((t) => (t.id === teamId ? { ...t, rank } : rank && t.rank === rank ? { ...t, rank: null } : t)),
    }));
  };

  const openEdit = (team: ChallengeTeam | null) => {
    setIsNew(!team);
    setEditing(team ?? { id: `TEAM-${Date.now()}`, name: `Team ${challenge.teams.length + 1}`, memberIds: [], rank: null });
    setDraftName(team?.name ?? `Team ${challenge.teams.length + 1}`);
    setDraftMembers(team?.memberIds ?? []);
    setMemberQuery("");
  };

  const saveTeam = () => {
    if (!editing || !draftName.trim()) return;
    if (draftMembers.length > challenge.maxTeamSize) {
      toast({ title: "Team too large", description: `A team can have at most ${challenge.maxTeamSize} students.`, variant: "error" });
      return;
    }
    const next: ChallengeTeam = { ...editing, name: draftName.trim(), memberIds: draftMembers };
    updateChallenge((prev) => ({
      ...prev,
      teams: isNew ? [...prev.teams, next] : prev.teams.map((t) => (t.id === next.id ? next : t)),
    }));
    toast({ title: isNew ? "Team created" : "Team updated", description: `${next.name} · ${next.memberIds.length} students`, variant: "success" });
    setEditing(null);
  };

  const removeTeam = (team: ChallengeTeam) => {
    updateChallenge((prev) => ({ ...prev, teams: prev.teams.filter((t) => t.id !== team.id) }));
    toast({ title: "Team removed", description: team.name });
  };

  const toggleMember = (id: string, checked: boolean) => {
    setDraftMembers((prev) => {
      if (!checked) return prev.filter((x) => x !== id);
      if (prev.includes(id)) return prev;
      if (prev.length >= challenge.maxTeamSize) {
        toast({ title: `Maximum ${challenge.maxTeamSize} students per team`, variant: "error" });
        return prev;
      }
      return [...prev, id];
    });
  };

  const candidates = eligible.filter((s) => {
    const owner = assigned.get(s.id);
    const free = !owner || owner === editing?.id;
    return free && (!memberQuery || s.name.toLowerCase().includes(memberQuery.toLowerCase()));
  });

  return (
    <div className="space-y-4">
      {/* Settings */}
      <div className={cn("bg-card rounded-xl border p-5 shadow-sm", !challenge.enabled && "opacity-80")}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-3">
            <div className="bg-warning-bg text-warning-text flex size-10 shrink-0 items-center justify-center rounded-lg">
              <TrophyIcon className="size-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-semibold">{challenge.name}</h3>
                <Badge variant={challenge.enabled ? "success" : "secondary"}>{challenge.enabled ? "Active" : "Inactive"}</Badge>
                <Badge variant="outline">One-off</Badge>
              </div>
              <p className="text-muted-foreground mt-1 max-w-xl text-sm">
                A one-day team challenge held once in the {challenge.courseLabel}, before the final project starts. Students are
                divided into teams of up to {challenge.maxTeamSize}; the top three teams receive a prize that is split equally among the
                team members and added to the {formatMonth(challenge.payoutMonth)} allowance.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 lg:pt-1">
            <Label htmlFor="challenge-enabled" className="text-sm">
              {challenge.enabled ? "Included in allowance" : "Excluded from allowance"}
            </Label>
            <Switch
              id="challenge-enabled"
              checked={challenge.enabled}
              onCheckedChange={(v) => {
                updateChallenge({ enabled: v });
                toast({ title: v ? "Coding challenge reward activated" : "Coding challenge reward deactivated", description: v ? `Prizes are added to the ${formatMonth(challenge.payoutMonth)} allowance.` : "Prizes are no longer included in any monthly allowance." });
              }}
            />
          </div>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="grid gap-1.5">
            <Label htmlFor="ch-date">Challenge date</Label>
            <Input id="ch-date" type="date" value={challenge.date} onChange={(e) => updateChallenge({ date: e.target.value })} />
          </div>
          <div className="grid gap-1.5">
            <Label>Payout month</Label>
            <Select value={challenge.payoutMonth} onValueChange={(v) => updateChallenge({ payoutMonth: v })}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>{ALLOWANCE_MONTHS.map((m) => <SelectItem key={m} value={m}>{formatMonth(m)}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="ch-size">Max students per team</Label>
            <Input id="ch-size" type="number" min={1} max={20} value={challenge.maxTeamSize} onChange={(e) => updateChallenge({ maxTeamSize: Math.max(1, Number(e.target.value) || 1) })} />
          </div>
          <div className="grid gap-1.5">
            <Label>Prize distribution</Label>
            <div className="bg-muted/50 flex h-9 items-center rounded-md border px-3 text-sm">Split equally among team members</div>
          </div>
        </div>

        <div className="mt-5">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide">Team prize rewards (USD) — editable when the policy changes</p>
          <div className="grid gap-3 sm:grid-cols-3">
            {challenge.rewards.map((r) => (
              <div key={r.place} className="flex items-center gap-3 rounded-lg border p-3">
                <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-bold", r.place === 1 ? "bg-[#f5a300] text-[#4a2c00]" : r.place === 2 ? "bg-[#cfd5db] text-[#394149]" : "bg-[#c47a3a] text-white")}>
                  {ordinal(r.place)}
                </span>
                <div className="flex-1">
                  <Label htmlFor={`prize-${r.place}`} className="text-muted-foreground text-xs">Top {r.place} team</Label>
                  <div className="mt-1 flex items-center gap-1">
                    <span className="text-muted-foreground text-sm">$</span>
                    <Input id={`prize-${r.place}`} type="number" min={0} step={5} value={r.amount} onChange={(e) => setReward(r.place, Math.max(0, Number(e.target.value) || 0))} className="h-8" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Teams" value={challenge.teams.length} hint={`${participants} participants`} icon={<UsersIcon />} tone="primary" />
        <KpiCard label="Winning teams" value={winners.length} hint="ranked 1st – 3rd" icon={<TrophyIcon />} tone="warning" />
        <KpiCard label="Total payout" value={formatCurrency(totalPayout)} hint={challenge.enabled ? `paid in ${formatMonth(challenge.payoutMonth)}` : "not included (inactive)"} tone={challenge.enabled ? "success" : "default"} />
        <KpiCard label="Challenge date" value={formatDate(challenge.date)} hint="before the final project" icon={<CalendarDaysIcon />} />
      </div>

      {/* Teams */}
      <div className="bg-card rounded-xl border shadow-sm">
        <div className="flex items-center justify-between border-b p-4">
          <div>
            <h3 className="font-semibold">Teams & results</h3>
            <p className="text-muted-foreground text-xs">Assign Basic-course students to teams and record the final placing.</p>
          </div>
          <div className="flex items-center gap-2">
            <ViewToggle value={view} onChange={setView} />
            <Button onClick={() => openEdit(null)}><PlusIcon /> Add team</Button>
          </div>
        </div>
        {challenge.teams.length === 0 ? (
          <EmptyState title="No teams yet" description="Create teams of up to the configured size and assign the top three places." />
        ) : view === "grid" ? (
          <CardGrid>
            {challenge.teams.map((t) => {
              const over = t.memberIds.length > challenge.maxTeamSize;
              return (
                <RecordCard
                  key={t.id}
                  title={t.name}
                  subtitle={
                    <>
                      {t.memberIds.slice(0, 4).map((id) => studentMap.get(id)?.name.split(" ")[1] ?? id).join(", ")}
                      {t.memberIds.length > 4 ? ` +${t.memberIds.length - 4}` : ""}
                    </>
                  }
                  leading={<Badge variant={over ? "danger" : "secondary"} className="h-7 px-2 tabular-nums">{t.memberIds.length} / {challenge.maxTeamSize}</Badge>}
                  trailing={
                    <>
                      <Button variant="ghost" size="icon-sm" aria-label="Edit team" onClick={() => openEdit(t)}><PencilSquareIcon /></Button>
                      <Button variant="ghost" size="icon-sm" aria-label="Remove team" className="text-destructive" onClick={() => removeTeam(t)}><TrashIcon /></Button>
                    </>
                  }
                  footer={
                    <>
                      <span className="text-muted-foreground text-xs">Per student (split)</span>
                      <span className="font-medium tabular-nums">{t.rank ? formatCurrency(memberPrize(t, challenge)) : "—"}</span>
                    </>
                  }
                >
                  <div className="flex items-center justify-between gap-3">
                    <Select value={t.rank ? String(t.rank) : "none"} onValueChange={(v) => setRank(t.id, v)}>
                      <SelectTrigger size="sm" className="w-32"><SelectValue /></SelectTrigger>
                      <SelectContent>{RANK_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                    </Select>
                    <CardFields columns={2} className="shrink-0">
                      <CardField label="Team prize" align="right">{t.rank ? formatCurrency(teamPrize(t, challenge)) : "—"}</CardField>
                    </CardFields>
                  </div>
                </RecordCard>
              );
            })}
          </CardGrid>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Team</TableHead>
                <TableHead>Members</TableHead>
                <TableHead>Placing</TableHead>
                <TableHead className="text-right">Team prize</TableHead>
                <TableHead className="text-right">Per student (split)</TableHead>
                <TableHead className="w-24" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {challenge.teams.map((t) => {
                const over = t.memberIds.length > challenge.maxTeamSize;
                return (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium">{t.name}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap items-center gap-1">
                        <Badge variant={over ? "danger" : "secondary"}>{t.memberIds.length} / {challenge.maxTeamSize}</Badge>
                        <span className="text-muted-foreground max-w-md truncate text-xs">
                          {t.memberIds.slice(0, 4).map((id) => studentMap.get(id)?.name.split(" ")[1] ?? id).join(", ")}
                          {t.memberIds.length > 4 ? ` +${t.memberIds.length - 4}` : ""}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Select value={t.rank ? String(t.rank) : "none"} onValueChange={(v) => setRank(t.id, v)}>
                        <SelectTrigger size="sm" className="w-32"><SelectValue /></SelectTrigger>
                        <SelectContent>{RANK_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{t.rank ? formatCurrency(teamPrize(t, challenge)) : "—"}</TableCell>
                    <TableCell className="text-right font-medium tabular-nums">{t.rank ? formatCurrency(memberPrize(t, challenge)) : "—"}</TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon-sm" aria-label="Edit team" onClick={() => openEdit(t)}><PencilSquareIcon /></Button>
                        <Button variant="ghost" size="icon-sm" aria-label="Remove team" className="text-destructive" onClick={() => removeTeam(t)}><TrashIcon /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
        <p className="text-muted-foreground border-t px-4 py-2.5 text-xs">
          {eligible.length - participants} eligible students are not in a team yet. Winners appear as a “Coding challenge reward” column in the{" "}
          <span className="text-foreground font-medium">{formatMonth(challenge.payoutMonth)}</span> monthly allowance.
        </p>
      </div>

      {/* Team editor */}
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{isNew ? "New team" : `Edit ${editing?.name}`}</DialogTitle>
            <DialogDescription>Select up to {challenge.maxTeamSize} Basic-course students. Students already in another team are hidden.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="team-name">Team name</Label>
              <Input id="team-name" value={draftName} onChange={(e) => setDraftName(e.target.value)} />
            </div>
            <div className="flex items-center justify-between">
              <Label>Members</Label>
              <Badge variant={draftMembers.length > challenge.maxTeamSize ? "danger" : "secondary"}>{draftMembers.length} / {challenge.maxTeamSize}</Badge>
            </div>
            <Input placeholder="Search students…" value={memberQuery} onChange={(e) => setMemberQuery(e.target.value)} />
            <div className="max-h-64 overflow-y-auto rounded-lg border">
              {candidates.map((s) => (
                <label key={s.id} className="hover:bg-accent/50 flex cursor-pointer items-center gap-3 border-b px-3 py-2 text-sm last:border-0">
                  <Checkbox checked={draftMembers.includes(s.id)} onCheckedChange={(v) => toggleMember(s.id, v === true)} />
                  <span className="flex-1 truncate">{s.name}</span>
                  <span className="text-muted-foreground text-xs">{s.classroom}</span>
                </label>
              ))}
              {candidates.length === 0 && <p className="text-muted-foreground px-3 py-4 text-xs">No available students match.</p>}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
            <Button onClick={saveTeam} disabled={!draftName.trim() || draftMembers.length === 0}>{isNew ? "Create team" : "Save team"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
