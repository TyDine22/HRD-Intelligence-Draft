import type { OvertimeReport } from "./types";
import { SCHOOL_DAYS } from "./academics";
import { STUDENTS } from "./students";
import { COURSES, USERS } from "./users";
import { mulberry32, randInt } from "./seed";

/** Default USD paid to an instructor per approved extra-class (overtime) hour. */
export const INSTRUCTOR_EXTRA_RATE = 15;

const TOPICS: Record<string, string[]> = {
  SP: ["Spring Cloud config server lab", "Spring Boot REST review", "JPA relationships workshop", "Microservices debugging clinic"],
  DA: ["Statistics refresher", "SQL window functions", "Pandas data cleaning lab", "Dashboard storytelling"],
  MB: ["Flutter state management", "Kotlin coroutines clinic", "Mobile UI polish session", "API integration lab"],
  DO: ["Docker networking lab", "CI/CD pipeline review", "Kubernetes troubleshooting", "Terraform basics"],
};

/**
 * Instructor-taught extra-class sessions (overtime). Deterministic so demo
 * numbers are stable between reloads. Sessions after late September are
 * still awaiting HRD approval, mirroring the student extra-class data.
 */
function buildOvertimeReports(): OvertimeReport[] {
  const rng = mulberry32(4242);
  const out: OvertimeReport[] = [];
  const days = SCHOOL_DAYS.filter((d) => d >= "2026-08-03");

  for (const instructor of USERS.filter((u) => u.role === "INSTRUCTOR" && u.course)) {
    const course = COURSES.find((c) => c.code === instructor.course)!;
    const classrooms = Array.from(new Set(STUDENTS.filter((s) => s.status === "active" && s.courseCode === course.code).map((s) => s.classroom)));
    const topics = TOPICS[course.code] ?? course.subjects;
    const sessions = randInt(rng, 9, 14);
    for (let i = 0; i < sessions; i++) {
      const date = days[randInt(rng, 0, days.length - 1)];
      out.push({
        id: `OT-${instructor.id.slice(-2)}-${i}`,
        instructorId: instructor.id,
        date,
        classroom: classrooms[randInt(rng, 0, classrooms.length - 1)],
        hours: [1.5, 2, 2, 2.5, 3][randInt(rng, 0, 4)],
        subject: topics[randInt(rng, 0, topics.length - 1)],
        notes: rng() < 0.3 ? "Requested by students ahead of the monthly assessment." : undefined,
        status: date > "2026-09-28" && rng() < 0.6 ? "submitted" : "approved",
      });
    }
  }
  return out.sort((a, b) => (a.date < b.date ? 1 : -1));
}

export const OVERTIME_REPORTS: OvertimeReport[] = buildOvertimeReports();
