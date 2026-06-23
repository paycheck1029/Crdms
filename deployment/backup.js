import { exec } from 'child_process';
import { Storage } from '@google-cloud/storage';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import dbConfig from '../backend/config/dbConfig.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const tempDir = join(__dirname, 'temp_backups');

if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

const GCS_BUCKET = process.env.GCS_BUCKET_NAME;
const RETENTION_DAYS = parseInt(process.env.BACKUP_RETENTION_DAYS || '30', 10);

const runBackup = async () => {
  console.log('--- STARTING AUTOMATED DATABASE BACKUP ---');

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFilename = `backup-${dbConfig.database}-${timestamp}.sql.gz`;
  const tempFilePath = join(tempDir, backupFilename);

  // 1. Execute mysqldump compressed directly with gzip
  // Wrap password in quotes to avoid shell escape issues
  const dumpCommand = `mysqldump --host=${dbConfig.host} --port=${dbConfig.port} --user=${dbConfig.user} --password="${dbConfig.password}" ${dbConfig.database} | gzip > "${tempFilePath}"`;

  console.log(`Executing database dump: ${backupFilename}...`);

  exec(dumpCommand, async (error, stdout, stderr) => {
    if (error) {
      console.error(`❌ Backup dump failed: ${error.message}`);
      process.exit(1);
    }

    console.log('✓ SQL dump completed and compressed.');

    // 2. Upload to Google Cloud Storage if GCS_BUCKET is set
    if (GCS_BUCKET) {
      try {
        console.log(`Uploading backup to GCS Bucket: ${GCS_BUCKET}...`);
        const storageConfig = {};
        if (process.env.GCP_PROJECT_ID) {
          storageConfig.projectId = process.env.GCP_PROJECT_ID;
        }
        if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
          storageConfig.keyFilename = process.env.GOOGLE_APPLICATION_CREDENTIALS;
        }

        const storage = new Storage(storageConfig);
        const bucket = storage.bucket(GCS_BUCKET);
        
        await bucket.upload(tempFilePath, {
          destination: `backups/${backupFilename}`,
          resumable: false
        });

        console.log(`✓ Backup successfully uploaded to GCS: backups/${backupFilename}`);

        // 3. Clean up GCS backups older than retention policy
        console.log(`Pruning GCS backups older than ${RETENTION_DAYS} days...`);
        const [files] = await bucket.getFiles({ prefix: 'backups/backup-' });
        
        const now = Date.now();
        const retentionMs = RETENTION_DAYS * 24 * 60 * 60 * 1000;
        let deletedCount = 0;

        for (const file of files) {
          const [metadata] = await file.getMetadata();
          const createdTime = new Date(metadata.timeCreated).getTime();
          
          if (now - createdTime > retentionMs) {
            console.log(`Deleting expired backup from GCS: ${file.name}...`);
            await file.delete();
            deletedCount++;
          }
        }
        console.log(`✓ GCS cleanup completed. Deleted: ${deletedCount} files.`);

      } catch (gcsErr) {
        console.error(`❌ GCS Upload/Cleanup failed: ${gcsErr.message}`);
      }
    } else {
      console.log('⚠️ STORAGE_BUCKET not configured. Backup saved only on local disk: ' + tempFilePath);
    }

    // If GCS upload was successful, clean up the local temp backup file
    if (GCS_BUCKET) {
      try {
        fs.unlinkSync(tempFilePath);
        console.log('✓ Local temporary file deleted.');
      } catch (err) {
        // Continue
      }
    }

    console.log('--- DATABASE BACKUP PROCESS COMPLETED ---');
    process.exit(0);
  });
};

runBackup();
