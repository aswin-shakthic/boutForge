import { AppLayoutWrapper } from "@/lib/app-context";

export default function AppGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppLayoutWrapper>{children}</AppLayoutWrapper>;
}
