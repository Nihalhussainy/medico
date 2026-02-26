const RECENT_PATIENTS_KEY = 'medico_recent_patients';
const MAX_RECENT = 5;

export const addRecentPatient = (phoneNumber, fullName, consentValidUntil) => {
  try {
    const stored = localStorage.getItem(RECENT_PATIENTS_KEY);
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

    localStorage.setItem(RECENT_PATIENTS_KEY, JSON.stringify(patients));
  } catch (error) {
    console.error('Error saving recent patient:', error);
  }
};

export const getRecentPatients = () => {
  try {
    const stored = localStorage.getItem(RECENT_PATIENTS_KEY);
    const patients = stored ? JSON.parse(stored) : [];
    const today = new Date();
    return patients.filter((patient) => {
      if (!patient.lastAccessed) return false;
      const accessed = new Date(patient.lastAccessed);
      return (
        accessed.getFullYear() === today.getFullYear() &&
        accessed.getMonth() === today.getMonth() &&
        accessed.getDate() === today.getDate()
      );
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

export const clearRecentPatients = () => {
  try {
    localStorage.removeItem(RECENT_PATIENTS_KEY);
  } catch (error) {
    console.error('Error clearing recent patients:', error);
  }
};
