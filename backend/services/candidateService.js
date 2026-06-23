import candidateRepository from '../repositories/candidateRepository.js';
import timelineRepository from '../repositories/timelineRepository.js';
import documentRepository from '../repositories/documentRepository.js';
import auditService from './auditService.js';
import fs from 'fs';

export const getCandidates = async (params = {}) => {
  const candidates = await candidateRepository.findActive(params);
  const total = await candidateRepository.countActive(params);
  const limit = parseInt(params.limit || '20', 10);
  const page = parseInt(params.page || '1', 10);

  return {
    candidates,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };
};

export const getRecycleBin = async (params = {}) => {
  const candidates = await candidateRepository.findDeleted(params);
  const total = await candidateRepository.countDeleted(params);
  const limit = parseInt(params.limit || '20', 10);
  const page = parseInt(params.page || '1', 10);

  return {
    candidates,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };
};

export const getCandidate = async (id, includeDeleted = false) => {
  const candidate = await candidateRepository.findById(id, includeDeleted);
  if (!candidate) {
    throw new Error('Candidate not found');
  }

  // Attach documents
  candidate.documents = await documentRepository.findByCandidateId(id);

  // Attach timeline
  candidate.timeline = await timelineRepository.findByCandidateId(id);

  return candidate;
};

export const createCandidate = async (candidateData, userId, req) => {
  const result = await candidateRepository.create(candidateData);
  const newCandidateId = result.id;

  // Add timeline event
  await timelineRepository.create({
    candidateId: newCandidateId,
    event: 'Created',
    details: `Candidate profile created with initial status '${candidateData.status}'.`,
    performedBy: userId
  });

  const createdCandidate = await candidateRepository.findById(newCandidateId);

  // Audit activity
  if (req) {
    await auditService.logActivity(
      req, 
      'Candidate Created', 
      `Added candidate profile: ${candidateData.name} (${candidateData.email})`,
      null,
      createdCandidate
    );
  }

  return createdCandidate;
};

export const updateCandidate = async (id, candidateData, req) => {
  const oldCandidate = await candidateRepository.findById(id);
  if (!oldCandidate) {
    throw new Error('Candidate not found');
  }

  const userId = req && req.user ? req.user.id : null;

  await candidateRepository.update(id, candidateData);
  const updatedCandidate = await candidateRepository.findById(id);

  // Timeline check for status updates
  if (candidateData.status && candidateData.status !== oldCandidate.status) {
    let timelineEvent = 'Updated';
    if (candidateData.status === 'Interviewing') timelineEvent = 'Interview Scheduled';
    if (candidateData.status === 'Offered') timelineEvent = 'Offer Sent';
    if (candidateData.status === 'Hired') timelineEvent = 'Hired';
    if (candidateData.status === 'Rejected') timelineEvent = 'Rejected';

    await timelineRepository.create({
      candidateId: id,
      event: timelineEvent,
      details: `Status changed from '${oldCandidate.status}' to '${candidateData.status}'.`,
      performedBy: userId
    });
  } else {
    // Standard update timeline event
    await timelineRepository.create({
      candidateId: id,
      event: 'Updated',
      details: 'Candidate details updated.',
      performedBy: userId
    });
  }

  // Audit activity
  if (req) {
    await auditService.logActivity(
      req,
      'Candidate Updated',
      `Modified details for candidate: ${oldCandidate.name}`,
      oldCandidate,
      updatedCandidate
    );
  }

  return updatedCandidate;
};

export const softDeleteCandidate = async (id, userId, req) => {
  const candidate = await candidateRepository.findById(id);
  if (!candidate) {
    throw new Error('Candidate not found');
  }

  await candidateRepository.softDelete(id, userId);

  await timelineRepository.create({
    candidateId: id,
    event: 'Updated',
    details: 'Candidate profile moved to Recycle Bin.',
    performedBy: userId
  });

  if (req) {
    await auditService.logActivity(
      req,
      'Candidate Deleted',
      `Moved candidate ${candidate.name} to Recycle Bin`,
      candidate,
      { ...candidate, deleted_at: new Date(), deleted_by: userId }
    );
  }

  return { success: true };
};

export const restoreCandidate = async (id, req) => {
  const candidate = await candidateRepository.findById(id, true); // Search deleted candidate too
  if (!candidate) {
    throw new Error('Candidate not found');
  }

  const userId = req && req.user ? req.user.id : null;

  await candidateRepository.restore(id);

  await timelineRepository.create({
    candidateId: id,
    event: 'Updated',
    details: 'Candidate profile restored from Recycle Bin.',
    performedBy: userId
  });

  if (req) {
    await auditService.logActivity(
      req,
      'Candidate Restored',
      `Restored candidate ${candidate.name} from Recycle Bin`,
      candidate,
      { ...candidate, deleted_at: null, deleted_by: null }
    );
  }

  return { success: true };
};

export const hardDeleteCandidate = async (id, req) => {
  const candidate = await candidateRepository.findById(id, true);
  if (!candidate) {
    throw new Error('Candidate not found');
  }

  // Delete local document files first
  const documents = await documentRepository.findByCandidateId(id);
  documents.forEach(doc => {
    try {
      if (fs.existsSync(doc.file_path)) {
        fs.unlinkSync(doc.file_path);
      }
    } catch (err) {
      // Gracefully continue
    }
  });

  await candidateRepository.hardDelete(id);

  if (req) {
    await auditService.logActivity(
      req,
      'Candidate Hard Deleted',
      `Permanently deleted candidate profile and resumes for: ${candidate.name}`,
      candidate,
      null
    );
  }

  return { success: true };
};

export default {
  getCandidates,
  getRecycleBin,
  getCandidate,
  createCandidate,
  updateCandidate,
  softDeleteCandidate,
  restoreCandidate,
  hardDeleteCandidate
};
