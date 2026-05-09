"use client";

import { AppBuilder } from "@/app/components/app-builder/AppBuilder";

export default function AppBuilderPage() {
  return (
    <main className="min-h-screen w-full bg-gradient-to-br from-slate-950 via-slate-950 to-indigo-950 px-4 py-8 md:px-8 md:py-12">
      <div className="mx-auto max-w-6xl">
        <AppBuilder />
      </div>
    </main>
  );
}
