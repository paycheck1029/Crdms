import { Storage } from '@google-cloud/storage';
import fs from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import { logError, logApp } from './loggerService.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const localUploadsDir = process.env.UPLOAD_DIR || join(__dirname, '..', 'uploads');

// Create local directory if it doesn't exist
if (!fs.existsSync(localUploadsDir)) {
  fs.mkdirSync(localUploadsDir, { recursive: true });
}

// Initialise GCS Storage client
let gcsStorage = null;
let gcsBucket = null;
const bucketName = process.env.STORAGE_BUCKET;

if (bucketName) {
  try {
    const config = {};
    if (process.env.GCP_PROJECT_ID) {
      config.projectId = process.env.GCP_PROJECT_ID;
    }
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      config.keyFilename = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    }
    
    gcsStorage = new Storage(config);
    gcsBucket = gcsStorage.bucket(bucketName);
    logApp(`[FileService] Initialised Google Cloud Storage bucket: ${bucketName}`);
  } catch (err) {
    logError(new Error(`[FileService] Failed to initialise Google Cloud Storage: ${err.message}`));
  }
}

// Allowed file settings
const ALLOWED_MIME_TYPES = {
  'application/pdf': 'pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'application/msword': 'doc',
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'text/plain': 'txt'
};

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export const validateFile = (file) => {
  if (!file) {
    throw new Error('No file provided');
  }

  // 1. Size Validation
  if (file.size > MAX_FILE_SIZE) {
    throw new Error('File size exceeds the 10MB limit');
  }

  // 2. MIME Type Validation
  const extension = ALLOWED_MIME_TYPES[file.mimetype];
  if (!extension) {
    throw new Error('Unsupported file type. Only PDF, DOC, DOCX, JPG, PNG, and TXT are allowed.');
  }

  return extension;
};

// Generates unique filename to prevent overwrites & path traversals
const generateUniqueFilename = (originalName, ext) => {
  const hash = crypto.randomBytes(16).toString('hex');
  const cleanName = originalName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
  return `doc-${hash}-${Date.now()}.${ext}`;
};

export const saveFile = async (file) => {
  const ext = validateFile(file);
  const uniqueName = generateUniqueFilename(file.originalname, ext);

  if (gcsBucket) {
    // Save to GCS
    logApp(`[FileService] Uploading file to GCS: ${uniqueName}`);
    const gcsFile = gcsBucket.file(`uploads/${uniqueName}`);
    
    await gcsFile.save(file.buffer, {
      metadata: { contentType: file.mimetype },
      resumable: false
    });

    // Make public or generate signed URL depending on auth (here we return relative path proxyable/linkable via backend)
    // We store the GCS path in file_path
    const filePath = `gcs://${bucketName}/uploads/${uniqueName}`;
    return {
      fileName: file.originalname,
      filePath,
      fileSize: file.size,
      mimeType: file.mimetype
    };
  } else {
    // Save locally
    logApp(`[FileService] Saving file locally: ${uniqueName}`);
    const filePath = join(localUploadsDir, uniqueName);
    
    // Save file buffer to local disk
    await fs.promises.writeFile(filePath, file.buffer);

    return {
      fileName: file.originalname,
      filePath: filePath, // Stores absolute path locally
      fileSize: file.size,
      mimeType: file.mimetype
    };
  }
};

export const deleteFile = async (filePath) => {
  if (filePath.startsWith('gcs://')) {
    if (!gcsBucket) {
      logError(new Error('[FileService] Cannot delete GCS file. GCS bucket is not configured.'));
      return;
    }

    const pathPart = filePath.replace(`gcs://${bucketName}/`, '');
    logApp(`[FileService] Deleting file from GCS: ${pathPart}`);
    const gcsFile = gcsBucket.file(pathPart);
    
    try {
      await gcsFile.delete();
    } catch (err) {
      logError(new Error(`[FileService] GCS file delete failed: ${err.message}`));
    }
  } else {
    // Delete local file
    logApp(`[FileService] Deleting local file: ${filePath}`);
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (err) {
      logError(new Error(`[FileService] Local file delete failed: ${err.message}`));
    }
  }
};

export const getFileReadStream = async (filePath) => {
  if (filePath.startsWith('gcs://')) {
    if (!gcsBucket) {
      throw new Error('GCS bucket is not configured.');
    }
    const pathPart = filePath.replace(`gcs://${bucketName}/`, '');
    return gcsBucket.file(pathPart).createReadStream();
  } else {
    if (!fs.existsSync(filePath)) {
      throw new Error('Local file not found.');
    }
    return fs.createReadStream(filePath);
  }
};

export default {
  validateFile,
  saveFile,
  deleteFile,
  getFileReadStream
};
