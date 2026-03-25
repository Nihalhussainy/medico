# Input Validation Rules - Medico AI Service

## Overview

All API endpoints now include comprehensive input validation to prevent invalid data from reaching the ML models. This ensures data integrity, prevents crashes, and makes the service production-ready.

---

## Global Constants

```python
VALID_GENDERS = {"Male", "Female"}
VALID_BLOOD_GROUPS = {"A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"}
VALID_SEVERITIES = {"MILD", "MODERATE", "SEVERE"}
VALID_OUTCOMES = {"CURED", "IMPROVED", "MONITORING", "WORSENED", "UNKNOWN"}
```

---

## Endpoint: POST /recommend-medicine

### Request Body Validation

| Field | Type | Constraints | Error Codes |
|-------|------|-------------|------------|
| **disease** | string | Non-empty, ≤100 chars, must exist in training data | 400, 503 |
| **age** | integer | 1-120 (years) | 400 |
| **gender** | string | Must be "Male" or "Female" | 400 |
| **blood_group** | string | Must be one of: A+, A-, B+, B-, AB+, AB-, O+, O- | 400 |
| **allergies** | array | Optional, max 20 items, each ≤100 chars, cannot be empty strings | 400 |
| **top_k** | integer | 1-20 recommendations to return | 400 |

### Validation Examples

✅ **Valid Request:**
```json
{
  "disease": "Diabetes",
  "age": 45,
  "gender": "Male",
  "blood_group": "A+",
  "allergies": ["Penicillin", "Sulfa drugs"],
  "top_k": 5
}
```

❌ **Invalid Request (age out of range):**
```json
{
  "disease": "Diabetes",
  "age": 150,
  "gender": "Male",
  "blood_group": "A+"
}
```
**Error:** 400 Bad Request - "age must be between 1 and 120"

❌ **Invalid Request (unknown disease):**
```json
{
  "disease": "FakeDiseaseXYZ",
  "age": 45,
  "gender": "Male",
  "blood_group": "O+"
}
```
**Error:** 400 Bad Request - "Unknown disease 'FakeDiseaseXYZ'. Available: [list of first 10 diseases]..."

❌ **Invalid Request (invalid gender):**
```json
{
  "disease": "Diabetes",
  "age": 45,
  "gender": "Other",
  "blood_group": "O+"
}
```
**Error:** 400 Bad Request - "Gender must be one of {'Male', 'Female'}"

---

## Endpoint: POST /predict-risks

### Request Body Validation

| Field | Type | Constraints | Error Codes |
|-------|------|-------------|------------|
| **patient_history** | array | Non-empty, 1-100 records max | 400 |
| **age** | integer | 1-120 (years) | 400 |
| **gender** | string | Must be "Male" or "Female" | 400 |
| **blood_group** | string | Must be one of: A+, A-, B+, B-, AB+, AB-, O+, O- | 400 |

### HistoryRecord Validation

| Field | Type | Constraints | Error Codes |
|-------|------|-------------|------------|
| **disease** | string | Non-empty, ≤100 chars, must exist in training data | 400 |
| **severity** | string | Must be one of: MILD, MODERATE, SEVERE | 400 |
| **bp_systolic** | float | 60-250 mmHg | 400 |
| **bp_diastolic** | float | 30-150 mmHg | 400 |
| **heart_rate** | float | 30-200 bpm | 400 |
| **temperature** | float | 32.0-42.0 °C | 400 |
| **spo2** | float | 50.0-100.0 % | 400 |
| **risk_factors** | string | Optional, max 500 chars | 400 |
| **is_chronic** | boolean | True/False | 400 |

### Validation Examples

✅ **Valid Request:**
```json
{
  "patient_history": [
    {
      "disease": "Hypertension",
      "severity": "MODERATE",
      "bp_systolic": 145,
      "bp_diastolic": 92,
      "heart_rate": 78,
      "temperature": 98.6,
      "spo2": 97,
      "risk_factors": "Obesity, Smoking",
      "is_chronic": true
    },
    {
      "disease": "Diabetes",
      "severity": "MILD",
      "bp_systolic": 130,
      "bp_diastolic": 85,
      "heart_rate": 75,
      "temperature": 98.5,
      "spo2": 98,
      "is_chronic": true
    }
  ],
  "age": 55,
  "gender": "Female",
  "blood_group": "B-"
}
```

❌ **Invalid Request (vitals out of range):**
```json
{
  "patient_history": [
    {
      "disease": "Hypertension",
      "severity": "MODERATE",
      "bp_systolic": 300,  // Invalid: > 250
      "bp_diastolic": 92,
      "heart_rate": 78,
      "temperature": 98.6,
      "spo2": 97
    }
  ],
  "age": 55,
  "gender": "Female",
  "blood_group": "B-"
}
```
**Error:** 400 Bad Request - "ensure this value is less than or equal to 250"

❌ **Invalid Request (invalid severity):**
```json
{
  "patient_history": [
    {
      "disease": "Hypertension",
      "severity": "CRITICAL"  // Invalid: not one of MILD, MODERATE, SEVERE
    }
  ],
  "age": 55,
  "gender": "Female"
}
```
**Error:** 400 Bad Request - "Severity must be one of {'MILD', 'MODERATE', 'SEVERE'}"

---

## Endpoint: POST /check-interactions

### Request Body Validation

| Field | Type | Constraints | Error Codes |
|-------|------|-------------|------------|
| **medications** | array | 2-20 items, each ≤100 chars, non-empty strings, no duplicates | 400 |

### Validation Rules

- **Minimum medications**: 2 required
- **Maximum medications**: 20 per request
- **Medication name**: 1-100 characters (no case-sensitive duplicates)
- **Duplicate detection**: Case-insensitive ("Aspirin" == "aspirin")

### Validation Examples

✅ **Valid Request:**
```json
{
  "medications": [
    "Warfarin",
    "Aspirin",
    "Metformin"
  ]
}
```

❌ **Invalid Request (too few medications):**
```json
{
  "medications": ["Aspirin"]
}
```
**Error:** 400 Bad Request - "At least 2 medications required for interaction checking"

❌ **Invalid Request (duplicate medications):**
```json
{
  "medications": [
    "Aspirn",
    "aspirin",  // Duplicate (case-insensitive)
    "Warfarin"
  ]
}
```
**Error:** 400 Bad Request - "Duplicate medications detected (ignoring case)"

❌ **Invalid Request (empty medication name):**
```json
{
  "medications": [
    "Aspirin",
    "",  // Empty string
    "Warfarin"
  ]
}
```
**Error:** 400 Bad Request - "Each medication must be a non-empty string"

❌ **Invalid Request (medication name too long):**
```json
{
  "medications": [
    "Aspirin",
    "A".repeat(101)  // > 100 chars
  ]
}
```
**Error:** 400 Bad Request - "Medication name too long... (max 100 characters)"

---

## Error Response Format

All validation errors follow FastAPI's standard error format:

```json
{
  "detail": "Error message describing the validation failure"
}
```

### Common HTTP Status Codes

| Code | Meaning | When Used |
|------|---------|-----------|
| **400** | Bad Request | Invalid input (invalid disease, vitals out of range, etc.) |
| **500** | Internal Server Error | Processing failure after validation passes |
| **503** | Service Unavailable | Model not loaded (run train.py first) |

---

## Production Recommendations

1. **Always validate at the entry point** (✅ implemented here)
2. **Use typed payloads** (✅ Pydantic models with Field validators)
3. **Set reasonable constraints** (✅ field length, numeric ranges)
4. **Provide helpful error messages** (✅ detailed field descriptions)
5. **Handle edge cases** (✅ whitespace, duplicates, case sensitivity)
6. **Log validation errors** (recommended: add logging in future versions)

---

## Testing the Validations

### Using curl:

```bash
# Test invalid age
curl -X POST http://localhost:5000/recommend-medicine \
  -H "Content-Type: application/json" \
  -d '{
    "disease": "Diabetes",
    "age": 150,
    "gender": "Male",
    "blood_group": "A+"
  }'

# Expected response:
# 422 Unprocessable Entity
# {"detail": [{"loc": ["body", "age"], "msg": "ensure this value is less than or equal to 120"}]}
```

```bash
# Test invalid gender
curl -X POST http://localhost:5000/recommend-medicine \
  -H "Content-Type: application/json" \
  -d '{
    "disease": "Diabetes",
    "age": 45,
    "gender": "Other",
    "blood_group": "A+"
  }'

# Expected response:
# 422 Unprocessable Entity
# {"detail": [{"loc": ["body", "gender"], "msg": "Gender must be one of..."}]}
```

```bash
# Test unknown disease
curl -X POST http://localhost:5000/recommend-medicine \
  -H "Content-Type: application/json" \
  -d '{
    "disease": "FakeDiseaseXYZ",
    "age": 45,
    "gender": "Male",
    "blood_group": "A+"
  }'

# Expected response:
# 400 Bad Request
# {"detail": "Unknown disease \"FakeDiseaseXYZ\". Available: ..."}
```

---

## Implementation Details

### Validation Layers

1. **Pydantic Field Validators** (declarative)
   - Type checking
   - Numeric ranges
   - String length constraints
   - Custom validators (gender, blood_group, severity)

2. **Custom Helper Functions** (reusable)
   - `_validate_disease()`: Check disease exists in training data
   - `_validate_medication()`: Check medication format

3. **Endpoint-level Validation** (context-aware)
   - History array not empty
   - All diseases in history are valid
   - Proper error context (which record failed)

### Constants Used

```python
VALID_GENDERS = {"Male", "Female"}
VALID_BLOOD_GROUPS = {"A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"}
VALID_SEVERITIES = {"MILD", "MODERATE", "SEVERE"}
VALID_OUTCOMES = {"CURED", "IMPROVED", "MONITORING", "WORSENED", "UNKNOWN"}

VITAL_RANGES = {
    "age": (0, 120),
    "bp_systolic": (60, 250),
    "bp_diastolic": (30, 150),
    "heart_rate": (30, 200),
    "temperature": (32.0, 42.0),
    "spo2": (50.0, 100.0),
}
```

---

## Future Improvements

- [ ] Add request/response logging for validation errors
- [ ] Add metrics (# of validation failures per field)
- [ ] Add medication database validation (if available)
- [ ] Add constraints on disease/allergy combinations
- [ ] Add rate limiting per client
- [ ] Add request signing for API authentication

