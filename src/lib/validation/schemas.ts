import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().min(1, "Email is required").email("Enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  remember: z.boolean().optional(),
});
export type LoginValues = z.infer<typeof loginSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().min(1, "Email is required").email("Enter a valid email address"),
});
export type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(8, "Use at least 8 characters")
      .regex(/[A-Z]/, "Include an uppercase letter")
      .regex(/[0-9]/, "Include a number"),
    confirmPassword: z.string().min(1, "Please confirm the new password"),
  })
  .refine((v) => v.newPassword === v.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })
  .refine((v) => v.newPassword !== v.currentPassword, {
    message: "New password must differ from the current password",
    path: ["newPassword"],
  });
export type ChangePasswordValues = z.infer<typeof changePasswordSchema>;

export const feedbackSchema = z.object({
  studentId: z.string().min(1, "Select a student"),
  category: z.enum(["Behavior", "Soft Skills", "Hard Skills", "Other"], { message: "Select a category" }),
  content: z.string().min(10, "Feedback should be at least 10 characters").max(1000, "Keep feedback under 1000 characters"),
  date: z.string().min(1, "Date is required"),
});
export type FeedbackValues = z.infer<typeof feedbackSchema>;

export const alumniSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Enter a valid email address"),
  phone: z.string().min(6, "Phone number is required"),
  gender: z.enum(["Male", "Female"]),
  generation: z.string().min(1, "Generation is required"),
  courseCode: z.string().min(1, "Course is required"),
  education: z.enum(["Bachelor", "Master", "PhD"]),
  university: z.string().min(2, "University is required"),
  employmentStatus: z.enum(["employed", "self-employed", "studying", "unemployed"]),
  industry: z.string().min(1, "Industry is required"),
  salaryRange: z.string().min(1, "Salary range is required"),
  company: z.string().optional(),
  jobTitle: z.string().optional(),
  location: z.string().optional(),
});
export type AlumniValues = z.infer<typeof alumniSchema>;

export const allowanceRateSchema = z.object({
  amount: z.string().refine((v) => !Number.isNaN(Number(v)) && Number(v) >= 0, "Enter a valid amount"),
});

export const folderNameSchema = z.object({
  name: z.string().min(1, "Name is required").max(80, "Name is too long").regex(/^[^/\\:*?"<>|]+$/, "Name contains invalid characters"),
});
export type FolderNameValues = z.infer<typeof folderNameSchema>;

export const shareSchema = z.object({
  userId: z.string().min(1, "Select a user"),
  permission: z.enum(["viewer", "editor"]),
});
export type ShareValues = z.infer<typeof shareSchema>;

export const overtimeReportSchema = z.object({
  date: z.string().min(1, "Date is required"),
  classroom: z.string().min(1, "Classroom is required"),
  hours: z.string().refine((v) => Number(v) > 0 && Number(v) <= 8, "Enter hours between 0.5 and 8"),
  subject: z.string().min(2, "Subject is required"),
  notes: z.string().max(500).optional(),
});
export type OvertimeReportValues = z.infer<typeof overtimeReportSchema>;
