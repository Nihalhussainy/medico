# Centralized Cloud-Based Medical History Management System

## Project overview
A full-stack medical history platform with secure JWT authentication, OTP-based patient consent, PostgreSQL persistence, and local file storage. Doctors can request access to patient records, patients can approve via OTP, and all access is audited.

## Architecture
- Backend: Spring Boot 3.2 (Java 17), layered architecture (controller/service/repository/entity)
- Frontend: React + Vite + Tailwind CSS
- Database: PostgreSQL 15
- File storage: Local filesystem (uploads folder)
- Security: JWT + role-based access (ADMIN, DOCTOR, PATIENT)

### Component interaction
1. React app calls Spring Boot REST APIs.
2. Spring Boot authenticates via JWT and enforces role policies.
3. Medical data stored in PostgreSQL.
4. Medical files uploaded to local storage, URLs stored in PostgreSQL.
5. Audit logs capture access and changes.

### Authentication flow
1. User registers with role (patient/doctor/admin).
2. Login returns JWT.
3. Frontend stores JWT and sends in `Authorization: Bearer <token>`.

### OTP consent flow
1. Doctor requests consent for a patient.
2. OTP is emailed to the patient (or returned in response if `app.otp.delivery=MOCK`).
3. Patient verifies OTP; consent becomes valid for a configurable window.
4. Doctor can access records only while consent is valid.

### File upload flow
1. Doctor uploads PDF/JPG/PNG to `/api/records/{recordId}/files`.
2. Backend validates file type and stores file in `backend/uploads`.
3. File URL and metadata stored in PostgreSQL.

## Database schema (PostgreSQL)
```sql
CREATE TABLE roles (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(20) NOT NULL UNIQUE
);

CREATE TABLE users (
  id BIGSERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role_id BIGINT NOT NULL REFERENCES roles(id),
  enabled BOOLEAN NOT NULL,
  created_at TIMESTAMP NOT NULL
);

CREATE TABLE patients (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL UNIQUE REFERENCES users(id),
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  date_of_birth DATE,
  gender VARCHAR(50)
);

CREATE TABLE doctors (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL UNIQUE REFERENCES users(id),
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  specialization VARCHAR(150) NOT NULL,
  license_number VARCHAR(150) NOT NULL UNIQUE
);

CREATE TABLE medical_records (
  id BIGSERIAL PRIMARY KEY,
  patient_id BIGINT NOT NULL REFERENCES patients(id),
  doctor_id BIGINT NOT NULL REFERENCES doctors(id),
  title VARCHAR(255) NOT NULL,
  description VARCHAR(2000) NOT NULL,
  record_date DATE,
  created_at TIMESTAMP NOT NULL
);

CREATE TABLE medical_files (
  id BIGSERIAL PRIMARY KEY,
  record_id BIGINT NOT NULL REFERENCES medical_records(id),
  url TEXT NOT NULL,
  public_id VARCHAR(255) NOT NULL,
  file_type VARCHAR(100) NOT NULL,
  original_file_name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NOT NULL
);

CREATE TABLE otp_consent (
  id BIGSERIAL PRIMARY KEY,
  patient_id BIGINT NOT NULL REFERENCES patients(id),
  doctor_id BIGINT NOT NULL REFERENCES doctors(id),
  otp_code VARCHAR(10) NOT NULL,
  status VARCHAR(20) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  verified_at TIMESTAMP,
  consent_valid_until TIMESTAMP
);

CREATE TABLE audit_logs (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES users(id),
  action VARCHAR(50) NOT NULL,
  entity_type VARCHAR(100) NOT NULL,
  entity_id VARCHAR(100) NOT NULL,
  created_at TIMESTAMP NOT NULL,
  ip_address VARCHAR(100),
  details VARCHAR(2000)
);

CREATE INDEX idx_records_patient ON medical_records(patient_id);
CREATE INDEX idx_files_record ON medical_files(record_id);
CREATE INDEX idx_consent_patient_doctor ON otp_consent(patient_id, doctor_id);
CREATE INDEX idx_audit_user ON audit_logs(user_id);
```

## Backend structure
- config/
- security/
- controller/
- service/
- repository/
- entity/
- dto/
- exception/
- utils/

## Frontend structure
- components/
- pages/
- services/
- context/
- routes/

## API design
### Authentication
- POST /api/auth/register
- POST /api/auth/login

### Users
- GET /api/users/me

### OTP consent
- POST /api/consent/request
- POST /api/consent/verify
- GET /api/consent/status?doctorId=&patientId=

### Medical records
- POST /api/records
- GET /api/records/patient/{patientId}

### File upload
- POST /api/records/{recordId}/files
- GET /api/records/{recordId}/files

## Setup (local)
### PostgreSQL
- Create database `medico` in PostgreSQL 15.
- Update credentials in backend application.properties.

### File storage
- Files are saved to `backend/uploads` and served at `http://localhost:8080/files/{filename}`.

### Email OTP
- Set SMTP credentials in application.properties.
- For local testing without SMTP, set `app.otp.delivery=MOCK` to get OTP in API response.

### Backend
```bash
cd backend
./mvnw spring-boot:run
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## Security notes
- `app.jwt.secret` must be at least 32 bytes (256-bit) for HS256.
- Use environment variables or secrets for production values.

## Verification checklist
- JWT login works
- OTP request/verify works
- Consent required for doctor access
- Records stored in PostgreSQL
- Files stored in Cloudinary and URLs saved
- Audit logs created for access events
