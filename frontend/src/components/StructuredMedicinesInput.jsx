import { useState } from "react";

export default function StructuredMedicinesInput({ value, onChange }) {
  // value is expected to be in format:
  // { breakfast: { before: [], after: [] }, lunch: {...}, dinner: {...} }
  
  const [medicines, setMedicines] = useState(() => {
    if (value && typeof value === 'object') {
      // Clean up empty medicines from old drafts
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
  const mealLabels = { breakfast: "🌅 Breakfast", lunch: "☀️ Lunch", dinner: "🌙 Dinner" };

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

  const removeMedicine = (meal, timing, index) => {
    const updated = { ...medicines };
    updated[meal][timing].splice(index, 1);
    setMedicines(updated);
    onChange(updated);
  };

  // Get all medicines grouped by name
  const medicinesByName = {};
  const mealColors = {
    breakfast: "bg-orange-50 border-orange-200",
    lunch: "bg-yellow-50 border-yellow-200",
    dinner: "bg-indigo-50 border-indigo-200"
  };

  meals.forEach((meal) => {
    ["before", "after"].forEach((timing) => {
      medicines[meal][timing].forEach((med) => {
        // Filter out empty medicines
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

  // Convert to array for display
  const allMedicines = Object.entries(medicinesByName).map(([name, timings]) => ({
    name,
    timings
  }));

  const selectedCount = Object.values(selectedTimings).filter(Boolean).length;

  return (
    <div className="space-y-4 border rounded-lg p-4 bg-slate-50">
      <h3 className="text-sm font-semibold text-slate-800">Medications</h3>
      
      {/* Input Section */}
      <div className="space-y-4 pb-4 border-b">
        {/* Medicine Name Input */}
        <div>
          <label className="text-xs font-medium text-slate-700 block mb-2">Medicine Name</label>
          <input
            type="text"
            value={medicineInput}
            onChange={(e) => setMedicineInput(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && selectedCount > 0 && addMedicine()}
            placeholder="e.g., Aspirin 500mg"
            className="input w-full"
          />
        </div>

        {/* When to take it - Grid Layout */}
        <div>
          <label className="text-xs font-medium text-slate-700 block mb-3">When to take it</label>
          <div className="border rounded-lg overflow-hidden bg-white">
            {/* Header Row */}
            <div className="grid grid-cols-3 border-b bg-slate-100">
              <div className="px-3 py-2 text-xs font-semibold text-slate-700"></div>
              <div className="px-3 py-2 text-xs font-semibold text-slate-700 border-l text-center">Before</div>
              <div className="px-3 py-2 text-xs font-semibold text-slate-700 border-l text-center">After</div>
            </div>

            {/* Data Rows */}
            {meals.map((meal) => (
              <div key={meal} className="grid grid-cols-3 border-b last:border-b-0">
                <div className="px-3 py-3 text-sm font-medium text-slate-700">
                  {mealLabels[meal]}
                </div>
                <div className="px-3 py-3 border-l flex items-center justify-center">
                  <input
                    type="checkbox"
                    checked={selectedTimings[`${meal}_before`] || false}
                    onChange={() => toggleTiming(meal, "before")}
                    className="w-4 h-4 rounded accent-emerald-600 cursor-pointer"
                  />
                </div>
                <div className="px-3 py-3 border-l flex items-center justify-center">
                  <input
                    type="checkbox"
                    checked={selectedTimings[`${meal}_after`] || false}
                    onChange={() => toggleTiming(meal, "after")}
                    className="w-4 h-4 rounded accent-emerald-600 cursor-pointer"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Add Button */}
        <button
          type="button"
          onClick={addMedicine}
          disabled={!medicineInput.trim() || selectedCount === 0}
          className="w-full px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 transition-colors font-medium text-sm disabled:bg-slate-300 disabled:cursor-not-allowed"
        >
          + Add Medicine
        </button>
      </div>

      {/* Medicines List */}
      {allMedicines.length > 0 && (
        <div className="space-y-2">
          <label className="text-xs font-medium text-slate-700">Added Medicines</label>
          <div className="space-y-2">
            {allMedicines.map((item, index) => (
              <div
                key={index}
                className="flex items-center justify-between gap-2 p-3 rounded border bg-slate-50 border-slate-300"
              >
                <div className="text-sm flex-1">
                  <span className="font-medium text-slate-800">{item.name}</span>
                  <div className="text-slate-600 text-xs mt-1 flex flex-wrap gap-2">
                    {item.timings.map((timing, i) => (
                      <span key={i} className={`px-2 py-1 rounded text-white text-xs font-medium`}
                        style={{
                          backgroundColor: timing.meal === 'breakfast' ? '#ea580c' : 
                                          timing.meal === 'lunch' ? '#eab308' : '#4f46e5'
                        }}>
                        {timing.mealLabel} ({timing.timingLabel})
                      </span>
                    ))}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    // Remove all instances of this medicine
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
                  className="px-2 py-1 hover:bg-red-200 rounded text-red-600 transition-colors text-sm flex-shrink-0"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
