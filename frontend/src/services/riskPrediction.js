function parseBP(vitals, part) {
  if (!vitals) return null;
  const match = vitals.match(/(\d{2,3})\s*\/\s*(\d{2,3})/);
  if (!match) return null;
  return part === "sys" ? Number(match[1]) : Number(match[2]);
}

function parseHR(vitals) {
  if (!vitals) return null;
  const match = vitals.match(/(?:HR|heart\s*rate|pulse)\s*[:=]?\s*(\d{2,3})/i);
  return match ? Number(match[1]) : null;
}

function parseTemperature(vitals) {
  if (!vitals) return null;
  const match = vitals.match(/(?:temp|temperature)\s*[:=]?\s*(\d{2,3}(?:\.\d+)?)\s*([FC])?/i);
  if (!match) return null;
  const value = Number(match[1]);
  const unit = (match[2] || "F").toUpperCase();
  if (Number.isNaN(value)) return null;
  return unit === "C" ? value : value;
}

function parseSpO2(vitals) {
  if (!vitals) return null;
  const match = vitals.match(/(?:spo2|oxygen\s*saturation)\s*[:=]?\s*(\d{2,3})\s*%?/i);
  return match ? Number(match[1]) : null;
}

function inferSeverity(record) {
  const text = `${record?.diagnosis || ""} ${record?.description || ""}`.toLowerCase();
  const bpSys = parseBP(record?.vitals, "sys");
  const bpDia = parseBP(record?.vitals, "dia");
  const spo2 = parseSpO2(record?.vitals);
  if ((bpSys && bpSys >= 160) || (bpDia && bpDia >= 100) || (spo2 && spo2 <= 92)) return "SEVERE";
  if (/(critical|severe|acute|emergency|uncontrolled)/.test(text)) return "SEVERE";
  if (/(mild|stable|improved|follow-up)/.test(text)) return "MILD";
  return "MODERATE";
}

function inferRiskFactors(record) {
  const text = `${record?.diagnosis || ""} ${record?.description || ""} ${record?.allergies || ""} ${record?.medications || ""}`.toLowerCase();
  const factors = [];
  if (/smok|tobacco/.test(text)) factors.push("Smoking");
  if (/obes|weight/.test(text)) factors.push("Obesity");
  if (/alcohol/.test(text)) factors.push("Alcohol");
  if (/diabet/.test(text)) factors.push("Diabetes");
  if (/hypertens|high blood pressure|bp/.test(text)) factors.push("Hypertension");
  if (/cholesterol|lipid/.test(text)) factors.push("Hyperlipidemia");
  return factors.join("|");
}

export function getPatientOwnRecords(records) {
  return (records || []).filter((record) => !record?.familyMemberId);
}

export function buildRiskPatientHistory(records) {
  const history = records || [];
  const diagnosisCounts = history.reduce((acc, record) => {
    const key = (record?.diagnosis || record?.title || "General Checkup").trim().toLowerCase();
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  return history.map((record) => {
    const disease = record.diagnosis || record.title || "General Checkup";
    const diagnosisKey = disease.trim().toLowerCase();
    const chronicByPattern = /chronic|long-term|ongoing|persistent|recurrent/i.test(`${record.diagnosis || ""} ${record.description || ""}`);
    const chronicByFrequency = (diagnosisCounts[diagnosisKey] || 0) >= 2;

    return {
      disease,
      severity: inferSeverity(record),
      bpSystolic: parseBP(record.vitals, "sys") || 120,
      bpDiastolic: parseBP(record.vitals, "dia") || 80,
      heartRate: parseHR(record.vitals) || 78,
      temperature: parseTemperature(record.vitals) || 98.6,
      spo2: parseSpO2(record.vitals) || 97,
      riskFactors: inferRiskFactors(record),
      isChronic: chronicByPattern || chronicByFrequency,
    };
  });
}
