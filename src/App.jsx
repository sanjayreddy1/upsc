import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Sidebar from './components/Layout/Sidebar';
import Header from './components/Layout/Header';
import Dashboard from './components/Dashboard/Dashboard';
import EssayModule from './components/Essay/EssayModule';
import SociologyFlashcards from './components/Optional/SociologyFlashcards';
import CurrentAffairs from './components/CurrentAffairs/CurrentAffairs';
import CSATModule from './components/CSAT/CSATModule';
import PrelimsModule from './components/Prelims/PrelimsModule';
import FlashcardsModule from './components/Flashcards/FlashcardsModule';
import OCRScanner from './components/OCR/OCRScanner';
import Chatbot from './components/Chatbot/Chatbot';
import UploadSyllabus from './components/Syllabus/UploadSyllabus';
import DailyTest from './components/DailyTest/DailyTest';
import PYQModule from './components/PYQ/PYQModule';
import { useNotification } from './hooks/useNotification';
import { initNotificationEngine } from './services/notificationEngine';
import './App.css';

const PAGE_TITLES = {
  '/': { title: 'Dashboard', subtitle: 'Your preparation overview' },
  '/daily-test': { title: 'Daily Challenge', subtitle: '10 Mandatory Questions' },
  '/essay': { title: 'Essay (Mains)', subtitle: 'GS1 · GS2 · GS3 · GS4' },
  '/sociology': { title: 'Sociology Optional', subtitle: 'Flashcards & Weekly Quiz' },
  '/current-affairs': { title: 'Current Affairs', subtitle: 'MCQ Practice' },
  '/csat': { title: 'CSAT Practice', subtitle: 'RC · LR · QA' },
  '/prelims': { title: 'Prelims Bits', subtitle: 'Subject-wise MCQs' },
  '/flashcards': { title: 'Global Flashcards', subtitle: 'Quick Revision' },
  '/ocr': { title: 'OCR Scanner', subtitle: 'Scan & Analyze Documents' },
  '/syllabus': { title: 'Custom Syllabus', subtitle: 'Upload & Generate Custom Questions' },
  '/pyq': { title: 'PYQ Archive', subtitle: 'Live Web PYQ Search' },
};

function AppContent() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const pageInfo = PAGE_TITLES[location.pathname] || PAGE_TITLES['/'];

  // Initialize notifications on app load
  useNotification();
  
  useEffect(() => {
    initNotificationEngine();
  }, []);

  return (
    <div className="app-layout">
      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      <main className="app-main">
        <Header
          title={pageInfo.title}
          subtitle={pageInfo.subtitle}
          onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
        />
        <div className="app-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/daily-test" element={<DailyTest />} />
            <Route path="/essay" element={<EssayModule />} />
            <Route path="/sociology" element={<SociologyFlashcards />} />
            <Route path="/current-affairs" element={<CurrentAffairs />} />
            <Route path="/csat" element={<CSATModule />} />
            <Route path="/prelims" element={<PrelimsModule />} />
            <Route path="/flashcards" element={<FlashcardsModule />} />
            <Route path="/ocr" element={<OCRScanner />} />
            <Route path="/syllabus" element={<UploadSyllabus />} />
            <Route path="/pyq" element={<PYQModule />} />
          </Routes>
        </div>
      </main>
      <Chatbot />
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
