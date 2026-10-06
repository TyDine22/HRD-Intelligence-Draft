import type { Student, StudentStatus } from "./types";
import { mulberry32, pick, randInt, pad } from "./seed";

const FIRST_NAMES = [
  "Sokha", "Dara", "Chanthou", "Sreyleak", "Vannak", "Bopha", "Rithy", "Kunthea", "Piseth", "Sreymom",
  "Sovann", "Chenda", "Makara", "Phalla", "Samnang", "Veasna", "Sophea", "Rachana", "Vuthy", "Sreypich",
  "Kosal", "Nary", "Chamroeun", "Sreyneang", "Pheakdey", "Sokun", "Leakhena", "Vireak", "Sochea", "Thida",
  "Sambath", "Kimheng", "Panha", "Ratana", "Sreynich", "Visal", "Monyroth", "Dalin", "Sokheng", "Theary",
  "Rotha", "Sreyoun", "Chanra", "Seyha", "Mealea", "Boramey", "Sovanna", "Kanika", "Narith", "Socheata",
];

const LAST_NAMES = [
  "Chan", "Sok", "Kim", "Heng", "Lim", "Chea", "Phan", "Ly", "Kong", "Meas",
  "Yim", "Nhem", "Ouk", "Pich", "Seng", "Tep", "Vong", "Keo", "Hun", "Sam",
];

const FEMALE_FIRST = new Set([
  "Sreyleak", "Bopha", "Kunthea", "Sreymom", "Chenda", "Phalla", "Sophea", "Rachana", "Sreypich", "Nary",
  "Sreyneang", "Leakhena", "Thida", "Sreynich", "Dalin", "Theary", "Sreyoun", "Mealea", "Kanika", "Socheata",
]);

export const UNIVERSITIES = [
  "Royal University of Phnom Penh",
  "Institute of Technology of Cambodia",
  "National University of Management",
  "Cambodia Academy of Digital Technology",
  "Paragon International University",
  "Norton University",
  "SETEC Institute",
  "University of Puthisastra",
];

export const GENERATIONS = [11, 12, 13] as const;

interface ClassPlan {
  generation: number;
  classroom: string;
  courseCode: string;
  size: number;
  enrollmentDate: string;
  status: StudentStatus;
}

const CLASS_PLAN: ClassPlan[] = [
  { generation: 13, classroom: "SP13-A", courseCode: "SP", size: 8, enrollmentDate: "2026-02-02", status: "active" },
  { generation: 13, classroom: "SP13-B", courseCode: "SP", size: 8, enrollmentDate: "2026-02-02", status: "active" },
  { generation: 13, classroom: "DA13", courseCode: "DA", size: 6, enrollmentDate: "2026-02-02", status: "active" },
  { generation: 13, classroom: "MB13", courseCode: "MB", size: 6, enrollmentDate: "2026-02-02", status: "active" },
  { generation: 13, classroom: "DO13", courseCode: "DO", size: 4, enrollmentDate: "2026-02-02", status: "active" },
  { generation: 12, classroom: "SP12", courseCode: "SP", size: 8, enrollmentDate: "2025-02-03", status: "graduated" },
  { generation: 12, classroom: "DA12", courseCode: "DA", size: 4, enrollmentDate: "2025-02-03", status: "graduated" },
  { generation: 12, classroom: "MB12", courseCode: "MB", size: 4, enrollmentDate: "2025-02-03", status: "graduated" },
  { generation: 11, classroom: "SP11", courseCode: "SP", size: 6, enrollmentDate: "2024-02-05", status: "graduated" },
  { generation: 11, classroom: "DO11", courseCode: "DO", size: 4, enrollmentDate: "2024-02-05", status: "graduated" },
];

/** Hidden behavioural profile used to generate attendance / score series. */
export interface StudentProfile {
  presence: number; // probability of being present on a given day (0..1)
  lateness: number; // probability that a present day is marked Late
  base: number; // base academic level (0..100)
  drift: number; // monthly change in average score (negative = declining)
}

export const STUDENT_PROFILES: Record<string, StudentProfile> = {};

/** Students that are deliberately shaped to show the at-risk workflow. */
const RISK_OVERRIDES: Record<number, Partial<StudentProfile>> = {
  2: { presence: 0.66, base: 71, drift: -1 }, // very low attendance
  7: { presence: 0.9, base: 78, drift: -7 }, // declining performance
  13: { presence: 0.72, base: 52, drift: -4 }, // low attendance + low scores
  20: { presence: 0.83, lateness: 0.35, base: 68, drift: -6 }, // late + declining
  27: { presence: 0.93, base: 49, drift: 1 }, // low scores only
  30: { presence: 0.78, base: 62, drift: -2 }, // moderate
};

const DROPPED_INDEXES = new Set([5, 18, 38, 45]);

function buildStudents(): Student[] {
  const rng = mulberry32(20261006);
  const students: Student[] = [];
  const usedNames = new Set<string>();
  let globalIndex = 0;

  for (const plan of CLASS_PLAN) {
    for (let i = 0; i < plan.size; i++) {
      let first = pick(rng, FIRST_NAMES);
      let last = pick(rng, LAST_NAMES);
      let guard = 0;
      while (usedNames.has(`${last} ${first}`) && guard++ < 50) {
        first = pick(rng, FIRST_NAMES);
        last = pick(rng, LAST_NAMES);
      }
      usedNames.add(`${last} ${first}`);

      const gender = FEMALE_FIRST.has(first) ? "Female" : "Male";
      const year = randInt(rng, 1999, 2004);
      const dob = `${year}-${pad(randInt(rng, 1, 12))}-${pad(randInt(rng, 1, 28))}`;
      const seq = pad(i + 1);
      const id = `STU-${plan.classroom.replace("-", "")}-${seq}`;

      let status: StudentStatus = plan.status;
      if (DROPPED_INDEXES.has(globalIndex)) status = "dropped";

      const profile: StudentProfile = {
        presence: 0.86 + rng() * 0.13,
        lateness: 0.04 + rng() * 0.12,
        base: 62 + rng() * 32,
        drift: -2 + rng() * 5,
      };
      Object.assign(profile, RISK_OVERRIDES[globalIndex] ?? {});
      STUDENT_PROFILES[id] = profile;

      students.push({
        id,
        name: `${last} ${first}`,
        email: `${first}.${last}${plan.generation}@student.hrd.local`.toLowerCase(),
        phone: `+855 ${randInt(rng, 10, 99)} ${randInt(rng, 200, 999)} ${randInt(rng, 100, 999)}`,
        gender,
        dob,
        generation: plan.generation,
        classroom: plan.classroom,
        courseCode: plan.courseCode,
        enrollmentDate: plan.enrollmentDate,
        university: pick(rng, UNIVERSITIES),
        status,
        itScore: Math.round(Math.min(100, Math.max(35, profile.base + (rng() * 16 - 8)))),
        koreanScore: Math.round(Math.min(100, Math.max(30, 55 + rng() * 45))),
        isClassLeader: i === 0,
      });
      globalIndex++;
    }
  }
  return students;
}

export const STUDENTS: Student[] = buildStudents();

export const CLASSROOMS: string[] = Array.from(new Set(STUDENTS.map((s) => s.classroom)));

export const studentById = (id: string): Student | undefined => STUDENTS.find((s) => s.id === id);

export const initials = (name: string): string =>
  name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
