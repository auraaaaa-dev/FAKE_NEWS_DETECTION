const Claim = require('../models/claim');
const natural = require('natural');
const nlp = require('compromise');
const axios = require('axios');
const cheerio = require('cheerio');
const path = require('path');
const fs = require('fs');

// Initialize natural language processing tools
const tokenizer = new natural.WordTokenizer();
const stemmer = natural.PorterStemmer;

// Fake news detection keywords and patterns
const FAKE_NEWS_INDICATORS = [
  'breaking', 'shocking', 'you won\'t believe', 'doctors hate', 'one weird trick',
  'miracle cure', 'instant results', 'guaranteed', 'secret', 'exposed',
  'they don\'t want you to know', 'click here', 'urgent', 'alert',
  'warning', 'dangerous', 'banned', 'forbidden', 'conspiracy'
];

const REAL_NEWS_INDICATORS = [
  'according to', 'study shows', 'research indicates', 'official statement',
  'government report', 'peer-reviewed', 'journal', 'university', 'institution',
  'expert says', 'data shows', 'statistics', 'survey', 'analysis'
];

class ClaimController {
  constructor(db) {
    this.db = db;
  }

  // Preprocess text for NLP analysis
  preprocessText(text) {
    if (!text) return '';
    
    // Convert to lowercase
    let processed = text.toLowerCase();
    
    // Remove special characters but keep spaces
    processed = processed.replace(/[^\w\s]/g, ' ');
    
    // Tokenize and stem
    const tokens = tokenizer.tokenize(processed);
    const stemmedTokens = tokens.map(token => stemmer.stem(token));
    
    return stemmedTokens.join(' ');
  }

  // Extract text from URL
  async extractTextFromUrl(url) {
    try {
      const response = await axios.get(url, {
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      
      const $ = cheerio.load(response.data);
      
      // Remove script and style elements
      $('script, style').remove();
      
      // Extract text from common content selectors
      const contentSelectors = [
        'article', '.article', '.content', '.post', '.entry',
        'main', '.main', '[role="main"]', '.story', '.news'
      ];
      
      let extractedText = '';
      
      for (const selector of contentSelectors) {
        const element = $(selector).first();
        if (element.length > 0) {
          extractedText = element.text().trim();
          break;
        }
      }
      
      // Fallback to body text if no content found
      if (!extractedText) {
        extractedText = $('body').text().trim();
      }
      
      return extractedText.substring(0, 2000); // Limit to 2000 characters
    } catch (error) {
      console.error('Error extracting text from URL:', error.message);
      return null;
    }
  }

  // Analyze text using NLP
  analyzeText(text) {
    if (!text || text.trim().length < 10) {
      return {
        verdict: 'unverified',
        confidence: 0,
        analysis: {
          reason: 'Insufficient text for analysis',
          indicators: [],
          sentiment: 'neutral'
        }
      };
    }

    const processedText = this.preprocessText(text);
    const words = processedText.split(' ');
    
    // Check for fake news indicators
    const fakeIndicators = FAKE_NEWS_INDICATORS.filter(indicator => 
      processedText.includes(indicator.toLowerCase())
    );
    
    // Check for real news indicators
    const realIndicators = REAL_NEWS_INDICATORS.filter(indicator => 
      processedText.includes(indicator.toLowerCase())
    );

    // Sentiment analysis using compromise
    const doc = nlp(text);
    const sentiment = doc.sentiment();
    
    // Calculate confidence based on indicators
    let confidence = 0;
    let verdict = 'unverified';
    
    if (fakeIndicators.length > 0) {
      confidence = Math.min(0.8, fakeIndicators.length * 0.2);
      verdict = 'fake';
    } else if (realIndicators.length > 0) {
      confidence = Math.min(0.8, realIndicators.length * 0.2);
      verdict = 'real';
    } else {
      // Use sentiment and text characteristics
      if (sentiment.score < -0.3) {
        verdict = 'fake';
        confidence = 0.3;
      } else if (sentiment.score > 0.3) {
        verdict = 'real';
        confidence = 0.3;
      }
    }

    // Additional checks
    const exclamationCount = (text.match(/!/g) || []).length;
    const capsCount = (text.match(/[A-Z]/g) || []).length;
    const capsRatio = capsCount / text.length;
    
    if (exclamationCount > 3 || capsRatio > 0.3) {
      if (verdict === 'unverified') {
        verdict = 'fake';
        confidence = Math.max(confidence, 0.4);
      }
    }

    return {
      verdict,
      confidence: Math.round(confidence * 100) / 100,
      analysis: {
        fakeIndicators,
        realIndicators,
        sentiment: sentiment.score,
        exclamationCount,
        capsRatio,
        wordCount: words.length,
        reason: this.getAnalysisReason(verdict, fakeIndicators, realIndicators)
      }
    };
  }

  getAnalysisReason(verdict, fakeIndicators, realIndicators) {
    if (verdict === 'fake') {
      if (fakeIndicators.length > 0) {
        return `Contains suspicious language: ${fakeIndicators.join(', ')}`;
      }
      return 'Text characteristics suggest unreliable content';
    } else if (verdict === 'real') {
      if (realIndicators.length > 0) {
        return `Contains credible language: ${realIndicators.join(', ')}`;
      }
      return 'Text characteristics suggest reliable content';
    }
    return 'Insufficient indicators for classification';
  }

  // Create a new claim
  async createClaim(req, res) {
    try {
      const { text, link, mediaType } = req.body;
      let mediaUrl = '';
      
      // Handle file upload
      if (req.file) {
        mediaUrl = `/uploads/${req.file.filename}`;
      }

      if (!text && !link && !mediaUrl) {
        return res.status(400).json({ 
          error: 'At least one of text, link, or media must be provided' 
        });
      }

      let analysisText = text || '';
      
      // Extract text from link if provided
      if (link && !text) {
        const extractedText = await this.extractTextFromUrl(link);
        if (extractedText) {
          analysisText = extractedText;
        }
      }

      // Perform NLP analysis
      const nlpResult = this.analyzeText(analysisText);
      
      // Create claim object
      const claimData = {
        text: text || analysisText,
        link: link || '',
        mediaUrl,
        mediaType: mediaType || (req.file ? req.file.mimetype : ''),
        verdict: nlpResult.verdict,
        confidence: nlpResult.confidence,
        nlpAnalysis: nlpResult.analysis
      };

      const claim = new Claim(claimData);
      
      // Save to database
      this.db.get('claims').push(claim.toJSON()).write();
      
      res.status(201).json({
        success: true,
        claim: claim.toJSON()
      });
    } catch (error) {
      console.error('Error creating claim:', error);
      res.status(500).json({ 
        error: 'Internal server error',
        message: error.message 
      });
    }
  }

  // Get all claims
  async getAllClaims(req, res) {
    try {
      const claims = this.db.get('claims').value() || [];
      res.json({
        success: true,
        claims: claims.reverse() // Most recent first
      });
    } catch (error) {
      console.error('Error fetching claims:', error);
      res.status(500).json({ 
        error: 'Internal server error',
        message: error.message 
      });
    }
  }

  // Get single claim
  async getClaimById(req, res) {
    try {
      const { id } = req.params;
      const claim = this.db.get('claims').find({ id }).value();
      
      if (!claim) {
        return res.status(404).json({ 
          error: 'Claim not found' 
        });
      }
      
      res.json({
        success: true,
        claim
      });
    } catch (error) {
      console.error('Error fetching claim:', error);
      res.status(500).json({ 
        error: 'Internal server error',
        message: error.message 
      });
    }
  }

  // Flag a claim
  async flagClaim(req, res) {
    try {
      const { id } = req.params;
      const { notes, flaggedBy } = req.body;
      
      const claim = this.db.get('claims').find({ id });
      
      if (!claim.value()) {
        return res.status(404).json({ 
          error: 'Claim not found' 
        });
      }
      
      claim.assign({
        isFlagged: true,
        flagNotes: notes || '',
        flaggedBy: flaggedBy || 'anonymous',
        updatedAt: new Date().toISOString()
      }).write();
      
      res.json({
        success: true,
        claim: claim.value()
      });
    } catch (error) {
      console.error('Error flagging claim:', error);
      res.status(500).json({ 
        error: 'Internal server error',
        message: error.message 
      });
    }
  }

  // Unflag a claim
  async unflagClaim(req, res) {
    try {
      const { id } = req.params;
      
      const claim = this.db.get('claims').find({ id });
      
      if (!claim.value()) {
        return res.status(404).json({ 
          error: 'Claim not found' 
        });
      }
      
      claim.assign({
        isFlagged: false,
        flagNotes: '',
        flaggedBy: '',
        updatedAt: new Date().toISOString()
      }).write();
      
      res.json({
        success: true,
        claim: claim.value()
      });
    } catch (error) {
      console.error('Error unflagging claim:', error);
      res.status(500).json({ 
        error: 'Internal server error',
        message: error.message 
      });
    }
  }

  // Get statistics
  async getStats(req, res) {
    try {
      const claims = this.db.get('claims').value() || [];
      
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
  }
}

module.exports = ClaimController;
