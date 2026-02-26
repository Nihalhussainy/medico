import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const consolidateMedicines = (medicineString) => {
  if (!medicineString) return {};
  
  const medicinesByName = {};
  const mealEmojis = { BREAKFAST: '🌅', LUNCH: '☀️', DINNER: '🌙' };
  
  // Parse the string format: "BREAKFAST_BEFORE:\n• Medicine1" or old emoji format
  const sections = medicineString.split('\n\n');
  
  sections.forEach((section) => {
    const lines = section.trim().split('\n');
    if (lines.length < 2) return;
    
    const headerLine = lines[0];
    // Match format: "BREAKFAST_BEFORE:" 
    let mealMatch = headerLine.match(/(\w+)_(BEFORE|AFTER):/);
    if (!mealMatch) {
      // Try old emoji format for backward compatibility
      mealMatch = headerLine.match(/(\w+)\s+\((\w+)\)/);
      if (mealMatch) {
        const meal = mealMatch[1];
        const timing = mealMatch[2];
        const emoji = mealEmojis[meal] || '';
        const label = `${emoji} (${timing}) ${meal}`;
        
        lines.slice(1).forEach((line) => {
          const medicineName = line.replace('• ', '').trim();
          if (medicineName) {
            if (!medicinesByName[medicineName]) {
              medicinesByName[medicineName] = [];
            }
            medicinesByName[medicineName].push(label);
          }
        });
      }
      return;
    }
    
    const meal = mealMatch[1];
    const timing = mealMatch[2] === 'BEFORE' ? 'Before' : 'After';
    const emoji = mealEmojis[meal] || '';
    const label = `${emoji} (${timing}) ${meal}`;
    
    // Extract medicine names
    lines.slice(1).forEach((line) => {
      const medicineName = line.replace('• ', '').trim();
      if (medicineName) {
        if (!medicinesByName[medicineName]) {
          medicinesByName[medicineName] = [];
        }
        medicinesByName[medicineName].push(label);
      }
    });
  });
  
  return medicinesByName;
};

export const generatePrescriptionPDF = async (doctorProfile, patientData, medicines, recordDate, diagnosis, followUpDate) => {
  // Create a temporary container for rendering
  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.width = '210mm';
  container.style.padding = '20px';
  container.style.backgroundColor = 'white';
  container.style.fontFamily = 'Arial, sans-serif';
  
  // Consolidate medicines by name
  const medicinesByName = consolidateMedicines(medicines);
  
  // Format medicines - consolidated view with emojis
  const medicinesHTML = Object.keys(medicinesByName).length > 0
    ? Object.entries(medicinesByName)
        .map(([name, timings]) => `
          <div style="margin: 12px 0; padding: 12px; background: #f1f5f9; border-left: 3px solid #0ea5e9; border-radius: 4px;">
            <p style="margin: 0; font-weight: bold; color: #1e293b; font-size: 13px;">${name}</p>
            <p style="margin: 4px 0 0 0; color: #475569; font-size: 11px;">${timings.join(', ')}</p>
          </div>
        `)
        .join('')
    : '<p style="color: #999; font-size: 12px;">No medications prescribed</p>';

  // Format follow-up date
  const followUpHTML = followUpDate ? `
    <div style="background: #dbeafe; border-left: 4px solid #0ea5e9; padding: 12px; margin: 15px 0; border-radius: 3px;">
      <p style="margin: 0; color: #0c4a6e; font-size: 13px; font-weight: bold;">
        📅 Next Visit: ${new Date(followUpDate).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
      </p>
    </div>
  ` : '';

  // Get current date if not provided
  const dateStr = recordDate ? new Date(recordDate).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' }) : new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' });

  // Build the HTML prescription
  container.innerHTML = `
    <div style="border: 2px solid #1e293b; border-radius: 8px; padding: 30px; background: white;">
      <!-- Header -->
      <div style="text-align: center; border-bottom: 2px solid #0ea5e9; padding-bottom: 20px; margin-bottom: 25px;">
        <h1 style="margin: 0; color: #0ea5e9; font-size: 28px; font-weight: bold;">Rx</h1>
        <p style="margin: 10px 0 0 0; color: #64748b; font-size: 14px;">MEDICAL PRESCRIPTION</p>
      </div>

      <!-- Doctor Info -->
      <div style="margin-bottom: 20px; background: #f8fafc; padding: 15px; border-radius: 5px;">
        <h3 style="margin: 0 0 8px 0; color: #1e293b; font-size: 13px; font-weight: bold;">👨‍⚕️ DOCTOR</h3>
        <p style="margin: 4px 0; color: #475569; font-size: 12px;">
          <strong>${doctorProfile.firstName} ${doctorProfile.lastName}</strong>
        </p>
        <p style="margin: 4px 0; color: #475569; font-size: 11px;">
          License: ${doctorProfile.licenseNumber}
        </p>
        <p style="margin: 4px 0; color: #475569; font-size: 11px;">
          ${doctorProfile.specialization}${doctorProfile.hospitalName ? ' • ' + doctorProfile.hospitalName : ''}
        </p>
      </div>

      <!-- Patient Info -->
      <div style="margin-bottom: 20px; background: #f8fafc; padding: 15px; border-radius: 5px;">
        <h3 style="margin: 0 0 8px 0; color: #1e293b; font-size: 13px; font-weight: bold;">👤 PATIENT</h3>
        <p style="margin: 4px 0; color: #475569; font-size: 12px;">
          <strong>${patientData.fullName || 'N/A'}</strong> | Age ${patientData.age || 'N/A'} ${patientData.gender ? '| ' + patientData.gender : ''}
        </p>
        <p style="margin: 4px 0; color: #475569; font-size: 11px;">
          Phone: ${patientData.phoneNumber || 'N/A'}
        </p>
      </div>

      <!-- Visit Details -->
      ${diagnosis ? `
      <div style="margin-bottom: 20px; background: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px; border-radius: 3px;">
        <h3 style="margin: 0 0 6px 0; color: #92400e; font-size: 12px; font-weight: bold;">🔍 Chief Complaint / Diagnosis</h3>
        <p style="margin: 0; color: #78350f; font-size: 12px; line-height: 1.4;">${diagnosis}</p>
      </div>
      ` : ''}

      <!-- Medications/Prescription -->
      <div style="margin-bottom: 20px;">
        <h3 style="margin: 0 0 12px 0; color: #1e293b; font-size: 13px; font-weight: bold; border-bottom: 2px solid #0ea5e9; padding-bottom: 8px;">
          💊 MEDICATIONS
        </h3>
        ${medicinesHTML}
      </div>

      <!-- Follow-up -->
      ${followUpHTML}

      <!-- Date and Signature -->
      <div style="margin-top: 40px; display: flex; justify-content: space-between; align-items: flex-end;">
        <div>
          <p style="margin: 0; color: #475569; font-size: 11px;">
            <strong>Issued:</strong> ${dateStr}
          </p>
        </div>
        <div style="text-align: center;">
          <div style="color: #64748b; font-size: 12px; margin-bottom: 12px; border-bottom: 1px solid #cbd5e1; width: 120px;">
          </div>
          <p style="margin: 0; color: #475569; font-size: 11px; font-weight: bold;">
            ${doctorProfile.firstName} ${doctorProfile.lastName.charAt(0)}.
          </p>
          <p style="margin: 2px 0 0 0; color: #64748b; font-size: 10px;">
            Digital Signature
          </p>
        </div>
      </div>

      <!-- Footer -->
      <div style="margin-top: 30px; padding-top: 15px; border-top: 1px solid #e2e8f0; text-align: center;">
        <p style="margin: 0; color: #94a3b8; font-size: 9px; line-height: 1.4;">
          This is a digitally generated prescription. Follow medication instructions strictly.<br/>
          Consult your doctor if any side effects occur.
        </p>
      </div>
    </div>
  `;

  document.body.appendChild(container);

  try {
    // Convert HTML to canvas
    const canvas = await html2canvas(container, {
      scale: 2,
      backgroundColor: '#ffffff',
      logging: false
    });

    // Create PDF from canvas
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const imgData = canvas.toDataURL('image/png');
    const imgWidth = 210; // A4 width in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);

    // Generate filename
    const timestamp = new Date().toISOString().slice(0, 10);
    const filename = `Rx_${patientData.fullName || 'Patient'}_${timestamp}.pdf`;

    // Download PDF
    pdf.save(filename);

    return true;
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  } finally {
    document.body.removeChild(container);
  }
};
