const express = require('express');
const multer = require('multer');
const authMiddleware = require('../middleware/authMiddleware');
const {
  getDocuments,
  uploadDocument,
  deleteDocument,
} = require('../controllers/documentController');

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
  fileFilter: (req, file, callback) => {
    const allowedMimeTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/webp',
    ];

    if (!allowedMimeTypes.includes(file.mimetype)) {
      callback(new Error('Only PDF, JPG, PNG, and WEBP documents are supported.'));
      return;
    }

    callback(null, true);
  },
});

router.use(authMiddleware);

router.get('/', getDocuments);
router.post('/', upload.single('document'), uploadDocument);
router.delete('/:documentId', deleteDocument);

module.exports = router;
