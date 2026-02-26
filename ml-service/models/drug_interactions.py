"""
Drug Interaction Checker

Rule-based system that checks for known dangerous drug interactions.
Provides severity levels, mechanisms, and clinical recommendations.
"""


# ── Drug Interaction Knowledge Base ─────────────────────────────────────────
# Each interaction: (drug_a, drug_b, severity, mechanism, recommendation)

INTERACTIONS = [
    # --- SEVERE (life-threatening) ---
    {
        "drugs": {"Warfarin", "Aspirin"},
        "severity": "SEVERE",
        "effect": "Greatly increased bleeding risk",
        "mechanism": "Both drugs impair clotting through different pathways (anticoagulant + antiplatelet).",
        "recommendation": "Avoid combination unless cardiologist-approved. Use PPI for GI protection if necessary.",
    },
    {
        "drugs": {"Warfarin", "Ibuprofen"},
        "severity": "SEVERE",
        "effect": "Increased bleeding risk and GI hemorrhage",
        "mechanism": "NSAIDs inhibit platelet function and damage GI mucosa; warfarin prevents clot formation.",
        "recommendation": "Use Paracetamol instead of Ibuprofen for pain relief in anticoagulated patients.",
    },
    {
        "drugs": {"Warfarin", "Diclofenac"},
        "severity": "SEVERE",
        "effect": "Increased bleeding risk and GI hemorrhage",
        "mechanism": "NSAIDs inhibit platelet function and damage GI mucosa; warfarin prevents clot formation.",
        "recommendation": "Use Paracetamol instead of Diclofenac for pain relief in anticoagulated patients.",
    },
    {
        "drugs": {"Fluoxetine", "Phenelzine"},
        "severity": "SEVERE",
        "effect": "Serotonin syndrome (potentially fatal)",
        "mechanism": "SSRI + MAOI causes excessive serotonin accumulation in the CNS.",
        "recommendation": "NEVER combine. Wait at least 5 weeks after stopping Fluoxetine before starting an MAOI.",
    },
    {
        "drugs": {"Sertraline", "Phenelzine"},
        "severity": "SEVERE",
        "effect": "Serotonin syndrome (potentially fatal)",
        "mechanism": "SSRI + MAOI causes excessive serotonin accumulation in the CNS.",
        "recommendation": "NEVER combine. Wait at least 2 weeks washout period between these medications.",
    },
    {
        "drugs": {"Methotrexate", "Ibuprofen"},
        "severity": "SEVERE",
        "effect": "Methotrexate toxicity (bone marrow suppression, renal failure)",
        "mechanism": "NSAIDs reduce renal clearance of Methotrexate, causing toxic accumulation.",
        "recommendation": "Avoid NSAIDs entirely during Methotrexate therapy. Use Paracetamol for pain.",
    },
    {
        "drugs": {"Metformin", "Contrast Dye"},
        "severity": "SEVERE",
        "effect": "Lactic acidosis",
        "mechanism": "Contrast media can cause acute kidney injury, impairing Metformin clearance.",
        "recommendation": "Stop Metformin 48 hours before and after contrast procedures. Monitor renal function.",
    },

    # --- MODERATE ---
    {
        "drugs": {"Enalapril", "Potassium Chloride"},
        "severity": "MODERATE",
        "effect": "Hyperkalemia (dangerously high potassium)",
        "mechanism": "ACE inhibitors reduce aldosterone → potassium retention. Adding potassium worsens this.",
        "recommendation": "Monitor serum potassium levels regularly. Avoid potassium supplements unless prescribed.",
    },
    {
        "drugs": {"Losartan", "Potassium Chloride"},
        "severity": "MODERATE",
        "effect": "Hyperkalemia",
        "mechanism": "ARBs reduce aldosterone → potassium retention.",
        "recommendation": "Monitor potassium levels closely if combination is necessary.",
    },
    {
        "drugs": {"Amlodipine", "Simvastatin"},
        "severity": "MODERATE",
        "effect": "Increased risk of myopathy and rhabdomyolysis",
        "mechanism": "Amlodipine inhibits CYP3A4, increasing Simvastatin blood levels.",
        "recommendation": "Limit Simvastatin to 20mg/day when combined with Amlodipine.",
    },
    {
        "drugs": {"Ciprofloxacin", "Antacid"},
        "severity": "MODERATE",
        "effect": "Reduced antibiotic effectiveness",
        "mechanism": "Aluminum/magnesium antacids chelate ciprofloxacin, reducing absorption by 90%.",
        "recommendation": "Take Ciprofloxacin 2 hours before or 6 hours after antacids.",
    },
    {
        "drugs": {"Metformin", "Alcohol"},
        "severity": "MODERATE",
        "effect": "Increased risk of lactic acidosis and hypoglycemia",
        "mechanism": "Alcohol impairs gluconeogenesis and increases lactate production.",
        "recommendation": "Limit alcohol intake. Never drink on an empty stomach while on Metformin.",
    },
    {
        "drugs": {"Azithromycin", "Amiodarone"},
        "severity": "MODERATE",
        "effect": "QT prolongation → risk of fatal cardiac arrhythmia",
        "mechanism": "Both drugs independently prolong the QT interval; combined effect is additive.",
        "recommendation": "Avoid combination. If necessary, continuous ECG monitoring required.",
    },
    {
        "drugs": {"Ibuprofen", "Aspirin"},
        "severity": "MODERATE",
        "effect": "Reduced cardioprotective effect of Aspirin",
        "mechanism": "Ibuprofen competitively blocks Aspirin's access to COX-1 on platelets.",
        "recommendation": "Take Aspirin 30 min before or 8 hours after Ibuprofen for cardioprotection.",
    },
    {
        "drugs": {"Levothyroxine", "Omeprazole"},
        "severity": "MODERATE",
        "effect": "Reduced Levothyroxine absorption",
        "mechanism": "PPIs increase gastric pH, impairing Levothyroxine dissolution and absorption.",
        "recommendation": "Take Levothyroxine 4 hours apart from Omeprazole. Monitor TSH levels.",
    },
    {
        "drugs": {"Levothyroxine", "Calcium Carbonate"},
        "severity": "MODERATE",
        "effect": "Reduced Levothyroxine absorption",
        "mechanism": "Calcium forms insoluble complexes with Levothyroxine in the gut.",
        "recommendation": "Separate doses by at least 4 hours.",
    },
    {
        "drugs": {"Prednisone", "Ibuprofen"},
        "severity": "MODERATE",
        "effect": "Significantly increased GI bleeding risk",
        "mechanism": "Both damage GI mucosa through different mechanisms; synergistic ulcerogenic effect.",
        "recommendation": "Use PPI (Omeprazole) for gastroprotection if combination is unavoidable.",
    },
    {
        "drugs": {"Fluoxetine", "Sumatriptan"},
        "severity": "MODERATE",
        "effect": "Serotonin syndrome risk",
        "mechanism": "Both increase serotonin; SSRIs prevent reuptake while triptans are serotonin agonists.",
        "recommendation": "Use with caution. Monitor for agitation, hyperthermia, muscle rigidity.",
    },
    {
        "drugs": {"Atenolol", "Salbutamol"},
        "severity": "MODERATE",
        "effect": "Reduced bronchodilator effect; potential bronchospasm",
        "mechanism": "Beta-blockers antagonize beta-2 agonists, reducing bronchodilation in asthma.",
        "recommendation": "Use cardioselective beta-blockers (e.g., Bisoprolol) in asthmatic patients.",
    },

    # --- MILD ---
    {
        "drugs": {"Paracetamol", "Alcohol"},
        "severity": "MILD",
        "effect": "Increased hepatotoxicity risk",
        "mechanism": "Chronic alcohol use induces CYP2E1 which generates more toxic Paracetamol metabolites.",
        "recommendation": "Limit Paracetamol to 2g/day in regular alcohol users. Avoid in acute intoxication.",
    },
    {
        "drugs": {"Cetirizine", "Alcohol"},
        "severity": "MILD",
        "effect": "Enhanced sedation and drowsiness",
        "mechanism": "Additive CNS depression from antihistamine + alcohol.",
        "recommendation": "Avoid driving or operating machinery. Limit alcohol intake.",
    },
    {
        "drugs": {"Amoxicillin", "Oral Contraceptive"},
        "severity": "MILD",
        "effect": "Possibly reduced contraceptive effectiveness",
        "mechanism": "Antibiotics may alter gut flora affecting enterohepatic recirculation of estrogen.",
        "recommendation": "Use backup contraception for the duration of antibiotic therapy + 7 days.",
    },
]


def _normalize(drug_name: str) -> str:
    """Normalize drug name for matching."""
    return drug_name.strip().lower()


def _build_lookup():
    """Build fast lookup dictionary."""
    lookup = {}
    for interaction in INTERACTIONS:
        drugs_list = sorted([_normalize(d) for d in interaction["drugs"]])
        key = (drugs_list[0], drugs_list[1])
        lookup[key] = interaction
    return lookup


LOOKUP = _build_lookup()


def check_interactions(medications: list) -> dict:
    """
    Check a list of medications for known interactions.

    Args:
        medications: List of medication names (strings)

    Returns:
        dict with 'interactions' list and summary stats
    """
    normalized = [_normalize(m) for m in medications]
    found = []
    checked_pairs = 0

    for i in range(len(normalized)):
        for j in range(i + 1, len(normalized)):
            pair = tuple(sorted([normalized[i], normalized[j]]))
            checked_pairs += 1
            if pair in LOOKUP:
                interaction = LOOKUP[pair]
                found.append({
                    "drug_a": medications[i],
                    "drug_b": medications[j],
                    "severity": interaction["severity"],
                    "effect": interaction["effect"],
                    "mechanism": interaction["mechanism"],
                    "recommendation": interaction["recommendation"],
                })

    # Also do partial/fuzzy matching
    for i in range(len(normalized)):
        for j in range(i + 1, len(normalized)):
            # Check if any known interaction drug is a substring
            for interaction in INTERACTIONS:
                known_drugs = [_normalize(d) for d in interaction["drugs"]]
                match_a = any(kd in normalized[i] or normalized[i] in kd for kd in known_drugs)
                match_b = any(kd in normalized[j] or normalized[j] in kd for kd in known_drugs)

                if not match_a or not match_b:
                    continue

                # Ensure we matched different drugs in the interaction
                matched_known_a = [kd for kd in known_drugs if kd in normalized[i] or normalized[i] in kd]
                matched_known_b = [kd for kd in known_drugs if kd in normalized[j] or normalized[j] in kd]
                if set(matched_known_a) == set(matched_known_b):
                    continue

                # Avoid duplicates
                already_found = any(
                    f["drug_a"] == medications[i] and f["drug_b"] == medications[j]
                    for f in found
                )
                if not already_found:
                    found.append({
                        "drug_a": medications[i],
                        "drug_b": medications[j],
                        "severity": interaction["severity"],
                        "effect": interaction["effect"],
                        "mechanism": interaction["mechanism"],
                        "recommendation": interaction["recommendation"],
                    })

    # Sort by severity
    severity_order = {"SEVERE": 0, "MODERATE": 1, "MILD": 2}
    found.sort(key=lambda x: severity_order.get(x["severity"], 3))

    severe_count = sum(1 for f in found if f["severity"] == "SEVERE")
    moderate_count = sum(1 for f in found if f["severity"] == "MODERATE")
    mild_count = sum(1 for f in found if f["severity"] == "MILD")

    return {
        "interactions": found,
        "total_interactions": len(found),
        "severe_count": severe_count,
        "moderate_count": moderate_count,
        "mild_count": mild_count,
        "medications_checked": medications,
        "pairs_checked": checked_pairs,
        "safe": len(found) == 0,
    }
