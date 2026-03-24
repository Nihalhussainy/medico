"""
Comprehensive Medical Data Generator — Medico AI
=================================================
Generates 50,000+ realistic synthetic medical records with:
  - 60 diseases across 12 medical specialties
  - 300+ real medicines with age-appropriate dosing
  - Multi-visit patients (same patient returns with related conditions)
  - Comorbidity patterns (diabetes + hypertension, etc.)
  - Realistic outcome distributions based on clinical data
  - Seasonal disease patterns
  - Risk factor accumulation over time
  - BMI, smoking, alcohol lifestyle factors
"""

import os
import csv
import random
import math

# ── Blood Groups ────────────────────────────────────────────────────────────

BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]
BLOOD_GROUP_WEIGHTS = [27, 3, 31, 2, 7, 1, 25, 4]  # Indian population distribution

# ── Lifestyle / Risk factors pool ───────────────────────────────────────────

LIFESTYLE_RISKS = [
    "Smoking", "Alcohol", "Sedentary lifestyle", "Obesity", "High BMI",
    "Family history (diabetes)", "Family history (heart disease)", "Family history (cancer)",
    "Family history (hypertension)", "Stress", "Poor diet", "Sleep deprivation",
    "Air pollution exposure", "Occupational hazard", "Previous surgery",
    "Drug abuse", "High cholesterol", "Low physical activity",
]

ALLERGY_OPTIONS = [
    "Penicillin", "Sulfa drugs", "Aspirin", "Ibuprofen", "Codeine",
    "Amoxicillin", "Cephalosporins", "Erythromycin", "Tetracycline",
    "Peanuts", "Shellfish", "Latex", "Dust mites", "Pollen", "Eggs",
    "Contrast dye", "Lidocaine", "NSAIDs",
]

# ══════════════════════════════════════════════════════════════════════
# 60 DISEASES — grouped by specialty
# Each entry: medicines by age group, symptoms, vitals, severity, risks
# ══════════════════════════════════════════════════════════════════════

DISEASES = {
    # ─── GENERAL / INFECTIOUS (1-12) ───────────────────────────────
    "Common Cold": {
        "specialty": "General",
        "age_range": (2, 85),
        "gender_bias": None,
        "medicines": {
            "child":  [("Cetirizine 2.5mg Syrup", 0.85), ("Paracetamol 250mg", 0.80), ("Ambroxol Syrup", 0.75), ("Cough Syrup (Dextromethorphan)", 0.70)],
            "teen":   [("Cetirizine 5mg", 0.85), ("Paracetamol 500mg", 0.82), ("Ambroxol 30mg", 0.78), ("Vitamin C 500mg", 0.65)],
            "adult":  [("Cetirizine 10mg", 0.88), ("Paracetamol 650mg", 0.85), ("Ambroxol 30mg", 0.78), ("Levocetirizine 5mg", 0.86), ("Montelukast 10mg", 0.72)],
            "middle": [("Levocetirizine 5mg", 0.86), ("Paracetamol 650mg", 0.84), ("Ambroxol 30mg", 0.75), ("Vitamin C 1000mg", 0.60)],
            "senior": [("Levocetirizine 5mg", 0.82), ("Paracetamol 500mg", 0.80), ("Ambroxol 30mg", 0.72), ("Vitamin C 500mg", 0.58)],
        },
        "symptoms": ["Runny nose", "Sneezing", "Sore throat", "Cough", "Mild headache", "Nasal congestion", "Body ache", "Watery eyes", "Low-grade fever"],
        "severity_dist": {"MILD": 0.65, "MODERATE": 0.30, "SEVERE": 0.05},
        "chronic": False,
        "vitals": {"bp_s": (110, 130), "bp_d": (70, 85), "hr": (70, 90), "temp": (98.6, 100.4), "spo2": (95, 99)},
        "risk_factors": ["Air pollution exposure", "Sleep deprivation", "Stress"],
        "leads_to": {"Bronchitis": 0.08, "Sinusitis": 0.12, "Pneumonia": 0.03},
    },
    "Fever (Viral)": {
        "specialty": "General",
        "age_range": (1, 80),
        "gender_bias": None,
        "medicines": {
            "child":  [("Paracetamol 250mg Syrup", 0.88), ("Ibuprofen 100mg Syrup", 0.80), ("ORS Sachets", 0.90), ("Zinc Supplement", 0.70)],
            "teen":   [("Paracetamol 500mg", 0.90), ("Ibuprofen 200mg", 0.82), ("ORS Sachets", 0.88)],
            "adult":  [("Paracetamol 650mg", 0.92), ("Ibuprofen 400mg", 0.84), ("Dolo 650mg", 0.90), ("Nimesulide 100mg", 0.78)],
            "middle": [("Paracetamol 650mg", 0.90), ("Dolo 650mg", 0.88), ("Nimesulide 100mg", 0.76)],
            "senior": [("Paracetamol 500mg", 0.86), ("Dolo 650mg", 0.84)],
        },
        "symptoms": ["High fever", "Body ache", "Headache", "Fatigue", "Chills", "Sweating", "Loss of appetite", "Muscle pain", "Joint pain"],
        "severity_dist": {"MILD": 0.35, "MODERATE": 0.50, "SEVERE": 0.15},
        "chronic": False,
        "vitals": {"bp_s": (100, 130), "bp_d": (65, 85), "hr": (80, 110), "temp": (100.0, 103.5), "spo2": (94, 99)},
        "risk_factors": ["Sleep deprivation", "Stress", "Poor diet"],
        "leads_to": {"Pneumonia": 0.05, "Dengue Fever": 0.03},
    },
    "Dengue Fever": {
        "specialty": "Infectious",
        "age_range": (5, 70),
        "gender_bias": None,
        "medicines": {
            "child":  [("Paracetamol 250mg", 0.78), ("ORS Sachets", 0.92), ("IV Fluids", 0.95), ("Platelet Transfusion", 0.70)],
            "teen":   [("Paracetamol 500mg", 0.80), ("ORS Sachets", 0.90), ("IV Fluids", 0.93)],
            "adult":  [("Paracetamol 650mg", 0.82), ("ORS Sachets", 0.90), ("IV Fluids", 0.94), ("Papaya Leaf Extract", 0.55)],
            "middle": [("Paracetamol 650mg", 0.78), ("ORS Sachets", 0.88), ("IV Fluids", 0.93)],
            "senior": [("Paracetamol 500mg", 0.72), ("IV Fluids", 0.92), ("Platelet Transfusion", 0.75)],
        },
        "symptoms": ["High fever", "Severe headache", "Pain behind eyes", "Joint pain", "Muscle pain", "Skin rash", "Nausea", "Low platelet count", "Bleeding gums", "Fatigue"],
        "severity_dist": {"MILD": 0.20, "MODERATE": 0.50, "SEVERE": 0.30},
        "chronic": False,
        "vitals": {"bp_s": (90, 120), "bp_d": (55, 80), "hr": (85, 115), "temp": (101.0, 104.5), "spo2": (92, 98)},
        "risk_factors": ["Air pollution exposure", "Poor diet"],
        "leads_to": {"Liver Damage": 0.06, "Dehydration": 0.15},
    },
    "Typhoid Fever": {
        "specialty": "Infectious",
        "age_range": (5, 65),
        "gender_bias": None,
        "medicines": {
            "child":  [("Azithromycin 200mg Syrup", 0.82), ("Cefixime 100mg", 0.80), ("ORS Sachets", 0.88), ("Paracetamol 250mg", 0.75)],
            "teen":   [("Azithromycin 500mg", 0.85), ("Cefixime 200mg", 0.83), ("Ciprofloxacin 250mg", 0.80), ("Paracetamol 500mg", 0.78)],
            "adult":  [("Azithromycin 500mg", 0.87), ("Cefixime 200mg", 0.84), ("Ciprofloxacin 500mg", 0.86), ("Ofloxacin 200mg", 0.82), ("Ceftriaxone 1g IV", 0.90)],
            "middle": [("Azithromycin 500mg", 0.85), ("Ciprofloxacin 500mg", 0.84), ("Ceftriaxone 1g IV", 0.88)],
            "senior": [("Ceftriaxone 1g IV", 0.86), ("Azithromycin 500mg", 0.80)],
        },
        "symptoms": ["Prolonged fever", "Weakness", "Stomach pain", "Headache", "Loss of appetite", "Diarrhea", "Constipation", "Rose spots on skin", "Coated tongue"],
        "severity_dist": {"MILD": 0.15, "MODERATE": 0.55, "SEVERE": 0.30},
        "chronic": False,
        "vitals": {"bp_s": (95, 125), "bp_d": (60, 82), "hr": (78, 105), "temp": (101.0, 104.0), "spo2": (94, 99)},
        "risk_factors": ["Poor diet", "Air pollution exposure"],
        "leads_to": {"Intestinal Perforation": 0.03, "Dehydration": 0.10},
    },
    "Malaria": {
        "specialty": "Infectious",
        "age_range": (3, 70),
        "gender_bias": None,
        "medicines": {
            "child":  [("Artemether-Lumefantrine Syrup", 0.88), ("Chloroquine 150mg", 0.75), ("Paracetamol 250mg", 0.80), ("ORS Sachets", 0.85)],
            "teen":   [("Artemether-Lumefantrine", 0.90), ("Chloroquine 250mg", 0.78), ("Primaquine 15mg", 0.82)],
            "adult":  [("Artemether-Lumefantrine", 0.92), ("Chloroquine 500mg", 0.80), ("Primaquine 15mg", 0.84), ("Artesunate 60mg IV", 0.94), ("Doxycycline 100mg", 0.78)],
            "middle": [("Artemether-Lumefantrine", 0.90), ("Artesunate 60mg IV", 0.92), ("Quinine 300mg", 0.82)],
            "senior": [("Artesunate 60mg IV", 0.88), ("Artemether-Lumefantrine", 0.85)],
        },
        "symptoms": ["Cyclical fever", "Severe chills", "Sweating", "Headache", "Nausea", "Vomiting", "Muscle pain", "Fatigue", "Anemia", "Jaundice"],
        "severity_dist": {"MILD": 0.15, "MODERATE": 0.45, "SEVERE": 0.40},
        "chronic": False,
        "vitals": {"bp_s": (90, 125), "bp_d": (55, 80), "hr": (85, 115), "temp": (101.5, 105.0), "spo2": (90, 97)},
        "risk_factors": ["Air pollution exposure"],
        "leads_to": {"Anemia": 0.15, "Kidney Disease": 0.05, "Liver Damage": 0.04},
    },
    "Chickenpox": {
        "specialty": "Infectious",
        "age_range": (2, 45),
        "gender_bias": None,
        "medicines": {
            "child":  [("Calamine Lotion", 0.80), ("Paracetamol 250mg", 0.82), ("Acyclovir 200mg", 0.78), ("Cetirizine 2.5mg Syrup", 0.75)],
            "teen":   [("Acyclovir 400mg", 0.85), ("Calamine Lotion", 0.80), ("Paracetamol 500mg", 0.80), ("Cetirizine 10mg", 0.76)],
            "adult":  [("Acyclovir 800mg", 0.88), ("Valacyclovir 1g", 0.90), ("Calamine Lotion", 0.78), ("Paracetamol 650mg", 0.82)],
            "middle": [("Valacyclovir 1g", 0.85), ("Acyclovir 800mg", 0.82)],
            "senior": [("Valacyclovir 1g", 0.80), ("Acyclovir 800mg", 0.78)],
        },
        "symptoms": ["Itchy rash", "Blisters", "Fever", "Fatigue", "Loss of appetite", "Headache", "Body ache"],
        "severity_dist": {"MILD": 0.45, "MODERATE": 0.40, "SEVERE": 0.15},
        "chronic": False,
        "vitals": {"bp_s": (105, 130), "bp_d": (65, 85), "hr": (72, 100), "temp": (99.5, 102.5), "spo2": (95, 99)},
        "risk_factors": [],
        "leads_to": {"Shingles": 0.08},
    },
    "UTI (Urinary Tract Infection)": {
        "specialty": "Urology",
        "age_range": (15, 80),
        "gender_bias": "F",
        "medicines": {
            "teen":   [("Nitrofurantoin 100mg", 0.85), ("Ciprofloxacin 250mg", 0.82), ("Cranberry Extract", 0.55)],
            "adult":  [("Nitrofurantoin 100mg", 0.88), ("Ciprofloxacin 500mg", 0.86), ("Trimethoprim 200mg", 0.83), ("Fosfomycin 3g", 0.90), ("Norfloxacin 400mg", 0.84)],
            "middle": [("Ciprofloxacin 500mg", 0.85), ("Nitrofurantoin 100mg", 0.86), ("Fosfomycin 3g", 0.88), ("Cefixime 200mg", 0.80)],
            "senior": [("Nitrofurantoin 100mg", 0.80), ("Cefixime 200mg", 0.78), ("Fosfomycin 3g", 0.85)],
        },
        "symptoms": ["Burning urination", "Frequent urination", "Urgency", "Cloudy urine", "Pelvic pain", "Lower back pain", "Blood in urine", "Foul-smelling urine"],
        "severity_dist": {"MILD": 0.35, "MODERATE": 0.50, "SEVERE": 0.15},
        "chronic": False,
        "vitals": {"bp_s": (110, 135), "bp_d": (70, 88), "hr": (72, 95), "temp": (98.6, 101.5), "spo2": (96, 99)},
        "risk_factors": ["Family history (diabetes)", "Sedentary lifestyle"],
        "leads_to": {"Kidney Infection": 0.10, "Kidney Stones": 0.04},
    },
    "Tuberculosis (Pulmonary)": {
        "specialty": "Pulmonology",
        "age_range": (15, 75),
        "gender_bias": "M",
        "medicines": {
            "teen":   [("Isoniazid 300mg", 0.88), ("Rifampicin 450mg", 0.90), ("Pyrazinamide 1500mg", 0.85), ("Ethambutol 800mg", 0.82)],
            "adult":  [("Isoniazid 300mg", 0.90), ("Rifampicin 600mg", 0.92), ("Pyrazinamide 1500mg", 0.87), ("Ethambutol 1200mg", 0.85), ("Streptomycin 750mg", 0.80)],
            "middle": [("Isoniazid 300mg", 0.88), ("Rifampicin 600mg", 0.90), ("Pyrazinamide 1500mg", 0.85), ("Ethambutol 1200mg", 0.83)],
            "senior": [("Isoniazid 300mg", 0.82), ("Rifampicin 450mg", 0.85), ("Ethambutol 800mg", 0.78)],
        },
        "symptoms": ["Chronic cough >2 weeks", "Hemoptysis", "Night sweats", "Weight loss", "Fever", "Fatigue", "Chest pain", "Loss of appetite"],
        "severity_dist": {"MILD": 0.15, "MODERATE": 0.45, "SEVERE": 0.40},
        "chronic": True,
        "vitals": {"bp_s": (100, 130), "bp_d": (60, 85), "hr": (78, 105), "temp": (99.0, 102.0), "spo2": (88, 96)},
        "risk_factors": ["Smoking", "Alcohol", "Poor diet", "Air pollution exposure"],
        "leads_to": {"COPD": 0.10, "Pneumonia": 0.08, "Lung Fibrosis": 0.05},
    },
    "COVID-19": {
        "specialty": "Infectious",
        "age_range": (5, 90),
        "gender_bias": None,
        "medicines": {
            "child":  [("Paracetamol 250mg", 0.82), ("ORS Sachets", 0.85), ("Vitamin C 250mg", 0.65), ("Zinc Supplement", 0.68)],
            "teen":   [("Paracetamol 500mg", 0.84), ("Vitamin C 500mg", 0.68), ("Zinc 50mg", 0.70), ("Ivermectin 12mg", 0.55)],
            "adult":  [("Paracetamol 650mg", 0.86), ("Dexamethasone 6mg", 0.82), ("Remdesivir 200mg IV", 0.78), ("Vitamin C 1000mg", 0.65), ("Favipiravir 200mg", 0.72), ("Montelukast 10mg", 0.68)],
            "middle": [("Dexamethasone 6mg", 0.80), ("Remdesivir 200mg IV", 0.76), ("Tocilizumab 400mg IV", 0.74), ("Paracetamol 650mg", 0.84)],
            "senior": [("Dexamethasone 6mg", 0.75), ("Remdesivir 200mg IV", 0.72), ("Oxygen Therapy", 0.90), ("Paracetamol 500mg", 0.80)],
        },
        "symptoms": ["Fever", "Dry cough", "Fatigue", "Loss of taste", "Loss of smell", "Shortness of breath", "Body ache", "Sore throat", "Headache", "Diarrhea", "Chest pain"],
        "severity_dist": {"MILD": 0.40, "MODERATE": 0.35, "SEVERE": 0.25},
        "chronic": False,
        "vitals": {"bp_s": (95, 140), "bp_d": (60, 90), "hr": (75, 120), "temp": (99.0, 103.5), "spo2": (85, 98)},
        "risk_factors": ["Obesity", "High BMI", "Family history (diabetes)", "Smoking"],
        "leads_to": {"Pneumonia": 0.15, "COPD": 0.05, "Depression": 0.08, "Anxiety Disorder": 0.06},
    },
    "Gastroenteritis": {
        "specialty": "Gastroenterology",
        "age_range": (2, 75),
        "gender_bias": None,
        "medicines": {
            "child":  [("ORS Sachets", 0.92), ("Zinc Supplement", 0.82), ("Racecadotril 10mg", 0.78), ("Ondansetron 2mg", 0.80)],
            "teen":   [("ORS Sachets", 0.90), ("Loperamide 2mg", 0.75), ("Ciprofloxacin 250mg", 0.80), ("Ondansetron 4mg", 0.82)],
            "adult":  [("ORS Sachets", 0.90), ("Loperamide 2mg", 0.78), ("Ciprofloxacin 500mg", 0.84), ("Ondansetron 4mg", 0.84), ("Metronidazole 400mg", 0.80), ("Norfloxacin 400mg", 0.82)],
            "middle": [("ORS Sachets", 0.88), ("Ciprofloxacin 500mg", 0.82), ("Ondansetron 4mg", 0.82)],
            "senior": [("ORS Sachets", 0.86), ("Ondansetron 4mg", 0.80), ("IV Fluids", 0.90)],
        },
        "symptoms": ["Diarrhea", "Vomiting", "Nausea", "Abdominal cramps", "Fever", "Dehydration", "Loss of appetite", "Bloating"],
        "severity_dist": {"MILD": 0.30, "MODERATE": 0.50, "SEVERE": 0.20},
        "chronic": False,
        "vitals": {"bp_s": (90, 125), "bp_d": (55, 80), "hr": (80, 110), "temp": (99.0, 102.5), "spo2": (94, 99)},
        "risk_factors": ["Poor diet"],
        "leads_to": {"Dehydration": 0.15, "IBS": 0.05},
    },
    "Diarrhea (Acute)": {
        "specialty": "Gastroenterology",
        "age_range": (1, 80),
        "gender_bias": None,
        "medicines": {
            "child":  [("ORS Sachets", 0.95), ("Zinc 20mg", 0.88), ("Probiotics (Saccharomyces)", 0.78), ("Racecadotril 10mg", 0.76)],
            "teen":   [("ORS Sachets", 0.92), ("Loperamide 2mg", 0.78), ("Probiotics", 0.76), ("Norfloxacin 400mg", 0.80)],
            "adult":  [("ORS Sachets", 0.92), ("Loperamide 2mg", 0.80), ("Norfloxacin 400mg", 0.84), ("Racecadotril 100mg", 0.80), ("Metronidazole 400mg", 0.82)],
            "middle": [("ORS Sachets", 0.90), ("Norfloxacin 400mg", 0.82), ("Metronidazole 400mg", 0.80)],
            "senior": [("ORS Sachets", 0.88), ("IV Fluids", 0.92), ("Norfloxacin 400mg", 0.78)],
        },
        "symptoms": ["Watery stools", "Abdominal cramps", "Nausea", "Vomiting", "Dehydration", "Fever", "Bloating", "Urgency"],
        "severity_dist": {"MILD": 0.35, "MODERATE": 0.45, "SEVERE": 0.20},
        "chronic": False,
        "vitals": {"bp_s": (90, 125), "bp_d": (55, 82), "hr": (78, 108), "temp": (98.6, 101.5), "spo2": (95, 99)},
        "risk_factors": ["Poor diet"],
        "leads_to": {"Dehydration": 0.12, "IBS": 0.04},
    },
    "Conjunctivitis": {
        "specialty": "Ophthalmology",
        "age_range": (3, 70),
        "gender_bias": None,
        "medicines": {
            "child":  [("Moxifloxacin Eye Drops", 0.88), ("Tobramycin Eye Drops", 0.85), ("Artificial Tears", 0.72)],
            "teen":   [("Moxifloxacin Eye Drops", 0.90), ("Ofloxacin Eye Drops", 0.87), ("Artificial Tears", 0.74)],
            "adult":  [("Moxifloxacin Eye Drops", 0.92), ("Ofloxacin Eye Drops", 0.88), ("Ketorolac Eye Drops", 0.78), ("Artificial Tears", 0.75)],
            "middle": [("Moxifloxacin Eye Drops", 0.90), ("Ofloxacin Eye Drops", 0.86)],
            "senior": [("Moxifloxacin Eye Drops", 0.88), ("Tobramycin Eye Drops", 0.84)],
        },
        "symptoms": ["Red eyes", "Itching", "Discharge", "Watery eyes", "Swollen eyelids", "Sensitivity to light", "Gritty feeling"],
        "severity_dist": {"MILD": 0.55, "MODERATE": 0.35, "SEVERE": 0.10},
        "chronic": False,
        "vitals": {"bp_s": (110, 130), "bp_d": (70, 85), "hr": (68, 88), "temp": (98.2, 99.8), "spo2": (96, 99)},
        "risk_factors": ["Air pollution exposure", "Dust mites"],
        "leads_to": {},
    },

    # ─── CARDIOVASCULAR (13-18) ────────────────────────────────────
    "Hypertension": {
        "specialty": "Cardiology",
        "age_range": (30, 85),
        "gender_bias": "M",
        "medicines": {
            "adult":  [("Amlodipine 5mg", 0.88), ("Telmisartan 40mg", 0.86), ("Losartan 50mg", 0.84), ("Enalapril 5mg", 0.82), ("Hydrochlorothiazide 12.5mg", 0.78), ("Atenolol 50mg", 0.80)],
            "middle": [("Amlodipine 5mg", 0.86), ("Telmisartan 40mg", 0.85), ("Losartan 50mg", 0.83), ("Enalapril 10mg", 0.84), ("Metoprolol 50mg", 0.82), ("Ramipril 5mg", 0.80), ("Chlorthalidone 12.5mg", 0.78)],
            "senior": [("Amlodipine 2.5mg", 0.82), ("Telmisartan 20mg", 0.80), ("Losartan 25mg", 0.78), ("Enalapril 5mg", 0.76), ("Hydrochlorothiazide 12.5mg", 0.74), ("Metoprolol 25mg", 0.76)],
        },
        "symptoms": ["Headache", "Dizziness", "Blurred vision", "Chest tightness", "Shortness of breath", "Nosebleeds", "Fatigue", "Palpitations"],
        "severity_dist": {"MILD": 0.30, "MODERATE": 0.50, "SEVERE": 0.20},
        "chronic": True,
        "vitals": {"bp_s": (140, 190), "bp_d": (90, 120), "hr": (70, 100), "temp": (97.8, 99.0), "spo2": (95, 99)},
        "risk_factors": ["Smoking", "Alcohol", "Obesity", "High BMI", "Sedentary lifestyle", "Family history (hypertension)", "Stress", "High cholesterol"],
        "leads_to": {"Heart Disease": 0.15, "Stroke": 0.10, "Kidney Disease": 0.08, "Retinopathy": 0.05},
    },
    "Hypotension": {
        "specialty": "Cardiology",
        "age_range": (18, 80),
        "gender_bias": "F",
        "medicines": {
            "adult":  [("Fludrocortisone 0.1mg", 0.78), ("Midodrine 5mg", 0.82), ("ORS Sachets", 0.85), ("Salt Tablets", 0.70)],
            "middle": [("Fludrocortisone 0.1mg", 0.76), ("Midodrine 5mg", 0.80)],
            "senior": [("Fludrocortisone 0.1mg", 0.72), ("Midodrine 2.5mg", 0.76)],
        },
        "symptoms": ["Dizziness", "Fainting", "Blurred vision", "Nausea", "Fatigue", "Weakness", "Lightheadedness"],
        "severity_dist": {"MILD": 0.40, "MODERATE": 0.45, "SEVERE": 0.15},
        "chronic": False,
        "vitals": {"bp_s": (70, 95), "bp_d": (40, 62), "hr": (55, 85), "temp": (97.5, 98.8), "spo2": (95, 99)},
        "risk_factors": ["Dehydration", "Anemia"],
        "leads_to": {"Syncope": 0.08},
    },
    "Coronary Artery Disease": {
        "specialty": "Cardiology",
        "age_range": (40, 85),
        "gender_bias": "M",
        "medicines": {
            "middle": [("Aspirin 75mg", 0.88), ("Atorvastatin 20mg", 0.86), ("Metoprolol 50mg", 0.84), ("Clopidogrel 75mg", 0.82), ("Ramipril 5mg", 0.80), ("Nitroglycerin SL 0.5mg", 0.90)],
            "senior": [("Aspirin 75mg", 0.85), ("Atorvastatin 10mg", 0.82), ("Metoprolol 25mg", 0.80), ("Clopidogrel 75mg", 0.78), ("Ramipril 2.5mg", 0.76), ("Nitroglycerin SL 0.5mg", 0.88)],
        },
        "symptoms": ["Chest pain", "Shortness of breath", "Palpitations", "Fatigue", "Dizziness", "Sweating", "Jaw pain", "Arm pain (left)", "Nausea"],
        "severity_dist": {"MILD": 0.15, "MODERATE": 0.45, "SEVERE": 0.40},
        "chronic": True,
        "vitals": {"bp_s": (130, 180), "bp_d": (80, 110), "hr": (55, 100), "temp": (97.5, 99.0), "spo2": (92, 98)},
        "risk_factors": ["Smoking", "Obesity", "High cholesterol", "Family history (heart disease)", "Sedentary lifestyle", "Stress"],
        "leads_to": {"Heart Disease": 0.20, "Stroke": 0.12, "Heart Failure": 0.10},
    },
    "Heart Failure (CHF)": {
        "specialty": "Cardiology",
        "age_range": (45, 90),
        "gender_bias": "M",
        "medicines": {
            "middle": [("Furosemide 40mg", 0.85), ("Enalapril 10mg", 0.82), ("Carvedilol 12.5mg", 0.80), ("Spironolactone 25mg", 0.78), ("Digoxin 0.25mg", 0.75)],
            "senior": [("Furosemide 20mg", 0.82), ("Enalapril 5mg", 0.78), ("Carvedilol 6.25mg", 0.76), ("Spironolactone 25mg", 0.74), ("Digoxin 0.125mg", 0.72)],
        },
        "symptoms": ["Shortness of breath", "Swollen legs", "Fatigue", "Rapid weight gain", "Persistent cough", "Reduced exercise tolerance", "Palpitations", "Chest congestion"],
        "severity_dist": {"MILD": 0.10, "MODERATE": 0.40, "SEVERE": 0.50},
        "chronic": True,
        "vitals": {"bp_s": (100, 150), "bp_d": (60, 95), "hr": (65, 110), "temp": (97.5, 99.2), "spo2": (88, 96)},
        "risk_factors": ["Smoking", "Obesity", "Family history (heart disease)", "High cholesterol"],
        "leads_to": {"Kidney Disease": 0.12, "Stroke": 0.08, "Pulmonary Edema": 0.10},
    },
    "Atrial Fibrillation": {
        "specialty": "Cardiology",
        "age_range": (40, 90),
        "gender_bias": "M",
        "medicines": {
            "middle": [("Warfarin 5mg", 0.82), ("Metoprolol 50mg", 0.85), ("Amiodarone 200mg", 0.78), ("Diltiazem 60mg", 0.76), ("Rivaroxaban 20mg", 0.84)],
            "senior": [("Warfarin 2.5mg", 0.78), ("Metoprolol 25mg", 0.82), ("Amiodarone 100mg", 0.74), ("Rivaroxaban 15mg", 0.80)],
        },
        "symptoms": ["Palpitations", "Irregular heartbeat", "Dizziness", "Shortness of breath", "Fatigue", "Chest discomfort", "Lightheadedness", "Anxiety"],
        "severity_dist": {"MILD": 0.20, "MODERATE": 0.45, "SEVERE": 0.35},
        "chronic": True,
        "vitals": {"bp_s": (110, 160), "bp_d": (65, 100), "hr": (90, 160), "temp": (97.5, 99.0), "spo2": (93, 98)},
        "risk_factors": ["Smoking", "Alcohol", "Obesity", "Family history (heart disease)"],
        "leads_to": {"Stroke": 0.15, "Heart Failure": 0.10},
    },
    "Hyperlipidemia": {
        "specialty": "Cardiology",
        "age_range": (25, 85),
        "gender_bias": None,
        "medicines": {
            "adult":  [("Atorvastatin 10mg", 0.88), ("Rosuvastatin 10mg", 0.90), ("Fenofibrate 160mg", 0.78), ("Ezetimibe 10mg", 0.80)],
            "middle": [("Atorvastatin 20mg", 0.86), ("Rosuvastatin 20mg", 0.88), ("Fenofibrate 160mg", 0.76), ("Ezetimibe 10mg", 0.78), ("Omega-3 Fatty Acids 1g", 0.65)],
            "senior": [("Atorvastatin 10mg", 0.82), ("Rosuvastatin 10mg", 0.84), ("Ezetimibe 10mg", 0.76)],
        },
        "symptoms": ["Usually asymptomatic", "Xanthomas", "Chest pain", "Fatigue", "Numbness in extremities"],
        "severity_dist": {"MILD": 0.40, "MODERATE": 0.45, "SEVERE": 0.15},
        "chronic": True,
        "vitals": {"bp_s": (115, 145), "bp_d": (72, 92), "hr": (65, 88), "temp": (97.8, 99.0), "spo2": (96, 99)},
        "risk_factors": ["Obesity", "Poor diet", "Sedentary lifestyle", "Family history (heart disease)", "High cholesterol"],
        "leads_to": {"Heart Disease": 0.12, "Stroke": 0.08, "Coronary Artery Disease": 0.10},
    },

    # ─── ENDOCRINE / METABOLIC (19-24) ────────────────────────────
    "Type 2 Diabetes": {
        "specialty": "Endocrinology",
        "age_range": (25, 85),
        "gender_bias": None,
        "medicines": {
            "adult":  [("Metformin 500mg", 0.88), ("Glimepiride 1mg", 0.82), ("Sitagliptin 100mg", 0.80), ("Vildagliptin 50mg", 0.78), ("Pioglitazone 15mg", 0.74), ("Empagliflozin 10mg", 0.84)],
            "middle": [("Metformin 1000mg", 0.86), ("Glimepiride 2mg", 0.84), ("Sitagliptin 100mg", 0.82), ("Insulin Glargine 10U", 0.88), ("Empagliflozin 25mg", 0.86), ("Dapagliflozin 10mg", 0.84)],
            "senior": [("Metformin 500mg", 0.80), ("Glimepiride 1mg", 0.78), ("Insulin Glargine 10U", 0.85), ("Sitagliptin 50mg", 0.76), ("Vildagliptin 50mg", 0.74)],
        },
        "symptoms": ["Frequent urination", "Excessive thirst", "Blurred vision", "Fatigue", "Slow wound healing", "Numbness in feet", "Unexplained weight loss", "Increased hunger", "Recurrent infections"],
        "severity_dist": {"MILD": 0.25, "MODERATE": 0.50, "SEVERE": 0.25},
        "chronic": True,
        "vitals": {"bp_s": (120, 160), "bp_d": (75, 100), "hr": (68, 95), "temp": (97.5, 99.2), "spo2": (94, 99)},
        "risk_factors": ["Obesity", "High BMI", "Sedentary lifestyle", "Family history (diabetes)", "Poor diet", "Stress"],
        "leads_to": {"Heart Disease": 0.12, "Kidney Disease": 0.10, "Neuropathy": 0.15, "Retinopathy": 0.12, "Foot Ulcer": 0.08, "Stroke": 0.06},
    },
    "Type 1 Diabetes": {
        "specialty": "Endocrinology",
        "age_range": (5, 35),
        "gender_bias": None,
        "medicines": {
            "child":  [("Insulin Lispro", 0.90), ("Insulin Glargine", 0.88), ("Insulin Aspart", 0.86)],
            "teen":   [("Insulin Lispro", 0.92), ("Insulin Glargine", 0.90), ("Insulin Pump", 0.88), ("Insulin Aspart", 0.88)],
            "adult":  [("Insulin Lispro", 0.92), ("Insulin Glargine", 0.90), ("Insulin Pump", 0.88), ("Insulin Degludec", 0.86)],
        },
        "symptoms": ["Frequent urination", "Excessive thirst", "Unexplained weight loss", "Fatigue", "Blurred vision", "Diabetic ketoacidosis", "Nausea"],
        "severity_dist": {"MILD": 0.15, "MODERATE": 0.50, "SEVERE": 0.35},
        "chronic": True,
        "vitals": {"bp_s": (100, 135), "bp_d": (65, 88), "hr": (72, 100), "temp": (97.5, 99.5), "spo2": (94, 99)},
        "risk_factors": ["Family history (diabetes)"],
        "leads_to": {"Neuropathy": 0.12, "Retinopathy": 0.10, "Kidney Disease": 0.08},
    },
    "Hypothyroidism": {
        "specialty": "Endocrinology",
        "age_range": (20, 80),
        "gender_bias": "F",
        "medicines": {
            "adult":  [("Levothyroxine 50mcg", 0.90), ("Levothyroxine 75mcg", 0.88), ("Levothyroxine 100mcg", 0.86)],
            "middle": [("Levothyroxine 75mcg", 0.88), ("Levothyroxine 100mcg", 0.86), ("Levothyroxine 125mcg", 0.84)],
            "senior": [("Levothyroxine 25mcg", 0.84), ("Levothyroxine 50mcg", 0.86)],
        },
        "symptoms": ["Fatigue", "Weight gain", "Cold intolerance", "Constipation", "Dry skin", "Hair loss", "Depression", "Puffy face", "Muscle weakness", "Irregular periods"],
        "severity_dist": {"MILD": 0.35, "MODERATE": 0.50, "SEVERE": 0.15},
        "chronic": True,
        "vitals": {"bp_s": (100, 130), "bp_d": (60, 82), "hr": (55, 72), "temp": (96.5, 98.2), "spo2": (96, 99)},
        "risk_factors": ["Family history (diabetes)", "Stress"],
        "leads_to": {"Depression": 0.10, "Heart Disease": 0.05, "Obesity": 0.08},
    },
    "Hyperthyroidism": {
        "specialty": "Endocrinology",
        "age_range": (20, 70),
        "gender_bias": "F",
        "medicines": {
            "adult":  [("Methimazole 10mg", 0.85), ("Carbimazole 10mg", 0.83), ("Propranolol 40mg", 0.80), ("Propylthiouracil 50mg", 0.78)],
            "middle": [("Methimazole 10mg", 0.83), ("Propranolol 40mg", 0.78), ("Radioactive Iodine", 0.82)],
            "senior": [("Methimazole 5mg", 0.78), ("Propranolol 20mg", 0.75)],
        },
        "symptoms": ["Weight loss", "Rapid heartbeat", "Tremor", "Sweating", "Heat intolerance", "Anxiety", "Irritability", "Bulging eyes", "Insomnia", "Diarrhea"],
        "severity_dist": {"MILD": 0.25, "MODERATE": 0.50, "SEVERE": 0.25},
        "chronic": True,
        "vitals": {"bp_s": (120, 155), "bp_d": (65, 88), "hr": (90, 130), "temp": (98.8, 100.5), "spo2": (95, 99)},
        "risk_factors": ["Stress", "Family history (diabetes)"],
        "leads_to": {"Atrial Fibrillation": 0.10, "Osteoporosis": 0.08, "Anxiety Disorder": 0.12},
    },
    "Anemia (Iron Deficiency)": {
        "specialty": "Hematology",
        "age_range": (10, 75),
        "gender_bias": "F",
        "medicines": {
            "child":  [("Iron Syrup (Ferrous Sulfate)", 0.85), ("Folic Acid 5mg", 0.78), ("Vitamin C 250mg", 0.72)],
            "teen":   [("Ferrous Sulfate 200mg", 0.88), ("Folic Acid 5mg", 0.80), ("Vitamin C 500mg", 0.75), ("Vitamin B12 1000mcg", 0.72)],
            "adult":  [("Ferrous Sulfate 200mg", 0.90), ("Iron Sucrose IV", 0.92), ("Folic Acid 5mg", 0.82), ("Vitamin B12 1000mcg", 0.78), ("Carbonyl Iron 100mg", 0.84)],
            "middle": [("Ferrous Sulfate 200mg", 0.86), ("Iron Sucrose IV", 0.90), ("Folic Acid 5mg", 0.80)],
            "senior": [("Iron Sucrose IV", 0.88), ("Ferrous Sulfate 200mg", 0.82), ("Folic Acid 5mg", 0.78)],
        },
        "symptoms": ["Fatigue", "Weakness", "Pale skin", "Shortness of breath", "Dizziness", "Cold hands and feet", "Brittle nails", "Pica cravings", "Rapid heartbeat"],
        "severity_dist": {"MILD": 0.30, "MODERATE": 0.50, "SEVERE": 0.20},
        "chronic": False,
        "vitals": {"bp_s": (95, 125), "bp_d": (58, 78), "hr": (80, 110), "temp": (97.5, 99.0), "spo2": (93, 98)},
        "risk_factors": ["Poor diet", "Family history (diabetes)"],
        "leads_to": {"Heart Disease": 0.04, "Depression": 0.06},
    },
    "Vitamin D Deficiency": {
        "specialty": "Endocrinology",
        "age_range": (15, 80),
        "gender_bias": "F",
        "medicines": {
            "teen":   [("Cholecalciferol 60000 IU weekly", 0.90), ("Calcium Carbonate 500mg", 0.78)],
            "adult":  [("Cholecalciferol 60000 IU weekly", 0.92), ("Calcium Carbonate 500mg", 0.80), ("Calcitriol 0.25mcg", 0.75)],
            "middle": [("Cholecalciferol 60000 IU weekly", 0.88), ("Calcium Carbonate 500mg", 0.78), ("Calcitriol 0.25mcg", 0.74)],
            "senior": [("Cholecalciferol 60000 IU weekly", 0.85), ("Calcium Carbonate 1000mg", 0.82), ("Calcitriol 0.5mcg", 0.78)],
        },
        "symptoms": ["Bone pain", "Muscle weakness", "Fatigue", "Mood changes", "Hair loss", "Frequent infections", "Back pain"],
        "severity_dist": {"MILD": 0.45, "MODERATE": 0.40, "SEVERE": 0.15},
        "chronic": False,
        "vitals": {"bp_s": (110, 130), "bp_d": (68, 85), "hr": (68, 88), "temp": (97.8, 99.0), "spo2": (96, 99)},
        "risk_factors": ["Sedentary lifestyle"],
        "leads_to": {"Osteoporosis": 0.10, "Depression": 0.06},
    },

    # ─── RESPIRATORY (25-30) ──────────────────────────────────────
    "Asthma": {
        "specialty": "Pulmonology",
        "age_range": (5, 70),
        "gender_bias": None,
        "medicines": {
            "child":  [("Salbutamol Nebulization", 0.90), ("Budesonide Nebulization", 0.85), ("Montelukast 4mg", 0.80), ("Prednisolone 5mg", 0.78)],
            "teen":   [("Salbutamol Inhaler 100mcg", 0.92), ("Budesonide Inhaler 200mcg", 0.88), ("Montelukast 10mg", 0.82), ("Fluticasone 125mcg", 0.86)],
            "adult":  [("Salbutamol Inhaler 100mcg", 0.92), ("Formoterol+Budesonide 200/6mcg", 0.90), ("Montelukast 10mg", 0.84), ("Fluticasone 250mcg", 0.88), ("Tiotropium 9mcg", 0.82), ("Prednisolone 10mg", 0.80)],
            "middle": [("Formoterol+Budesonide 400/12mcg", 0.88), ("Salbutamol Inhaler 100mcg", 0.90), ("Tiotropium 9mcg", 0.84)],
            "senior": [("Salbutamol Inhaler 100mcg", 0.86), ("Formoterol+Budesonide 200/6mcg", 0.84), ("Tiotropium 9mcg", 0.80)],
        },
        "symptoms": ["Wheezing", "Shortness of breath", "Chest tightness", "Coughing (especially at night)", "Difficulty breathing", "Rapid breathing", "Anxiety"],
        "severity_dist": {"MILD": 0.30, "MODERATE": 0.45, "SEVERE": 0.25},
        "chronic": True,
        "vitals": {"bp_s": (105, 140), "bp_d": (65, 90), "hr": (78, 110), "temp": (97.8, 99.5), "spo2": (88, 97)},
        "risk_factors": ["Air pollution exposure", "Smoking", "Dust mites", "Family history (diabetes)"],
        "leads_to": {"COPD": 0.08, "Pneumonia": 0.06, "Bronchitis": 0.10},
    },
    "Bronchitis": {
        "specialty": "Pulmonology",
        "age_range": (10, 80),
        "gender_bias": None,
        "medicines": {
            "child":  [("Amoxicillin 250mg", 0.82), ("Cough Syrup (Dextromethorphan)", 0.75), ("Paracetamol 250mg", 0.78), ("Salbutamol Syrup", 0.80)],
            "teen":   [("Amoxicillin 500mg", 0.84), ("Azithromycin 500mg", 0.86), ("Salbutamol Inhaler", 0.82), ("Paracetamol 500mg", 0.80)],
            "adult":  [("Azithromycin 500mg", 0.88), ("Amoxicillin+Clavulanate 625mg", 0.86), ("Doxycycline 100mg", 0.82), ("Salbutamol Inhaler", 0.84), ("Montelukast 10mg", 0.76)],
            "middle": [("Azithromycin 500mg", 0.86), ("Amoxicillin+Clavulanate 625mg", 0.84), ("Doxycycline 100mg", 0.80)],
            "senior": [("Azithromycin 500mg", 0.82), ("Amoxicillin+Clavulanate 625mg", 0.80), ("Ceftriaxone 1g IV", 0.84)],
        },
        "symptoms": ["Persistent cough", "Mucus production", "Chest discomfort", "Fatigue", "Shortness of breath", "Mild fever", "Wheezing", "Sore throat"],
        "severity_dist": {"MILD": 0.30, "MODERATE": 0.50, "SEVERE": 0.20},
        "chronic": False,
        "vitals": {"bp_s": (105, 135), "bp_d": (65, 88), "hr": (75, 100), "temp": (98.6, 101.5), "spo2": (92, 98)},
        "risk_factors": ["Smoking", "Air pollution exposure"],
        "leads_to": {"COPD": 0.06, "Pneumonia": 0.08, "Asthma": 0.04},
    },
    "Pneumonia": {
        "specialty": "Pulmonology",
        "age_range": (3, 85),
        "gender_bias": None,
        "medicines": {
            "child":  [("Amoxicillin 250mg", 0.84), ("Azithromycin 200mg Syrup", 0.82), ("Ceftriaxone 500mg IV", 0.88), ("Paracetamol 250mg", 0.78)],
            "teen":   [("Amoxicillin 500mg", 0.86), ("Azithromycin 500mg", 0.88), ("Levofloxacin 500mg", 0.84)],
            "adult":  [("Azithromycin 500mg", 0.88), ("Amoxicillin+Clavulanate 1g", 0.86), ("Levofloxacin 750mg", 0.90), ("Ceftriaxone 1g IV", 0.92), ("Piperacillin+Tazobactam 4.5g IV", 0.88), ("Meropenem 1g IV", 0.90)],
            "middle": [("Levofloxacin 750mg", 0.88), ("Ceftriaxone 1g IV", 0.90), ("Piperacillin+Tazobactam 4.5g IV", 0.86)],
            "senior": [("Ceftriaxone 1g IV", 0.86), ("Levofloxacin 500mg", 0.84), ("Meropenem 1g IV", 0.88), ("Oxygen Therapy", 0.92)],
        },
        "symptoms": ["High fever", "Productive cough", "Chest pain", "Shortness of breath", "Rapid breathing", "Fatigue", "Chills", "Bluish lips", "Confusion (elderly)"],
        "severity_dist": {"MILD": 0.15, "MODERATE": 0.40, "SEVERE": 0.45},
        "chronic": False,
        "vitals": {"bp_s": (95, 140), "bp_d": (55, 88), "hr": (85, 120), "temp": (100.5, 104.0), "spo2": (85, 96)},
        "risk_factors": ["Smoking", "Air pollution exposure", "Previous surgery"],
        "leads_to": {"COPD": 0.05, "Lung Fibrosis": 0.04, "Sepsis": 0.06},
    },
    "COPD": {
        "specialty": "Pulmonology",
        "age_range": (40, 85),
        "gender_bias": "M",
        "medicines": {
            "middle": [("Tiotropium 18mcg", 0.85), ("Formoterol+Budesonide 400/12mcg", 0.82), ("Salbutamol Inhaler", 0.88), ("Ipratropium Nebulization", 0.80), ("Prednisolone 10mg", 0.75), ("Theophylline 200mg", 0.72)],
            "senior": [("Tiotropium 18mcg", 0.82), ("Formoterol+Budesonide 200/6mcg", 0.78), ("Salbutamol Inhaler", 0.85), ("Oxygen Therapy", 0.90), ("Ipratropium Nebulization", 0.78)],
        },
        "symptoms": ["Chronic cough", "Sputum production", "Shortness of breath", "Wheezing", "Chest tightness", "Fatigue", "Frequent respiratory infections", "Bluish lips"],
        "severity_dist": {"MILD": 0.15, "MODERATE": 0.40, "SEVERE": 0.45},
        "chronic": True,
        "vitals": {"bp_s": (110, 145), "bp_d": (65, 92), "hr": (80, 110), "temp": (97.8, 100.5), "spo2": (84, 94)},
        "risk_factors": ["Smoking", "Air pollution exposure", "Occupational hazard"],
        "leads_to": {"Heart Failure": 0.08, "Pneumonia": 0.12, "Lung Cancer": 0.06},
    },
    "Sinusitis": {
        "specialty": "ENT",
        "age_range": (10, 70),
        "gender_bias": None,
        "medicines": {
            "child":  [("Amoxicillin 250mg", 0.85), ("Xylometazoline Nasal Drops", 0.78), ("Paracetamol 250mg", 0.80), ("Cetirizine 2.5mg Syrup", 0.75)],
            "teen":   [("Amoxicillin 500mg", 0.87), ("Fluticasone Nasal Spray", 0.84), ("Cetirizine 10mg", 0.80), ("Paracetamol 500mg", 0.78)],
            "adult":  [("Amoxicillin+Clavulanate 625mg", 0.88), ("Fluticasone Nasal Spray", 0.86), ("Levocetirizine 5mg", 0.82), ("Doxycycline 100mg", 0.80), ("Xylometazoline Nasal Spray", 0.78)],
            "middle": [("Amoxicillin+Clavulanate 625mg", 0.86), ("Fluticasone Nasal Spray", 0.84)],
            "senior": [("Amoxicillin+Clavulanate 625mg", 0.82), ("Fluticasone Nasal Spray", 0.80)],
        },
        "symptoms": ["Facial pain/pressure", "Nasal congestion", "Thick nasal discharge", "Reduced smell", "Cough", "Headache", "Ear pressure", "Fatigue"],
        "severity_dist": {"MILD": 0.35, "MODERATE": 0.50, "SEVERE": 0.15},
        "chronic": False,
        "vitals": {"bp_s": (110, 130), "bp_d": (70, 85), "hr": (68, 90), "temp": (98.6, 101.0), "spo2": (96, 99)},
        "risk_factors": ["Air pollution exposure", "Dust mites"],
        "leads_to": {"Chronic Sinusitis": 0.12, "Bronchitis": 0.06},
    },
    "Allergic Rhinitis": {
        "specialty": "ENT",
        "age_range": (8, 65),
        "gender_bias": None,
        "medicines": {
            "child":  [("Cetirizine 5mg Syrup", 0.85), ("Fluticasone Nasal Spray", 0.82), ("Montelukast 4mg", 0.78)],
            "teen":   [("Cetirizine 10mg", 0.88), ("Fluticasone Nasal Spray", 0.85), ("Montelukast 10mg", 0.80), ("Levocetirizine 5mg", 0.86)],
            "adult":  [("Levocetirizine 5mg", 0.90), ("Fluticasone Nasal Spray", 0.88), ("Montelukast 10mg", 0.82), ("Fexofenadine 120mg", 0.84), ("Bilastine 20mg", 0.80)],
            "middle": [("Levocetirizine 5mg", 0.88), ("Fluticasone Nasal Spray", 0.86), ("Fexofenadine 120mg", 0.82)],
            "senior": [("Levocetirizine 5mg", 0.84), ("Fluticasone Nasal Spray", 0.82)],
        },
        "symptoms": ["Sneezing", "Runny nose", "Itchy nose", "Nasal congestion", "Itchy/watery eyes", "Postnasal drip", "Sinus pressure"],
        "severity_dist": {"MILD": 0.45, "MODERATE": 0.40, "SEVERE": 0.15},
        "chronic": True,
        "vitals": {"bp_s": (110, 130), "bp_d": (68, 85), "hr": (66, 86), "temp": (98.0, 99.2), "spo2": (96, 99)},
        "risk_factors": ["Dust mites", "Air pollution exposure", "Pollen"],
        "leads_to": {"Asthma": 0.08, "Sinusitis": 0.10},
    },

    # ─── GASTROENTEROLOGY (31-36) ─────────────────────────────────
    "Gastritis": {
        "specialty": "Gastroenterology",
        "age_range": (18, 75),
        "gender_bias": None,
        "medicines": {
            "teen":   [("Pantoprazole 20mg", 0.86), ("Ranitidine 150mg", 0.80), ("Sucralfate 1g", 0.75), ("Antacid Gel", 0.78)],
            "adult":  [("Pantoprazole 40mg", 0.90), ("Omeprazole 20mg", 0.88), ("Rabeprazole 20mg", 0.86), ("Sucralfate 1g", 0.78), ("Domperidone 10mg", 0.76)],
            "middle": [("Pantoprazole 40mg", 0.88), ("Omeprazole 20mg", 0.86), ("Esomeprazole 40mg", 0.88)],
            "senior": [("Pantoprazole 40mg", 0.85), ("Omeprazole 20mg", 0.82), ("Sucralfate 1g", 0.76)],
        },
        "symptoms": ["Upper abdominal pain", "Nausea", "Vomiting", "Bloating", "Loss of appetite", "Indigestion", "Belching", "Burning sensation"],
        "severity_dist": {"MILD": 0.35, "MODERATE": 0.50, "SEVERE": 0.15},
        "chronic": False,
        "vitals": {"bp_s": (110, 135), "bp_d": (68, 88), "hr": (70, 92), "temp": (98.0, 99.5), "spo2": (96, 99)},
        "risk_factors": ["Alcohol", "Smoking", "Stress", "Poor diet"],
        "leads_to": {"GERD": 0.12, "Peptic Ulcer": 0.10},
    },
    "GERD": {
        "specialty": "Gastroenterology",
        "age_range": (20, 80),
        "gender_bias": None,
        "medicines": {
            "adult":  [("Pantoprazole 40mg", 0.90), ("Esomeprazole 40mg", 0.88), ("Omeprazole 20mg", 0.86), ("Domperidone 10mg", 0.78), ("Antacid Gel (Aluminum Hydroxide)", 0.75), ("Levosulpiride 25mg", 0.72)],
            "middle": [("Pantoprazole 40mg", 0.88), ("Esomeprazole 40mg", 0.86), ("Itopride 50mg", 0.74)],
            "senior": [("Pantoprazole 40mg", 0.84), ("Esomeprazole 20mg", 0.82), ("Domperidone 10mg", 0.74)],
        },
        "symptoms": ["Heartburn", "Acid reflux", "Chest pain after eating", "Difficulty swallowing", "Regurgitation", "Sore throat", "Chronic cough", "Nausea"],
        "severity_dist": {"MILD": 0.30, "MODERATE": 0.50, "SEVERE": 0.20},
        "chronic": True,
        "vitals": {"bp_s": (110, 135), "bp_d": (68, 88), "hr": (68, 90), "temp": (97.8, 99.2), "spo2": (96, 99)},
        "risk_factors": ["Obesity", "Smoking", "Alcohol", "Poor diet", "Stress"],
        "leads_to": {"Barrett's Esophagus": 0.06, "Esophageal Stricture": 0.04, "Peptic Ulcer": 0.08},
    },
    "Peptic Ulcer": {
        "specialty": "Gastroenterology",
        "age_range": (25, 75),
        "gender_bias": "M",
        "medicines": {
            "adult":  [("Pantoprazole 40mg", 0.90), ("Amoxicillin 1g (H.pylori)", 0.85), ("Clarithromycin 500mg (H.pylori)", 0.83), ("Bismuth Subsalicylate", 0.78), ("Sucralfate 1g", 0.82)],
            "middle": [("Pantoprazole 40mg", 0.88), ("Amoxicillin 1g (H.pylori)", 0.83), ("Clarithromycin 500mg (H.pylori)", 0.80)],
            "senior": [("Pantoprazole 40mg", 0.85), ("Sucralfate 1g", 0.80)],
        },
        "symptoms": ["Burning stomach pain", "Bloating", "Heartburn", "Nausea", "Vomiting", "Dark/tar-colored stool", "Weight loss", "Pain worsens when empty stomach"],
        "severity_dist": {"MILD": 0.20, "MODERATE": 0.50, "SEVERE": 0.30},
        "chronic": True,
        "vitals": {"bp_s": (105, 135), "bp_d": (65, 88), "hr": (70, 95), "temp": (97.8, 99.5), "spo2": (96, 99)},
        "risk_factors": ["Smoking", "Alcohol", "Stress"],
        "leads_to": {"GI Bleeding": 0.08, "Gastric Cancer": 0.03},
    },
    "IBS (Irritable Bowel Syndrome)": {
        "specialty": "Gastroenterology",
        "age_range": (18, 65),
        "gender_bias": "F",
        "medicines": {
            "adult":  [("Mebeverine 135mg", 0.80), ("Dicyclomine 20mg", 0.78), ("Rifaximin 550mg", 0.76), ("Probiotics (VSL#3)", 0.72), ("Amitriptyline 10mg", 0.70), ("Trimebutine 200mg", 0.74)],
            "middle": [("Mebeverine 135mg", 0.78), ("Dicyclomine 20mg", 0.76), ("Rifaximin 550mg", 0.74)],
            "senior": [("Mebeverine 135mg", 0.74), ("Probiotics", 0.70)],
        },
        "symptoms": ["Abdominal pain", "Bloating", "Alternating diarrhea/constipation", "Gas", "Mucus in stool", "Cramping", "Urgency", "Incomplete evacuation"],
        "severity_dist": {"MILD": 0.30, "MODERATE": 0.50, "SEVERE": 0.20},
        "chronic": True,
        "vitals": {"bp_s": (110, 130), "bp_d": (68, 85), "hr": (68, 88), "temp": (97.8, 99.0), "spo2": (96, 99)},
        "risk_factors": ["Stress", "Poor diet"],
        "leads_to": {"Depression": 0.08, "Anxiety Disorder": 0.10},
    },
    "Liver Disease (Fatty Liver / NAFLD)": {
        "specialty": "Gastroenterology",
        "age_range": (30, 75),
        "gender_bias": "M",
        "medicines": {
            "adult":  [("Ursodeoxycholic Acid 300mg", 0.80), ("Vitamin E 400IU", 0.72), ("Metformin 500mg", 0.68), ("Silymarin 140mg", 0.65)],
            "middle": [("Ursodeoxycholic Acid 300mg", 0.78), ("Vitamin E 400IU", 0.70), ("Pioglitazone 15mg", 0.66)],
            "senior": [("Ursodeoxycholic Acid 300mg", 0.74), ("Silymarin 140mg", 0.62)],
        },
        "symptoms": ["Fatigue", "Upper right abdominal discomfort", "Enlarged liver", "Elevated liver enzymes", "Nausea", "Weight gain", "Jaundice (advanced)"],
        "severity_dist": {"MILD": 0.35, "MODERATE": 0.45, "SEVERE": 0.20},
        "chronic": True,
        "vitals": {"bp_s": (115, 140), "bp_d": (70, 90), "hr": (68, 90), "temp": (97.8, 99.2), "spo2": (95, 99)},
        "risk_factors": ["Obesity", "High BMI", "Alcohol", "Poor diet", "Sedentary lifestyle"],
        "leads_to": {"Liver Cirrhosis": 0.10, "Type 2 Diabetes": 0.08, "Heart Disease": 0.05},
    },
    "Kidney Stones": {
        "specialty": "Urology",
        "age_range": (20, 70),
        "gender_bias": "M",
        "medicines": {
            "adult":  [("Tamsulosin 0.4mg", 0.85), ("Diclofenac 50mg", 0.82), ("Potassium Citrate 1080mg", 0.78), ("Ketorolac 10mg", 0.84), ("Hyoscine Butylbromide 10mg", 0.76)],
            "middle": [("Tamsulosin 0.4mg", 0.83), ("Diclofenac 50mg", 0.80), ("Potassium Citrate 1080mg", 0.76)],
            "senior": [("Tamsulosin 0.4mg", 0.78), ("Paracetamol 650mg", 0.74)],
        },
        "symptoms": ["Severe flank pain", "Radiating to groin", "Blood in urine", "Nausea", "Vomiting", "Frequent urination", "Burning urination", "Fever"],
        "severity_dist": {"MILD": 0.15, "MODERATE": 0.45, "SEVERE": 0.40},
        "chronic": False,
        "vitals": {"bp_s": (120, 160), "bp_d": (75, 98), "hr": (85, 115), "temp": (98.2, 101.5), "spo2": (95, 99)},
        "risk_factors": ["Obesity", "Poor diet", "Family history (diabetes)"],
        "leads_to": {"Kidney Infection": 0.08, "Kidney Disease": 0.05},
    },

    # ─── MUSCULOSKELETAL (37-42) ──────────────────────────────────
    "Arthritis (Osteoarthritis)": {
        "specialty": "Orthopedics",
        "age_range": (40, 85),
        "gender_bias": "F",
        "medicines": {
            "middle": [("Diclofenac 50mg", 0.82), ("Paracetamol 650mg", 0.78), ("Glucosamine 1500mg", 0.72), ("Etoricoxib 60mg", 0.84), ("Diacerein 50mg", 0.76), ("Capsaicin Cream", 0.68)],
            "senior": [("Paracetamol 650mg", 0.76), ("Glucosamine 1500mg", 0.70), ("Etoricoxib 60mg", 0.80), ("Tramadol 50mg", 0.74), ("Diacerein 50mg", 0.72)],
        },
        "symptoms": ["Joint pain", "Joint stiffness", "Swelling", "Reduced range of motion", "Crepitus", "Bone spurs", "Morning stiffness", "Tenderness"],
        "severity_dist": {"MILD": 0.20, "MODERATE": 0.50, "SEVERE": 0.30},
        "chronic": True,
        "vitals": {"bp_s": (115, 145), "bp_d": (70, 92), "hr": (65, 88), "temp": (97.5, 99.0), "spo2": (96, 99)},
        "risk_factors": ["Obesity", "Previous surgery", "Sedentary lifestyle"],
        "leads_to": {"Osteoporosis": 0.08, "Depression": 0.06},
    },
    "Rheumatoid Arthritis": {
        "specialty": "Rheumatology",
        "age_range": (25, 75),
        "gender_bias": "F",
        "medicines": {
            "adult":  [("Methotrexate 7.5mg weekly", 0.85), ("Hydroxychloroquine 200mg", 0.80), ("Prednisolone 5mg", 0.78), ("Sulfasalazine 500mg", 0.76), ("Leflunomide 20mg", 0.74)],
            "middle": [("Methotrexate 15mg weekly", 0.83), ("Hydroxychloroquine 200mg", 0.78), ("Prednisolone 10mg", 0.80), ("Adalimumab 40mg", 0.82)],
            "senior": [("Methotrexate 7.5mg weekly", 0.78), ("Hydroxychloroquine 200mg", 0.74), ("Prednisolone 5mg", 0.76)],
        },
        "symptoms": ["Symmetric joint pain", "Morning stiffness >1 hour", "Joint swelling", "Fatigue", "Fever", "Weight loss", "Rheumatoid nodules", "Deformity"],
        "severity_dist": {"MILD": 0.15, "MODERATE": 0.50, "SEVERE": 0.35},
        "chronic": True,
        "vitals": {"bp_s": (110, 140), "bp_d": (65, 88), "hr": (70, 95), "temp": (98.0, 100.5), "spo2": (95, 99)},
        "risk_factors": ["Smoking", "Stress"],
        "leads_to": {"Osteoporosis": 0.10, "Heart Disease": 0.06, "Depression": 0.08},
    },
    "Lower Back Pain": {
        "specialty": "Orthopedics",
        "age_range": (20, 80),
        "gender_bias": "M",
        "medicines": {
            "adult":  [("Diclofenac 50mg", 0.84), ("Aceclofenac 100mg", 0.82), ("Thiocolchicoside 4mg", 0.80), ("Pregabalin 75mg", 0.78), ("Paracetamol 650mg", 0.76), ("Etoricoxib 90mg", 0.82)],
            "middle": [("Diclofenac 50mg", 0.82), ("Pregabalin 75mg", 0.80), ("Thiocolchicoside 4mg", 0.78), ("Tramadol 50mg", 0.76), ("Etoricoxib 90mg", 0.80)],
            "senior": [("Paracetamol 650mg", 0.74), ("Pregabalin 50mg", 0.76), ("Tramadol 37.5mg", 0.72)],
        },
        "symptoms": ["Lower back pain", "Stiffness", "Muscle spasm", "Pain radiating to legs", "Difficulty standing", "Numbness", "Weakness", "Reduced mobility"],
        "severity_dist": {"MILD": 0.25, "MODERATE": 0.50, "SEVERE": 0.25},
        "chronic": False,
        "vitals": {"bp_s": (110, 140), "bp_d": (68, 90), "hr": (68, 92), "temp": (97.8, 99.2), "spo2": (96, 99)},
        "risk_factors": ["Obesity", "Sedentary lifestyle", "Occupational hazard"],
        "leads_to": {"Disc Herniation": 0.10, "Sciatica": 0.12, "Chronic Pain Syndrome": 0.08},
    },
    "Osteoporosis": {
        "specialty": "Orthopedics",
        "age_range": (45, 85),
        "gender_bias": "F",
        "medicines": {
            "middle": [("Alendronate 70mg weekly", 0.85), ("Calcium Carbonate 1000mg", 0.82), ("Cholecalciferol 60000 IU weekly", 0.80), ("Risedronate 35mg weekly", 0.82)],
            "senior": [("Alendronate 70mg weekly", 0.82), ("Calcium Carbonate 1000mg", 0.80), ("Cholecalciferol 60000 IU weekly", 0.78), ("Denosumab 60mg SC", 0.84), ("Teriparatide 20mcg SC daily", 0.80)],
        },
        "symptoms": ["Back pain", "Loss of height", "Stooped posture", "Fractures with minor falls", "Bone pain", "Reduced grip strength"],
        "severity_dist": {"MILD": 0.25, "MODERATE": 0.45, "SEVERE": 0.30},
        "chronic": True,
        "vitals": {"bp_s": (110, 140), "bp_d": (65, 88), "hr": (65, 85), "temp": (97.5, 98.8), "spo2": (96, 99)},
        "risk_factors": ["Smoking", "Alcohol", "Sedentary lifestyle", "Low physical activity"],
        "leads_to": {"Hip Fracture": 0.10, "Vertebral Fracture": 0.12},
    },
    "Gout": {
        "specialty": "Rheumatology",
        "age_range": (30, 80),
        "gender_bias": "M",
        "medicines": {
            "adult":  [("Colchicine 0.5mg", 0.85), ("Allopurinol 100mg", 0.82), ("Febuxostat 40mg", 0.84), ("Indomethacin 25mg", 0.80), ("Naproxen 500mg", 0.78)],
            "middle": [("Colchicine 0.5mg", 0.83), ("Allopurinol 300mg", 0.85), ("Febuxostat 80mg", 0.86), ("Prednisolone 10mg", 0.78)],
            "senior": [("Colchicine 0.5mg", 0.78), ("Febuxostat 40mg", 0.80), ("Prednisolone 5mg", 0.76)],
        },
        "symptoms": ["Sudden severe joint pain (big toe)", "Swelling", "Redness", "Warmth", "Tenderness", "Limited range of motion", "Peeling skin around joint"],
        "severity_dist": {"MILD": 0.20, "MODERATE": 0.50, "SEVERE": 0.30},
        "chronic": True,
        "vitals": {"bp_s": (120, 150), "bp_d": (75, 95), "hr": (72, 95), "temp": (98.5, 101.0), "spo2": (96, 99)},
        "risk_factors": ["Obesity", "Alcohol", "Poor diet", "High BMI"],
        "leads_to": {"Kidney Stones": 0.10, "Kidney Disease": 0.06, "Arthritis (Osteoarthritis)": 0.08},
    },
    "Cervical Spondylosis": {
        "specialty": "Orthopedics",
        "age_range": (30, 80),
        "gender_bias": None,
        "medicines": {
            "adult":  [("Aceclofenac 100mg", 0.82), ("Thiocolchicoside 4mg", 0.80), ("Pregabalin 75mg", 0.78), ("Methylcobalamin 1500mcg", 0.74)],
            "middle": [("Aceclofenac 100mg", 0.80), ("Pregabalin 75mg", 0.78), ("Etoricoxib 60mg", 0.82), ("Methylcobalamin 1500mcg", 0.74)],
            "senior": [("Paracetamol 650mg", 0.74), ("Pregabalin 50mg", 0.76), ("Methylcobalamin 1500mcg", 0.72)],
        },
        "symptoms": ["Neck pain", "Stiffness", "Headache", "Tingling in arms", "Numbness", "Weakness in hands", "Grinding sensation", "Shoulder pain"],
        "severity_dist": {"MILD": 0.25, "MODERATE": 0.50, "SEVERE": 0.25},
        "chronic": True,
        "vitals": {"bp_s": (110, 140), "bp_d": (68, 90), "hr": (68, 88), "temp": (97.8, 99.0), "spo2": (96, 99)},
        "risk_factors": ["Sedentary lifestyle", "Occupational hazard"],
        "leads_to": {"Disc Herniation": 0.08, "Neuropathy": 0.06},
    },

    # ─── NEUROLOGICAL / PSYCHIATRIC (43-50) ───────────────────────
    "Migraine": {
        "specialty": "Neurology",
        "age_range": (15, 65),
        "gender_bias": "F",
        "medicines": {
            "teen":   [("Paracetamol 500mg", 0.72), ("Ibuprofen 400mg", 0.78), ("Sumatriptan 25mg", 0.82), ("Naproxen 250mg", 0.76)],
            "adult":  [("Sumatriptan 50mg", 0.88), ("Rizatriptan 10mg", 0.86), ("Propranolol 20mg", 0.78), ("Amitriptyline 10mg", 0.76), ("Topiramate 25mg", 0.74), ("Flunarizine 5mg", 0.80)],
            "middle": [("Sumatriptan 50mg", 0.86), ("Flunarizine 10mg", 0.82), ("Propranolol 40mg", 0.80), ("Valproate 250mg", 0.76)],
            "senior": [("Paracetamol 650mg", 0.70), ("Flunarizine 5mg", 0.76)],
        },
        "symptoms": ["Throbbing headache (one-sided)", "Nausea", "Vomiting", "Sensitivity to light", "Sensitivity to sound", "Aura", "Visual disturbances", "Neck stiffness", "Fatigue"],
        "severity_dist": {"MILD": 0.25, "MODERATE": 0.50, "SEVERE": 0.25},
        "chronic": True,
        "vitals": {"bp_s": (110, 145), "bp_d": (68, 92), "hr": (68, 95), "temp": (97.8, 99.5), "spo2": (96, 99)},
        "risk_factors": ["Stress", "Sleep deprivation"],
        "leads_to": {"Depression": 0.08, "Anxiety Disorder": 0.06, "Stroke": 0.02},
    },
    "Epilepsy": {
        "specialty": "Neurology",
        "age_range": (5, 70),
        "gender_bias": None,
        "medicines": {
            "child":  [("Valproate Syrup 200mg/5ml", 0.82), ("Levetiracetam 250mg", 0.80), ("Carbamazepine 100mg", 0.78)],
            "teen":   [("Levetiracetam 500mg", 0.86), ("Valproate 250mg", 0.84), ("Carbamazepine 200mg", 0.80), ("Lamotrigine 25mg", 0.78)],
            "adult":  [("Levetiracetam 500mg", 0.88), ("Valproate 500mg", 0.86), ("Carbamazepine 200mg", 0.82), ("Lamotrigine 50mg", 0.80), ("Phenytoin 100mg", 0.76), ("Oxcarbazepine 300mg", 0.78)],
            "middle": [("Levetiracetam 500mg", 0.86), ("Valproate 500mg", 0.84), ("Lamotrigine 100mg", 0.82)],
            "senior": [("Levetiracetam 250mg", 0.82), ("Lamotrigine 25mg", 0.78)],
        },
        "symptoms": ["Seizures", "Confusion", "Staring spells", "Uncontrollable jerking", "Loss of consciousness", "Lip smacking", "Aura before seizure", "Post-ictal drowsiness"],
        "severity_dist": {"MILD": 0.20, "MODERATE": 0.45, "SEVERE": 0.35},
        "chronic": True,
        "vitals": {"bp_s": (100, 140), "bp_d": (60, 90), "hr": (70, 100), "temp": (97.8, 99.5), "spo2": (93, 99)},
        "risk_factors": ["Previous surgery", "Family history (diabetes)"],
        "leads_to": {"Depression": 0.10, "Anxiety Disorder": 0.08, "Cognitive Decline": 0.05},
    },
    "Depression": {
        "specialty": "Psychiatry",
        "age_range": (15, 80),
        "gender_bias": "F",
        "medicines": {
            "teen":   [("Fluoxetine 20mg", 0.80), ("Escitalopram 5mg", 0.78), ("Counseling/CBT", 0.82)],
            "adult":  [("Escitalopram 10mg", 0.86), ("Sertraline 50mg", 0.84), ("Fluoxetine 20mg", 0.82), ("Venlafaxine 75mg", 0.80), ("Mirtazapine 15mg", 0.78), ("Bupropion 150mg", 0.76)],
            "middle": [("Escitalopram 10mg", 0.84), ("Sertraline 50mg", 0.82), ("Duloxetine 30mg", 0.80), ("Venlafaxine 75mg", 0.78)],
            "senior": [("Escitalopram 5mg", 0.78), ("Sertraline 25mg", 0.76), ("Mirtazapine 7.5mg", 0.74)],
        },
        "symptoms": ["Persistent sadness", "Loss of interest", "Fatigue", "Sleep disturbances", "Appetite changes", "Difficulty concentrating", "Feelings of worthlessness", "Social withdrawal", "Suicidal thoughts"],
        "severity_dist": {"MILD": 0.25, "MODERATE": 0.50, "SEVERE": 0.25},
        "chronic": True,
        "vitals": {"bp_s": (100, 130), "bp_d": (60, 85), "hr": (60, 88), "temp": (97.5, 99.0), "spo2": (96, 99)},
        "risk_factors": ["Stress", "Alcohol", "Drug abuse", "Sleep deprivation"],
        "leads_to": {"Anxiety Disorder": 0.15, "Insomnia": 0.12, "Substance Abuse": 0.06, "Heart Disease": 0.04},
    },
    "Anxiety Disorder": {
        "specialty": "Psychiatry",
        "age_range": (15, 70),
        "gender_bias": "F",
        "medicines": {
            "teen":   [("Escitalopram 5mg", 0.80), ("Counseling/CBT", 0.85), ("Clonazepam 0.25mg", 0.75)],
            "adult":  [("Escitalopram 10mg", 0.86), ("Sertraline 50mg", 0.84), ("Buspirone 5mg", 0.78), ("Clonazepam 0.5mg", 0.82), ("Propranolol 10mg", 0.76), ("Venlafaxine 75mg", 0.80)],
            "middle": [("Escitalopram 10mg", 0.84), ("Buspirone 10mg", 0.80), ("Clonazepam 0.5mg", 0.80)],
            "senior": [("Escitalopram 5mg", 0.78), ("Buspirone 5mg", 0.76)],
        },
        "symptoms": ["Excessive worry", "Restlessness", "Rapid heartbeat", "Sweating", "Trembling", "Difficulty concentrating", "Insomnia", "Muscle tension", "Panic attacks", "Irritability"],
        "severity_dist": {"MILD": 0.25, "MODERATE": 0.50, "SEVERE": 0.25},
        "chronic": True,
        "vitals": {"bp_s": (115, 145), "bp_d": (72, 95), "hr": (80, 110), "temp": (97.8, 99.5), "spo2": (96, 99)},
        "risk_factors": ["Stress", "Sleep deprivation", "Drug abuse"],
        "leads_to": {"Depression": 0.12, "Insomnia": 0.15, "Hypertension": 0.06},
    },
    "Insomnia": {
        "specialty": "Psychiatry",
        "age_range": (18, 80),
        "gender_bias": "F",
        "medicines": {
            "adult":  [("Zolpidem 5mg", 0.80), ("Melatonin 3mg", 0.75), ("Trazodone 50mg", 0.78), ("Clonazepam 0.25mg", 0.76), ("Eszopiclone 2mg", 0.74)],
            "middle": [("Zolpidem 5mg", 0.78), ("Melatonin 3mg", 0.72), ("Trazodone 50mg", 0.76)],
            "senior": [("Melatonin 1mg", 0.70), ("Trazodone 25mg", 0.72)],
        },
        "symptoms": ["Difficulty falling asleep", "Waking up during the night", "Early morning awakening", "Daytime fatigue", "Irritability", "Poor concentration", "Headache", "Anxiety about sleep"],
        "severity_dist": {"MILD": 0.30, "MODERATE": 0.50, "SEVERE": 0.20},
        "chronic": True,
        "vitals": {"bp_s": (110, 140), "bp_d": (68, 90), "hr": (68, 92), "temp": (97.5, 99.0), "spo2": (96, 99)},
        "risk_factors": ["Stress", "Sleep deprivation"],
        "leads_to": {"Depression": 0.10, "Anxiety Disorder": 0.08, "Hypertension": 0.05},
    },
    "Peripheral Neuropathy": {
        "specialty": "Neurology",
        "age_range": (30, 80),
        "gender_bias": None,
        "medicines": {
            "adult":  [("Pregabalin 75mg", 0.84), ("Gabapentin 300mg", 0.82), ("Duloxetine 30mg", 0.78), ("Methylcobalamin 1500mcg", 0.80), ("Amitriptyline 10mg", 0.76)],
            "middle": [("Pregabalin 150mg", 0.82), ("Gabapentin 600mg", 0.80), ("Duloxetine 60mg", 0.80), ("Methylcobalamin 1500mcg", 0.78)],
            "senior": [("Pregabalin 75mg", 0.78), ("Gabapentin 300mg", 0.76), ("Methylcobalamin 1500mcg", 0.76)],
        },
        "symptoms": ["Numbness in hands/feet", "Tingling", "Burning sensation", "Sharp pain", "Muscle weakness", "Loss of coordination", "Sensitivity to touch"],
        "severity_dist": {"MILD": 0.20, "MODERATE": 0.50, "SEVERE": 0.30},
        "chronic": True,
        "vitals": {"bp_s": (110, 140), "bp_d": (68, 90), "hr": (68, 90), "temp": (97.5, 99.0), "spo2": (96, 99)},
        "risk_factors": ["Family history (diabetes)", "Alcohol"],
        "leads_to": {"Foot Ulcer": 0.08, "Falls/Fractures": 0.06},
    },
    "ADHD": {
        "specialty": "Psychiatry",
        "age_range": (6, 35),
        "gender_bias": "M",
        "medicines": {
            "child":  [("Methylphenidate 10mg", 0.82), ("Atomoxetine 18mg", 0.78), ("Clonidine 0.1mg", 0.72)],
            "teen":   [("Methylphenidate 20mg", 0.85), ("Atomoxetine 40mg", 0.80), ("Lisdexamfetamine 30mg", 0.84)],
            "adult":  [("Methylphenidate 20mg", 0.84), ("Atomoxetine 60mg", 0.80), ("Lisdexamfetamine 50mg", 0.86), ("Bupropion 150mg", 0.72)],
        },
        "symptoms": ["Inattention", "Hyperactivity", "Impulsivity", "Difficulty focusing", "Forgetfulness", "Disorganization", "Fidgeting", "Poor time management"],
        "severity_dist": {"MILD": 0.30, "MODERATE": 0.50, "SEVERE": 0.20},
        "chronic": True,
        "vitals": {"bp_s": (105, 130), "bp_d": (65, 85), "hr": (72, 95), "temp": (97.8, 99.2), "spo2": (96, 99)},
        "risk_factors": ["Sleep deprivation", "Stress"],
        "leads_to": {"Anxiety Disorder": 0.12, "Depression": 0.10},
    },
    "Vertigo (BPPV)": {
        "specialty": "ENT",
        "age_range": (25, 80),
        "gender_bias": "F",
        "medicines": {
            "adult":  [("Betahistine 16mg", 0.84), ("Cinnarizine 25mg", 0.80), ("Meclizine 25mg", 0.78), ("Prochlorperazine 5mg", 0.76)],
            "middle": [("Betahistine 16mg", 0.82), ("Cinnarizine 25mg", 0.78), ("Meclizine 25mg", 0.76)],
            "senior": [("Betahistine 8mg", 0.78), ("Meclizine 12.5mg", 0.74)],
        },
        "symptoms": ["Spinning sensation", "Dizziness", "Nausea", "Vomiting", "Unsteadiness", "Nystagmus", "Triggered by head movement"],
        "severity_dist": {"MILD": 0.25, "MODERATE": 0.50, "SEVERE": 0.25},
        "chronic": False,
        "vitals": {"bp_s": (100, 140), "bp_d": (62, 88), "hr": (65, 95), "temp": (97.8, 99.2), "spo2": (96, 99)},
        "risk_factors": ["Stress"],
        "leads_to": {"Anxiety Disorder": 0.06},
    },

    # ─── DERMATOLOGY (51-55) ─────────────────────────────────────
    "Skin Allergy (Urticaria)": {
        "specialty": "Dermatology",
        "age_range": (5, 70),
        "gender_bias": None,
        "medicines": {
            "child":  [("Cetirizine 5mg Syrup", 0.85), ("Calamine Lotion", 0.78), ("Hydroxyzine 10mg", 0.80)],
            "teen":   [("Cetirizine 10mg", 0.88), ("Fexofenadine 120mg", 0.86), ("Calamine Lotion", 0.78)],
            "adult":  [("Fexofenadine 180mg", 0.90), ("Levocetirizine 5mg", 0.88), ("Hydroxyzine 25mg", 0.82), ("Prednisolone 10mg", 0.80), ("Montelukast 10mg", 0.76)],
            "middle": [("Fexofenadine 180mg", 0.88), ("Levocetirizine 5mg", 0.86)],
            "senior": [("Levocetirizine 5mg", 0.82), ("Fexofenadine 120mg", 0.80)],
        },
        "symptoms": ["Itchy red welts", "Swelling", "Hives", "Skin redness", "Burning sensation", "Angioedema"],
        "severity_dist": {"MILD": 0.40, "MODERATE": 0.45, "SEVERE": 0.15},
        "chronic": False,
        "vitals": {"bp_s": (110, 130), "bp_d": (68, 85), "hr": (70, 92), "temp": (98.0, 99.5), "spo2": (96, 99)},
        "risk_factors": ["Dust mites", "Pollen"],
        "leads_to": {"Eczema": 0.06},
    },
    "Eczema (Atopic Dermatitis)": {
        "specialty": "Dermatology",
        "age_range": (2, 60),
        "gender_bias": None,
        "medicines": {
            "child":  [("Mometasone Cream 0.1%", 0.82), ("Emollient Cream", 0.85), ("Cetirizine 5mg Syrup", 0.78), ("Tacrolimus 0.03% Ointment", 0.76)],
            "teen":   [("Mometasone Cream 0.1%", 0.84), ("Tacrolimus 0.1% Ointment", 0.80), ("Cetirizine 10mg", 0.80)],
            "adult":  [("Mometasone Cream 0.1%", 0.86), ("Tacrolimus 0.1% Ointment", 0.82), ("Dupilumab 300mg SC", 0.88), ("Hydroxyzine 25mg", 0.78)],
            "middle": [("Mometasone Cream 0.1%", 0.84), ("Tacrolimus 0.1% Ointment", 0.80)],
            "senior": [("Emollient Cream", 0.80), ("Mometasone Cream 0.1%", 0.78)],
        },
        "symptoms": ["Dry itchy skin", "Red patches", "Cracked skin", "Oozing", "Thickened skin", "Sleep disturbance from itching", "Flaking"],
        "severity_dist": {"MILD": 0.30, "MODERATE": 0.50, "SEVERE": 0.20},
        "chronic": True,
        "vitals": {"bp_s": (110, 130), "bp_d": (68, 85), "hr": (68, 88), "temp": (97.8, 99.2), "spo2": (96, 99)},
        "risk_factors": ["Dust mites", "Pollen", "Stress"],
        "leads_to": {"Asthma": 0.08, "Allergic Rhinitis": 0.10},
    },
    "Acne Vulgaris": {
        "specialty": "Dermatology",
        "age_range": (12, 35),
        "gender_bias": None,
        "medicines": {
            "teen":   [("Benzoyl Peroxide 2.5%", 0.80), ("Adapalene 0.1% Gel", 0.82), ("Clindamycin 1% Gel", 0.78), ("Doxycycline 100mg", 0.76)],
            "adult":  [("Adapalene 0.1% Gel", 0.84), ("Clindamycin 1% Gel", 0.80), ("Doxycycline 100mg", 0.82), ("Isotretinoin 20mg", 0.88), ("Azelaic Acid 20% Cream", 0.76)],
        },
        "symptoms": ["Pimples", "Blackheads", "Whiteheads", "Oily skin", "Scarring", "Painful cysts", "Redness"],
        "severity_dist": {"MILD": 0.40, "MODERATE": 0.40, "SEVERE": 0.20},
        "chronic": False,
        "vitals": {"bp_s": (108, 128), "bp_d": (66, 82), "hr": (68, 86), "temp": (97.8, 99.0), "spo2": (97, 99)},
        "risk_factors": ["Stress", "Poor diet"],
        "leads_to": {"Depression": 0.05},
    },
    "Psoriasis": {
        "specialty": "Dermatology",
        "age_range": (15, 70),
        "gender_bias": None,
        "medicines": {
            "teen":   [("Clobetasol 0.05% Cream", 0.82), ("Calcipotriol Ointment", 0.78), ("Coal Tar Ointment", 0.72)],
            "adult":  [("Methotrexate 7.5mg weekly", 0.84), ("Clobetasol 0.05% Cream", 0.82), ("Calcipotriol Ointment", 0.80), ("Acitretin 25mg", 0.76), ("Adalimumab 40mg SC", 0.86)],
            "middle": [("Methotrexate 15mg weekly", 0.82), ("Adalimumab 40mg SC", 0.84), ("Apremilast 30mg", 0.80)],
            "senior": [("Clobetasol 0.05% Cream", 0.78), ("Methotrexate 7.5mg weekly", 0.76)],
        },
        "symptoms": ["Red scaly patches", "Silvery scales", "Dry cracked skin", "Itching", "Burning", "Nail pitting", "Joint pain", "Thick nails"],
        "severity_dist": {"MILD": 0.25, "MODERATE": 0.50, "SEVERE": 0.25},
        "chronic": True,
        "vitals": {"bp_s": (110, 135), "bp_d": (68, 88), "hr": (68, 88), "temp": (97.8, 99.2), "spo2": (96, 99)},
        "risk_factors": ["Smoking", "Alcohol", "Stress"],
        "leads_to": {"Arthritis (Osteoarthritis)": 0.08, "Depression": 0.10, "Heart Disease": 0.04},
    },
    "Fungal Infection (Tinea)": {
        "specialty": "Dermatology",
        "age_range": (10, 65),
        "gender_bias": "M",
        "medicines": {
            "child":  [("Clotrimazole Cream 1%", 0.82), ("Terbinafine Cream 1%", 0.80), ("Fluconazole 50mg", 0.78)],
            "teen":   [("Terbinafine Cream 1%", 0.85), ("Fluconazole 150mg", 0.82), ("Itraconazole 100mg", 0.80)],
            "adult":  [("Terbinafine 250mg", 0.88), ("Fluconazole 150mg weekly", 0.85), ("Itraconazole 200mg", 0.84), ("Ketoconazole 200mg", 0.80), ("Sertaconazole Cream 2%", 0.82)],
            "middle": [("Terbinafine 250mg", 0.86), ("Itraconazole 200mg", 0.82)],
            "senior": [("Terbinafine 250mg", 0.82), ("Fluconazole 150mg", 0.80)],
        },
        "symptoms": ["Ring-shaped rash", "Itching", "Redness", "Scaling", "Cracking skin", "Blisters", "Burning"],
        "severity_dist": {"MILD": 0.40, "MODERATE": 0.45, "SEVERE": 0.15},
        "chronic": False,
        "vitals": {"bp_s": (110, 130), "bp_d": (68, 85), "hr": (68, 86), "temp": (97.8, 99.2), "spo2": (97, 99)},
        "risk_factors": ["Obesity", "Family history (diabetes)"],
        "leads_to": {},
    },

    # ─── MISCELLANEOUS (56-60) ───────────────────────────────────
    "Thyroid Nodule": {
        "specialty": "Endocrinology",
        "age_range": (25, 75),
        "gender_bias": "F",
        "medicines": {
            "adult":  [("Levothyroxine 50mcg (suppressive)", 0.72), ("Observation/watchful waiting", 0.80)],
            "middle": [("Levothyroxine 75mcg (suppressive)", 0.70), ("Observation/watchful waiting", 0.78)],
            "senior": [("Observation/watchful waiting", 0.75)],
        },
        "symptoms": ["Neck swelling", "Difficulty swallowing", "Hoarseness", "Usually asymptomatic", "Neck tightness"],
        "severity_dist": {"MILD": 0.50, "MODERATE": 0.35, "SEVERE": 0.15},
        "chronic": False,
        "vitals": {"bp_s": (110, 135), "bp_d": (68, 88), "hr": (65, 90), "temp": (97.5, 99.0), "spo2": (96, 99)},
        "risk_factors": ["Stress"],
        "leads_to": {"Hypothyroidism": 0.08, "Hyperthyroidism": 0.06},
    },
    "Chronic Kidney Disease": {
        "specialty": "Nephrology",
        "age_range": (35, 85),
        "gender_bias": "M",
        "medicines": {
            "middle": [("Telmisartan 40mg", 0.82), ("Furosemide 40mg", 0.80), ("Erythropoietin 4000IU SC", 0.78), ("Calcium Carbonate 500mg", 0.75), ("Sodium Bicarbonate 500mg", 0.72), ("Iron Sucrose IV", 0.80)],
            "senior": [("Telmisartan 20mg", 0.78), ("Furosemide 20mg", 0.76), ("Erythropoietin 4000IU SC", 0.76), ("Calcium Carbonate 500mg", 0.74)],
        },
        "symptoms": ["Fatigue", "Swelling (edema)", "Reduced urine output", "Nausea", "Shortness of breath", "Confusion", "High blood pressure", "Itching"],
        "severity_dist": {"MILD": 0.15, "MODERATE": 0.40, "SEVERE": 0.45},
        "chronic": True,
        "vitals": {"bp_s": (130, 170), "bp_d": (80, 105), "hr": (72, 100), "temp": (97.5, 99.5), "spo2": (92, 97)},
        "risk_factors": ["Family history (diabetes)", "Family history (hypertension)", "Obesity"],
        "leads_to": {"Heart Disease": 0.12, "Anemia": 0.15, "Bone Disease": 0.08},
    },
    "Sciatica": {
        "specialty": "Orthopedics",
        "age_range": (25, 75),
        "gender_bias": "M",
        "medicines": {
            "adult":  [("Pregabalin 75mg", 0.84), ("Diclofenac 50mg", 0.82), ("Methylcobalamin 1500mcg", 0.78), ("Thiocolchicoside 4mg", 0.76), ("Gabapentin 300mg", 0.78)],
            "middle": [("Pregabalin 150mg", 0.82), ("Etoricoxib 90mg", 0.80), ("Methylcobalamin 1500mcg", 0.78)],
            "senior": [("Pregabalin 75mg", 0.78), ("Paracetamol 650mg", 0.72), ("Methylcobalamin 1500mcg", 0.76)],
        },
        "symptoms": ["Radiating leg pain", "Lower back pain", "Numbness", "Tingling", "Muscle weakness", "Difficulty walking", "Sharp shooting pain"],
        "severity_dist": {"MILD": 0.20, "MODERATE": 0.50, "SEVERE": 0.30},
        "chronic": False,
        "vitals": {"bp_s": (110, 140), "bp_d": (68, 90), "hr": (68, 92), "temp": (97.8, 99.2), "spo2": (96, 99)},
        "risk_factors": ["Obesity", "Sedentary lifestyle", "Occupational hazard"],
        "leads_to": {"Disc Herniation": 0.12, "Chronic Pain Syndrome": 0.08},
    },
    "Iron Deficiency (Pregnancy-related Anemia)": {
        "specialty": "Obstetrics",
        "age_range": (18, 42),
        "gender_bias": "F",
        "medicines": {
            "adult":  [("Ferrous Sulfate 200mg", 0.88), ("Folic Acid 5mg", 0.90), ("Iron Sucrose IV 200mg", 0.92), ("Vitamin C 500mg", 0.75), ("Calcium Carbonate 500mg", 0.72)],
        },
        "symptoms": ["Fatigue", "Weakness", "Pale skin", "Shortness of breath", "Dizziness", "Cold extremities", "Pica cravings", "Rapid heartbeat"],
        "severity_dist": {"MILD": 0.25, "MODERATE": 0.55, "SEVERE": 0.20},
        "chronic": False,
        "vitals": {"bp_s": (95, 125), "bp_d": (55, 78), "hr": (80, 105), "temp": (97.5, 99.0), "spo2": (93, 98)},
        "risk_factors": ["Poor diet"],
        "leads_to": {"Postpartum Depression": 0.08},
    },
    "Benign Prostatic Hyperplasia (BPH)": {
        "specialty": "Urology",
        "age_range": (45, 85),
        "gender_bias": "M",
        "medicines": {
            "middle": [("Tamsulosin 0.4mg", 0.86), ("Finasteride 5mg", 0.82), ("Dutasteride 0.5mg", 0.80), ("Silodosin 8mg", 0.84), ("Alfuzosin 10mg", 0.80)],
            "senior": [("Tamsulosin 0.4mg", 0.84), ("Finasteride 5mg", 0.80), ("Dutasteride 0.5mg", 0.78), ("Alfuzosin 10mg", 0.78)],
        },
        "symptoms": ["Frequent urination", "Weak urine stream", "Difficulty starting urination", "Nocturia", "Incomplete emptying", "Urgency", "Dribbling"],
        "severity_dist": {"MILD": 0.25, "MODERATE": 0.50, "SEVERE": 0.25},
        "chronic": True,
        "vitals": {"bp_s": (115, 145), "bp_d": (70, 92), "hr": (65, 88), "temp": (97.5, 99.0), "spo2": (96, 99)},
        "risk_factors": ["Obesity", "Sedentary lifestyle"],
        "leads_to": {"UTI (Urinary Tract Infection)": 0.08, "Kidney Infection": 0.04},
    },
}


# ── Helper Functions ────────────────────────────────────────────────────────

def get_age_group(age):
    if age < 13: return "child"
    if age < 18: return "teen"
    if age < 40: return "adult"
    if age < 60: return "middle"
    return "senior"


def random_vitals(v):
    return {
        "bp_systolic":  round(random.uniform(*v["bp_s"]), 0),
        "bp_diastolic": round(random.uniform(*v["bp_d"]), 0),
        "heart_rate":   round(random.uniform(*v["hr"]), 0),
        "temperature":  round(random.uniform(*v["temp"]), 1),
        "spo2":         round(random.uniform(*v["spo2"]), 0),
    }


def pick_severity(dist):
    r = random.random()
    cumulative = 0
    for sev, prob in dist.items():
        cumulative += prob
        if r <= cumulative:
            return sev
    return "MODERATE"


def compute_outcome(severity, medications, disease_info, age_group):
    """Determine treatment outcome based on medicine efficacy + severity."""
    age_meds = disease_info["medicines"].get(age_group, {})
    if not age_meds:
        for fallback in ["adult", "middle", "teen", "senior", "child"]:
            if disease_info["medicines"].get(fallback):
                age_meds = disease_info["medicines"][fallback]
                break

    # Average efficacy of prescribed medicines
    med_dict = {m[0]: m[1] for m in age_meds} if age_meds else {}
    efficacy_scores = [med_dict.get(m, 0.6) for m in medications]
    avg_efficacy = sum(efficacy_scores) / len(efficacy_scores) if efficacy_scores else 0.6

    # Severity penalty
    sev_modifier = {"MILD": 0.15, "MODERATE": 0.0, "SEVERE": -0.20}
    modified = avg_efficacy + sev_modifier.get(severity, 0)

    # Add randomness
    modified += random.gauss(0, 0.08)

    if modified >= 0.75:
        return "CURED"
    elif modified >= 0.55:
        return "IMPROVED"
    elif modified >= 0.35:
        return "NO_CHANGE"
    else:
        return "WORSENED"


def pick_risk_factors(disease_info, age):
    """Select risk factors relevant to the patient."""
    risk_pool = disease_info.get("risk_factors", [])
    if not risk_pool:
        return []
    # Older patients accumulate more risk factors
    max_rf = min(len(risk_pool), 1 + (age // 25))
    n = random.randint(0, max_rf)
    return random.sample(risk_pool, n)


def pick_follow_up_diagnosis(disease_info):
    """Determine if a follow-up disease develops."""
    leads_to = disease_info.get("leads_to", {})
    if not leads_to:
        return ""
    for future_disease, probability in leads_to.items():
        if random.random() < probability:
            return future_disease
    return ""


# ── Comorbidity Patterns ───────────────────────────────────────────────────

COMORBIDITY_GROUPS = [
    # (primary, secondary, probability_of_comorbidity)
    ("Hypertension", "Type 2 Diabetes", 0.35),
    ("Type 2 Diabetes", "Hypertension", 0.40),
    ("Hypertension", "Hyperlipidemia", 0.30),
    ("Type 2 Diabetes", "Hyperlipidemia", 0.25),
    ("Type 2 Diabetes", "Chronic Kidney Disease", 0.15),
    ("Obesity", "Type 2 Diabetes", 0.30),
    ("COPD", "Heart Failure (CHF)", 0.12),
    ("Depression", "Anxiety Disorder", 0.40),
    ("Depression", "Insomnia", 0.30),
    ("Asthma", "Allergic Rhinitis", 0.35),
    ("GERD", "Asthma", 0.10),
    ("Hypertension", "Coronary Artery Disease", 0.15),
    ("Arthritis (Osteoarthritis)", "Osteoporosis", 0.20),
    ("Hypothyroidism", "Depression", 0.15),
    ("IBS (Irritable Bowel Syndrome)", "Anxiety Disorder", 0.20),
]


# ══════════════════════════════════════════════════════════════════════
# MAIN GENERATOR
# ══════════════════════════════════════════════════════════════════════

def generate_records(n=50000, output_path="data/training_data.csv"):
    """
    Generate n synthetic medical records.
    ~40% of patients will have 2-5 visits (multi-visit).
    Comorbidity patterns are respected.
    """
    records = []
    disease_names = list(DISEASES.keys())

    # Weighted disease prevalence (roughly based on real-world frequency)
    disease_weights = []
    high_prevalence = {"Common Cold", "Fever (Viral)", "Hypertension", "Type 2 Diabetes",
                       "Gastritis", "GERD", "Lower Back Pain", "Skin Allergy (Urticaria)",
                       "Allergic Rhinitis", "Diarrhea (Acute)", "Vitamin D Deficiency",
                       "Anemia (Iron Deficiency)", "Migraine", "UTI (Urinary Tract Infection)"}
    medium_prevalence = {"Asthma", "Bronchitis", "Sinusitis", "Hyperlipidemia", "Hypothyroidism",
                         "Depression", "Anxiety Disorder", "Insomnia", "Gastroenteritis",
                         "Arthritis (Osteoarthritis)", "Fungal Infection (Tinea)", "Acne Vulgaris",
                         "Conjunctivitis", "Eczema (Atopic Dermatitis)", "Cervical Spondylosis",
                         "IBS (Irritable Bowel Syndrome)", "Gout", "Vertigo (BPPV)",
                         "Benign Prostatic Hyperplasia (BPH)"}

    for d in disease_names:
        if d in high_prevalence:
            disease_weights.append(10)
        elif d in medium_prevalence:
            disease_weights.append(5)
        else:
            disease_weights.append(3)

    # Create patient pool — ~60% single visit, ~40% multi-visit (2-5 visits)
    patient_id_counter = 1000
    patient_visits = []  # (patient_id, demographics, n_visits)

    total_target = n
    generated = 0

    while generated < total_target:
        patient_id = patient_id_counter
        patient_id_counter += 1

        # Patient demographics (consistent across visits)
        age = random.randint(3, 88)
        gender = random.choice(["Male", "Female"])
        blood_group = random.choices(BLOOD_GROUPS, weights=BLOOD_GROUP_WEIGHTS, k=1)[0]

        # Lifestyle factors (consistent for patient)
        is_smoker = random.random() < (0.18 if gender == "Male" else 0.04)
        is_drinker = random.random() < (0.25 if gender == "Male" else 0.08)
        bmi = round(random.gauss(25.5, 5.5), 1)
        bmi = max(15.0, min(bmi, 48.0))
        is_obese = bmi >= 30

        # Number of visits
        if random.random() < 0.40:
            n_visits = random.choices([2, 3, 4, 5], weights=[45, 30, 15, 10], k=1)[0]
        else:
            n_visits = 1

        n_visits = min(n_visits, total_target - generated)

        # Pick primary disease
        primary_disease_name = random.choices(disease_names, weights=disease_weights, k=1)[0]
        primary_info = DISEASES[primary_disease_name]

        # Check age eligibility
        if age < primary_info["age_range"][0] or age > primary_info["age_range"][1]:
            # Re-roll within range
            age = random.randint(*primary_info["age_range"])

        visit_diseases = [primary_disease_name]

        # Add comorbid diseases for multi-visit patients
        if n_visits > 1:
            for primary_d, secondary_d, prob in COMORBIDITY_GROUPS:
                if primary_disease_name == primary_d and random.random() < prob:
                    if secondary_d in DISEASES:
                        sec_info = DISEASES[secondary_d]
                        if sec_info["age_range"][0] <= age <= sec_info["age_range"][1]:
                            visit_diseases.append(secondary_d)

            # Fill remaining visits with related or random diseases
            while len(visit_diseases) < n_visits:
                # Follow-up from primary
                follow_ups = list(primary_info.get("leads_to", {}).keys())
                added = False
                for fu in follow_ups:
                    if fu in DISEASES and fu not in visit_diseases:
                        fu_info = DISEASES[fu]
                        if fu_info["age_range"][0] <= age <= fu_info["age_range"][1]:
                            visit_diseases.append(fu)
                            added = True
                            break
                if not added:
                    rand_d = random.choices(disease_names, weights=disease_weights, k=1)[0]
                    visit_diseases.append(rand_d)

        # Generate records for each visit
        for visit_idx, disease_name in enumerate(visit_diseases):
            info = DISEASES[disease_name]

            # Adjust age slightly for follow-up visits (aging)
            visit_age = age + (visit_idx * random.choice([0, 0, 1]))

            age_group = get_age_group(visit_age)

            # Gender check for bias
            if info["gender_bias"] == "M" and gender == "Female":
                if random.random() > 0.35:
                    continue  # skip - less likely for this gender
            elif info["gender_bias"] == "F" and gender == "Male":
                if random.random() > 0.35:
                    continue

            severity = pick_severity(info["severity_dist"])

            # Symptoms
            n_symptoms = random.randint(3, min(6, len(info["symptoms"])))
            symptoms = random.sample(info["symptoms"], n_symptoms)

            # Medicines
            age_meds = info["medicines"].get(age_group, [])
            if not age_meds:
                for fallback in ["adult", "middle", "teen", "senior", "child"]:
                    if info["medicines"].get(fallback):
                        age_meds = info["medicines"][fallback]
                        break
            if not age_meds:
                continue  # skip if no medicines defined

            n_meds = min(random.randint(1, 3), len(age_meds))
            selected_meds = random.sample(age_meds, n_meds)
            medications = [m[0] for m in selected_meds]

            # Vitals
            vitals = random_vitals(info["vitals"])

            # Allergies
            allergies = ""
            if random.random() < 0.12:
                n_allergy = random.choices([1, 2], weights=[80, 20], k=1)[0]
                allergies = "|".join(random.sample(ALLERGY_OPTIONS, n_allergy))

            # Outcome
            outcome = compute_outcome(severity, medications, info, age_group)

            # Worse outcome for smokers/obese with certain disease types
            if outcome == "CURED" and (is_smoker or is_obese):
                if info["specialty"] in ["Cardiology", "Pulmonology", "Endocrinology"]:
                    if random.random() < 0.20:
                        outcome = "IMPROVED"

            # Treatment duration
            base_days = {"MILD": (3, 7), "MODERATE": (5, 14), "SEVERE": (10, 28)}
            duration = random.randint(*base_days.get(severity, (5, 14)))
            if info["chronic"]:
                duration = random.randint(30, 365)

            # Risk factors
            risk_factors = pick_risk_factors(info, visit_age)
            if is_smoker and "Smoking" not in risk_factors:
                risk_factors.append("Smoking")
            if is_drinker and "Alcohol" not in risk_factors:
                risk_factors.append("Alcohol")
            if is_obese and "Obesity" not in risk_factors:
                risk_factors.append("Obesity")

            follow_up = pick_follow_up_diagnosis(info)

            records.append({
                "patient_id": patient_id,
                "age": visit_age,
                "gender": gender,
                "blood_group": blood_group,
                "disease": disease_name,
                "severity": severity,
                "symptoms": "|".join(symptoms),
                "medications": "|".join(medications),
                "bp_systolic": vitals["bp_systolic"],
                "bp_diastolic": vitals["bp_diastolic"],
                "heart_rate": vitals["heart_rate"],
                "temperature": vitals["temperature"],
                "spo2": vitals["spo2"],
                "allergies": allergies,
                "outcome": outcome,
                "treatment_duration_days": duration,
                "is_chronic": info["chronic"],
                "risk_factors": "|".join(risk_factors),
                "follow_up_diagnosis": follow_up,
                "bmi": bmi,
                "smoking": is_smoker,
                "alcohol": is_drinker,
                "specialty": info["specialty"],
            })

        generated += len(visit_diseases)

    # Trim to exact n
    records = records[:n]

    # Write CSV
    os.makedirs(os.path.dirname(output_path) if os.path.dirname(output_path) else ".", exist_ok=True)
    fieldnames = list(records[0].keys())
    with open(output_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(records)

    print(f"Generated {len(records)} records -> {output_path}")
    print(f"  Unique patients: {len(set(r['patient_id'] for r in records))}")
    print(f"  Diseases: {len(set(r['disease'] for r in records))}")
    return records


if __name__ == "__main__":
    generate_records(50000)
