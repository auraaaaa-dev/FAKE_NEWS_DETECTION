const { v4: uuidv4 } = require('uuid');

class Claim {
  constructor(data) {
    this.id = data.id || uuidv4();
    this.text = data.text || '';
    this.link = data.link || '';
    this.mediaUrl = data.mediaUrl || '';
    this.mediaType = data.mediaType || '';
    this.verdict = data.verdict || 'unverified'; // 'real', 'fake', 'unverified'
    this.confidence = data.confidence || 0;
    this.nlpAnalysis = data.nlpAnalysis || {};
    this.isFlagged = data.isFlagged || false;
    this.flagNotes = data.flagNotes || '';
    this.flaggedBy = data.flaggedBy || '';
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = data.updatedAt || new Date().toISOString();
  }

  toJSON() {
    return {
      id: this.id,
      text: this.text,
      link: this.link,
      mediaUrl: this.mediaUrl,
      mediaType: this.mediaType,
      verdict: this.verdict,
      confidence: this.confidence,
      nlpAnalysis: this.nlpAnalysis,
      isFlagged: this.isFlagged,
      flagNotes: this.flagNotes,
      flaggedBy: this.flaggedBy,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  updateVerdict(verdict, confidence, nlpAnalysis) {
    this.verdict = verdict;
    this.confidence = confidence;
    this.nlpAnalysis = nlpAnalysis;
    this.updatedAt = new Date().toISOString();
  }

  flag(notes, flaggedBy) {
    this.isFlagged = true;
    this.flagNotes = notes;
    this.flaggedBy = flaggedBy;
    this.updatedAt = new Date().toISOString();
  }

  unflag() {
    this.isFlagged = false;
    this.flagNotes = '';
    this.flaggedBy = '';
    this.updatedAt = new Date().toISOString();
  }
}

module.exports = Claim;
