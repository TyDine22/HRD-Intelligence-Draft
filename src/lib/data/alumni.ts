import type { Alumni, EmploymentStatus, Job } from "./types";
import { UNIVERSITIES } from "./students";
import { mulberry32, pick, randInt, pad, addDays, TODAY } from "./seed";

export const INDUSTRIES = [
  "Fintech & Banking",
  "Software Outsourcing",
  "E-commerce",
  "Telecommunications",
  "Government & Public Sector",
  "Education",
  "Healthcare IT",
  "Startup / Product",
];

export const SALARY_RANGES = ["$300 – $500", "$500 – $800", "$800 – $1,200", "$1,200 – $2,000", "$2,000+"];

/** Official employment statuses, in the order they appear in the achievements chart. */
export const EMPLOYMENT_STATUSES: EmploymentStatus[] = [
  "Local SW Developer",
  "International SW Developer",
  "Banks",
  "Government Officials",
  "Full Scholarship Abroad",
  "IT Instructor in HRD Center",
  "Other",
];

/** Statuses that count as "employed" for the employment-rate KPI. */
export const EMPLOYED_STATUSES: EmploymentStatus[] = [
  "Local SW Developer",
  "International SW Developer",
  "Banks",
  "Government Officials",
  "IT Instructor in HRD Center",
];

/** Midpoint of a salary range label, used for the average-salary KPI. */
export function salaryMidpoint(range: string): number | null {
  const nums = range.match(/[\d,]+/g)?.map((n) => Number(n.replace(/,/g, ""))) ?? [];
  if (nums.length === 0) return null;
  if (range.includes("+")) return nums[0] * 1.15;
  return nums.length >= 2 ? (nums[0] + nums[1]) / 2 : nums[0];
}

/* ------------------------------------------------------------------ */
/* Mock data                                                           */
/* ------------------------------------------------------------------ */

const STATUS_PROFILE: Record<
  EmploymentStatus,
  { industries: string[]; companies: string[]; locations: string[]; hasJob: boolean }
> = {
  "Local SW Developer": {
    industries: ["Software Outsourcing", "E-commerce", "Telecommunications", "Startup / Product", "Healthcare IT"],
    companies: ["Bayon Software", "Tonle Labs", "Kampot Systems", "Khmer Cloud Co.", "Sangkat Market", "Bokor Telecom", "Chaktomuk AI", "MedLink Asia"],
    locations: ["Phnom Penh", "Phnom Penh", "Siem Reap"],
    hasJob: true,
  },
  "International SW Developer": {
    industries: ["Software Outsourcing", "Startup / Product", "E-commerce"],
    companies: ["Hanwoo Systems (Seoul)", "Lion City Digital (Singapore)", "Sakura Tech (Tokyo)", "Nordic Cloud (Remote)"],
    locations: ["Seoul", "Singapore", "Tokyo", "Remote"],
    hasJob: true,
  },
  Banks: {
    industries: ["Fintech & Banking"],
    companies: ["Angkor FinTech", "Riel Bank", "Naga Pay", "Mekong Credit"],
    locations: ["Phnom Penh"],
    hasJob: true,
  },
  "Government Officials": {
    industries: ["Government & Public Sector"],
    companies: ["Ministry Digital Unit", "National Data Office"],
    locations: ["Phnom Penh"],
    hasJob: true,
  },
  "Full Scholarship Abroad": {
    industries: ["Education"],
    companies: [],
    locations: ["Seoul", "Daejeon", "Tokyo"],
    hasJob: false,
  },
  "IT Instructor in HRD Center": {
    industries: ["Education"],
    companies: ["Korea Software HRD Center"],
    locations: ["Phnom Penh"],
    hasJob: true,
  },
  Other: {
    industries: ["Education", "E-commerce", "Healthcare IT"],
    companies: ["Freelance / Own business", "Phnom Tech Academy", "Nokor Shop"],
    locations: ["Phnom Penh", "Battambang"],
    hasJob: true,
  },
};

const TITLES: Record<string, string[]> = {
  SP: ["Backend Developer", "Java Engineer", "Software Engineer", "Full-Stack Developer"],
  DA: ["Data Analyst", "BI Developer", "Data Engineer", "Junior Data Scientist"],
  MB: ["Android Developer", "iOS Developer", "Mobile Engineer"],
  DO: ["DevOps Engineer", "Cloud Engineer", "Site Reliability Engineer"],
};

const FIRST = [
  "Sovandara", "Chanlina", "Rotanak", "Sreyroth", "Kimsan", "Puthea", "Vichet", "Sokunthea", "Menghour", "Davin",
  "Sreymao", "Oudom", "Borey", "Chantrea", "Sokvisal", "Reaksmey", "Tola", "Sreynit", "Vibol", "Pisey",
  "Rina", "Kosoma", "Sopheak", "Channary", "Virak", "Dany", "Sambo", "Leakhena", "Piseth", "Sotheary",
  "Kunthea", "Rithya", "Chandara", "Sreypov", "Vannak", "Bunthoeun",
];
const LAST = ["Ngo", "Chhun", "Khun", "Pen", "Soth", "Mao", "Ros", "Touch", "Eng", "Hok", "Khoy", "Noun", "Lay"];
const FEMALE = new Set(["Chanlina", "Sreyroth", "Sokunthea", "Sreymao", "Chantrea", "Reaksmey", "Sreynit", "Pisey", "Rina", "Channary", "Dany", "Leakhena", "Sotheary", "Kunthea", "Sreypov"]);

/**
 * Status sequence shaped to the official distribution
 * (≈56% local, 11% international, 15% banks, 5% government, 9% scholarship, 2% instructor, 2% other).
 */
const STATUS_SEQUENCE: EmploymentStatus[] = [
  "Local SW Developer", "Banks", "Local SW Developer", "International SW Developer", "Local SW Developer",
  "Full Scholarship Abroad", "Local SW Developer", "Government Officials", "Local SW Developer", "Banks",
  "Local SW Developer", "International SW Developer", "Local SW Developer", "Full Scholarship Abroad", "Local SW Developer",
  "Banks", "Local SW Developer", "IT Instructor in HRD Center", "Local SW Developer", "Other",
  "Local SW Developer", "International SW Developer", "Banks", "Local SW Developer", "Government Officials",
  "Local SW Developer", "Full Scholarship Abroad", "Local SW Developer", "Banks", "Local SW Developer",
  "International SW Developer", "Local SW Developer", "Local SW Developer", "Banks",
];

function buildAlumni(): Alumni[] {
  const rng = mulberry32(31337);
  const out: Alumni[] = [];
  const plan: { generation: number; courseCode: string; count: number; gradYear: number }[] = [
    { generation: 12, courseCode: "SP", count: 6, gradYear: 2025 },
    { generation: 12, courseCode: "DA", count: 3, gradYear: 2025 },
    { generation: 12, courseCode: "MB", count: 3, gradYear: 2025 },
    { generation: 11, courseCode: "SP", count: 5, gradYear: 2024 },
    { generation: 11, courseCode: "DO", count: 3, gradYear: 2024 },
    { generation: 10, courseCode: "SP", count: 5, gradYear: 2023 },
    { generation: 10, courseCode: "DA", count: 3, gradYear: 2023 },
    { generation: 9, courseCode: "SP", count: 4, gradYear: 2022 },
    { generation: 8, courseCode: "SP", count: 2, gradYear: 2021 },
  ];
  let n = 1;
  let f = 0;
  for (const p of plan) {
    for (let i = 0; i < p.count; i++) {
      const first = FIRST[f % FIRST.length];
      const last = LAST[(f * 7 + 3) % LAST.length];
      const employmentStatus = STATUS_SEQUENCE[f % STATUS_SEQUENCE.length];
      f++;
      const profile = STATUS_PROFILE[employmentStatus];
      const industry = pick(rng, profile.industries);
      const education: Alumni["education"] =
        employmentStatus === "Full Scholarship Abroad" ? (rng() < 0.7 ? "Master" : "PhD") : rng() < 0.85 ? "Bachelor" : "Master";

      const jobs: Job[] = [];
      let from = `${p.gradYear}-${pad(randInt(rng, 9, 12))}-01`;
      if (profile.hasJob) {
        const jobCount = randInt(rng, 1, Math.min(3, 1 + (2026 - p.gradYear)));
        for (let j = 0; j < jobCount; j++) {
          const isLast = j === jobCount - 1;
          // earlier jobs are usually local developer roles before moving to the current status
          const prof = isLast ? profile : STATUS_PROFILE["Local SW Developer"];
          const to = isLast ? null : addDays(from, randInt(rng, 180, 540));
          jobs.push({
            id: `JOB-${n}-${j}`,
            company: pick(rng, prof.companies),
            title:
              employmentStatus === "IT Instructor in HRD Center" && isLast
                ? "IT Instructor"
                : employmentStatus === "Government Officials" && isLast
                  ? "IT Officer"
                  : pick(rng, TITLES[p.courseCode]),
            industry: isLast ? industry : pick(rng, prof.industries),
            location: pick(rng, prof.locations),
            from,
            to,
          });
          if (to) from = addDays(to, randInt(rng, 10, 90));
        }
      }

      const salaryBase = Math.min(4, Math.max(0, 13 - p.generation + randInt(rng, -1, 1)));
      const salaryIdx =
        employmentStatus === "International SW Developer" ? Math.min(4, salaryBase + 2) : employmentStatus === "Banks" ? Math.min(4, salaryBase + 1) : salaryBase;
      const sentAt = addDays(TODAY, -randInt(rng, 3, 120));
      const updateRequest =
        rng() < 0.45
          ? { sentAt, sentBy: (rng() < 0.5 ? "ai" : "admin") as "ai" | "admin", status: (rng() < 0.6 ? "completed" : "pending") as "completed" | "pending" }
          : null;

      out.push({
        id: `ALM-${String(n++).padStart(3, "0")}`,
        name: `${last} ${first}`,
        email: `${first}.${last}@alumni.hrd.local`.toLowerCase(),
        phone: `+855 ${randInt(rng, 10, 99)} ${randInt(rng, 200, 999)} ${randInt(rng, 100, 999)}`,
        gender: FEMALE.has(first) ? "Female" : "Male",
        generation: p.generation,
        courseCode: p.courseCode,
        education,
        university: pick(rng, UNIVERSITIES),
        employmentStatus,
        industry,
        salaryRange: employmentStatus === "Full Scholarship Abroad" ? "—" : SALARY_RANGES[salaryIdx],
        jobs,
        documents: [
          { id: `DOC-${n}-cv`, name: `${last}_${first}_CV.pdf`, ext: "pdf", size: 240_000 + randInt(rng, 0, 400_000), uploadedAt: addDays(TODAY, -randInt(rng, 30, 400)) },
          ...(rng() < 0.5
            ? [{ id: `DOC-${n}-cert`, name: "HRD_Completion_Certificate.pdf", ext: "pdf", size: 120_000, uploadedAt: `${p.gradYear}-12-15` }]
            : []),
        ],
        lastUpdated: updateRequest?.status === "completed" ? addDays(updateRequest.sentAt, randInt(rng, 1, 10)) : addDays(TODAY, -randInt(rng, 60, 400)),
        updateRequest,
      });
    }
  }
  return out;
}

export const ALUMNI: Alumni[] = buildAlumni();
export const ALUMNI_GENERATIONS = Array.from(new Set(ALUMNI.map((a) => a.generation))).sort((a, b) => b - a);