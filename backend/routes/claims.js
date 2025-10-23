const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: function (req, file, cb) {
    // Allow images and videos
    const allowedTypes = /jpeg|jpg|png|gif|mp4|avi|mov|webm/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image and video files are allowed'));
    }
  }
});

module.exports = (db) => {
  const ClaimController = require('../controllers/claimController');
  const claimController = new ClaimController(db);

  // POST /api/claims - Create a new claim
  router.post('/', upload.single('media'), async (req, res) => {
    await claimController.createClaim(req, res);
  });

  // GET /api/claims - Get all claims
  router.get('/', async (req, res) => {
    await claimController.getAllClaims(req, res);
  });

  // GET /api/claims/:id - Get a single claim
  router.get('/:id', async (req, res) => {
    await claimController.getClaimById(req, res);
  });

  // POST /api/claims/:id/flag - Flag a claim
  router.post('/:id/flag', async (req, res) => {
    await claimController.flagClaim(req, res);
  });

  // DELETE /api/claims/:id/flag - Unflag a claim
  router.delete('/:id/flag', async (req, res) => {
    await claimController.unflagClaim(req, res);
  });

  return router;
};
