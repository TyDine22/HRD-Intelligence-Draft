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

export const EMPLOYMENT_STATUSES: EmploymentStatus[] = ["employed", "self-employed", "studying", "unemployed"];

const COMPANIES: Record<string, string[]> = {
  "Fintech & Banking": ["Angkor FinTech", "Riel Bank", "Naga Pay", "Mekong Credit"],
  "Software Outsourcing": ["Bayon Software", "Tonle Labs", "Kampot Systems", "Khmer Cloud Co."],
  "E-commerce": ["Sangkat Market", "Nokor Shop", "Apsara Commerce"],
  Telecommunications: ["Bokor Telecom", "Kirirom Mobile"],
  "Government & Public Sector": ["Ministry Digital Unit", "National Data Office"],
  Education: ["Phnom Tech Academy", "Code School Kampuchea"],
  "Healthcare IT": ["MedLink Asia", "Sokapheap Health Systems"],
  "Startup / Product": ["Preah Vihear Labs", "Chaktomuk AI", "Lotus Robotics"],
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
  "Rina", "Kosoma", "Sopheak", "Channary", "Virak", "Dany",
];
const LAST = ["Ngo", "Chhun", "Khun", "Pen", "Soth", "Mao", "Ros", "Touch", "Eng", "Hok", "Khoy", "Noun", "Lay"];
const FEMALE = new Set(["Chanlina", "Sreyroth", "Sokunthea", "Sreymao", "Chantrea", "Reaksmey", "Sreynit", "Pisey", "Rina", "Channary", "Dany"]);

function buildAlumni(): Alumni[] {
  const rng = mulberry32(31337);
  const out: Alumni[] = [];
  const plan: { generation: number; courseCode: string; count: number; gradYear: number }[] = [
    { generation: 12, courseCode: "SP", count: 5, gradYear: 2025 },
    { generation: 12, courseCode: "DA", count: 3, gradYear: 2025 },
    { generation: 12, courseCode: "MB", count: 3, gradYear: 2025 },
    { generation: 11, courseCode: "SP", count: 4, gradYear: 2024 },
    { generation: 11, courseCode: "DO", count: 3, gradYear: 2024 },
    { generation: 10, courseCode: "SP", count: 4, gradYear: 2023 },
    { generation: 10, courseCode: "DA", count: 2, gradYear: 2023 },
    { generation: 9, courseCode: "SP", count: 2, gradYear: 2022 },
  ];
  let n = 1;
  let f = 0;
  for (const p of plan) {
    for (let i = 0; i < p.count; i++) {
      const first = FIRST[f++ % FIRST.length];
      const last = pick(rng, LAST);
      const r = rng();
      const employmentStatus: EmploymentStatus = r < 0.68 ? "employed" : r < 0.8 ? "self-employed" : r < 0.9 ? "studying" : "unemployed";
      const industry = pick(rng, INDUSTRIES);
      const jobs: Job[] = [];
      const jobCount = employmentStatus === "unemployed" ? randInt(rng, 0, 1) : randInt(rng, 1, 3);
      let from = `${p.gradYear}-${pad(randInt(rng, 9, 12))}-01`;
      for (let j = 0; j < jobCount; j++) {
        const ind = j === jobCount - 1 ? industry : pick(rng, INDUSTRIES);
        const isLast = j === jobCount - 1;
        const to = isLast && employmentStatus !== "unemployed" ? null : addDays(from, randInt(rng, 180, 540));
        jobs.push({
          id: `JOB-${n}-${j}`,
          company: employmentStatus === "self-employed" && isLast ? "Freelance / Own business" : pick(rng, COMPANIES[ind]),
          title: pick(rng, TITLES[p.courseCode]),
          industry: ind,
          location: pick(rng, ["Phnom Penh", "Phnom Penh", "Siem Reap", "Remote", "Sihanoukville"]),
          from,
          to,
        });
        if (to) from = addDays(to, randInt(rng, 10, 90));
      }
      const salaryIdx = Math.min(4, Math.max(0, (13 - p.generation) + randInt(rng, -1, 1)));
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
        education: rng() < 0.82 ? "Bachelor" : "Master",
        university: pick(rng, UNIVERSITIES),
        employmentStatus,
        industry: employmentStatus === "studying" ? "Education" : industry,
        salaryRange: employmentStatus === "unemployed" || employmentStatus === "studying" ? "—" : SALARY_RANGES[salaryIdx],
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
