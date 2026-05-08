"use client";

import { Recommendation } from "../types";
import { ExternalLink, Star, DollarSign } from "lucide-react";

interface RecommendationsProps {
  recommendations: Recommendation[];
  destination: string;
}

type BookingType = "flights" | "hotels" | "activities" | "rental";

export function Recommendations({
  recommendations,
  destination,
}: RecommendationsProps) {
  const items =
    recommendations.length > 0
      ? recommendations
      : generateDefaultRecommendations(destination);

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
              <RecommendationCard
                key={`${category}-${idx}`}
                recommendation={rec}
                destination={destination}
              />
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
          <BookingLink destination={destination} type="flights" service="Skyscanner" />
          <BookingLink destination={destination} type="hotels" service="Booking.com" />
          <BookingLink destination={destination} type="activities" service="GetYourGuide" />
          <BookingLink destination={destination} type="rental" service="Airbnb" />
        </div>
      </div>
    </div>
  );
}

function RecommendationCard({
  recommendation,
  destination,
}: {
  recommendation: Recommendation;
  destination: string;
}) {
  const fallbackLink = buildSearchLink(
    `${recommendation.title} ${destination}`
  );
  const link = recommendation.link?.trim() || fallbackLink;

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

      <a
        href={link}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 text-sm text-purple-600 hover:text-purple-700 font-medium"
      >
        Ver más <ExternalLink className="w-3 h-3" />
      </a>
    </div>
  );
}

function BookingLink({
  destination,
  service,
  type,
}: {
  destination: string;
  service: string;
  type: BookingType;
}) {
  const dest = destination.trim();
  const encoded = encodeURIComponent(dest);
  const slug = encodeURIComponent(dest.toLowerCase());

  const urls: Record<BookingType, string> = {
    flights: `https://www.skyscanner.net/transport/flights-to/${slug}/`,
    hotels: `https://www.booking.com/searchresults.html?ss=${encoded}`,
    activities: `https://www.getyourguide.com/s/?q=${encoded}`,
    rental: `https://www.airbnb.com/s/${encoded}/homes`,
  };

  const labels: Record<BookingType, string> = {
    flights: "Vuelos",
    hotels: "Hoteles",
    activities: "Actividades",
    rental: "Alquiler",
  };

  return (
    <a
      href={urls[type]}
      target="_blank"
      rel="noopener noreferrer"
      className="flex flex-col items-center gap-2 p-3 bg-white rounded-lg border border-gray-200 hover:border-purple-300 hover:shadow-sm transition-all text-center"
    >
      <span className="text-sm font-medium text-gray-900">{labels[type]}</span>
      <span className="text-xs text-gray-500">{service}</span>
    </a>
  );
}

function buildSearchLink(query: string): string {
  return `https://www.google.com/search?q=${encodeURIComponent(query)}`;
}

function generateDefaultRecommendations(
  destination: string
): Recommendation[] {
  return [
    {
      category: "Lugares imperdibles",
      title: `Atracciones más visitadas de ${destination}`,
      description:
        "Lista curada de los hitos más fotografiados y comentados.",
    },
    {
      category: "Gastronomía",
      title: `Mejores restaurantes de ${destination}`,
      description: "Restaurantes locales con buenas reseñas en Google y TripAdvisor.",
      price: "$$",
    },
    {
      category: "Tips de viaje",
      title: "Cómo moverse en transporte público",
      description: "Tarjetas de transporte, abonos y apps oficiales del destino.",
    },
  ];
}
