<div align="center">
  <img src="public/pwa-192x192.png" alt="UPSC Prep Logo" width="120" />
  <h1>UPSC Prep — AI-Powered Civil Services Companion</h1>
  <p>An intelligent, highly aggressive, and gamified study companion for UPSC aspirants. Built to track streaks, enforce daily mock tests, evaluate Mains essays via AI, and keep you disciplined.</p>
  
  [![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](#)
  [![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)](#)
  [![Groq AI](https://img.shields.io/badge/AI_Powered-Groq_LLaMA_3-f59e0b?style=for-the-badge)](#)
  [![PWA Ready](https://img.shields.io/badge/PWA-Installable-10b981?style=for-the-badge)](#)
</div>

---

## 🎯 Project Overview

**UPSC Prep** is a comprehensive, serverless React application tailored specifically for Indian Civil Services (UPSC) aspirants. Rather than serving as a passive question bank, the application actively curates tests, mathematically analyzes user weak points, enforces daily streaks via operating system notifications, and grades long-form Mains essays using state-of-the-art Large Language Models (LLMs).

## 🔥 Core Features

### 1. Progressive Web App (PWA) Infrastructure
- **Installability:** Fully installable as a standalone app on iOS, Android, and Desktop via browser prompts.
- **Offline Resilience:** Service worker caching allows the app frame to load instantly without a network connection.
- **Unified Local State:** Leverages `localStorage` and `IndexedDB` to ensure your data stays strictly on your device while seamlessly syncing between the browser and installed app views.

### 2. Algorithmic Question Generation & Evaluation
- **Anti-Hallucination Directives:** Uses strict prompt engineering to ensure LLMs retrieve exact, word-for-word Previous Year Questions (PYQs) rather than fabricating them.
- **Advanced OCR & Parsing:** Integrates `Tesseract.js` and `pdf.js` for scanning handwritten notes and printed syllabi.
- **Fuzzy String Matching:** Utilizes custom implementations of **Soundex** and **Jaro-Winkler** algorithms to evaluate short-form answers, accommodating minor spelling mistakes without unfairly penalizing the user.

### 3. Gamification & The Daily Loop
- **The Daily Test:** A mandatory 10-question mixed-bag mock test (covering History, Polity, Geography, Current Affairs) that locks out once completed.
- **Streak Engine:** A strictly enforced 24-hour forgiveness window that resets your "Days Streak" if a Daily Test is missed.
- **Notification Engine:** Intercepts the native OS notification tray to deliver random motivational quotes every 45 minutes and aggressive reminders to complete pending Daily Tests every 1 hour.

### 4. Comprehensive Modules
- **✍️ Mains Essay (GS1-GS4):** Automated grading based on UPSC parameters (Structure, Relevance, Vocabulary).
- **📰 Current Affairs:** Dynamically generated MCQs based on specific real-world event categories.
- **📚 Sociology Optional Suite:** Specialized Weekly Quizzes and a global Flashcard revision system.
- **📊 Interactive Dashboard:** Real-time visualization of your MCQ accuracy, Essay averages, and study activity.

---

## 🛠️ Architecture & Tech Stack

| Category | Technologies Used |
|---|---|
| **Frontend Framework** | React 19, Vite, React Router DOM |
| **Styling & UI** | Vanilla CSS3, CSS Variables, Glassmorphism Design |
| **AI Integration** | Groq API (LLaMA-3-70B-Versatile / Mixtral-8x7B fallback) |
| **Document Processing** | `pdf.js` (WebAssembly Workers), `html2pdf.js` |
| **Optical Character Recognition** | `tesseract.js` |
| **Algorithms** | Jaro-Winkler Distance, Soundex Phonetic Indexing |
| **PWA Capabilities** | `vite-plugin-pwa`, Manifest APIs |

---

## 🚀 Setup & Installation

To run this project locally, you will need Node.js (v18+) installed.

1. **Clone the Repository**
   ```bash
   git clone https://github.com/yourusername/upsc-prep.git
   cd upsc-prep
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment Variables**
   The application requires a Groq API key for AI generation and evaluation. Create a `.env` file in the root directory:
   ```env
   VITE_GROQ_API_KEY=your_api_key_here
   ```

4. **Start Development Server**
   ```bash
   npm run dev
   ```

5. **Build for Production**
   ```bash
   npm run build
   ```
   > **Note for Render/Netlify Deployment:** As an SPA, ensure you configure a rewrite rule redirecting all `/*` traffic to `/index.html` to prevent 404 errors on deep links.

---

## 📁 Directory Structure
```text
src/
├── algorithms/       # Core math/eval logic (JaroWinkler, Soundex)
├── components/       # Modular UI (Dashboard, DailyTest, Essay, etc.)
├── config/           # API configurations and constants
├── data/             # Hardcoded UPSC Syllabus structures
├── hooks/            # Custom React Hooks (useStreak, useNotification)
├── services/         # API abstraction layers (groqService)
└── App.jsx           # Main Router & Layout definition
```

<br/><br/>

---

<div align="center">

## 👨‍💻 Developed By

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:0F0C29,50:302B63,100:24243e&height=150&section=header&text=Sanjay%20Kumar%20D&fontSize=45&fontColor=ffffff&fontAlignY=38&desc=Full%20Stack%20%7C%20IoT%20%7C%20AI%2FML%20%7C%20Mobile%20%7C%20Systems%20Developer&descAlignY=65&descSize=15&animation=fadeIn" />

[![Typing SVG](https://readme-typing-svg.demolab.com?font=Fira+Code&weight=600&size=20&pause=1000&color=A78BFA&center=true&vCenter=true&width=700&lines=I+build+things+that+actually+work+%E2%9A%A1;Flask+%7C+FastAPI+%7C+MySQL+%7C+PostgreSQL;Flutter+%7C+Kotlin+%7C+Rust+%7C+Mobile+Dev;Distributed+Systems+%7C+Task+Schedulers+in+Rust;ML+for+Medical+Intelligence+%F0%9F%A7%A0;Oracle+Certified+Gen+AI+%26+APEX+Developer+%F0%9F%8F%85)](https://git.io/typing-svg)

**Oracle Certified — Generative AI & APEX Developer Professional**

*“I don't build for marks — I build to make things actually work 🔥”*

<br/>

[![LinkedIn](https://img.shields.io/badge/LinkedIn-%230077B5.svg?style=for-the-badge&logo=linkedin&logoColor=white)](https://linkedin.com/in/sanjay-kumar-89a79b32b)
[![Portfolio](https://img.shields.io/badge/Portfolio-%230F0C29.svg?style=for-the-badge&logo=vercel&logoColor=white)](https://sanjaykumard.vercel.app)
[![Email](https://img.shields.io/badge/Email-D14836?style=for-the-badge&logo=gmail&logoColor=white)](mailto:sanjaykumar4112006@gmail.com)

</div>