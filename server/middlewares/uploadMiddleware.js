const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowedImageTypes = /jpeg|jpg|png/;
  const allowedDocTypes = /pdf/;
  const ext = path.extname(file.originalname).toLowerCase().replace('.', '');
  const mimetype = file.mimetype.toLowerCase();

  if (
    allowedImageTypes.test(ext) ||
    allowedDocTypes.test(ext) ||
    mimetype === 'application/pdf' ||
    mimetype.startsWith('image/')
  ) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type: ${file.originalname}. Only JPG, JPEG, PNG, and PDF files are allowed.`));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10 MB per file
  }
});

module.exports = { upload };
