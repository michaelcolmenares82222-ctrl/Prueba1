"use client";

import { Activity, DayPlan } from "../types";
import { Sun, CloudSun, Moon, Clock, MapPin } from "lucide-react";

interface ItineraryTimelineProps {
  itinerary: DayPlan[];
}

export function ItineraryTimeline({ itinerary }: ItineraryTimelineProps) {
  return (
    <div className="space-y-6">
      {itinerary.map((day) => (
        <DayCard key={day.day} day={day} />
      ))}
    </div>
  );
}

function DayCard({ day }: { day: DayPlan }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
      {/* Day Header */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-900">
              Día {day.day}
            </h3>
            {day.date ? (
              <p className="text-sm text-gray-600">{day.date}</p>
            ) : null}
          </div>
          <div className="bg-white rounded-full px-4 py-2 text-sm font-medium text-purple-600">
            Día completo
          </div>
        </div>
      </div>

      {/* Activities */}
      <div className="divide-y divide-gray-100">
        {day.morning ? (
          <ActivityBlock
            icon={<Sun className="w-5 h-5 text-amber-500" />}
            iconBgClass="bg-amber-100"
            time="Mañana"
            activity={day.morning}
          />
        ) : null}

        {day.afternoon ? (
          <ActivityBlock
            icon={<CloudSun className="w-5 h-5 text-orange-500" />}
            iconBgClass="bg-orange-100"
            time="Tarde"
            activity={day.afternoon}
          />
        ) : null}

        {day.evening ? (
          <ActivityBlock
            icon={<Moon className="w-5 h-5 text-indigo-500" />}
            iconBgClass="bg-indigo-100"
            time="Noche"
            activity={day.evening}
          />
        ) : null}
      </div>
    </div>
  );
}

function ActivityBlock({
  icon,
  iconBgClass,
  time,
  activity,
}: {
  icon: React.ReactNode;
  iconBgClass: string;
  time: string;
  activity: Activity;
}) {
  return (
    <div className="p-6">
      <div className="flex items-start gap-4">
        <div className={`flex-shrink-0 ${iconBgClass} rounded-lg p-2`}>
          {icon}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-medium text-gray-500">
              {time}
            </span>
            {activity.duration ? (
              <>
                <span className="text-gray-300">•</span>
                <div className="flex items-center gap-1 text-sm text-gray-500">
                  <Clock className="w-3 h-3" />
                  <span>{activity.duration}</span>
                </div>
              </>
            ) : null}
          </div>

          <h4 className="font-semibold text-gray-900 mb-1">
            {activity.title}
          </h4>
          <p className="text-gray-600 text-sm mb-2">
            {activity.description}
          </p>

          <div className="flex items-center gap-4 text-sm">
            {activity.location ? (
              <div className="flex items-center gap-1 text-gray-500">
                <MapPin className="w-3 h-3" />
                <span>{activity.location}</span>
              </div>
            ) : null}

            {activity.cost ? (
              <div className="text-purple-600 font-medium">
                ${activity.cost}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
