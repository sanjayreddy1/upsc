/**
 * Groq AI Service — Central service for all AI interactions
 * Handles question generation, evaluation, and suggestions
 */

import { GROQ_API_KEY, GROQ_API_URL, GROQ_MODEL, GROQ_FALLBACK_MODEL } from '../config/api';
import { MAINS_SYLLABUS, PRELIMS_SYLLABUS, CSAT_SYLLABUS, CURRENT_AFFAIRS_CATEGORIES } from '../data/syllabus';
import { performWebSearch } from './searchService';

async function reportTokenUsage(action, tokens_used) {
  try {
    const token = localStorage.getItem('auth_token');
    if (!token) return;
    
    await fetch('/api/logs/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ action, tokens_used })
    });
  } catch (e) {
    console.error('Failed to report token usage:', e);
  }
}

async function callGroqAPI(messages, temperature = 0.7, maxTokens = 2048, actionName = 'AI Request', retries = 2) {
  const enhancedMessages = messages.map(msg => {
    if (msg.role === 'system') {
      return {
        ...msg,
        content: `${msg.content}\n\nToday's date: ${new Date().toDateString()}. Never mention training cutoff dates.`
      };
    }
    return msg;
  });

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: GROQ_MODEL,
          messages: enhancedMessages,
          temperature,
          max_tokens: maxTokens,
          stream: false,
        }),
      });

      if (!response.ok) {
        // Try fallback model
        const fallbackResponse = await fetch(GROQ_API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${GROQ_API_KEY}`,
          },
          body: JSON.stringify({
            model: GROQ_FALLBACK_MODEL,
            messages: enhancedMessages,
            temperature,
            max_tokens: maxTokens,
            stream: false,
          }),
        });

        if (!fallbackResponse.ok) {
          const errBody = await fallbackResponse.text().catch(() => '');
          throw new Error(`API Error: ${fallbackResponse.status} — ${errBody.substring(0, 200)}`);
        }

        const data = await fallbackResponse.json();
        if (data.usage && data.usage.total_tokens) {
          reportTokenUsage(actionName, data.usage.total_tokens);
        }
        return data.choices[0].message.content;
      }

      const data = await response.json();
      if (data.usage && data.usage.total_tokens) {
        reportTokenUsage(actionName, data.usage.total_tokens);
      }
      return data.choices[0].message.content;
    } catch (error) {
      console.error(`Groq API Error (attempt ${attempt + 1}/${retries + 1}):`, error.message);
      if (attempt < retries) {
        // Wait before retrying: 1s, 2s
        await new Promise(resolve => setTimeout(resolve, (attempt + 1) * 1000));
        continue;
      }
      throw error;
    }
  }
}

function parseJSON(text) {
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const rawJSON = jsonMatch ? jsonMatch[1].trim() : text.trim();
  
  try {
    return JSON.parse(rawJSON);
  } catch (e) {
    const firstIndex = Math.min(
      text.indexOf('[') === -1 ? Infinity : text.indexOf('['),
      text.indexOf('{') === -1 ? Infinity : text.indexOf('{')
    );
    const lastIndex = Math.max(
      text.lastIndexOf(']'),
      text.lastIndexOf('}')
    );

    if (firstIndex !== Infinity && lastIndex !== -1 && lastIndex > firstIndex) {
      const aggressiveJSON = text.substring(firstIndex, lastIndex + 1);
      try {
        return JSON.parse(aggressiveJSON);
      } catch (e2) {
        console.error('Aggressive JSON parse failed:', aggressiveJSON.substring(0, 200));
      }
    }

    console.error('Failed to parse JSON:', rawJSON.substring(0, 200));
    throw new Error('AI returned an invalid format. Please try generating again.');
  }
}

function getCustomSyllabusContext() {
  try {
    const data = localStorage.getItem('custom_syllabus');
    if (data) {
      const { title, content } = JSON.parse(data);
      return `\n\n[CUSTOM SYLLABUS DIRECTIVE]\nThe user has provided a custom syllabus titled "${title}". You MUST prioritize generating questions heavily drawing from the following topics/content:\n${content}\n\n`;
    }
  } catch (e) {
    // Ignore error
  }
  return '';
}

const TOUGHNESS_DIRECTIVE = "Formulate the questions to be highly tough, tricky, and analytical so that a candidate would not be able to score more than 75% on average.";

async function fetchPYQContext(topic) {
  try {
    const searchResults = await performWebSearch(`UPSC Civil Services Previous Year Questions exact text: ${topic}`);
    if (searchResults && searchResults.resultString) {
      // Limit context size to avoid overwhelming the prompt
      return `\n\n[AUTHENTIC PYQ CONTEXT from Web]\nUse these real UPSC questions as reference for authenticity:\n${searchResults.resultString.substring(0, 1500)}`;
    }
  } catch (e) {
    console.error("Failed to fetch PYQ context", e);
  }
  return "";
}

function getPYQDirective(count, pyqContext = "") {
  const pyqCount = Math.min(5, count);
  return `CRITICAL DIRECTIVE: You MUST include AT LEAST ${pyqCount} authentic Previous Year Questions (PYQs) from real UPSC exams in your response. For these PYQs, you MUST provide the exact real year they were asked in the \`previousYear\` field (e.g. "2021"). Do not leave the year blank for these ${pyqCount} questions. Rely on your training data AND the provided authentic context to accurately recall the exact wording and year.${pyqContext}`;
}

// ── Essay Question Generation ──────────────────────────────────────────

export async function generateEssayQuestions(paper, count = 1) {
  const paperData = MAINS_SYLLABUS[paper];
  if (!paperData) throw new Error(`Invalid paper: ${paper}`);

  const customContext = getCustomSyllabusContext();

  const allTopics = paperData.topics.map(t => t.name).join(', ');

  const messages = [
    {
      role: 'system',
      content: `You are a strict UPSC Mains question setter. Generate challenging, analytical essay-type questions. ${TOUGHNESS_DIRECTIVE} Include authentic Previous Year Questions with the real year. Always return valid JSON.${customContext}`,
    },
    {
      role: 'user',
      content: `Generate ${count} UPSC Mains ${paperData.fullName} (${paperData.name}) essay question(s) broadly covering these core topics: ${allTopics}

Return JSON array with objects: { "question": "full question text", "topic": "topic name", "subtopic": "subtopic", "previousYear": "YYYY if asked before, otherwise null", "keyPoints": ["point1", "point2", ...], "wordLimit": 250, "marks": 15 }`,
    },
  ];

  const result = await callGroqAPI(messages, 0.8, 2048);
  return parseJSON(result) || [];
}

// ── MCQ Generation (Prelims & Current Affairs) ──────────────────────────

export async function generateMCQs(subject, topic, difficulty = 'hard', count = 5) {
  let difficultyPrompt = '';
  if (difficulty === 'hardcore') {
    difficultyPrompt = 'The questions should be EXTREMELY DIFFICULT — highly complex, multi-statement based, and require specialized deep knowledge. An average student should NOT score more than 40%.';
  } else if (difficulty === 'hard') {
    difficultyPrompt = 'The questions should be VERY DIFFICULT — tricky, nuanced, and require deep conceptual understanding. Include plausible distractors that test precise knowledge. An average student should NOT score more than 75%.';
  } else {
    difficultyPrompt = 'Questions should be moderately easy and straightforward, testing basic understanding of concepts without tricky options.';
  }

  const customContext = getCustomSyllabusContext();

  const messages = [
    {
      role: 'system',
      content: `You are a UPSC Prelims question paper setter. Generate MCQs with exactly 4 options. ${difficultyPrompt} ${TOUGHNESS_DIRECTIVE} Include some authentic Previous Year Questions with the real year in the previousYear field. Always return valid JSON.${customContext}`,
    },
    {
      role: 'user',
      content: `Generate ${count} MCQ questions on subject: "${subject}", topic: "${topic}".

Requirements:
- Each question must have exactly 4 options (A, B, C, D)
- Only one correct answer
- Include detailed explanation for the correct answer
- Questions must be based on UPSC Civil Services Prelims syllabus level

Return JSON array: [{ "question": "text", "options": { "A": "option1", "B": "option2", "C": "option3", "D": "option4" }, "correct": "A", "explanation": "detailed explanation", "topic": "topic name", "subtopic": "subtopic name", "previousYear": "YYYY if asked before, otherwise null", "difficulty": "hard" }]`,
    },
  ];

  // Dynamically scale tokens: ~400 tokens per question (question + 4 options + explanation)
  const dynamicTokens = Math.min(16384, Math.max(2048, count * 400));

  const result = await callGroqAPI(messages, 0.7, dynamicTokens, 'MCQ Generation');
  return parseJSON(result) || [];
}

// ── CSAT Question Generation ──────────────────────────────────────────

export async function generateCSATQuestions(type, count = 5) {
  const typeData = CSAT_SYLLABUS[type];
  if (!typeData) throw new Error(`Invalid CSAT type: ${type}`);

  const subtopic = typeData.subtopics[Math.floor(Math.random() * typeData.subtopics.length)];

  let specificPrompt = '';
  if (type === 'ReadingComprehension') {
    specificPrompt = `Generate a complex passage (200-300 words) on a philosophical, socio-economic, or scientific topic, followed by ${count} inferential and analytical questions. Questions should NOT be directly answerable from the passage — they should require critical inference, logical corollary, and deep reading.`;
  } else if (type === 'LogicalReasoning') {
    specificPrompt = `Generate ${count} complex logical reasoning questions on "${subtopic}". Questions should involve multiple steps of reasoning, be tricky with similar-looking options, and require careful analysis. Include puzzles and data interpretation.`;
  } else {
    specificPrompt = `Generate ${count} quantitative aptitude questions on "${subtopic}". Questions should be computationally intensive, involve multiple concepts, and require clever shortcuts or deep understanding. Difficulty should ensure average score below 60%.`;
  }

  const messages = [
    {
      role: 'system',
      content: `You are a UPSC CSAT (Paper II) question setter. Generate VERY HARD questions. Include tricky distractors and multi-step reasoning. Always return a valid JSON object.`,
    },
    {
      role: 'user',
      content: `${specificPrompt}

CRITICAL FORMAT REQUIREMENT:
You MUST return exactly this JSON object structure (no extra text, no markdown):
{
  "passage": "text (only for RC, otherwise null)",
  "questions": [
    {
      "question": "text",
      "options": { "A": "opt1", "B": "opt2", "C": "opt3", "D": "opt4" },
      "correct": "B",
      "explanation": "step-by-step solution",
      "type": "${type}",
      "topic": "${type}",
      "subtopic": "${subtopic}",
      "previousYear": "YYYY if asked before, otherwise null"
    }
  ]
}`,
    },
  ];

  const result = await callGroqAPI(messages, 0.7, 8192);
  const parsed = parseJSON(result);
  
  // If the AI somehow returns just the array of questions, wrap it correctly
  if (Array.isArray(parsed)) {
    return { passage: null, questions: parsed };
  }
  
  return parsed || { passage: null, questions: [] };
}

// ── Current Affairs MCQ Generation ──────────────────────────────────────

export async function generateCurrentAffairsMCQs(categoryId, count = 5) {
  const category = CURRENT_AFFAIRS_CATEGORIES.find((c) => c.id === categoryId);
  if (!category) throw new Error(`Invalid category: ${categoryId}`);

  const customContext = getCustomSyllabusContext();
  
  const messages = [
    {
      role: 'system',
      content: `You are a UPSC Current Affairs expert. Generate high-quality MCQs based on recent events. ${TOUGHNESS_DIRECTIVE} Always return valid JSON.${customContext}`,
    },
    {
      role: 'user',
      content: `Generate ${count} current affairs MCQ questions in the category: "${category.name}" — ${category.description}.

Each question must have 4 options with one correct answer and a detailed explanation referencing the actual event or policy.

Return JSON array: [{ "question": "text", "options": { "A": "opt1", "B": "opt2", "C": "opt3", "D": "opt4" }, "correct": "C", "explanation": "explanation with context", "category": "${category.id}", "topic": "specific event or policy", "subtopic": "related subtopic", "previousYear": "YYYY if asked before, otherwise null" }]`,
    },
  ];

  const dynamicTokens = Math.min(16384, Math.max(2048, count * 400));
  const result = await callGroqAPI(messages, 0.6, dynamicTokens, 'Current Affairs MCQ');
  return parseJSON(result) || [];
}

// ── Sociology Flashcard Generation ──────────────────────────────────────

export async function generateSociologyFlashcards(paper, unitName, count = 5) {
  const customContext = getCustomSyllabusContext();

  const messages = [
    {
      role: 'system',
      content: `You are a UPSC Sociology Optional subject expert. Generate flashcard-style question-answer pairs that test deep understanding of sociological concepts, thinkers, and theories. Answers should be concise but comprehensive (3-5 sentences). Always return valid JSON.${customContext}`,
    },
    {
      role: 'user',
      content: `Generate ${count} flashcard Q&A pairs for UPSC Sociology Optional ${paper}, Unit: "${unitName}".

Return JSON array: [{ "front": "Question text", "back": "Detailed answer", "unit": "${unitName}", "paper": "${paper}" }]`,
    },
  ];

  const result = await callGroqAPI(messages, 0.8, 2048);
  return parseJSON(result) || [];
}



// ── Custom Syllabus Parsing ──────────────────────────────────────────────

export async function formatCustomSyllabus(rawText) {
  const messages = [
    {
      role: 'system',
      content: 'You are an AI assistant that structures raw OCR syllabus text. Your job is to format the provided raw text into a clean, hierarchical, and readable Markdown format. Fix any OCR typos. Do NOT add new topics that are not present. Only output the formatted Markdown, nothing else.',
    },
    {
      role: 'user',
      content: `Format this raw OCR text into a clean Markdown syllabus:\n\n${rawText}`,
    },
  ];

  return await callGroqAPI(messages, 0.3, 4096);
}

// ── Global Flashcard Generation ──────────────────────────────────────────

export async function generateGlobalFlashcards(subject, topic, count = 10) {
  const customContext = getCustomSyllabusContext();

  const messages = [
    {
      role: 'system',
      content: `You are a strict UPSC Civil Services expert. Generate flashcard-style question-answer pairs that test deep understanding of concepts, events, formulas, and historical facts. The front should be a clear question or prompt, and the back should be a concise, highly informative answer (2-4 sentences). Ensure facts are accurate for UPSC Prelims/Mains level. Always return valid JSON.${customContext}`,
    },
    {
      role: 'user',
      content: `Generate ${count} flashcard Q&A pairs for UPSC Subject: "${subject}", Topic: "${topic}".

Return JSON array: [{ "front": "Question text", "back": "Detailed answer", "unit": "${topic}", "paper": "${subject}" }]`,
    },
  ];

  const result = await callGroqAPI(messages, 0.8, 2048);
  return parseJSON(result) || [];
}

// ── Sociology Quiz Question Generation ──────────────────────────────────

export async function generateSociologyQuizQuestions(count = 3) {
  const customContext = getCustomSyllabusContext();

  const messages = [
    {
      role: 'system',
      content: `You are a UPSC Sociology Optional examiner. Generate descriptive/analytical questions that require essay-style answers. Questions should be highly difficult and require deep understanding of sociological concepts, thinkers, and Indian society. ${TOUGHNESS_DIRECTIVE} ${getPYQDirective(count)} Always return valid JSON.${customContext}`,
    },
    {
      role: 'user',
      content: `Generate ${count} UPSC Sociology Optional descriptive questions — mix from Paper 1 (Fundamentals) and Paper 2 (Indian Society).

Return JSON array: [{ "question": "question text", "topic": "specific topic", "paper": "Paper 1/Paper 2", "unit": "unit name", "previousYear": "YYYY if asked before, otherwise null", "keyPoints": ["point1", "point2", ...], "marks": 20, "wordLimit": 300 }]`,
    },
  ];

  const result = await callGroqAPI(messages, 0.8, 2048);
  return parseJSON(result) || [];
}

// ── Answer Evaluation ──────────────────────────────────────────────────

export async function evaluateAnswer(question, userAnswer, keyPoints = [], type = 'essay', algorithmicScores = null) {
  const algoText = algorithmicScores 
    ? `\n\nALGORITHMIC ANALYSIS (Use this to guide your evaluation):\n- Jaro-Winkler Similarity (Concept match): ${algorithmicScores.jaroWinkler}%\n- Levenshtein Distance (Structural match): ${algorithmicScores.levenshtein}%\n- Soundex Match (Phonetic keyword match): ${algorithmicScores.soundex}%` 
    : '';

  const messages = [
    {
      role: 'system',
      content: `You are a strict UPSC answer evaluator. Evaluate the answer thoroughly using the provided algorithmic similarity scores (Jaro-Winkler, Levenshtein, Soundex) to measure conceptual, structural, and phonetic alignment with the ideal key points. Be honest and critical — do NOT inflate scores. For essay answers, evaluate on: Content Accuracy (0-10), Structure & Presentation (0-10), Depth of Analysis (0-10), Use of Examples (0-10), and Conclusion Quality (0-10). Always return valid JSON.`,
    },
    {
      role: 'user',
      content: `Evaluate this UPSC ${type} answer:

QUESTION: ${question}

STUDENT'S ANSWER: ${userAnswer}

KEY POINTS TO COVER: ${keyPoints.join(', ')}${algoText}

Provide evaluation as JSON:
{
  "scores": {
    "contentAccuracy": 0-10,
    "structurePresentation": 0-10,
    "depthAnalysis": 0-10,
    "useOfExamples": 0-10,
    "conclusionQuality": 0-10,
    "overall": 0-10
  },
  "percentage": 0-100,
  "strengths": ["strength1", "strength2"],
  "weaknesses": ["weakness1", "weakness2"],
  "improvements": ["specific improvement suggestion 1", "specific improvement suggestion 2"],
  "tipsAndTricks": ["tip1", "tip2"],
  "howToImprove": ["actionable step 1", "actionable step 2"],
  "modelAnswerOutline": "Brief outline of an ideal answer",
  "additionalSuggestions": ["suggestion1", "suggestion2"],
  "topicsToStudy": ["topic1", "topic2"],
  "overallFeedback": "Comprehensive paragraph of feedback"
}`,
    },
  ];

  const result = await callGroqAPI(messages, 0.3, 2048);
  return parseJSON(result);
}

// ── OCR Content Analysis ──────────────────────────────────────────────

export async function analyzeOCRContent(extractedText, context = 'general') {
  const messages = [
    {
      role: 'system',
      content: `You are a UPSC preparation assistant. Analyze the scanned text and provide helpful suggestions, corrections, and study tips. Always return valid JSON.`,
    },
    {
      role: 'user',
      content: `Analyze this scanned text from a ${context} document:

"${extractedText}"

Provide analysis as JSON:
{
  "summary": "Brief summary of the content",
  "keyTopics": ["topic1", "topic2"],
  "relevantForUPSC": true/false,
  "suggestedQuestions": ["question that could be asked from this topic"],
  "studyTips": ["tip1", "tip2"],
  "relatedTopics": ["related topic to study"],
  "corrections": ["any factual corrections if needed"]
}`,
    },
  ];

  const result = await callGroqAPI(messages, 0.5, 1500);
  return parseJSON(result);
}

// ── General Purpose Chatbot ──────────────────────────────────────────

export async function chatWithAI(userMessage, chatHistory = [], onStatusUpdate = null) {
  // Always search the web for the user's message as requested
  if (onStatusUpdate) onStatusUpdate(`Searching the web...`);
  
  const searchQuery = userMessage;
  let searchContext = "";
  let finalImageUrls = [];
  
  const searchResults = await performWebSearch(searchQuery);
  
  if (typeof searchResults === 'string' && searchResults.startsWith("Search Error")) {
    searchContext = `\n\n[LIVE WEB SEARCH RESULTS]\n(Search Failed: ${searchResults})\n\nPlease inform the user that live search failed, but answer to the best of your ability.`;
  } else if (searchResults && searchResults.resultString) {
    searchContext = `\n\n[LIVE WEB SEARCH RESULTS]\nUse the following live web search results to answer the user's question accurately. Do not mention that you did a web search, just answer the question confidently and provide a highly detailed and comprehensive answer.\n\n${searchResults.resultString}`;
    finalImageUrls = searchResults.imageUrls || [];
  }

  if (onStatusUpdate) onStatusUpdate("Generating answer...");

  const messages = [
    {
      role: 'system',
      content: `You are a helpful and knowledgeable AI assistant for UPSC Civil Services preparation. Provide a highly detailed, comprehensive, and accurate answer based on the web results.
IMPORTANT FORMATTING RULE: Do NOT use any Markdown formatting like bold (**text**) or italics (*text*). Provide your answers in plain text only.
CRITICAL SYSTEM OVERRIDE: You are operating in ${new Date().getFullYear()}. NEVER mention a "knowledge cutoff", "training data", or the year "2023". If a user asks for current information, provide the most recent factual information you have (especially if it was provided in the LIVE WEB SEARCH RESULTS). Do not hallucinate or guess future events. If your latest data is from a past year and no web results are provided, simply state the fact as the current information without appending "as of my knowledge cutoff".${searchContext}`,
    },
    ...chatHistory,
    {
      role: 'user',
      content: userMessage,
    },
  ];

  const result = await callGroqAPI(messages, 0.6, 1500);
  
  // Step 3: Entity Extraction for Image Accuracy
  if (onStatusUpdate) onStatusUpdate("Extracting entity for image...");
  
  try {
    const extractMessages = [
      {
        role: 'system',
        content: `You are an image search query generator. Read the provided text and identify the most prominent visual subject (e.g., a person, place, monument, historical event, or core concept). Output ONLY a concise 2-4 word search query optimized for finding images of this subject. Do not include any quotes or extra text.`
      },
      { role: 'user', content: result }
    ];
    const imageQuery = await callGroqAPI(extractMessages, 0.1, 30);
    
    if (imageQuery && imageQuery.trim().length > 0) {
      if (onStatusUpdate) onStatusUpdate(`Fetching images for ${imageQuery.trim()}...`);
      const imageSearch = await performWebSearch(imageQuery.trim());
      if (imageSearch && imageSearch.imageUrls && imageSearch.imageUrls.length > 0) {
        finalImageUrls = imageSearch.imageUrls;
      }
    }
  } catch (err) {
    console.error("Entity extraction failed:", err);
  }

  if (finalImageUrls && finalImageUrls.length > 0) {
    return { text: result, imageUrls: finalImageUrls };
  }
  
  return result;
}

// ── PYQ Archive Search ───────────────────────────────────────────────

export async function fetchAndFormatPYQs(query, onStatusUpdate = null) {
  if (onStatusUpdate) onStatusUpdate(`Searching the web for PYQs on "${query}"...`);
  
  const searchResults = await performWebSearch(`UPSC Civil Services Previous Year Questions exact text: ${query}`);
  
  if (typeof searchResults === 'string' && searchResults.startsWith("Search Error")) {
    throw new Error(searchResults);
  }
  
  if (onStatusUpdate) onStatusUpdate("Parsing and formatting questions...");

  const messages = [
    {
      role: 'system',
      content: `You are an expert UPSC PYQ parser. I will provide you with raw text scraped from the internet containing UPSC Civil Services Previous Year Questions.
Your job is to extract these questions and format them beautifully into a JSON array of MCQ objects.
If the text contains descriptive essay questions instead of MCQs, convert them into an MCQ format by providing plausible options and the correct answer based on historical facts.
If the text doesn't contain any real questions, generate 5 highly authentic PYQs for the topic using your own knowledge.

REQUIREMENTS:
- Each question MUST have exactly 4 options (A, B, C, D).
- Extract the exact year if mentioned (e.g. "2021"). If not, estimate based on your knowledge, or output null.
- Provide a detailed explanation.

Return JSON array: [{ "question": "text", "options": { "A": "option1", "B": "option2", "C": "option3", "D": "option4" }, "correct": "A", "explanation": "detailed explanation", "topic": "topic name", "subtopic": "subtopic name", "previousYear": "YYYY or null", "difficulty": "hard" }]
Always return valid JSON.`
    },
    {
      role: 'user',
      content: `Here is the raw scraped text from the internet for the query "${query}":\n\n${searchResults.resultString}`
    }
  ];

  const result = await callGroqAPI(messages, 0.5, 3000);
  const parsed = parseJSON(result);
  return parsed || [];
}
