import fileService from '../services/fileService.js';
import documentRepository from '../repositories/documentRepository.js';
import candidateRepository from '../repositories/candidateRepository.js';
import timelineRepository from '../repositories/timelineRepository.js';
import auditService from '../services/auditService.js';
import { sendSuccess, sendError } from '../utils/responseHelper.js';

export const uploadCandidateDocument = async (req, res, next) => {
  try {
    const { candidate_id } = req.body;
    if (!candidate_id || !req.file) {
      throw new Error('Candidate ID and file attachment are required');
    }

    const candidate = await candidateRepository.findById(candidate_id);
    if (!candidate) {
      throw new Error('Candidate profile not found');
    }

    // Save file locally or in GCS
    const savedFile = await fileService.saveFile(req.file);

    // Save record to DB
    const result = await documentRepository.create({
      candidateId: candidate_id,
      fileName: savedFile.fileName,
      filePath: savedFile.filePath,
      fileSize: savedFile.fileSize,
      mimeType: savedFile.mimeType
    });

    const userId = req.user.id;

    // Timeline event
    await timelineRepository.create({
      candidateId: candidate_id,
      event: 'Updated',
      details: `Uploaded file '${savedFile.fileName}' to candidate profile.`,
      performedBy: userId
    });

    // Audit logs
    await auditService.logActivity(
      req,
      'Candidate Updated',
      `Uploaded file: ${savedFile.fileName} for candidate ${candidate.name}`
    );

    return sendSuccess(res, {
      id: result.id,
      candidate_id,
      file_name: savedFile.fileName,
      file_size: savedFile.fileSize,
      mime_type: savedFile.mimeType
    }, 'File uploaded successfully', 201);
  } catch (error) {
    next(error);
  }
};

export const downloadDocument = async (req, res, next) => {
  try {
    const { id } = req.params;
    const doc = await documentRepository.findById(id);
    
    if (!doc) {
      return sendError(res, 'Document not found', {}, 404);
    }

    const candidate = await candidateRepository.findById(doc.candidate_id, true);

    // Stream read file
    const fileStream = await fileService.getFileReadStream(doc.file_path);

    // Set headers
    res.setHeader('Content-Type', doc.mime_type);
    res.setHeader('Content-Disposition', `attachment; filename="${doc.file_name}"`);

    // Audit Download
    await auditService.logActivity(
      req,
      'Resume Downloaded',
      `Downloaded file: ${doc.file_name} for candidate ${candidate ? candidate.name : 'Unknown'}`
    );

    fileStream.pipe(res);
  } catch (error) {
    next(error);
  }
};

export const deleteDocument = async (req, res, next) => {
  try {
    const { id } = req.params;
    const doc = await documentRepository.findById(id);
    if (!doc) {
      return sendError(res, 'Document not found', {}, 404);
    }

    const candidate = await candidateRepository.findById(doc.candidate_id);
    const userId = req.user.id;

    // Delete actual file
    await fileService.deleteFile(doc.file_path);

    // Delete DB record
    await documentRepository.deleteDoc(id);

    // Timeline event
    await timelineRepository.create({
      candidateId: doc.candidate_id,
      event: 'Updated',
      details: `Deleted file '${doc.file_name}' from candidate profile.`,
      performedBy: userId
    });

    // Audit logs
    await auditService.logActivity(
      req,
      'Candidate Updated',
      `Deleted file: ${doc.file_name} from candidate ${candidate ? candidate.name : 'Unknown'}`
    );

    return sendSuccess(res, {}, 'Document deleted successfully');
  } catch (error) {
    next(error);
  }
};

export default {
  uploadCandidateDocument,
  downloadDocument,
  deleteDocument
};
