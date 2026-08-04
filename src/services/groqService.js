/**
 * Groq AI Service — Central service for all AI interactions
 * Handles question generation, evaluation, and suggestions
 */

import { GROQ_API_KEY, GROQ_API_URL, GROQ_MODEL, GROQ_FALLBACK_MODEL } from '../config/api';
import { MAINS_SYLLABUS, PRELIMS_SYLLABUS, CSAT_SYLLABUS, CURRENT_AFFAIRS_CATEGORIES } from '../data/syllabus';

async function callGroqAPI(messages, temperature = 0.7, maxTokens = 2048) {
  try {
    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages,
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
          messages,
          temperature,
          max_tokens: maxTokens,
          stream: false,
        }),
      });

      if (!fallbackResponse.ok) {
        throw new Error(`API Error: ${fallbackResponse.status} ${fallbackResponse.statusText}`);
      }

      const data = await fallbackResponse.json();
      return data.choices[0].message.content;
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('Groq API Error:', error);
    throw error;
  }
}

function parseJSON(text) {
  // Extract JSON from markdown code blocks if present
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const rawJSON = jsonMatch ? jsonMatch[1].trim() : text.trim();
  try {
    return JSON.parse(rawJSON);
  } catch {
    console.error('Failed to parse JSON:', rawJSON.substring(0, 200));
    return null;
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

function getPYQDirective(count) {
  const pyqCount = Math.min(5, count);
  return `CRITICAL DIRECTIVE: You MUST include AT LEAST ${pyqCount} authentic Previous Year Questions (PYQs) from real UPSC exams in your response. For these PYQs, you MUST provide the exact real year they were asked in the \`previousYear\` field (e.g. "2021"). Do not leave the year blank for these ${pyqCount} questions. Rely on your training data of official UPSC past papers to accurately recall the exact wording and year.`;
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
      content: `You are a strict UPSC Civil Services Mains examination question setter. Generate challenging, analytical essay-type questions that test deep understanding, critical thinking, and the ability to present balanced arguments. ${TOUGHNESS_DIRECTIVE} ${getPYQDirective(count)} Always return valid JSON.${customContext}`,
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
  const difficultyPrompt =
    difficulty === 'hard'
      ? 'The questions should be VERY DIFFICULT — tricky, nuanced, and require deep conceptual understanding. Include plausible distractors that test precise knowledge. An average student should NOT score more than 75%.'
      : 'Questions should be moderately difficult, testing solid understanding of concepts.';

  const customContext = getCustomSyllabusContext();

  const messages = [
    {
      role: 'system',
      content: `You are a UPSC Prelims question paper setter. Generate multiple choice questions with exactly 4 options. ${difficultyPrompt} Generate questions using structural variation (like Levenshtein distance principles) and phonetic concept grouping (Soundex principles) to ensure unique and non-repetitive phrasing. ${TOUGHNESS_DIRECTIVE} ${getPYQDirective(count)} Always return valid JSON.${customContext}`,
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

  const result = await callGroqAPI(messages, 0.7, 3000);
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
      content: `You are a UPSC CSAT (Paper II) question setter. Generate VERY HARD questions that test analytical ability at the highest level. An average aspirant should NOT score more than 60%. Include tricky distractors and multi-step reasoning. ${getPYQDirective(count)} Always return valid JSON.`,
    },
    {
      role: 'user',
      content: `${specificPrompt}

Return JSON: { "passage": "text (only for RC)", "questions": [{ "question": "text", "options": { "A": "opt1", "B": "opt2", "C": "opt3", "D": "opt4" }, "correct": "B", "explanation": "step-by-step solution", "type": "${type}", "topic": "${type}", "subtopic": "${subtopic}", "previousYear": "YYYY if asked before, otherwise null" }] }`,
    },
  ];

  const result = await callGroqAPI(messages, 0.7, 4000);
  return parseJSON(result);
}

// ── Current Affairs MCQ Generation ──────────────────────────────────────

export async function generateCurrentAffairsMCQs(categoryId, count = 5) {
  const category = CURRENT_AFFAIRS_CATEGORIES.find((c) => c.id === categoryId);
  if (!category) throw new Error(`Invalid category: ${categoryId}`);

  const customContext = getCustomSyllabusContext();
  
  const messages = [
    {
      role: 'system',
      content: `You are a UPSC Current Affairs expert. Generate high-quality MCQs based on recent events. ${TOUGHNESS_DIRECTIVE} ${getPYQDirective(count)} Always return valid JSON.${customContext}`,
    },
    {
      role: 'user',
      content: `Generate ${count} current affairs MCQ questions in the category: "${category.name}" — ${category.description}.

Each question must have 4 options with one correct answer and a detailed explanation referencing the actual event or policy.

Return JSON array: [{ "question": "text", "options": { "A": "opt1", "B": "opt2", "C": "opt3", "D": "opt4" }, "correct": "C", "explanation": "explanation with context", "category": "${category.id}", "topic": "specific event or policy", "subtopic": "related subtopic", "previousYear": "YYYY if asked before, otherwise null" }]`,
    },
  ];

  const result = await callGroqAPI(messages, 0.6, 3000);
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

export async function chatWithAI(userMessage, chatHistory = []) {
  const messages = [
    {
      role: 'system',
      content: `You are a helpful and knowledgeable AI assistant for UPSC Civil Services preparation. Provide concise, clear, and accurate answers.
IMPORTANT FORMATTING RULE: Do NOT use any Markdown formatting like bold (**text**) or italics (*text*). Provide your answers in plain text only.`,
    },
    ...chatHistory,
    {
      role: 'user',
      content: userMessage,
    },
  ];

  const result = await callGroqAPI(messages, 0.6, 1000);
  return result;
}
