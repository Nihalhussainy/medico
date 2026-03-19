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

function inferSeverity(record) {
  const text = `${record?.diagnosis || ""} ${record?.description || ""}`.toLowerCase();
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
  return (records || []).map((record) => ({
    disease: record.diagnosis || record.title || "General Checkup",
    severity: inferSeverity(record),
    bpSystolic: parseBP(record.vitals, "sys") || 120,
    bpDiastolic: parseBP(record.vitals, "dia") || 80,
    heartRate: parseHR(record.vitals) || 78,
    temperature: 98.6,
    spo2: 97,
    riskFactors: inferRiskFactors(record),
    isChronic: /chronic|long-term|ongoing/i.test(`${record.diagnosis || ""} ${record.description || ""}`)
  }));
}
