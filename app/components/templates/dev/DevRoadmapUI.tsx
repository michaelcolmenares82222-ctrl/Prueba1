"use client";

import type { DevRoadmap, Phase, Resource, TechItem } from "../types";
import {
  BookOpen,
  Calendar,
  ChevronRight,
  ExternalLink,
  Layers,
  Map,
} from "lucide-react";

interface DevRoadmapUIProps {
  roadmap: DevRoadmap;
}

export function DevRoadmapUI({ roadmap }: DevRoadmapUIProps) {
  const phases = roadmap.phases ?? [];
  const stack = roadmap.techStack ?? [];
  const resources = roadmap.resources ?? [];

  return (
    <div className="space-y-10 text-gray-900">
      <header className="border-b border-gray-200 pb-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-indigo-600 mb-1">
              Roadmap de desarrollo
            </p>
            <h1 className="text-3xl font-bold tracking-tight">
              {roadmap.projectType}
            </h1>
            <p className="mt-2 text-gray-600 flex items-center gap-2">
              <Calendar className="w-4 h-4 shrink-0" />
              Plazo: {roadmap.timeframe}
            </p>
          </div>
        </div>
      </header>

      <section>
        <h2 className="text-xl font-bold flex items-center gap-2 mb-4">
          <Map className="w-5 h-5 text-indigo-600" />
          Fases del plan
        </h2>
        {phases.length === 0 ? (
          <p className="text-gray-500 text-sm">
            No se recibieron fases del modelo. Prueba de nuevo o reformula el
            objetivo.
          </p>
        ) : (
          <ol className="space-y-4">
            {phases.map((phase, i) => (
              <PhaseCard key={`${phase.name}-${i}`} index={i + 1} phase={phase} />
            ))}
          </ol>
        )}
      </section>

      <section>
        <h2 className="text-xl font-bold flex items-center gap-2 mb-4">
          <Layers className="w-5 h-5 text-indigo-600" />
          Stack recomendado
        </h2>
        {stack.length === 0 ? (
          <p className="text-gray-500 text-sm">Sin tecnologías listadas.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {stack.map((item, i) => (
              <TechCard key={`${item.name}-${i}`} item={item} />
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-xl font-bold flex items-center gap-2 mb-4">
          <BookOpen className="w-5 h-5 text-indigo-600" />
          Recursos
        </h2>
        {resources.length === 0 ? (
          <p className="text-gray-500 text-sm">Sin recursos listados.</p>
        ) : (
          <ul className="space-y-3">
            {resources.map((r, i) => (
              <ResourceRow key={`${r.title}-${i}`} resource={r} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function PhaseCard({ index, phase }: { index: number; phase: Phase }) {
  return (
    <li className="rounded-xl border border-gray-200 bg-gray-50/80 p-5">
      <div className="flex items-center gap-3 mb-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-600 text-sm font-bold text-white">
          {index}
        </span>
        <div>
          <h3 className="font-semibold text-lg">{phase.name}</h3>
          <p className="text-sm text-gray-500">{phase.weeks} semanas</p>
        </div>
      </div>
      {phase.objectives?.length ? (
        <div className="mb-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">
            Objetivos
          </p>
          <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
            {phase.objectives.map((o, j) => (
              <li key={j}>{o}</li>
            ))}
          </ul>
        </div>
      ) : null}
      {phase.deliverables?.length ? (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">
            Entregables
          </p>
          <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
            {phase.deliverables.map((d, j) => (
              <li key={j}>{d}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </li>
  );
}

function TechCard({ item }: { item: TechItem }) {
  const diffColors = {
    beginner: "bg-green-100 text-green-800",
    intermediate: "bg-amber-100 text-amber-800",
    advanced: "bg-red-100 text-red-800",
  };
  return (
    <div className="rounded-xl border border-gray-200 p-4 bg-white shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="font-semibold">{item.name}</h3>
          <p className="text-xs text-gray-500 capitalize">{item.category}</p>
        </div>
        <span
          className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${diffColors[item.difficulty]}`}
        >
          {item.difficulty}
        </span>
      </div>
      <p className="mt-2 text-sm text-gray-600">{item.reason}</p>
    </div>
  );
}

function ResourceRow({ resource }: { resource: Resource }) {
  const typeLabel: Record<Resource["type"], string> = {
    course: "Curso",
    doc: "Documentación",
    video: "Video",
    project: "Proyecto",
  };
  return (
    <li className="flex flex-col sm:flex-row sm:items-center gap-2 rounded-xl border border-gray-200 p-4 bg-white hover:border-indigo-200 transition-colors">
      <ChevronRight className="w-4 h-4 text-indigo-500 shrink-0 hidden sm:block" />
      <div className="flex-1 min-w-0">
        <span className="text-xs font-medium text-indigo-600 uppercase">
          {typeLabel[resource.type]}
        </span>
        <h3 className="font-semibold">{resource.title}</h3>
        <p className="text-sm text-gray-600 mt-1">{resource.description}</p>
      </div>
      <a
        href={resource.url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-800 shrink-0"
      >
        Abrir
        <ExternalLink className="w-4 h-4" />
      </a>
    </li>
  );
}
