import { useState, useRef } from 'react';
import { scanFile } from '../../services/ocrService';
import { analyzeOCRContent } from '../../services/groqService';
import './OCRScanner.css';

export default function OCRScanner() {
  const [file, setFile] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  const handleFile = (f) => {
    setFile(f);
    setResult(null);
    setAnalysis(null);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0]);
  };

  const handleScan = async () => {
    if (!file) return;
    setScanning(true);
    setProgress(0);
    try {
      const scanResult = await scanFile(file, (p) => setProgress(p));
      setResult(scanResult);
    } catch (err) {
      alert('OCR Error: ' + err.message);
    } finally {
      setScanning(false);
    }
  };

  const handleAnalyze = async () => {
    if (!result?.text) return;
    setAnalyzing(true);
    try {
      const ai = await analyzeOCRContent(result.text, 'UPSC study material');
      setAnalysis(ai);
    } catch (err) {
      alert('Analysis Error: ' + err.message);
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="ocr-module animate-fade-in">
      <div className="ocr-header">
        <h1>📷 OCR Scanner</h1>
        <p className="ocr-desc">
          Upload images or PDFs — extract text using OCR (Tesseract.js) and get AI-powered analysis and study suggestions.
        </p>
      </div>

      {/* Upload Area */}
      <div
        className={`ocr-upload-area glass-card ${dragActive ? 'drag-active' : ''}`}
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,.pdf"
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          style={{ display: 'none' }}
        />
        <div className="upload-content">
          <span className="upload-icon">{file ? '📄' : '☁️'}</span>
          {file ? (
            <div className="file-info">
              <span className="file-name">{file.name}</span>
              <span className="file-size">{(file.size / 1024).toFixed(1)} KB</span>
            </div>
          ) : (
            <>
              <h3>Drop your file here or click to upload</h3>
              <p>Supports: PNG, JPEG, BMP, GIF, TIFF, WebP, PDF</p>
            </>
          )}
        </div>
      </div>

      {/* Scan Button */}
      {file && !result && (
        <div className="ocr-actions">
          <button className="btn btn-primary btn-lg" onClick={handleScan} disabled={scanning}>
            {scanning ? (
              <>
                <span className="spinner"></span> Scanning... {progress}%
              </>
            ) : (
              '🔍 Start OCR Scan'
            )}
          </button>
        </div>
      )}

      {/* Progress Bar */}
      {scanning && (
        <div className="ocr-progress glass-card">
          <div className="progress-info">
            <span>Processing...</span>
            <span>{progress}%</span>
          </div>
          <div className="progress-bar">
            <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="ocr-results animate-slide-up">
          {/* Stats */}
          <div className="ocr-stats">
            <div className="ocr-stat glass-card">
              <span className="stat-label">Words</span>
              <span className="stat-value">{result.words}</span>
            </div>
            <div className="ocr-stat glass-card">
              <span className="stat-label">Confidence</span>
              <span className="stat-value">{Math.round(result.confidence)}%</span>
            </div>
            {result.pages && (
              <div className="ocr-stat glass-card">
                <span className="stat-label">Pages</span>
                <span className="stat-value">{result.pages}</span>
              </div>
            )}
          </div>

          {/* Extracted Text */}
          <div className="ocr-text-section glass-card">
            <div className="ocr-text-header">
              <h3>📝 Extracted Text</h3>
              <button
                className="btn btn-sm btn-secondary"
                onClick={() => navigator.clipboard.writeText(result.text)}
              >
                📋 Copy
              </button>
            </div>
            <textarea
              className="textarea ocr-textarea"
              value={result.text}
              onChange={(e) => setResult({ ...result, text: e.target.value })}
              rows={12}
            />
          </div>

          {/* AI Analysis Button */}
          <div className="ocr-actions">
            <button className="btn btn-primary btn-lg" onClick={handleAnalyze} disabled={analyzing}>
              {analyzing ? (
                <>
                  <span className="spinner"></span> Analyzing...
                </>
              ) : (
                '🤖 Analyze with AI'
              )}
            </button>
            <button
              className="btn btn-secondary btn-lg"
              onClick={() => {
                setFile(null);
                setResult(null);
                setAnalysis(null);
              }}
            >
              🔄 Scan Another
            </button>
          </div>

          {/* AI Analysis Results */}
          {analysis && (
            <div className="ocr-analysis glass-card animate-scale-in">
              <h3>🤖 AI Analysis</h3>

              {analysis.summary && (
                <div className="analysis-section">
                  <h4>📋 Summary</h4>
                  <p>{analysis.summary}</p>
                </div>
              )}

              {analysis.keyTopics?.length > 0 && (
                <div className="analysis-section">
                  <h4>🏷️ Key Topics</h4>
                  <div className="topics-tags">
                    {analysis.keyTopics.map((t, i) => (
                      <span key={i} className="badge badge-primary">{t}</span>
                    ))}
                  </div>
                </div>
              )}

              {analysis.relevantForUPSC !== undefined && (
                <div className="analysis-section">
                  <h4>🎯 UPSC Relevance</h4>
                  <span className={`badge ${analysis.relevantForUPSC ? 'badge-success' : 'badge-warning'}`}>
                    {analysis.relevantForUPSC ? '✅ Relevant for UPSC' : '⚠️ Limited relevance'}
                  </span>
                </div>
              )}

              {analysis.suggestedQuestions?.length > 0 && (
                <div className="analysis-section">
                  <h4>❓ Possible Questions</h4>
                  <ul>
                    {analysis.suggestedQuestions.map((q, i) => (
                      <li key={i}>{q}</li>
                    ))}
                  </ul>
                </div>
              )}

              {analysis.studyTips?.length > 0 && (
                <div className="analysis-section">
                  <h4>💡 Study Tips</h4>
                  <ul>
                    {analysis.studyTips.map((t, i) => (
                      <li key={i}>{t}</li>
                    ))}
                  </ul>
                </div>
              )}

              {analysis.relatedTopics?.length > 0 && (
                <div className="analysis-section">
                  <h4>🔗 Related Topics</h4>
                  <div className="topics-tags">
                    {analysis.relatedTopics.map((t, i) => (
                      <span key={i} className="badge badge-info">{t}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
