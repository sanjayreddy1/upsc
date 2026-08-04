import { TAVILY_API_KEY } from '../config/api';

/**
 * Perform a web search using Tavily API.
 * Returns a concatenated string of the best search results.
 */
export async function performWebSearch(query) {
  if (!TAVILY_API_KEY || TAVILY_API_KEY === 'your_tavily_api_key_here') {
    return 'Search Error: Tavily API key is not configured. Please add VITE_TAVILY_API_KEY to your .env file.';
  }

  try {
    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api_key: TAVILY_API_KEY,
        query: query,
        search_depth: 'advanced',
        include_answer: true,
        include_images: true,
        max_results: 5,
      }),
    });

    if (!response.ok) {
      throw new Error(`Tavily API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    // Tavily often provides a direct answer
    let resultString = '';
    if (data.answer) {
      resultString += `DIRECT ANSWER: ${data.answer}\n\n`;
    }

    // Append the top results for more context
    if (data.results && data.results.length > 0) {
      resultString += 'WEB RESULTS:\n';
      data.results.forEach((res, i) => {
        resultString += `[${i + 1}] ${res.title}\n${res.content}\n\n`;
      });
    }

    const imageUrls = data.images && data.images.length > 0 ? data.images : [];

    return {
      resultString: resultString.trim() || 'No relevant information found on the web.',
      imageUrls: imageUrls
    };
  } catch (err) {
    console.error('Web Search Error:', err);
    return `Search Error: Could not fetch live data (${err.message}).`;
  }
}

/**
 * Perform a web search specifically optimized for finding PDF document links.
 * Returns the raw results array containing titles and URLs.
 */
export async function fetchPYQPdfs(query) {
  if (!TAVILY_API_KEY || TAVILY_API_KEY === 'your_tavily_api_key_here') {
    throw new Error('Tavily API key is not configured. Please add VITE_TAVILY_API_KEY to your .env file.');
  }

  try {
    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api_key: TAVILY_API_KEY,
        // Append PDF and official keywords to improve accuracy
        query: `UPSC ${query} question paper PDF official`,
        search_depth: 'advanced',
        include_answer: false,
        include_images: false,
        max_results: 10,
      }),
    });

    if (!response.ok) {
      throw new Error(`Tavily API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.results || [];
  } catch (err) {
    console.error('Web Search Error:', err);
    throw new Error(`Could not fetch PDFs (${err.message}).`);
  }
}
