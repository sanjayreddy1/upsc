import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { scanFile } from '../../services/ocrService';
import { formatCustomSyllabus } from '../../services/groqService';
import './UploadSyllabus.css';

export default function UploadSyllabus() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isSaved, setIsSaved] = useState(false);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [formatting, setFormatting] = useState(false);
  const [viewMode, setViewMode] = useState(false);

  useEffect(() => {
    try {
      const existing = localStorage.getItem('custom_syllabus');
      if (existing) {
        const parsed = JSON.parse(existing);
        setTitle(parsed.title || '');
        setContent(parsed.content || '');
        if (parsed.content) setViewMode(true);
      }
    } catch (e) {
      console.warn('Failed to load syllabus', e);
    }
  }, []);

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) {
      alert('Please provide both a title and the syllabus content.');
      return;
    }

    setFormatting(true);
    try {
      const formatted = await formatCustomSyllabus(content.trim());
      setContent(formatted);
      localStorage.setItem(
        'custom_syllabus',
        JSON.stringify({ title: title.trim(), content: formatted })
      );
      setIsSaved(true);
      setViewMode(true);
      setTimeout(() => setIsSaved(false), 3000);
    } catch (err) {
      alert('Failed to format syllabus: ' + err.message);
      // Save raw if AI fails
      localStorage.setItem(
        'custom_syllabus',
        JSON.stringify({ title: title.trim(), content: content.trim() })
      );
      setIsSaved(true);
      setViewMode(true);
      setTimeout(() => setIsSaved(false), 3000);
    } finally {
      setFormatting(false);
    }
  };

  const handleClear = () => {
    localStorage.removeItem('custom_syllabus');
    setTitle('');
    setContent('');
    setViewMode(false);
  };

  const handleEdit = () => {
    setViewMode(false);
  };

  const handleOCRUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setOcrLoading(true);
    setOcrProgress(0);
    try {
      const result = await scanFile(file, (p) => setOcrProgress(p));
      setContent((prev) => (prev ? prev + '\n' + result.text : result.text));
    } catch (err) {
      alert('OCR Error: ' + err.message);
    } finally {
      setOcrLoading(false);
    }
  };

  return (
    <div className="upload-syllabus animate-fade-in">
      <div className="syllabus-header">
        <h1>📑 Custom Syllabus</h1>
        <p className="syllabus-desc">
          Upload or paste your own syllabus topics. Once saved, the AI will prioritize generating questions from this syllabus.
        </p>
      </div>

      <div className="syllabus-container glass-card">
        {viewMode ? (
          <div className="syllabus-view-mode">
            <div className="sv-header">
              <h2>{title}</h2>
              <div className="sv-actions">
                <button className="btn btn-sm btn-secondary" onClick={handleEdit}>✏️ Edit</button>
                <button className="btn btn-sm btn-danger" onClick={handleClear}>🗑️ Clear</button>
              </div>
            </div>
            <div className="sv-content">
              <ReactMarkdown>{content}</ReactMarkdown>
            </div>
          </div>
        ) : (
          <>
            <div className="form-group">
              <label>Syllabus Title (e.g., 'Modern Indian History 1857-1947')</label>
              <input
                type="text"
                className="form-input"
                placeholder="Enter syllabus title..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Syllabus Content</label>
              <div className="syllabus-toolbar">
                <label className="btn btn-sm btn-secondary ocr-upload-btn">
                  📷 Upload Image/PDF
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={handleOCRUpload}
                    style={{ display: 'none' }}
                  />
                </label>
                {ocrLoading && (
                  <span className="ocr-progress">
                    <span className="spinner"></span> {ocrProgress}% Extracting...
                  </span>
                )}
              </div>
              <textarea
                className="textarea"
                placeholder="Paste syllabus topics, keywords, or structure here..."
                rows={15}
                value={content}
                onChange={(e) => setContent(e.target.value)}
              ></textarea>
            </div>

            <div className="syllabus-actions">
              <button className="btn btn-secondary" onClick={handleClear} disabled={formatting}>
                🗑️ Clear
              </button>
              <button className="btn btn-primary" onClick={handleSave} disabled={formatting}>
                {formatting ? (
                  <><span className="spinner"></span> AI Structuring...</>
                ) : isSaved ? (
                  '✅ Saved!'
                ) : (
                  '✨ Parse & Save Syllabus'
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
