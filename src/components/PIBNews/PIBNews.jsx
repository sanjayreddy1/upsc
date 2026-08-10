import React, { useState, useEffect } from 'react';
import { fetchPIBNews } from '../../services/searchService';
import './PIBNews.css';

export default function PIBNews() {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadNews();
  }, []);

  const loadNews = async () => {
    setLoading(true);
    setError(null);
    try {
      const results = await fetchPIBNews();
      // Filter out some junk results if necessary, or just use them
      setNews(results);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pib-container animate-fade-in">
      <div className="pib-header">
        <h1>🇮🇳 PIB News Updates</h1>
        <p className="pib-desc">Latest official press releases from the Press Information Bureau, India.</p>
      </div>

      {error && (
        <div className="error-banner glass-card">
          <span>⚠️ {error}</span>
          <button className="btn btn-sm btn-primary" onClick={loadNews}>
            Retry
          </button>
        </div>
      )}

      {loading ? (
        <div className="loading-container">
          <div className="spinner spinner-lg"></div>
          <p>Fetching latest news from PIB...</p>
        </div>
      ) : (
        <div className="pib-grid">
          {news.length === 0 && !error ? (
            <div className="empty-state">No news found at the moment.</div>
          ) : (
            news.map((item, index) => (
              <a 
                key={index} 
                href={item.url} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="pib-card glass-card"
              >
                <div className="pib-card-content">
                  <h3 className="pib-title">{item.title}</h3>
                  <p className="pib-snippet">{item.content}</p>
                </div>
                <div className="pib-card-footer">
                  <span className="pib-source">pib.gov.in</span>
                  <span className="pib-read-more">Read Full Release →</span>
                </div>
              </a>
            ))
          )}
        </div>
      )}
    </div>
  );
}
