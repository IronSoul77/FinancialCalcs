import type { ReactNode } from "react";
import { Nav } from "@/components/Nav";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Nav />
      <main className="mx-auto max-w-7xl px-4 py-8">{children}</main>
    </>
  );
}
