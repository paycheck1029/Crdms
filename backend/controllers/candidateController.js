import candidateService from '../services/candidateService.js';
import excelService from '../services/excelService.js';
import auditService from '../services/auditService.js';
import { sendSuccess } from '../utils/responseHelper.js';

export const getCandidates = async (req, res, next) => {
  try {
    const data = await candidateService.getCandidates(req.query);
    return sendSuccess(res, data, 'Candidates retrieved successfully');
  } catch (error) {
    next(error);
  }
};

export const getRecycleBin = async (req, res, next) => {
  try {
    const data = await candidateService.getRecycleBin(req.query);
    return sendSuccess(res, data, 'Recycle bin retrieved successfully');
  } catch (error) {
    next(error);
  }
};

export const getCandidate = async (req, res, next) => {
  try {
    const { id } = req.params;
    const includeDeleted = req.query.includeDeleted === 'true';
    const candidate = await candidateService.getCandidate(id, includeDeleted);
    return sendSuccess(res, candidate, 'Candidate details retrieved successfully');
  } catch (error) {
    next(error);
  }
};

export const createCandidate = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const candidate = await candidateService.createCandidate(req.body, userId, req);
    return sendSuccess(res, candidate, 'Candidate created successfully', 201);
  } catch (error) {
    next(error);
  }
};

export const updateCandidate = async (req, res, next) => {
  try {
    const { id } = req.params;
    const candidate = await candidateService.updateCandidate(id, req.body, req);
    return sendSuccess(res, candidate, 'Candidate updated successfully');
  } catch (error) {
    next(error);
  }
};

export const softDeleteCandidate = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    await candidateService.softDeleteCandidate(id, userId, req);
    return sendSuccess(res, {}, 'Candidate profile moved to Recycle Bin');
  } catch (error) {
    next(error);
  }
};

export const restoreCandidate = async (req, res, next) => {
  try {
    const { id } = req.params;
    await candidateService.restoreCandidate(id, req);
    return sendSuccess(res, {}, 'Candidate profile restored successfully');
  } catch (error) {
    next(error);
  }
};

export const hardDeleteCandidate = async (req, res, next) => {
  try {
    const { id } = req.params;
    await candidateService.hardDeleteCandidate(id, req);
    return sendSuccess(res, {}, 'Candidate permanently deleted');
  } catch (error) {
    next(error);
  }
};

export const importCandidates = async (req, res, next) => {
  try {
    if (!req.file) {
      throw new Error('Please upload an Excel file (.xlsx, .xls)');
    }

    const userId = req.user.id;
    const summary = await excelService.importCandidatesFromExcel(req.file.buffer, userId);

    await auditService.logActivity(
      req,
      'Excel Imported',
      `Imported talent sheet: ${summary.imported} candidates added, ${summary.duplicates} duplicates, ${summary.invalid} failed`,
      null,
      summary
    );

    return sendSuccess(res, summary, 'Talent pool sheet imported successfully');
  } catch (error) {
    next(error);
  }
};

export default {
  getCandidates,
  getRecycleBin,
  getCandidate,
  createCandidate,
  updateCandidate,
  softDeleteCandidate,
  restoreCandidate,
  hardDeleteCandidate,
  importCandidates
};
