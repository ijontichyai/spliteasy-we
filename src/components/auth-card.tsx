import { BrandLogo } from "@/components/brand-logo";
import type { ReactNode } from "react";

export function AuthCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <main className="bg-hero min-h-[calc(100vh-4rem)] px-4 py-12">
      <div className="mx-auto w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-soft sm:p-8">
        <div className="mb-6 flex justify-center"><BrandLogo className="h-14" /></div>
        <h1 className="text-2xl font-bold">{title}</h1>
        <div className="mt-6">{children}</div>
      </div>
    </main>
  );
}
