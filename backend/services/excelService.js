import xlsx from 'xlsx';
import candidateRepository from '../repositories/candidateRepository.js';
import timelineRepository from '../repositories/timelineRepository.js';
import { queryGet } from '../database/connection.js';
import { parsePay, parseNoticePeriod } from '../utils/parser.js';
import { logError, logApp } from './loggerService.js';

export const importCandidatesFromExcel = async (fileBuffer, userId) => {
  const workbook = xlsx.read(fileBuffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const rows = xlsx.utils.sheet_to_json(worksheet);

  let imported = 0;
  let duplicates = 0;
  let invalid = 0;

  for (const rawRow of rows) {
    // Normalize keys to lowercase and trimmed
    const row = {};
    Object.keys(rawRow).forEach(key => {
      row[key.trim().toLowerCase()] = rawRow[key];
    });

    const rawName = row['name'] || row['candidate name'] || row['  name'];
    const rawLink = row['link'] || row['linkedin'] || row['   link'] || row['linkedin link'];
    const rawExperience = row['exprience'] || row['experience'] || row[' exprience'];
    const rawCompany = row['company'] || row['  company'];

    const name = rawName ? String(rawName).trim() : '';
    const linkedin = rawLink ? String(rawLink).trim() : '';

    if (!name) {
      invalid++;
      continue;
    }

    // Parse experience
    let experience_years = 0;
    if (rawExperience !== undefined) {
      const match = String(rawExperience).match(/([0-9.]+)/);
      if (match) {
        experience_years = parseFloat(match[1]);
      }
    }

    // LinkedIn normalization
    let normalizedLinkedin = '';
    let emailLocalSlug = '';
    if (linkedin) {
      normalizedLinkedin = linkedin;
      if (!normalizedLinkedin.startsWith('http://') && !normalizedLinkedin.startsWith('https://')) {
        if (normalizedLinkedin.startsWith('www.')) {
          normalizedLinkedin = 'https://' + normalizedLinkedin;
        } else if (normalizedLinkedin.startsWith('linkedin.com')) {
          normalizedLinkedin = 'https://www.' + normalizedLinkedin;
        } else {
          normalizedLinkedin = 'https://www.linkedin.com/in/' + normalizedLinkedin;
        }
      }

      let slug = normalizedLinkedin.replace(/^(https?:\/\/)?(www\.)?linkedin\.com\/in\//i, '');
      slug = slug.split(/[?\/]/)[0].trim().toLowerCase();
      if (slug) {
        emailLocalSlug = slug;
      }
    }

    if (!emailLocalSlug) {
      emailLocalSlug = name.toLowerCase().replace(/[^a-z0-9]/g, '');
    }

    const email = `${emailLocalSlug}@import.local`;
    let isDuplicate = false;

    // Check duplicate LinkedIn
    if (normalizedLinkedin) {
      const dupLinkedIn = await queryGet('SELECT id FROM Candidates WHERE linkedin_url = ?', [normalizedLinkedin]);
      if (dupLinkedIn) {
        isDuplicate = true;
      }
    }

    // Check duplicate email
    if (!isDuplicate) {
      const dupEmail = await queryGet('SELECT id FROM Candidates WHERE email = ?', [email]);
      if (dupEmail) {
        isDuplicate = true;
      }
    }

    if (isDuplicate) {
      duplicates++;
      continue;
    }

    // Parsing rest of candidate fields
    const rawSkills = row['skills'] || row['skill'] || row['key skills'];
    const skills = rawSkills ? String(rawSkills).trim() : (rawCompany ? `AI, Machine Learning, ${String(rawCompany).trim()}` : 'AI, Machine Learning');
    
    const rawLocation = row['current location'] || row['location'] || row['current_location'];
    const location = rawLocation ? String(rawLocation).trim() : 'Remote';
    
    const rawPhone = row['mobile number'] || row['phone'] || row['mobile'] || row['mobile_number'];
    const phone = rawPhone ? String(rawPhone).trim() : null;

    const rawStatus = row['status'];
    let status = 'Applied';
    if (rawStatus) {
      const trimmed = String(rawStatus).trim();
      const capitalized = trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
      const validStatuses = ['Applied', 'Screening', 'Interviewing', 'Offered', 'Hired', 'Rejected'];
      if (validStatuses.includes(capitalized)) {
        status = capitalized;
      } else if (capitalized === 'Interview') {
        status = 'Interviewing';
      }
    }

    const rawCurrentPay = row['current pay'] || row['current_pay'] || row['current ctc'] || row['current_ctc'];
    const rawExpectedPay = row['expected pay'] || row['expected_pay'] || row['expected ctc'] || row['expected_ctc'];
    const rawNoticePeriod = row['notice period'] || row['notice_period'];

    const current_ctc = rawCurrentPay !== undefined && rawCurrentPay !== null ? parsePay(rawCurrentPay) : null;
    const expected_ctc = rawExpectedPay !== undefined && rawExpectedPay !== null ? parsePay(rawExpectedPay) : null;
    const notice_period_days = rawNoticePeriod !== undefined && rawNoticePeriod !== null ? parseNoticePeriod(rawNoticePeriod) : null;

    const company = rawCompany ? String(rawCompany).trim() : null;
    const rawPrefLoc = row['preferred location'] || row['preferred_location'] || row['preferred place'];
    const preferred_location = rawPrefLoc ? String(rawPrefLoc).trim() : null;
    
    const rawRemarks = row['remarks'] || row['remark'];
    const remarks = rawRemarks ? String(rawRemarks).trim() : null;
    
    const rawComment = row['comment'] || row['comments'];
    const comment = rawComment ? String(rawComment).trim() : null;

    try {
      const result = await candidateRepository.create({
        name,
        email,
        phone,
        skills,
        location,
        experience_years,
        status,
        current_ctc,
        expected_ctc,
        notice_period_days,
        linkedin_url: normalizedLinkedin,
        company,
        preferred_location,
        remarks,
        comment
      });

      // Timeline tracking
      await timelineRepository.create({
        candidateId: result.id,
        event: 'Created',
        details: 'Candidate imported from Excel talent sheet.',
        performedBy: userId
      });

      imported++;
    } catch (err) {
      logError(new Error(`Failed to import Candidate row for ${name}: ${err.message}`));
      invalid++;
    }
  }

  logApp(`[ExcelService] Completed Excel Import. Rows parsed: ${rows.length}, Imported: ${imported}, Duplicates: ${duplicates}, Invalid: ${invalid}`);

  return {
    total: rows.length,
    imported,
    duplicates,
    invalid
  };
};

export default {
  importCandidatesFromExcel
};
