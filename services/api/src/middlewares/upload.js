import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import multer from 'multer';
import env from '../config/env.js';
import AppError from '../lib/AppError.js';

// Product images are written to the shared `uploads` volume, served by nginx at /uploads/.
const dir = path.join(env.uploadsDir, 'products');
const EXT = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp' };

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (_req, file, cb) => cb(null, `${crypto.randomUUID()}${EXT[file.mimetype]}`),
});

export const uploadImages = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024, files: 10 },
  fileFilter: (_req, file, cb) =>
    EXT[file.mimetype]
      ? cb(null, true)
      : cb(AppError.badRequest('Chỉ chấp nhận ảnh JPG, PNG hoặc WEBP', undefined, 'INVALID_FILE')),
}).array('images', 10);

export const publicUrl = (filename) => `/uploads/products/${filename}`;
