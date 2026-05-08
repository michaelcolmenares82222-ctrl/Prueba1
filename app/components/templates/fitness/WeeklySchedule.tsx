"use client";

import { Exercise, WeeklyWorkout, Workout } from "../types";
import { Dumbbell, Coffee } from "lucide-react";

interface WeeklyScheduleProps {
  weeklyPlan: WeeklyWorkout;
}

const DAYS: string[] = [
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
  "Domingo",
];

export function WeeklySchedule({ weeklyPlan }: WeeklyScheduleProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {DAYS.map((day) => {
        const workout = weeklyPlan[day.toLowerCase()];
        return <DayCard key={day} day={day} workout={workout} />;
      })}
    </div>
  );
}

function DayCard({
  day,
  workout,
}: {
  day: string;
  workout?: Workout;
}) {
  const isRestDay = !workout || workout.restDay;

  if (isRestDay) {
    return (
      <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-6 border-2 border-blue-200">
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-blue-100 rounded-lg p-2">
            <Coffee className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900">{day}</h3>
            <p className="text-sm text-blue-600">Día de descanso</p>
          </div>
        </div>
        <p className="text-sm text-gray-600">
          Recuperación activa: camina, estira, o haz yoga suave
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center gap-3 mb-4">
        <div className="bg-green-100 rounded-lg p-2">
          <Dumbbell className="w-5 h-5 text-green-600" />
        </div>
        <div>
          <h3 className="font-bold text-gray-900">{day}</h3>
          <p className="text-sm text-green-600">{workout!.focus}</p>
        </div>
      </div>

      {workout!.exercises && workout!.exercises.length > 0 ? (
        <div className="space-y-3">
          {workout!.exercises.map((exercise, idx) => (
            <ExerciseItem key={idx} exercise={exercise} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function ExerciseItem({ exercise }: { exercise: Exercise }) {
  return (
    <div className="bg-gray-50 rounded-lg p-3">
      <h4 className="font-medium text-gray-900 mb-1">{exercise.name}</h4>
      <div className="flex items-center gap-4 text-sm text-gray-600">
        <span>{exercise.sets} series</span>
        <span>•</span>
        <span>{exercise.reps} reps</span>
        <span>•</span>
        <span>Desc: {exercise.rest}</span>
      </div>
      {exercise.notes ? (
        <p className="text-xs text-gray-500 mt-1">💡 {exercise.notes}</p>
      ) : null}
    </div>
  );
}
