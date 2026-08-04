// Groq API Configuration
export const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
export const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
export const GROQ_MODEL = 'llama-3.1-8b-instant';
export const GROQ_FALLBACK_MODEL = 'llama-3.3-70b-versatile';

// Tavily Search API
export const TAVILY_API_KEY = import.meta.env.VITE_TAVILY_API_KEY;

// App Configuration
export const APP_CONFIG = {
  essayQuestionsPerDay: 4,
  sociologyQuestionsPerWeek: 3,
  csatTargetScore: 60,
  prelimsTargetScore: 75,
  negativeMargingFraction: 1 / 3,
  mcqOptionsCount: 4,
};
