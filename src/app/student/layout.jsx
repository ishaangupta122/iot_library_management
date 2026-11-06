import { StudentShell } from "@/app/student/_components/StudentShell";

export const metadata = { title: "Student Dashboard · SmartLib" };

export default function StudentLayout({ children }) {
  return <StudentShell>{children}</StudentShell>;
}
