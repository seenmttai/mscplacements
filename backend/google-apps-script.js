/**
 * Google Apps Script for mscplacements.com Vacancy Submissions
 * 
 * Setup Instructions:
 * 1. Open your target Google Sheet (e.g., "MSC Placement Vacancies").
 * 2. Click Extensions -> Apps Script.
 * 3. Replace all code in Code.gs with this code.
 * 4. Replace NOTIFICATION_EMAIL below with your preferred inbox (e.g. placements@mystudentclub.com).
 * 5. Click Deploy -> New Deployment.
 * 6. Select type: "Web App".
 * 7. Set "Execute as": "Me".
 * 8. Set "Who has access": "Anyone" (essential for receiving public form submissions).
 * 9. Copy the Web App URL and paste it in your Cloudflare Worker script.
 */

const NOTIFICATION_EMAIL = 'placements@mystudentclub.com';

function doPost(e) {
  try {
    const lock = LockService.getScriptLock();
    lock.tryLock(10000);

    let data;
    if (e.postData && e.postData.contents) {
      data = JSON.parse(e.postData.contents);
    } else if (e.parameter) {
      data = e.parameter;
    } else {
      throw new Error('No post data provided');
    }

    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

    // Setup headers if sheet is brand new
    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        'Timestamp',
        'Name',
        'Company',
        'Work Email',
        'Phone',
        'Role Title',
        'Domain',
        'Location',
        'Stipend / Salary',
        'Joining Month',
        'Positions',
        'Job Description'
      ]);
      sheet.getRange(1, 1, 1, 12).setFontWeight('bold').setBackground('#F1F5F9');
    }

    const timestamp = data.submittedAt || new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

    // Append new row
    sheet.appendRow([
      timestamp,
      data.userName || '',
      data.companyName || '',
      data.workEmail || '',
      data.phone || '',
      data.roleTitle || '',
      data.domain || '',
      data.location || '',
      data.stipend || '',
      data.joiningMonth || '',
      data.numPositions || '',
      data.jobDescription || ''
    ]);

    // Send Email Notification
    sendEmailNotification(data, timestamp);

    lock.releaseLock();

    return ContentService
      .createTextOutput(JSON.stringify({ status: 'success', message: 'Vacancy recorded successfully' }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function sendEmailNotification(data, timestamp) {
  const subject = `[New Vacancy] ${data.roleTitle || 'CA Role'} at ${data.companyName || 'Company'}`;
  
  const htmlBody = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #0F172A; max-width: 600px; margin: 0 auto; border: 1px solid #E2E8F0; border-radius: 8px; overflow: hidden;">
      <div style="background-color: #0F172A; color: #FFFFFF; padding: 20px; text-align: center;">
        <h2 style="margin: 0; font-size: 20px;">New Vacancy Submitted</h2>
        <p style="margin: 5px 0 0; font-size: 13px; color: #38BDF8;">mscplacements.com Employer Portal</p>
      </div>

      <div style="padding: 24px;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; font-weight: bold; width: 140px; color: #64748B;">Contact Name:</td>
            <td style="padding: 8px 0;">${escapeHtml(data.userName)}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold; color: #64748B;">Company:</td>
            <td style="padding: 8px 0;"><strong>${escapeHtml(data.companyName)}</strong></td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold; color: #64748B;">Work Email:</td>
            <td style="padding: 8px 0;"><a href="mailto:${escapeHtml(data.workEmail)}" style="color: #2563EB;">${escapeHtml(data.workEmail)}</a></td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold; color: #64748B;">Phone / WhatsApp:</td>
            <td style="padding: 8px 0;">${escapeHtml(data.phone || 'N/A')}</td>
          </tr>
          <tr style="border-top: 1px solid #E2E8F0;">
            <td style="padding: 8px 0; font-weight: bold; color: #64748B;">Role Title:</td>
            <td style="padding: 8px 0; font-weight: bold; color: #1E3A8A;">${escapeHtml(data.roleTitle)}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold; color: #64748B;">Domain:</td>
            <td style="padding: 8px 0;">${escapeHtml(data.domain)}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold; color: #64748B;">Location:</td>
            <td style="padding: 8px 0;">${escapeHtml(data.location)}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold; color: #64748B;">Stipend / Salary:</td>
            <td style="padding: 8px 0;">${escapeHtml(data.stipend || 'Not specified')}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold; color: #64748B;">Joining Month:</td>
            <td style="padding: 8px 0;">${escapeHtml(data.joiningMonth)}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold; color: #64748B;">No. of Positions:</td>
            <td style="padding: 8px 0;">${escapeHtml(data.numPositions || '1')}</td>
          </tr>
        </table>

        ${data.jobDescription ? `
          <div style="margin-top: 16px; padding: 12px; background-color: #F8FAFC; border-left: 4px solid #2563EB; border-radius: 4px;">
            <strong style="color: #0F172A; display: block; margin-bottom: 6px;">Job Description / Requirements:</strong>
            <p style="margin: 0; white-space: pre-wrap; font-size: 14px; color: #334155;">${escapeHtml(data.jobDescription)}</p>
          </div>
        ` : ''}
      </div>

      <div style="background-color: #F1F5F9; padding: 12px; text-align: center; font-size: 12px; color: #64748B;">
        Submitted at ${timestamp} IST via mscplacements.com
      </div>
    </div>
  `;

  MailApp.sendEmail({
    to: NOTIFICATION_EMAIL,
    subject: subject,
    htmlBody: htmlBody
  });
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({ status: 'ok', message: 'mscplacements Apps Script service active' }))
    .setMimeType(ContentService.MimeType.JSON);
}
