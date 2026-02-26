"""
Drug Interaction Checker

Rule-based system that checks for known dangerous drug interactions.
Provides severity levels, mechanisms, and clinical recommendations.
"""


# ── Drug Interaction Knowledge Base ─────────────────────────────────────────
# Each interaction: (drug_a, drug_b, severity, mechanism, recommendation)

INTERACTIONS = [
    # ═══════════════════════════════════════════════════════════════
    # SEVERE (life-threatening)  — 20 interactions
    # ═══════════════════════════════════════════════════════════════
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
        "drugs": {"Warfarin", "Naproxen"},
        "severity": "SEVERE",
        "effect": "Increased bleeding risk and GI hemorrhage",
        "mechanism": "NSAIDs inhibit platelet function; warfarin prevents clot formation.",
        "recommendation": "Avoid all NSAIDs with Warfarin. Use Paracetamol for pain management.",
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
        "drugs": {"Escitalopram", "Phenelzine"},
        "severity": "SEVERE",
        "effect": "Serotonin syndrome (potentially fatal)",
        "mechanism": "SSRI + MAOI causes dangerous serotonin levels in the brain.",
        "recommendation": "NEVER combine. Minimum 2-week washout between these drug classes.",
    },
    {
        "drugs": {"Methotrexate", "Ibuprofen"},
        "severity": "SEVERE",
        "effect": "Methotrexate toxicity (bone marrow suppression, renal failure)",
        "mechanism": "NSAIDs reduce renal clearance of Methotrexate, causing toxic accumulation.",
        "recommendation": "Avoid NSAIDs entirely during Methotrexate therapy. Use Paracetamol for pain.",
    },
    {
        "drugs": {"Methotrexate", "Trimethoprim"},
        "severity": "SEVERE",
        "effect": "Methotrexate toxicity — pancytopenia",
        "mechanism": "Both inhibit folate metabolism; combined effect causes severe bone marrow suppression.",
        "recommendation": "Avoid combination. If antibiotics needed, choose non-folate antagonists.",
    },
    {
        "drugs": {"Metformin", "Contrast Dye"},
        "severity": "SEVERE",
        "effect": "Lactic acidosis",
        "mechanism": "Contrast media can cause acute kidney injury, impairing Metformin clearance.",
        "recommendation": "Stop Metformin 48 hours before and after contrast procedures. Monitor renal function.",
    },
    {
        "drugs": {"Digoxin", "Amiodarone"},
        "severity": "SEVERE",
        "effect": "Digoxin toxicity — fatal arrhythmia",
        "mechanism": "Amiodarone increases Digoxin levels by 70-100% via P-glycoprotein inhibition.",
        "recommendation": "Reduce Digoxin dose by 50% when adding Amiodarone. Monitor Digoxin levels closely.",
    },
    {
        "drugs": {"Digoxin", "Verapamil"},
        "severity": "SEVERE",
        "effect": "Severe bradycardia and heart block",
        "mechanism": "Both slow AV conduction; Verapamil also increases Digoxin levels by 50-75%.",
        "recommendation": "Avoid combination. If essential, reduce Digoxin dose and monitor ECG.",
    },
    {
        "drugs": {"Clopidogrel", "Omeprazole"},
        "severity": "SEVERE",
        "effect": "Reduced antiplatelet effect — increased cardiac risk",
        "mechanism": "Omeprazole inhibits CYP2C19, blocking conversion of Clopidogrel to its active form.",
        "recommendation": "Use Pantoprazole instead — it has minimal CYP2C19 interaction.",
    },
    {
        "drugs": {"Lithium", "Ibuprofen"},
        "severity": "SEVERE",
        "effect": "Lithium toxicity — tremor, seizures, renal failure",
        "mechanism": "NSAIDs reduce renal Lithium clearance, causing levels to rise 25-50%.",
        "recommendation": "Avoid NSAIDs. Use Paracetamol. Monitor Lithium levels if unavoidable.",
    },
    {
        "drugs": {"Lithium", "Diclofenac"},
        "severity": "SEVERE",
        "effect": "Lithium toxicity — CNS and renal toxicity",
        "mechanism": "NSAIDs impair renal prostaglandin synthesis, reducing Lithium clearance.",
        "recommendation": "Avoid all NSAIDs with Lithium. Use Aspirin low-dose if needed.",
    },
    {
        "drugs": {"Rivaroxaban", "Ketoconazole"},
        "severity": "SEVERE",
        "effect": "Excessive bleeding risk",
        "mechanism": "Ketoconazole strongly inhibits CYP3A4 and P-gp, dramatically increasing Rivaroxaban levels.",
        "recommendation": "Contraindicated combination. Choose alternative antifungal (Terbinafine).",
    },
    {
        "drugs": {"Clarithromycin", "Colchicine"},
        "severity": "SEVERE",
        "effect": "Colchicine toxicity — multi-organ failure",
        "mechanism": "Clarithromycin inhibits CYP3A4 and P-gp, causing Colchicine accumulation.",
        "recommendation": "Avoid combination, especially in renal/hepatic impairment. Use Azithromycin instead.",
    },
    {
        "drugs": {"Spironolactone", "Potassium Chloride"},
        "severity": "SEVERE",
        "effect": "Life-threatening hyperkalemia",
        "mechanism": "Spironolactone is potassium-sparing; additional potassium causes dangerous levels.",
        "recommendation": "Never supplement potassium with Spironolactone unless under close lab monitoring.",
    },
    {
        "drugs": {"Isoniazid", "Rifampicin"},
        "severity": "SEVERE",
        "effect": "Hepatotoxicity — liver failure risk",
        "mechanism": "Both are independently hepatotoxic; combined use multiplies liver damage risk.",
        "recommendation": "Monitor liver function tests (ALT/AST) every 2 weeks. Stop if ALT > 3× ULN with symptoms.",
    },
    {
        "drugs": {"Carbamazepine", "Erythromycin"},
        "severity": "SEVERE",
        "effect": "Carbamazepine toxicity — dizziness, ataxia, nystagmus",
        "mechanism": "Erythromycin inhibits CYP3A4, doubling Carbamazepine levels.",
        "recommendation": "Avoid Erythromycin. Use Azithromycin which has minimal CYP3A4 interaction.",
    },

    # ═══════════════════════════════════════════════════════════════
    # MODERATE  — 35 interactions
    # ═══════════════════════════════════════════════════════════════
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
        "drugs": {"Telmisartan", "Potassium Chloride"},
        "severity": "MODERATE",
        "effect": "Hyperkalemia",
        "mechanism": "ARBs reduce aldosterone secretion, promoting potassium retention.",
        "recommendation": "Monitor serum potassium. Avoid unless specifically directed.",
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
        "drugs": {"Ciprofloxacin", "Calcium Carbonate"},
        "severity": "MODERATE",
        "effect": "Reduced Ciprofloxacin absorption",
        "mechanism": "Calcium chelates quinolone antibiotics, reducing bioavailability by 40%.",
        "recommendation": "Separate administration by at least 2 hours.",
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
        "drugs": {"Levothyroxine", "Pantoprazole"},
        "severity": "MODERATE",
        "effect": "Reduced Levothyroxine absorption",
        "mechanism": "PPIs alter gastric pH, impairing absorption of thyroid hormone.",
        "recommendation": "Take Levothyroxine on empty stomach, 4 hours before PPI.",
    },
    {
        "drugs": {"Levothyroxine", "Calcium Carbonate"},
        "severity": "MODERATE",
        "effect": "Reduced Levothyroxine absorption",
        "mechanism": "Calcium forms insoluble complexes with Levothyroxine in the gut.",
        "recommendation": "Separate doses by at least 4 hours.",
    },
    {
        "drugs": {"Levothyroxine", "Ferrous Sulfate"},
        "severity": "MODERATE",
        "effect": "Reduced Levothyroxine absorption",
        "mechanism": "Iron chelates with Levothyroxine forming insoluble complexes.",
        "recommendation": "Separate by at least 4 hours. Monitor TSH 6-8 weeks after starting iron.",
    },
    {
        "drugs": {"Prednisone", "Ibuprofen"},
        "severity": "MODERATE",
        "effect": "Significantly increased GI bleeding risk",
        "mechanism": "Both damage GI mucosa through different mechanisms; synergistic ulcerogenic effect.",
        "recommendation": "Use PPI (Omeprazole) for gastroprotection if combination is unavoidable.",
    },
    {
        "drugs": {"Prednisolone", "Diclofenac"},
        "severity": "MODERATE",
        "effect": "Increased GI bleeding and ulcer risk",
        "mechanism": "Corticosteroids + NSAIDs have synergistic gastrointestinal toxicity.",
        "recommendation": "Add proton pump inhibitor prophylaxis. Use lowest effective doses.",
    },
    {
        "drugs": {"Fluoxetine", "Sumatriptan"},
        "severity": "MODERATE",
        "effect": "Serotonin syndrome risk",
        "mechanism": "Both increase serotonin; SSRIs prevent reuptake while triptans are serotonin agonists.",
        "recommendation": "Use with caution. Monitor for agitation, hyperthermia, muscle rigidity.",
    },
    {
        "drugs": {"Escitalopram", "Sumatriptan"},
        "severity": "MODERATE",
        "effect": "Increased serotonin syndrome risk",
        "mechanism": "SSRI + triptan dual serotonergic stimulation.",
        "recommendation": "Monitor closely. Educate patient on serotonin syndrome symptoms.",
    },
    {
        "drugs": {"Atenolol", "Salbutamol"},
        "severity": "MODERATE",
        "effect": "Reduced bronchodilator effect; potential bronchospasm",
        "mechanism": "Beta-blockers antagonize beta-2 agonists, reducing bronchodilation in asthma.",
        "recommendation": "Use cardioselective beta-blockers (e.g., Bisoprolol) in asthmatic patients.",
    },
    {
        "drugs": {"Metoprolol", "Salbutamol"},
        "severity": "MODERATE",
        "effect": "Partial antagonism of bronchodilator effect",
        "mechanism": "Beta-1 selective blockers can still partially antagonize beta-2 bronchodilation at higher doses.",
        "recommendation": "Monitor respiratory function. Consider alternative bronchodilator.",
    },
    {
        "drugs": {"Metformin", "Glimepiride"},
        "severity": "MODERATE",
        "effect": "Increased hypoglycemia risk",
        "mechanism": "Both lower blood glucose through different mechanisms; combined risk is additive.",
        "recommendation": "Monitor blood glucose closely. Adjust Glimepiride dose if adding Metformin.",
    },
    {
        "drugs": {"Amlodipine", "Atenolol"},
        "severity": "MODERATE",
        "effect": "Excessive hypotension and bradycardia",
        "mechanism": "Both lower blood pressure; beta-blocker + calcium channel blocker cause additive cardiac depression.",
        "recommendation": "Start with low doses. Monitor blood pressure and heart rate.",
    },
    {
        "drugs": {"Enalapril", "Losartan"},
        "severity": "MODERATE",
        "effect": "Hyperkalemia and renal impairment",
        "mechanism": "Dual RAAS blockade causes excessive potassium retention and reduced renal perfusion.",
        "recommendation": "Avoid dual RAAS blockade. Choose one agent only.",
    },
    {
        "drugs": {"Furosemide", "Gentamicin"},
        "severity": "MODERATE",
        "effect": "Increased ototoxicity and nephrotoxicity",
        "mechanism": "Loop diuretics potentiate aminoglycoside-induced damage to inner ear and kidney.",
        "recommendation": "Monitor renal function and audiometry. Ensure adequate hydration.",
    },
    {
        "drugs": {"Phenytoin", "Valproate"},
        "severity": "MODERATE",
        "effect": "Unpredictable changes in both drug levels",
        "mechanism": "Complex protein binding displacement and enzyme induction/inhibition.",
        "recommendation": "Monitor levels of both drugs. Adjust doses based on clinical response.",
    },
    {
        "drugs": {"Doxycycline", "Calcium Carbonate"},
        "severity": "MODERATE",
        "effect": "Reduced Doxycycline absorption",
        "mechanism": "Divalent cations chelate tetracyclines in the gut.",
        "recommendation": "Separate doses by 2-3 hours. Take Doxycycline with water only.",
    },
    {
        "drugs": {"Doxycycline", "Ferrous Sulfate"},
        "severity": "MODERATE",
        "effect": "Reduced absorption of both drugs",
        "mechanism": "Iron and tetracyclines form insoluble chelate complexes.",
        "recommendation": "Separate doses by at least 3 hours.",
    },
    {
        "drugs": {"Pregabalin", "Alcohol"},
        "severity": "MODERATE",
        "effect": "Severe CNS depression and respiratory depression",
        "mechanism": "Additive GABAergic CNS depressant effects.",
        "recommendation": "Avoid alcohol during Pregabalin therapy. Warn about drowsiness/impairment.",
    },
    {
        "drugs": {"Clonazepam", "Alcohol"},
        "severity": "MODERATE",
        "effect": "Severe CNS depression, respiratory depression",
        "mechanism": "Additive GABA-mediated CNS depression. Risk of respiratory arrest.",
        "recommendation": "Strictly avoid alcohol with benzodiazepines.",
    },
    {
        "drugs": {"Ramipril", "Spironolactone"},
        "severity": "MODERATE",
        "effect": "Hyperkalemia risk",
        "mechanism": "ACE inhibitor + potassium-sparing diuretic both promote potassium retention.",
        "recommendation": "Monitor potassium levels within 1 week of combination and regularly thereafter.",
    },
    {
        "drugs": {"Tramadol", "Sertraline"},
        "severity": "MODERATE",
        "effect": "Serotonin syndrome and seizure risk",
        "mechanism": "Both increase serotonin; Tramadol also lowers seizure threshold.",
        "recommendation": "Avoid if possible. Use alternative analgesic (Paracetamol, NSAIDs).",
    },
    {
        "drugs": {"Tramadol", "Escitalopram"},
        "severity": "MODERATE",
        "effect": "Serotonin syndrome risk",
        "mechanism": "Dual serotonergic mechanism increases serotonin toxicity risk.",
        "recommendation": "Avoid combination. Use non-serotonergic analgesics.",
    },
    {
        "drugs": {"Isotretinoin", "Doxycycline"},
        "severity": "MODERATE",
        "effect": "Pseudotumor cerebri (increased intracranial pressure)",
        "mechanism": "Both independently raise intracranial pressure; combined risk is significant.",
        "recommendation": "NEVER combine. If acne needs oral antibiotics, use Azithromycin.",
    },
    {
        "drugs": {"Allopurinol", "Azathioprine"},
        "severity": "MODERATE",
        "effect": "Severe myelosuppression",
        "mechanism": "Allopurinol inhibits xanthine oxidase, blocking Azathioprine metabolism → toxicity.",
        "recommendation": "Reduce Azathioprine dose by 75% if Allopurinol is essential.",
    },
    {
        "drugs": {"Sildenafil", "Nitroglycerin"},
        "severity": "SEVERE",
        "effect": "Severe life-threatening hypotension",
        "mechanism": "Both cause vasodilation via nitric oxide/cGMP pathway — synergistic effect.",
        "recommendation": "ABSOLUTELY CONTRAINDICATED. Wait 24-48 hours between these drugs.",
    },
    {
        "drugs": {"Metoprolol", "Diltiazem"},
        "severity": "MODERATE",
        "effect": "Severe bradycardia and heart block",
        "mechanism": "Both slow AV conduction; combined negative chronotropic effect is dangerous.",
        "recommendation": "Avoid combination. If essential, start with very low doses and monitor ECG.",
    },

    # ═══════════════════════════════════════════════════════════════
    # MILD  — 20 interactions
    # ═══════════════════════════════════════════════════════════════
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
        "drugs": {"Levocetirizine", "Alcohol"},
        "severity": "MILD",
        "effect": "Enhanced drowsiness",
        "mechanism": "Additive CNS depressant effects.",
        "recommendation": "Avoid driving. Take Levocetirizine at bedtime.",
    },
    {
        "drugs": {"Amoxicillin", "Oral Contraceptive"},
        "severity": "MILD",
        "effect": "Possibly reduced contraceptive effectiveness",
        "mechanism": "Antibiotics may alter gut flora affecting enterohepatic recirculation of estrogen.",
        "recommendation": "Use backup contraception for the duration of antibiotic therapy + 7 days.",
    },
    {
        "drugs": {"Pantoprazole", "Clopidogrel"},
        "severity": "MILD",
        "effect": "Minor reduction in Clopidogrel activation",
        "mechanism": "Pantoprazole weakly inhibits CYP2C19 (less than Omeprazole).",
        "recommendation": "Pantoprazole is the preferred PPI with Clopidogrel. Monitor if concerned.",
    },
    {
        "drugs": {"Metformin", "Vitamin B12"},
        "severity": "MILD",
        "effect": "Reduced Vitamin B12 absorption over time",
        "mechanism": "Metformin reduces intrinsic factor–B12 complex absorption in ileum.",
        "recommendation": "Monitor B12 levels annually. Supplement if deficient.",
    },
    {
        "drugs": {"Atorvastatin", "Grapefruit"},
        "severity": "MILD",
        "effect": "Increased statin levels — myalgia risk",
        "mechanism": "Grapefruit inhibits intestinal CYP3A4, increasing Atorvastatin bioavailability.",
        "recommendation": "Avoid grapefruit juice. Small amounts unlikely to cause problems.",
    },
    {
        "drugs": {"Aspirin", "Clopidogrel"},
        "severity": "MILD",
        "effect": "Increased bleeding tendency",
        "mechanism": "Dual antiplatelet therapy — intended therapeutic effect but increases bleeding risk.",
        "recommendation": "Standard post-stent therapy. Add PPI for GI protection. Monitor for bleeding signs.",
    },
    {
        "drugs": {"Amlodipine", "Atorvastatin"},
        "severity": "MILD",
        "effect": "Slightly increased statin exposure",
        "mechanism": "Mild CYP3A4 interaction increasing Atorvastatin levels by 18%.",
        "recommendation": "Generally safe combination (Caduet). No dose adjustment usually needed.",
    },
    {
        "drugs": {"Omeprazole", "Iron Sucrose"},
        "severity": "MILD",
        "effect": "Reduced oral iron absorption",
        "mechanism": "Gastric acid needed for iron dissolution; PPIs raise gastric pH.",
        "recommendation": "IV iron (Iron Sucrose) bypasses this issue. Separate oral iron from PPI by 2 hours.",
    },
    {
        "drugs": {"Hydroxyzine", "Alcohol"},
        "severity": "MILD",
        "effect": "Increased sedation and impairment",
        "mechanism": "Additive CNS depression from sedating antihistamine + alcohol.",
        "recommendation": "Avoid driving. Take Hydroxyzine at bedtime.",
    },
    {
        "drugs": {"Fluticasone", "Ritonavir"},
        "severity": "MILD",
        "effect": "Cushing syndrome from steroid accumulation",
        "mechanism": "Ritonavir inhibits CYP3A4, greatly increasing systemic Fluticasone exposure.",
        "recommendation": "Use Beclomethasone inhaler instead. Monitor for cushingoid features.",
    },
    {
        "drugs": {"Gabapentin", "Alcohol"},
        "severity": "MILD",
        "effect": "Enhanced CNS depression",
        "mechanism": "Additive effects on GABAergic pathways.",
        "recommendation": "Limit alcohol. Warn about increased drowsiness/dizziness.",
    },
    {
        "drugs": {"Montelukast", "Phenobarbital"},
        "severity": "MILD",
        "effect": "Reduced Montelukast effectiveness",
        "mechanism": "Phenobarbital induces CYP3A4, increasing Montelukast metabolism.",
        "recommendation": "May need higher Montelukast dose. Monitor asthma control.",
    },
    {
        "drugs": {"Fexofenadine", "Grapefruit"},
        "severity": "MILD",
        "effect": "Reduced Fexofenadine absorption",
        "mechanism": "Grapefruit inhibits OATP transporters needed for Fexofenadine absorption.",
        "recommendation": "Take Fexofenadine with water, not fruit juice.",
    },
    {
        "drugs": {"Losartan", "Fluconazole"},
        "severity": "MILD",
        "effect": "Reduced antihypertensive effect",
        "mechanism": "Fluconazole inhibits CYP2C9, blocking conversion of Losartan to active metabolite.",
        "recommendation": "Monitor blood pressure. Consider switching to Telmisartan.",
    },
    {
        "drugs": {"Propranolol", "Insulin"},
        "severity": "MILD",
        "effect": "Masked hypoglycemia symptoms",
        "mechanism": "Beta-blockers blunt tachycardia and tremor that warn of low blood sugar.",
        "recommendation": "Monitor blood glucose more frequently. Educate on non-adrenergic hypo symptoms.",
    },
    {
        "drugs": {"Aceclofenac", "Aspirin"},
        "severity": "MILD",
        "effect": "Increased GI irritation and reduced Aspirin antiplatelet effect",
        "mechanism": "NSAIDs compete for COX binding and increase GI mucosal damage.",
        "recommendation": "Use with PPI protection. Separate dosing times.",
    },
    {
        "drugs": {"Zolpidem", "Alcohol"},
        "severity": "MILD",
        "effect": "Excessive sedation and respiratory depression risk",
        "mechanism": "Additive CNS depressant effects on GABA receptors.",
        "recommendation": "Avoid alcohol on days Zolpidem is taken.",
    },
    {
        "drugs": {"Valproate", "Lamotrigine"},
        "severity": "MILD",
        "effect": "Increased Lamotrigine levels — risk of Stevens-Johnson Syndrome",
        "mechanism": "Valproate inhibits glucuronidation of Lamotrigine, doubling its half-life.",
        "recommendation": "Halve the Lamotrigine dose. Titrate very slowly (25mg every 2 weeks).",
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
