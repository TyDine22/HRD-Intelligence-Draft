import type { Course, User } from "./types";

export const USERS: User[] = [
  {
    id: "USR-ADMIN-01",
    name: "Chan Dara",
    email: "admin@hrd-intelligence.local",
    role: "ADMIN",
    title: "HRD Administrator",
  },
  {
    id: "USR-INS-01",
    name: "Sok Vannak",
    email: "vannak@hrd-intelligence.local",
    role: "INSTRUCTOR",
    title: "Senior Instructor · Spring",
    course: "SP",
    standbyDays: ["Tuesday", "Thursday"],
  },
  {
    id: "USR-INS-02",
    name: "Meas Sophea",
    email: "sophea@hrd-intelligence.local",
    role: "INSTRUCTOR",
    title: "Instructor · Data Analytics",
    course: "DA",
    standbyDays: ["Monday", "Wednesday"],
  },
  {
    id: "USR-INS-03",
    name: "Lim Rithy",
    email: "rithy@hrd-intelligence.local",
    role: "INSTRUCTOR",
    title: "Instructor · Mobile Development",
    course: "MB",
    standbyDays: ["Wednesday", "Friday"],
  },
  {
    id: "USR-INS-04",
    name: "Keo Bopha",
    email: "bopha@hrd-intelligence.local",
    role: "INSTRUCTOR",
    title: "Instructor · DevOps",
    course: "DO",
    standbyDays: ["Monday", "Friday"],
  },
];

/** Demo credentials accepted by the mock Keycloak login. */
export const DEMO_PASSWORD = "Hrd@2026";

export const COURSES: Course[] = [
  {
    code: "SP",
    name: "Spring + Microservices",
    subjects: ["Java Core", "Spring Boot", "Spring Cloud", "PostgreSQL & JPA"],
    instructorId: "USR-INS-01",
  },
  {
    code: "DA",
    name: "Data Analytics",
    subjects: ["Python", "Statistics", "SQL & Warehousing", "Machine Learning"],
    instructorId: "USR-INS-02",
  },
  {
    code: "MB",
    name: "Mobile Development",
    subjects: ["Kotlin", "Jetpack Compose", "Swift", "SwiftUI"],
    instructorId: "USR-INS-03",
  },
  {
    code: "DO",
    name: "DevOps Engineering",
    subjects: ["Linux & Networking", "Docker", "Kubernetes", "CI/CD Pipelines"],
    instructorId: "USR-INS-04",
  },
];

export const courseByCode = (code: string): Course => COURSES.find((c) => c.code === code) ?? COURSES[0];
export const userById = (id: string): User | undefined => USERS.find((u) => u.id === id);
export const instructors = USERS.filter((u) => u.role === "INSTRUCTOR");
