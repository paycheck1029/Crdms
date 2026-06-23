import auditService from '../services/auditService.js';
import { sendSuccess } from '../utils/responseHelper.js';

export const getActivityLogs = async (req, res, next) => {
  try {
    const data = await auditService.listLogs(req.query);
    return sendSuccess(res, data, 'Activity logs retrieved successfully');
  } catch (error) {
    next(error);
  }
};

export default {
  getActivityLogs
};
