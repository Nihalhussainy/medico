const MAX_RECENT = 5;

// Generate doctor-specific storage key
const getDoctorKey = (doctorIdentifier) => {
  if (!doctorIdentifier) return null;
  return `medico_recent_patients_${doctorIdentifier}`;
};

export const addRecentPatient = (phoneNumber, fullName, consentValidUntil, doctorIdentifier) => {
  try {
    const key = getDoctorKey(doctorIdentifier);
    if (!key) return;

    const stored = localStorage.getItem(key);
    let patients = stored ? JSON.parse(stored) : [];

    // Remove if already exists
    patients = patients.filter(p => p.phoneNumber !== phoneNumber);

    // Add to front
    patients.unshift({
      phoneNumber,
      fullName,
      consentValidUntil,
      lastAccessed: new Date().toISOString()
    });

    // Keep only last 5
    patients = patients.slice(0, MAX_RECENT);

    localStorage.setItem(key, JSON.stringify(patients));
  } catch (error) {
    console.error('Error saving recent patient:', error);
  }
};

export const getRecentPatients = (doctorIdentifier) => {
  try {
    const key = getDoctorKey(doctorIdentifier);
    if (!key) return [];

    const stored = localStorage.getItem(key);
    const patients = stored ? JSON.parse(stored) : [];
    const today = new Date();
    return patients.filter((patient) => {
      if (!patient.lastAccessed) return false;
      const accessed = new Date(patient.lastAccessed);
      const isToday =
        accessed.getFullYear() === today.getFullYear() &&
        accessed.getMonth() === today.getMonth() &&
        accessed.getDate() === today.getDate();

      // Only include patients accessed today AND with valid consent
      return isToday && isConsentValid(patient.consentValidUntil);
    });
  } catch (error) {
    console.error('Error retrieving recent patients:', error);
    return [];
  }
};

export const isConsentValid = (consentValidUntil) => {
  if (!consentValidUntil) return false;
  return new Date(consentValidUntil) > new Date();
};

export const clearRecentPatients = (doctorIdentifier) => {
  try {
    const key = getDoctorKey(doctorIdentifier);
    if (key) {
      localStorage.removeItem(key);
    }
  } catch (error) {
    console.error('Error clearing recent patients:', error);
  }
};

// Clear all doctor's recent patients on logout (remove all medico_recent_patients_* keys)
export const clearAllDoctorPatients = () => {
  try {
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('medico_recent_patients_')) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
  } catch (error) {
    console.error('Error clearing all doctor patients:', error);
  }
};

