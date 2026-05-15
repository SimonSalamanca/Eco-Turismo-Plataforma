const sharp = require('sharp');
const path = require('path');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');
const env = require('../config/env');

const uploadDir = path.join(__dirname, '../../uploads');

const ensureUploadDir = async () => {
  try {
    await fs.access(uploadDir);
  } catch {
    await fs.mkdir(uploadDir, { recursive: true });
  }
};

const processImage = async (buffer, filename) => {
  const id = uuidv4();
  const outputName = `${id}.webp`;
  const outputPath = path.join(uploadDir, outputName);

  await sharp(buffer)
    .resize(1200, 800, { fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 80 })
    .toFile(outputPath);

  return {
    filename: outputName,
    path: outputPath,
    url: `/uploads/${outputName}`
  };
};

const handleUpload = async (req, res, next) => {
  try {
    console.log('[handleUpload] req.files:', req.files ? req.files.length : 0);
    await ensureUploadDir();

    if (!req.files || req.files.length === 0) {
      console.log('[handleUpload] No files provided');
      return res.status(400).json({
        success: false,
        error: {
          code: 'NO_FILES',
          message: 'No se proporcionaron archivos'
        }
      });
    }

    console.log('[handleUpload] Processing', req.files.length, 'files');
    console.log('[handleUpload] env.upload.maxSize:', env.upload.maxSize);

    const processedImages = await Promise.all(
      req.files.map(async (file) => {
        console.log('[handleUpload] File:', file.originalname, 'size:', file.size, 'mimetype:', file.mimetype);
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
        if (!allowedTypes.includes(file.mimetype)) {
          throw new Error(`Tipo de archivo no permitido: ${file.mimetype}`);
        }

        if (file.size > env.upload.maxSize) {
          throw new Error(`El archivo excede el tamaño máximo de ${env.upload.maxSize / 1024 / 1024}MB`);
        }

        return processImage(file.buffer, file.originalname);
      })
    );

    req.uploadedFiles = processedImages;
    next();
  } catch (error) {
    console.log('[handleUpload] Error:', error.message);
    res.status(400).json({
      success: false,
      error: {
        code: 'UPLOAD_ERROR',
        message: error.message
      }
    });
  }
};

const deleteFile = async (filename) => {
  try {
    const filePath = path.join(uploadDir, filename);
    await fs.unlink(filePath);
    return true;
  } catch (error) {
    console.error('Error deleting file:', error.message);
    return false;
  }
};

module.exports = {
  handleUpload,
  deleteFile,
  ensureUploadDir
};