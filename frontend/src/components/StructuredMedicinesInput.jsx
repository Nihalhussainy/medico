import { useState } from "react";

export default function StructuredMedicinesInput({ value, onChange }) {
  const [medicines, setMedicines] = useState(() => {
    if (value && typeof value === 'object') {
      const cleaned = { ...value };
      ["breakfast", "lunch", "dinner"].forEach(meal => {
        ["before", "after"].forEach(timing => {
          if (Array.isArray(cleaned[meal]?.[timing])) {
            cleaned[meal][timing] = cleaned[meal][timing].filter(m => m?.trim());
          }
        });
      });
      return cleaned;
    }
    return {
      breakfast: { before: [], after: [] },
      lunch: { before: [], after: [] },
      dinner: { before: [], after: [] }
    };
  });

  const [medicineInput, setMedicineInput] = useState("");
  const [selectedTimings, setSelectedTimings] = useState({});

  const meals = ["breakfast", "lunch", "dinner"];
  const mealLabels = { breakfast: "Morning", lunch: "Afternoon", dinner: "Evening" };

  const toggleTiming = (meal, timing) => {
    const key = `${meal}_${timing}`;
    setSelectedTimings(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const addMedicine = () => {
    if (!medicineInput.trim()) return;

    const selectedCount = Object.values(selectedTimings).filter(Boolean).length;
    if (selectedCount === 0) return;

    const updated = { ...medicines };
    meals.forEach(meal => {
      ["before", "after"].forEach(timing => {
        const key = `${meal}_${timing}`;
        if (selectedTimings[key]) {
          updated[meal][timing].push(medicineInput.trim());
        }
      });
    });

    setMedicines(updated);
    onChange(updated);
    setMedicineInput("");
    setSelectedTimings({});
  };

  const mealColors = {
    breakfast: "bg-orange-500",
    lunch: "bg-amber-500",
    dinner: "bg-indigo-500"
  };

  const medicinesByName = {};
  meals.forEach((meal) => {
    ["before", "after"].forEach((timing) => {
      medicines[meal][timing].forEach((med) => {
        if (med && med.trim()) {
          if (!medicinesByName[med]) {
            medicinesByName[med] = [];
          }
          medicinesByName[med].push({
            meal,
            mealLabel: mealLabels[meal],
            timing,
            timingLabel: timing === "before" ? "Before" : "After"
          });
        }
      });
    });
  });

  const allMedicines = Object.entries(medicinesByName).map(([name, timings]) => ({
    name,
    timings
  }));

  const selectedCount = Object.values(selectedTimings).filter(Boolean).length;

  return (
    <div className="space-y-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
      <h3 className="text-sm font-semibold text-gray-800">Medications</h3>

      <div className="space-y-4 border-b border-gray-200 pb-4">
        <div>
          <label className="text-xs font-medium text-gray-700 block mb-2">Medicine Name</label>
          <input
            type="text"
            value={medicineInput}
            onChange={(e) => setMedicineInput(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && selectedCount > 0 && addMedicine()}
            placeholder="e.g., Aspirin 500mg"
            className="input w-full"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-gray-700 block mb-3">When to take it</label>
          <div className="rounded-lg border border-gray-200 overflow-hidden bg-white">
            <div className="grid grid-cols-3 border-b bg-gray-100">
              <div className="px-3 py-2 text-xs font-semibold text-gray-700"></div>
              <div className="px-3 py-2 text-xs font-semibold text-gray-700 border-l text-center">Before</div>
              <div className="px-3 py-2 text-xs font-semibold text-gray-700 border-l text-center">After</div>
            </div>

            {meals.map((meal) => (
              <div key={meal} className="grid grid-cols-3 border-b last:border-b-0">
                <div className="px-3 py-3 text-sm font-medium text-gray-700">
                  {mealLabels[meal]}
                </div>
                <div className="px-3 py-3 border-l flex items-center justify-center">
                  <input
                    type="checkbox"
                    checked={selectedTimings[`${meal}_before`] || false}
                    onChange={() => toggleTiming(meal, "before")}
                    className="w-4 h-4 rounded accent-teal-600 cursor-pointer"
                  />
                </div>
                <div className="px-3 py-3 border-l flex items-center justify-center">
                  <input
                    type="checkbox"
                    checked={selectedTimings[`${meal}_after`] || false}
                    onChange={() => toggleTiming(meal, "after")}
                    className="w-4 h-4 rounded accent-teal-600 cursor-pointer"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={addMedicine}
          disabled={!medicineInput.trim() || selectedCount === 0}
          className="button w-full justify-center"
        >
          Add Medicine
        </button>
      </div>

      {allMedicines.length > 0 && (
        <div className="space-y-2">
          <label className="text-xs font-medium text-gray-700">Added Medicines</label>
          <div className="space-y-2">
            {allMedicines.map((item, index) => (
              <div
                key={index}
                className="flex items-center justify-between gap-2 p-3 rounded-lg border border-gray-200 bg-white"
              >
                <div className="text-sm flex-1">
                  <span className="font-medium text-gray-800">{item.name}</span>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {item.timings.map((timing, i) => (
                      <span key={i} className={`px-2 py-0.5 rounded text-white text-xs font-medium ${mealColors[timing.meal]}`}>
                        {timing.mealLabel} ({timing.timingLabel})
                      </span>
                    ))}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const updated = { ...medicines };
                    item.timings.forEach(timing => {
                      const medIndex = updated[timing.meal][timing.timing].indexOf(item.name);
                      if (medIndex >= 0) {
                        updated[timing.meal][timing.timing].splice(medIndex, 1);
                      }
                    });
                    setMedicines(updated);
                    onChange(updated);
                  }}
                  className="p-1.5 hover:bg-red-50 rounded text-red-500 transition-colors"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
