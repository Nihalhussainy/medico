<p align="center">
  <img src="frontend/public/medico-logo.svg" alt="Medico Logo" width="120" height="120">
</p>

<h1 align="center">Medico</h1>

<p align="center">
  <strong>Centralized Cloud-Based Medical History Management System</strong>
</p>

<p align="center">
  A comprehensive healthcare platform with AI-powered insights, secure patient data management, and seamless doctor-patient collaboration.
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#tech-stack">Tech Stack</a> •
  <a href="#architecture">Architecture</a> •
  <a href="#installation">Installation</a> •
  <a href="#api-reference">API Reference</a> •
  <a href="#contributing">Contributing</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Spring_Boot-3.2-6DB33F?style=for-the-badge&logo=springboot&logoColor=white" alt="Spring Boot">
  <img src="https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React">
  <img src="https://img.shields.io/badge/PostgreSQL-15-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL">
  <img src="https://img.shields.io/badge/Python-3.11-3776AB?style=for-the-badge&logo=python&logoColor=white" alt="Python">
  <img src="https://img.shields.io/badge/TailwindCSS-3.4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="Tailwind">
</p>

<p align="center">
  <img src="https://img.shields.io/badge/License-MIT-yellow?style=flat-square" alt="License">
  <img src="https://img.shields.io/badge/Status-Active-success?style=flat-square" alt="Status">
  <img src="https://img.shields.io/badge/PRs-Welcome-brightgreen?style=flat-square" alt="PRs Welcome">
</p>

---

## Overview

**Medico** is a sophisticated healthcare management platform designed to revolutionize how medical records are stored, accessed, and analyzed. Built with security-first principles, it enables seamless collaboration between patients, doctors, and healthcare administrators while leveraging AI/ML for predictive health insights.

### Why Medico?

| Challenge | Solution |
|-----------|----------|
| Fragmented medical records | Centralized, cloud-based storage accessible anywhere |
| Privacy concerns | OTP-based consent system for controlled data access |
| Manual health tracking | AI-powered risk prediction and medicine recommendations |
| Family health management | Unified family profiles with shared medical history |
| Emergency blood requirements | Integrated blood donation request & notification system |

---

## Features

### For Patients

| Feature | Description |
|---------|-------------|
| **Medical History Timeline** | View complete medical history in chronological order with diagnosis, prescriptions, and doctor notes |
| **Lab Report Management** | Upload, organize, and track lab reports with cloud storage |
| **Family Health Profiles** | Manage health records for family members (spouse, children, parents) |
| **AI Risk Prediction** | Get personalized health risk forecasts based on medical history |
| **Health Assistant Chat** | AI-powered lifestyle recommendations and health guidance |
| **Blood Donation Alerts** | Receive notifications for blood donation requests matching your blood type |

### For Doctors

| Feature | Description |
|---------|-------------|
| **Patient Search & Consent** | Search patients and request OTP-based access consent |
| **Medical Record Creation** | Create comprehensive records with vitals, diagnosis, medications, and follow-ups |
| **AI Medicine Recommendations** | Get AI-suggested medications based on diagnosis with dosage schedules |
| **Drug Interaction Checker** | Verify drug-to-drug interactions before prescribing |
| **File Attachments** | Attach prescriptions, imaging reports, and documents to records |
| **Analytics Dashboard** | Track patient statistics, visit trends, and top diagnoses |
| **Recent Patients Sidebar** | Quick access to recently consulted patients |

### For Administrators

| Feature | Description |
|---------|-------------|
| **Doctor Verification** | Review and approve/reject doctor registrations |
| **Blood Donation Management** | Create blood requests and track donor responses |
| **System Analytics** | Platform-wide metrics, user growth, and activity monitoring |
| **Patient & Doctor Directory** | Complete overview of all registered users |
| **Audit Logs** | Comprehensive logging of all system activities |

### Security & Compliance

| Feature | Description |
|---------|-------------|
| **JWT Authentication** | Secure token-based authentication with role enforcement |
| **OTP Consent System** | Doctors must obtain patient consent via OTP before accessing records |
| **Time-Limited Access** | Consent expires after configurable duration (default: 24 hours) |
| **Audit Trail** | Every access, modification, and deletion is logged with IP address |
| **Role-Based Access Control** | Three-tier access: Admin, Doctor, Patient |

---

## Tech Stack

### Backend

| Technology | Purpose |
|------------|---------|
| **Spring Boot 3.2** | RESTful API framework |
| **Java 17** | Core programming language |
| **Spring Security** | Authentication & authorization |
| **JWT (JSON Web Tokens)** | Stateless authentication |
| **Spring Data JPA** | Database ORM |
| **PostgreSQL 15** | Primary database |
| **Maven** | Dependency management |

### Frontend

| Technology | Purpose |
|------------|---------|
| **React 18** | UI library |
| **Vite** | Build tool & dev server |
| **Tailwind CSS** | Utility-first styling |
| **React Router** | Client-side routing |
| **Axios** | HTTP client |
| **jwt-decode** | Token parsing |

### ML Service

| Technology | Purpose |
|------------|---------|
| **Python 3.11** | ML service runtime |
| **FastAPI** | ML API framework |
| **Scikit-learn** | Machine learning models |
| **FuzzyWuzzy** | Disease name matching |

### Infrastructure

| Technology | Purpose |
|------------|---------|
| **Cloudinary** | Cloud file storage (optional) |
| **Local Storage** | Default file storage |
| **SMTP** | Email OTP delivery |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              MEDICO PLATFORM                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐       │
│  │   React + Vite  │────▶│  Spring Boot    │────▶│   PostgreSQL    │       │
│  │    Frontend     │     │    Backend      │     │    Database     │       │
│  │  (Port: 5173)   │◀────│  (Port: 8080)   │◀────│  (Port: 5432)   │       │
│  └─────────────────┘     └────────┬────────┘     └─────────────────┘       │
│                                   │                                         │
│                                   │ HTTP                                    │
│                                   ▼                                         │
│                          ┌─────────────────┐     ┌─────────────────┐       │
│                          │   ML Service    │     │   File Storage  │       │
│                          │    (FastAPI)    │     │  (Local/Cloud)  │       │
│                          │  (Port: 8000)   │     │                 │       │
│                          └─────────────────┘     └─────────────────┘       │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Authentication Flow

```
┌────────┐      ┌────────┐      ┌────────┐      ┌────────┐
│  User  │─────▶│ Login  │─────▶│  JWT   │─────▶│ Access │
│        │      │  API   │      │ Token  │      │  APIs  │
└────────┘      └────────┘      └────────┘      └────────┘
                                     │
                                     ▼
                              ┌────────────┐
                              │ Role Check │
                              │ ADMIN │     │
                              │ DOCTOR│     │
                              │PATIENT│     │
                              └────────────┘
```

### OTP Consent Flow

```
┌──────────┐    Request    ┌──────────┐    OTP Email    ┌──────────┐
│  Doctor  │──────────────▶│  System  │────────────────▶│ Patient  │
└──────────┘               └──────────┘                 └──────────┘
     │                          │                            │
     │                          │                            │
     │      OTP Verification    │      OTP Code              │
     │◀─────────────────────────│◀───────────────────────────│
     │                          │                            │
     ▼                          ▼                            │
┌──────────┐    24hr Access ┌──────────┐                     │
│  Access  │◀──────────────│  Consent │                     │
│ Records  │               │  Granted │                     │
└──────────┘               └──────────┘                     │
```

---

## Installation

### Prerequisites

| Requirement | Version |
|-------------|---------|
| Java | 17+ |
| Node.js | 18+ |
| PostgreSQL | 15+ |
| Python | 3.11+ |
| Maven | 3.8+ |

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/medico.git
cd medico
```

### 2. Database Setup

```sql
-- Create PostgreSQL database
CREATE DATABASE medico;

-- The application will auto-create tables via JPA/Hibernate
```

### 3. Backend Setup

```bash
cd backend

# Configure application properties
cp src/main/resources/application.properties.example src/main/resources/application.properties
```

Edit `application.properties`:

```properties
# Database Configuration
spring.datasource.url=jdbc:postgresql://localhost:5432/medico
spring.datasource.username=your_username
spring.datasource.password=your_password

# JWT Configuration (min 32 bytes for HS256)
app.jwt.secret=your-256-bit-secret-key-here-minimum-32-bytes
app.jwt.expiration-ms=86400000

# OTP Configuration
app.otp.delivery=EMAIL  # or MOCK for testing
app.otp.expiry-minutes=10
app.consent.valid-hours=24

# Email Configuration (for OTP)
spring.mail.host=smtp.gmail.com
spring.mail.port=587
spring.mail.username=your-email@gmail.com
spring.mail.password=your-app-password

# File Storage
app.file.upload-dir=./uploads
app.file.max-size=10485760
```

Run the backend:

```bash
./mvnw spring-boot:run
```

The backend will start at `http://localhost:8080`

### 4. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

The frontend will start at `http://localhost:5173`

### 5. ML Service Setup (Optional)

```bash
cd ml-service

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Train models (first time only)
python train.py

# Start the service
python main.py
```

The ML service will start at `http://localhost:8000`

---

## API Reference

### Authentication

| Endpoint | Method | Description | Auth |
|----------|--------|-------------|------|
| `/api/auth/register` | POST | Register new user | Public |
| `/api/auth/login` | POST | Login and get JWT | Public |

### Users

| Endpoint | Method | Description | Auth |
|----------|--------|-------------|------|
| `/api/users/me` | GET | Get current user profile | JWT |

### Patients

| Endpoint | Method | Description | Auth |
|----------|--------|-------------|------|
| `/api/patients/phone/{phone}` | GET | Get patient by phone | JWT (with consent) |
| `/api/patients/me` | PUT | Update patient profile | JWT (Patient) |

### Doctors

| Endpoint | Method | Description | Auth |
|----------|--------|-------------|------|
| `/api/doctors/me` | GET | Get doctor profile | JWT (Doctor) |
| `/api/doctors/me` | PUT | Update doctor profile | JWT (Doctor) |
| `/api/doctors/me/profile-picture` | PUT | Upload profile picture | JWT (Doctor) |

### Medical Records

| Endpoint | Method | Description | Auth |
|----------|--------|-------------|------|
| `/api/records` | POST | Create medical record | JWT (Doctor) |
| `/api/records/patient/{phone}` | GET | Get patient records | JWT (with consent) |
| `/api/records/{id}` | PUT | Update record | JWT (Doctor) |
| `/api/records/{id}` | DELETE | Delete record | JWT (Doctor) |

### File Uploads

| Endpoint | Method | Description | Auth |
|----------|--------|-------------|------|
| `/api/records/{id}/files` | POST | Upload file to record | JWT (Doctor/Patient) |
| `/api/records/{id}/files` | GET | List record files | JWT |

### OTP Consent

| Endpoint | Method | Description | Auth |
|----------|--------|-------------|------|
| `/api/consent/request` | POST | Request patient consent | JWT (Doctor) |
| `/api/consent/verify` | POST | Verify OTP | JWT (Doctor) |
| `/api/consent/status` | GET | Check consent status | JWT |

### Lab Reports

| Endpoint | Method | Description | Auth |
|----------|--------|-------------|------|
| `/api/lab-reports/mine` | GET | Get my lab reports | JWT (Patient) |
| `/api/lab-reports/mine` | POST | Upload lab report | JWT (Patient) |

### Family Management

| Endpoint | Method | Description | Auth |
|----------|--------|-------------|------|
| `/api/family/group` | GET | Get family group | JWT (Patient) |
| `/api/family/members` | POST | Add family member | JWT (Patient) |
| `/api/family/members/{id}` | PUT | Update family member | JWT (Patient) |
| `/api/family/members/{id}` | DELETE | Remove family member | JWT (Patient) |

### Blood Donation

| Endpoint | Method | Description | Auth |
|----------|--------|-------------|------|
| `/api/blood-donation/request` | POST | Create blood request | JWT (Admin) |
| `/api/blood-donation/requests` | GET | List active requests | JWT (Admin) |
| `/api/blood-donation/notifications` | GET | Get donation alerts | JWT (Patient) |

### ML Integration

| Endpoint | Method | Description | Auth |
|----------|--------|-------------|------|
| `/api/ml/health` | GET | ML service health check | Public |
| `/api/ml/diseases` | GET | List known diseases | Public |
| `/api/ml/recommend` | POST | Get medicine recommendations | JWT (Doctor) |
| `/api/ml/predict-risks` | POST | Predict health risks | JWT |
| `/api/ml/check-interactions` | POST | Check drug interactions | JWT (Doctor) |

### Analytics

| Endpoint | Method | Description | Auth |
|----------|--------|-------------|------|
| `/api/analytics/dashboard` | GET | Get dashboard analytics | JWT (Admin/Doctor) |

---

## Project Structure

```
medico/
├── backend/                      # Spring Boot Backend
│   ├── src/main/java/com/medico/backend/
│   │   ├── config/              # App configuration
│   │   ├── controller/          # REST controllers
│   │   ├── dto/                 # Data transfer objects
│   │   ├── entity/              # JPA entities
│   │   ├── exception/           # Custom exceptions
│   │   ├── repository/          # Data repositories
│   │   ├── security/            # JWT & Spring Security
│   │   ├── service/             # Business logic
│   │   └── utils/               # Utilities
│   └── pom.xml
│
├── frontend/                     # React Frontend
│   ├── src/
│   │   ├── components/          # Reusable UI components
│   │   ├── context/             # React context providers
│   │   ├── pages/               # Page components
│   │   ├── routes/              # Route definitions
│   │   ├── services/            # API services
│   │   ├── App.jsx              # Root component
│   │   └── main.jsx             # Entry point
│   ├── package.json
│   └── vite.config.js
│
├── ml-service/                   # Python ML Service
│   ├── models/
│   │   ├── recommender.py       # Medicine recommender
│   │   ├── risk_predictor.py    # Health risk prediction
│   │   └── drug_interactions.py # Drug interaction checker
│   ├── main.py                  # FastAPI app
│   └── train.py                 # Model training script
│
└── README.md
```

---

## Database Schema

### Entity Relationship

```
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│    Users    │──────▶│   Patients  │──────▶│   Family    │
│             │       │             │       │   Members   │
└─────────────┘       └─────────────┘       └─────────────┘
       │                     │
       │                     │
       ▼                     ▼
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│   Doctors   │──────▶│  Medical    │──────▶│  Medical    │
│             │       │  Records    │       │   Files     │
└─────────────┘       └─────────────┘       └─────────────┘
       │                     │
       │                     │
       ▼                     ▼
┌─────────────┐       ┌─────────────┐
│ OTP Consent │       │ Audit Logs  │
│             │       │             │
└─────────────┘       └─────────────┘
```

### Key Tables

| Table | Description |
|-------|-------------|
| `users` | Core user accounts with email, password hash, role |
| `patients` | Patient profiles linked to users |
| `doctors` | Doctor profiles with specialization & license |
| `medical_records` | Patient visit records with diagnosis & treatment |
| `medical_files` | Attached files (prescriptions, reports) |
| `otp_consent` | Doctor-patient consent tracking |
| `family_members` | Patient family member profiles |
| `blood_donation_requests` | Active blood donation needs |
| `audit_logs` | System-wide activity logging |

---

## Environment Variables

### Backend

| Variable | Description | Default |
|----------|-------------|---------|
| `DB_URL` | PostgreSQL connection URL | `jdbc:postgresql://localhost:5432/medico` |
| `DB_USERNAME` | Database username | - |
| `DB_PASSWORD` | Database password | - |
| `JWT_SECRET` | JWT signing key (min 32 bytes) | - |
| `JWT_EXPIRATION` | Token expiration in ms | `86400000` |
| `OTP_DELIVERY` | OTP method (`EMAIL`/`MOCK`) | `MOCK` |
| `MAIL_HOST` | SMTP host | `smtp.gmail.com` |
| `MAIL_USERNAME` | SMTP username | - |
| `MAIL_PASSWORD` | SMTP password | - |

### Frontend

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_BASE_URL` | Backend API URL | `http://localhost:8080/api` |

### ML Service

| Variable | Description | Default |
|----------|-------------|---------|
| `ML_PORT` | Service port | `8000` |
| `MODEL_PATH` | Trained model directory | `./models` |

---

## Security Best Practices

### Production Checklist

- [ ] Use strong, unique `JWT_SECRET` (256+ bits)
- [ ] Enable HTTPS for all services
- [ ] Set secure CORS origins
- [ ] Use environment variables for secrets
- [ ] Enable rate limiting
- [ ] Configure proper database user permissions
- [ ] Set up SSL/TLS for PostgreSQL
- [ ] Enable audit logging
- [ ] Regular security updates

### Data Protection

- All passwords are hashed using BCrypt
- JWT tokens expire after 24 hours
- OTP codes expire after 10 minutes
- Consent access expires after 24 hours
- All file uploads are validated for type and size
- SQL injection prevented via parameterized queries

---

## Contributing

We welcome contributions! Please follow these steps:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### Development Guidelines

- Follow existing code style and conventions
- Write meaningful commit messages
- Add tests for new features
- Update documentation as needed
- Ensure all tests pass before submitting PR

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## Acknowledgments

- Spring Boot team for the excellent framework
- React and Vite communities
- All contributors who helped build this platform

---

<p align="center">
  Made with care for better healthcare management
</p>

<p align="center">
  <a href="#medico">Back to Top</a>
</p>
