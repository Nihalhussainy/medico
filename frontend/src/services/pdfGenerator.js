import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const escapeHtml = (value) => {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
};

const formatDisplayDate = (value, withWeekday = false) => {
  if (!value) return 'Not specified';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not specified';
  return date.toLocaleDateString('en-IN', {
    weekday: withWeekday ? 'long' : undefined,
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

const consolidateMedicines = (medicineString) => {
  if (!medicineString) return {};
  
  const medicinesByName = {};
  const mealLabels = {
    BREAKFAST: 'Breakfast',
    LUNCH: 'Lunch',
    DINNER: 'Dinner'
  };
  
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
        const meal = mealMatch[1].toUpperCase();
        const timing = mealMatch[2];
        const label = `${mealLabels[meal] || meal} (${timing})`;
        
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
    
    const meal = mealMatch[1].toUpperCase();
    const timing = mealMatch[2] === 'BEFORE' ? 'Before' : 'After';
    const label = `${mealLabels[meal] || meal} (${timing} food)`;
    
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
  container.style.padding = '12mm';
  container.style.backgroundColor = 'white';
  container.style.fontFamily = '"Times New Roman", Georgia, serif';
  
  // Consolidate medicines by name
  const medicinesByName = consolidateMedicines(medicines);

  const doctorFullName = `${doctorProfile?.firstName || ''} ${doctorProfile?.lastName || ''}`.trim() || 'Treating Doctor';
  const patientFullName = patientData?.fullName || 'Patient';
  const diagnosisText = diagnosis ? escapeHtml(diagnosis).replace(/\n/g, '<br/>') : '';
  const issueDate = formatDisplayDate(recordDate, false);
  const followUpDateText = followUpDate ? formatDisplayDate(followUpDate, true) : 'As advised';
  
  // Format medicines - professional prescription rows
  const medicinesHTML = Object.keys(medicinesByName).length > 0
    ? Object.entries(medicinesByName)
        .map(([name, timings], index) => `
          <tr>
            <td style="padding: 8px 10px; border-bottom: 1px solid #d1d5db; font-size: 12px; color: #111827; vertical-align: top; width: 44px;">${index + 1}.</td>
            <td style="padding: 8px 10px; border-bottom: 1px solid #d1d5db; font-size: 12px; color: #111827; vertical-align: top; font-weight: 600;">${escapeHtml(name)}</td>
            <td style="padding: 8px 10px; border-bottom: 1px solid #d1d5db; font-size: 11px; color: #374151; vertical-align: top;">${escapeHtml(timings.join(' | '))}</td>
          </tr>
        `)
        .join('')
    : `
      <tr>
        <td colspan="3" style="padding: 10px; border-bottom: 1px solid #d1d5db; font-size: 11px; color: #6b7280; text-align: center;">
          No medicines prescribed in this consultation.
        </td>
      </tr>
    `;

  // Build the HTML prescription
  container.innerHTML = `
    <div style="border: 1.5px solid #0f172a; background: #fff; color: #111827;">
      <div style="padding: 18px 24px 14px; border-bottom: 2px solid #0f172a;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="width: 65%; vertical-align: top;">
              <h1 style="margin: 0; font-size: 26px; font-weight: 700; letter-spacing: 0.2px;">Dr. ${escapeHtml(doctorFullName)}</h1>
              <p style="margin: 5px 0 0; font-size: 12px; color: #374151;">${escapeHtml(doctorProfile?.specialization || 'General Practice')}</p>
              <p style="margin: 3px 0 0; font-size: 11px; color: #4b5563;">Reg. No: ${escapeHtml(doctorProfile?.licenseNumber || 'N/A')}</p>
              <p style="margin: 3px 0 0; font-size: 11px; color: #4b5563;">${escapeHtml(doctorProfile?.hospitalName || 'Clinic')}</p>
            </td>
            <td style="width: 35%; text-align: right; vertical-align: top;">
              <p style="margin: 0; font-size: 11px; color: #4b5563;">Date</p>
              <p style="margin: 2px 0 12px; font-size: 13px; font-weight: 700; color: #111827;">${escapeHtml(issueDate)}</p>
              <p style="margin: 0; font-size: 11px; color: #4b5563;">Prescription ID</p>
              <p style="margin: 2px 0 0; font-size: 12px; font-weight: 700; color: #111827;">RX-${Date.now().toString().slice(-6)}</p>
            </td>
          </tr>
        </table>
      </div>

      <div style="padding: 14px 24px 10px; border-bottom: 1px solid #d1d5db; background: #fafafa;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="width: 60%; font-size: 12px; color: #111827;">
              <span style="color: #6b7280;">Patient:</span>
              <strong> ${escapeHtml(patientFullName)}</strong>
            </td>
            <td style="width: 20%; font-size: 12px; color: #111827;">
              <span style="color: #6b7280;">Age:</span>
              <strong> ${escapeHtml(patientData?.age || 'N/A')}</strong>
            </td>
            <td style="width: 20%; font-size: 12px; color: #111827;">
              <span style="color: #6b7280;">Gender:</span>
              <strong> ${escapeHtml(patientData?.gender || 'N/A')}</strong>
            </td>
          </tr>
          <tr>
            <td colspan="3" style="padding-top: 6px; font-size: 11px; color: #4b5563;">
              Contact: ${escapeHtml(patientData?.phoneNumber || 'N/A')}
            </td>
          </tr>
        </table>
      </div>

      <div style="padding: 14px 24px 4px;">
        <p style="margin: 0; font-size: 22px; font-weight: 700; color: #111827;">Rx</p>
        ${diagnosisText ? `
          <div style="margin-top: 10px; border: 1px solid #d1d5db; background: #f9fafb; padding: 10px 12px;">
            <p style="margin: 0 0 4px; font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em;">Chief Complaint / Diagnosis</p>
            <p style="margin: 0; font-size: 12px; color: #111827; line-height: 1.45;">${diagnosisText}</p>
          </div>
        ` : ''}
      </div>

      <div style="padding: 8px 24px 0;">
        <table style="width: 100%; border-collapse: collapse; border: 1px solid #9ca3af;">
          <thead>
            <tr>
              <th style="text-align: left; padding: 8px 10px; font-size: 11px; border-bottom: 1px solid #9ca3af; background: #f3f4f6; width: 44px;">#</th>
              <th style="text-align: left; padding: 8px 10px; font-size: 11px; border-bottom: 1px solid #9ca3af; background: #f3f4f6;">Medicine</th>
              <th style="text-align: left; padding: 8px 10px; font-size: 11px; border-bottom: 1px solid #9ca3af; background: #f3f4f6;">Directions</th>
            </tr>
          </thead>
          <tbody>
            ${medicinesHTML}
          </tbody>
        </table>
      </div>

      <div style="padding: 14px 24px 0;">
        <div style="border: 1px solid #d1d5db; padding: 10px 12px; background: #fafafa;">
          <p style="margin: 0; font-size: 11px; color: #374151;"><strong>Follow-up:</strong> ${escapeHtml(followUpDateText)}</p>
        </div>
      </div>

      <div style="padding: 32px 24px 18px;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="width: 55%; vertical-align: bottom; font-size: 10px; color: #6b7280; line-height: 1.5;">
              This is a digitally generated prescription.<br/>
              Please take medicines strictly as directed.
            </td>
            <td style="width: 45%; vertical-align: bottom; text-align: right;">
              <div style="display: inline-block; min-width: 180px; text-align: center;">
                <div style="height: 36px; border-bottom: 1px solid #9ca3af;"></div>
                <p style="margin: 6px 0 0; font-size: 11px; color: #111827; font-weight: 700;">Dr. ${escapeHtml(doctorFullName)}</p>
                <p style="margin: 2px 0 0; font-size: 10px; color: #4b5563;">Authorized Signature</p>
              </div>
            </td>
          </tr>
        </table>
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

    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= 297;

    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= 297;
    }

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
