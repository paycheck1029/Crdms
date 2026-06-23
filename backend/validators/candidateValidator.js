import { sendError } from '../utils/responseHelper.js';

export const validateCandidate = (req, res, next) => {
  const { name, email, skills, location, experience_years, status } = req.body;

  if (!name || !email || !skills || !location || experience_years === undefined || !status) {
    return sendError(res, 'Required fields: name, email, skills, location, experience_years, status', {}, 400);
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return sendError(res, 'Invalid email format', {}, 400);
  }

  if (isNaN(parseFloat(experience_years)) || parseFloat(experience_years) < 0) {
    return sendError(res, 'Experience years must be a positive number', {}, 400);
  }

  const validStatuses = ['Applied', 'Screening', 'Interviewing', 'Offered', 'Hired', 'Rejected', 'Selected', 'Joining', 'Pending'];
  if (!validStatuses.includes(status)) {
    return sendError(res, `Invalid status. Must be one of: ${validStatuses.join(', ')}`, {}, 400);
  }

  next();
};

export default {
  validateCandidate
};
