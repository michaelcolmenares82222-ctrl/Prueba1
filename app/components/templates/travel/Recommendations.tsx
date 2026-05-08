"use client";

import { Recommendation } from "../types";
import { ExternalLink, Star, DollarSign } from "lucide-react";

interface RecommendationsProps {
  recommendations: Recommendation[];
  destination: string;
}

export function Recommendations({
  recommendations,
  destination,
}: RecommendationsProps) {
  // Si no hay recomendaciones, generar algunas por defecto
  const items =
    recommendations.length > 0
      ? recommendations
      : generateDefaultRecommendations(destination);

  // Agrupar por categoría
  const grouped: Record<string, Recommendation[]> = items.reduce(
    (acc, rec) => {
      const category = rec.category || "General";
      if (!acc[category]) acc[category] = [];
      acc[category].push(rec);
      return acc;
    },
    {} as Record<string, Recommendation[]>
  );

  return (
    <div className="space-y-8">
      {Object.entries(grouped).map(([category, recs]) => (
        <div key={category}>
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-500" />
            {category}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recs.map((rec, idx) => (
              <RecommendationCard key={idx} recommendation={rec} />
            ))}
          </div>
        </div>
      ))}

      {/* Booking Links */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <h3 className="font-bold text-gray-900 mb-4">
          ¿Listo para reservar?
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <BookingLink href="#" label="Vuelos" service="Skyscanner" />
          <BookingLink href="#" label="Hoteles" service="Booking.com" />
          <BookingLink
            href="#"
            label="Actividades"
            service="GetYourGuide"
          />
          <BookingLink href="#" label="Alquiler" service="Airbnb" />
        </div>
      </div>
    </div>
  );
}

function RecommendationCard({
  recommendation,
}: {
  recommendation: Recommendation;
}) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-2">
        <h4 className="font-semibold text-gray-900">
          {recommendation.title}
        </h4>
        {recommendation.price ? (
          <div className="flex items-center gap-1 text-sm text-gray-600">
            <DollarSign className="w-3 h-3" />
            <span>{recommendation.price}</span>
          </div>
        ) : null}
      </div>

      <p className="text-sm text-gray-600 mb-3">
        {recommendation.description}
      </p>

      {recommendation.link ? (
        <a
          href={recommendation.link}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-sm text-purple-600 hover:text-purple-700 font-medium"
        >
          Ver más <ExternalLink className="w-3 h-3" />
        </a>
      ) : null}
    </div>
  );
}

function BookingLink({
  href,
  label,
  service,
}: {
  href: string;
  label: string;
  service: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex flex-col items-center gap-2 p-3 bg-white rounded-lg border border-gray-200 hover:border-purple-300 hover:shadow-sm transition-all text-center"
    >
      <span className="text-sm font-medium text-gray-900">{label}</span>
      <span className="text-xs text-gray-500">{service}</span>
    </a>
  );
}

function generateDefaultRecommendations(
  destination: string
): Recommendation[] {
  return [
    {
      category: "Lugares imperdibles",
      title: `Principales atracciones de ${destination}`,
      description:
        "Visita los sitios más emblemáticos y fotografiados",
    },
    {
      category: "Gastronomía",
      title: "Restaurantes locales recomendados",
      description: "Prueba la auténtica comida local en estos lugares",
      price: "$$",
    },
    {
      category: "Tips de viaje",
      title: "Transporte público",
      description: "Cómo moverse eficientemente por la ciudad",
    },
    {
      category: "Tips de viaje",
      title: "Mejor época para visitar",
      description: "Consideraciones de clima y temporadas turísticas",
    },
  ];
}
