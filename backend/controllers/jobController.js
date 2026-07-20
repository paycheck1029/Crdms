import jobRepository from '../repositories/jobRepository.js';
import auditService from '../services/auditService.js';
import { sendSuccess, sendError } from '../utils/responseHelper.js';

export const createJob = async (req, res, next) => {
  try {
    const { title, description, requirements, location, salaryRange } = req.body;
    const createdBy = req.user.id;

    if (!title || !description || !location) {
      return sendError(res, 'Title, description, and location are required fields.', {}, 400);
    }

    const result = await jobRepository.create({
      title,
      description,
      requirements,
      location,
      salaryRange,
      createdBy
    });

    const newJob = await jobRepository.findById(result.id);

    await auditService.logActivity(
      req,
      'Job Created',
      `Created job posting request: "${title}" (Status: Pending)`,
      null,
      newJob
    );

    return sendSuccess(res, newJob, 'Job posting request created successfully and is pending approval.', 201);
  } catch (error) {
    next(error);
  }
};

export const getJobs = async (req, res, next) => {
  try {
    const role = req.user.role;
    let jobs = [];

    if (role === 'Admin' || role === 'IT Team') {
      jobs = await jobRepository.listAll();
    } else if (role === 'Recruiter') {
      jobs = await jobRepository.listByCreator(req.user.id);
    } else {
      jobs = await jobRepository.listApproved();
    }

    return sendSuccess(res, jobs, 'Jobs retrieved successfully');
  } catch (error) {
    next(error);
  }
};

export const getPublicJobs = async (req, res, next) => {
  try {
    const jobs = await jobRepository.listApproved();
    return sendSuccess(res, jobs, 'Approved jobs retrieved successfully');
  } catch (error) {
    next(error);
  }
};

export const getJobById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const job = await jobRepository.findById(id);

    if (!job) {
      return sendError(res, 'Job posting not found.', {}, 404);
    }

    return sendSuccess(res, job, 'Job details retrieved successfully');
  } catch (error) {
    next(error);
  }
};

export const approveJob = async (req, res, next) => {
  try {
    const { id } = req.params;
    const job = await jobRepository.findById(id);

    if (!job) {
      return sendError(res, 'Job posting not found.', {}, 404);
    }

    const oldJob = { ...job };
    await jobRepository.updateStatus(id, 'Active');
    const updatedJob = await jobRepository.findById(id);

    await auditService.logActivity(
      req,
      'Job Approved',
      `Approved job posting: "${job.title}" (Status set to Active)`,
      oldJob,
      updatedJob
    );

    return sendSuccess(res, updatedJob, 'Job posting approved successfully.');
  } catch (error) {
    next(error);
  }
};

export const rejectJob = async (req, res, next) => {
  try {
    const { id } = req.params;
    const job = await jobRepository.findById(id);

    if (!job) {
      return sendError(res, 'Job posting not found.', {}, 404);
    }

    const oldJob = { ...job };
    await jobRepository.updateStatus(id, 'Rejected');
    const updatedJob = await jobRepository.findById(id);

    await auditService.logActivity(
      req,
      'Job Rejected',
      `Rejected job posting: "${job.title}" (Status set to Rejected)`,
      oldJob,
      updatedJob
    );

    return sendSuccess(res, updatedJob, 'Job posting rejected successfully.');
  } catch (error) {
    next(error);
  }
};

export const deleteJob = async (req, res, next) => {
  try {
    const { id } = req.params;
    const job = await jobRepository.findById(id);

    if (!job) {
      return sendError(res, 'Job posting not found.', {}, 404);
    }

    if (req.user.role !== 'Admin' && req.user.id !== job.created_by) {
      return sendError(res, 'Unauthorized to delete this job posting.', {}, 403);
    }

    await jobRepository.deleteJob(id);

    await auditService.logActivity(
      req,
      'Job Deleted',
      `Deleted job posting: "${job.title}"`,
      job,
      null
    );

    return sendSuccess(res, {}, 'Job posting deleted successfully.');
  } catch (error) {
    next(error);
  }
};

export default {
  createJob,
  getJobs,
  getPublicJobs,
  getJobById,
  approveJob,
  rejectJob,
  deleteJob
};
