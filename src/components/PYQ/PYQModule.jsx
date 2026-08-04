import { useState } from 'react';
import { fetchPYQPdfs } from '../../services/searchService';
import './PYQModule.css';

const QUICK_FILTERS = [
  "Prelims GS 2023",
  "Prelims CSAT 2023",
  "Mains GS1 2022",
  "Mains Essay 2022",
  "Sociology Paper 1 2021"
];

export default function PYQModule() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [pdfs, setPdfs] = useState([]);
  const [error, setError] = useState(null);

  const handleSearch = async (searchQuery) => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    setError(null);
    setPdfs([]);
    setQuery(searchQuery);

    try {
      const results = await fetchPYQPdfs(searchQuery.trim());
      setPdfs(results);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pyq-module animate-fade-in">
      <div className="module-header">
        <h2 className="gradient-text">PYQ Paper Archive</h2>
        <p>Find and download official UPSC Previous Year Question paper PDFs.</p>
      </div>

      <div className="pyq-search-container glass-card">
        <div className="pyq-quick-filters">
          {QUICK_FILTERS.map(filter => (
            <button 
              key={filter} 
              className="quick-filter-btn"
              onClick={() => handleSearch(filter)}
              disabled={loading}
            >
              {filter}
            </button>
          ))}
        </div>

        <form onSubmit={(e) => { e.preventDefault(); handleSearch(query); }} className="pyq-search-form mt-4">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for any paper (e.g., Prelims 2018, History Optional 2020)..."
            className="pyq-search-input"
            disabled={loading}
          />
          <button type="submit" className="btn btn-primary btn-glow" disabled={loading || !query.trim()}>
            {loading ? 'Searching...' : 'Find PDFs'}
          </button>
        </form>
      </div>

      {loading && (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Scouring the web for official PDFs...</p>
        </div>
      )}

      {error && (
        <div className="error-message glass-card">
          <p>⚠️ {error}</p>
        </div>
      )}

      {!loading && !error && pdfs.length > 0 && (
        <div className="pyq-results">
          <div className="results-header">
            <h3>Found {pdfs.length} Documents for "{query}"</h3>
          </div>
          <div className="pdf-grid">
            {pdfs.map((pdf, idx) => (
              <div key={idx} className="pdf-card glass-card">
                <div className="pdf-icon">📄</div>
                <div className="pdf-info">
                  <h4>{pdf.title}</h4>
                  <p className="pdf-url">{new URL(pdf.url).hostname}</p>
                </div>
                <a 
                  href={pdf.url} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="btn btn-secondary pdf-download-btn"
                >
                  View PDF
                </a>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {!loading && !error && pdfs.length === 0 && (
        <div className="pyq-empty glass-card" style={{ padding: '40px', textAlign: 'center', marginTop: '20px' }}>
          <p>Enter a year and subject above to find downloadable question papers.</p>
        </div>
      )}
    </div>
  );
}
