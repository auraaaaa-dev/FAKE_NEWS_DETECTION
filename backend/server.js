const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');

const app = express();
const PORT = process.env.PORT || 5000;

// Create data directory if it doesn't exist
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Initialize database
const adapter = new FileSync(path.join(__dirname, 'data/db.json'));
const db = low(adapter);

// Set default database structure
db.defaults({
  claims: [],
  stats: {
    total: 0,
    fake: 0,
    real: 0,
    unverified: 0,
    flagged: 0
  }
}).write();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/claims', require('./routes/claims')(db));

// Stats endpoint
app.get('/api/stats', async (req, res) => {
  try {
    const claims = db.get('claims').value() || [];
    
    const stats = {
      total: claims.length,
      fake: claims.filter(c => c.verdict === 'fake').length,
      real: claims.filter(c => c.verdict === 'real').length,
      unverified: claims.filter(c => c.verdict === 'unverified').length,
      flagged: claims.filter(c => c.isFlagged).length,
      averageConfidence: claims.length > 0 
        ? Math.round(claims.reduce((sum, c) => sum + c.confidence, 0) / claims.length * 100) / 100
        : 0
    };
    
    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Fake News Detection API is running',
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Error:', error);
  
  if (error.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      error: 'File too large',
      message: 'File size must be less than 10MB'
    });
  }
  
  if (error.message === 'Only image and video files are allowed') {
    return res.status(400).json({
      error: 'Invalid file type',
      message: 'Only image and video files are allowed'
    });
  }
  
  res.status(500).json({
    error: 'Internal server error',
    message: error.message
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not found',
    message: 'The requested endpoint does not exist'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Fake News Detection API running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`📈 Stats: http://localhost:${PORT}/api/stats`);
  console.log(`📝 Claims: http://localhost:${PORT}/api/claims`);
});

module.exports = app;
