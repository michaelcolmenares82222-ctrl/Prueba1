"use client";

import { BudgetBreakdown as BudgetType } from "../types";
import {
  Plane,
  Home,
  Utensils,
  Camera,
  Car,
  AlertCircle,
  type LucideIcon,
} from "lucide-react";

interface BudgetBreakdownProps {
  breakdown: BudgetType;
  currency?: string;
  days?: number;
}

interface BudgetItem {
  key: keyof BudgetType;
  label: string;
  icon: LucideIcon;
  bgClass: string;
  iconClass: string;
  barClass: string;
}

const ITEMS: BudgetItem[] = [
  {
    key: "flights",
    label: "Vuelos",
    icon: Plane,
    bgClass: "bg-blue-100",
    iconClass: "text-blue-600",
    barClass: "bg-blue-500",
  },
  {
    key: "accommodation",
    label: "Alojamiento",
    icon: Home,
    bgClass: "bg-purple-100",
    iconClass: "text-purple-600",
    barClass: "bg-purple-500",
  },
  {
    key: "food",
    label: "Comidas",
    icon: Utensils,
    bgClass: "bg-green-100",
    iconClass: "text-green-600",
    barClass: "bg-green-500",
  },
  {
    key: "activities",
    label: "Actividades",
    icon: Camera,
    bgClass: "bg-orange-100",
    iconClass: "text-orange-600",
    barClass: "bg-orange-500",
  },
  {
    key: "transport",
    label: "Transporte local",
    icon: Car,
    bgClass: "bg-cyan-100",
    iconClass: "text-cyan-600",
    barClass: "bg-cyan-500",
  },
  {
    key: "emergency",
    label: "Fondo emergencia",
    icon: AlertCircle,
    bgClass: "bg-red-100",
    iconClass: "text-red-600",
    barClass: "bg-red-500",
  },
];

export function BudgetBreakdown({
  breakdown,
  currency = "USD",
  days = 7,
}: BudgetBreakdownProps) {
  const itemsTotal = ITEMS.reduce(
    (sum, item) => sum + ((breakdown[item.key] as number | undefined) ?? 0),
    0
  );
  const total = breakdown.total || itemsTotal;
  const perDay = days > 0 ? Math.round(total / days) : total;

  return (
    <div className="space-y-6">
      {/* Budget Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {ITEMS.map((item) => {
          const amount =
            (breakdown[item.key] as number | undefined) ?? 0;
          const percentage = total > 0 ? (amount / total) * 100 : 0;
          const Icon = item.icon;

          return (
            <div
              key={item.key}
              className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`${item.bgClass} rounded-lg p-2`}>
                  <Icon className={`w-5 h-5 ${item.iconClass}`} />
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-900">
                    ${amount.toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-500">{currency}</div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-gray-700">
                    {item.label}
                  </span>
                  <span className="text-gray-500">
                    {percentage.toFixed(0)}%
                  </span>
                </div>

                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${item.barClass} rounded-full transition-all duration-500`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Total Card */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm opacity-90 mb-1">
              Presupuesto Total Estimado
            </p>
            <p className="text-4xl font-bold">${total.toLocaleString()}</p>
            <p className="text-sm opacity-75 mt-1">{currency}</p>
          </div>
          <div className="text-right">
            <p className="text-sm opacity-90">Por día</p>
            <p className="text-2xl font-semibold">
              ${perDay.toLocaleString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
