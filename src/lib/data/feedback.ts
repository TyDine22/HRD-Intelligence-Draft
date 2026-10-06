import type { FeedbackCategory, FeedbackEntry } from "./types";
import { STUDENTS } from "./students";
import { courseByCode } from "./users";
import { mulberry32, randInt, addDays, TODAY } from "./seed";

const TEMPLATES: Record<FeedbackCategory, string[]> = {
  Behavior: [
    "Consistently punctual and respectful toward classmates; sets a positive tone for the room.",
    "Has been distracted during afternoon sessions this week; recommend a short check-in.",
    "Takes initiative to help peers debug issues without being asked.",
    "Occasionally arrives late after lunch; attitude is good once engaged.",
  ],
  "Soft Skills": [
    "Communicates clearly during stand-ups and presents work confidently.",
    "Needs encouragement to speak up in group discussions; strong listener.",
    "Excellent collaboration in the team project; natural facilitator.",
    "Struggles with time management on multi-day assignments.",
  ],
  "Hard Skills": [
    "Strong grasp of the core framework; ready for more advanced microservice patterns.",
    "Database design fundamentals need reinforcement before the next module.",
    "Debugging skills improved noticeably after the extra-class sessions.",
    "Writes clean, well-structured code but should add more automated tests.",
  ],
  Other: [
    "Expressed interest in a DevOps career track; could benefit from mentorship.",
    "Reported personal circumstances affecting attendance; HR follow-up suggested.",
    "Volunteered to lead the mini-project demo day logistics.",
  ],
};

function buildFeedback(): FeedbackEntry[] {
  const rng = mulberry32(5151);
  const out: FeedbackEntry[] = [];
  const active = STUDENTS.filter((s) => s.status === "active");
  const categories: FeedbackCategory[] = ["Behavior", "Soft Skills", "Hard Skills", "Other"];
  let n = 1;
  for (const s of active) {
    const count = randInt(rng, 0, 3);
    for (let i = 0; i < count; i++) {
      const category = categories[randInt(rng, 0, 3)];
      const list = TEMPLATES[category];
      out.push({
        id: `FB-${String(n++).padStart(3, "0")}`,
        studentId: s.id,
        instructorId: courseByCode(s.courseCode).instructorId,
        category,
        content: list[randInt(rng, 0, list.length - 1)],
        date: addDays(TODAY, -randInt(rng, 1, 60)),
      });
    }
  }
  return out.sort((a, b) => (a.date < b.date ? 1 : -1));
}

export const FEEDBACK: FeedbackEntry[] = buildFeedback();

export const FEEDBACK_CATEGORIES: FeedbackCategory[] = ["Behavior", "Soft Skills", "Hard Skills", "Other"];

/** Mock "AI" summary of the feedback a student has received. */
export function summarizeFeedback(entries: FeedbackEntry[], studentName: string): string {
  if (!entries.length) return `No instructor feedback has been recorded for ${studentName} yet.`;
  const byCat = new Map<FeedbackCategory, number>();
  entries.forEach((e) => byCat.set(e.category, (byCat.get(e.category) ?? 0) + 1));
  const cats = Array.from(byCat.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([c, n]) => `${c.toLowerCase()} (${n})`)
    .join(", ");
  const concern = entries.find((e) => /need|struggl|distract|late|circumstance/i.test(e.content));
  const strength = entries.find((e) => /strong|excellent|clean|initiative|confident|punctual/i.test(e.content));
  return [
    `${entries.length} feedback note${entries.length > 1 ? "s" : ""} across ${cats}.`,
    strength ? `Strength: ${strength.content}` : null,
    concern ? `Watch-out: ${concern.content}` : "No significant concerns were raised by instructors.",
  ]
    .filter(Boolean)
    .join(" ");
}
