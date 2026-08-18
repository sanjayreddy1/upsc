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
import PolityModule from './components/Polity/PolityModule';
import FlashcardsModule from './components/Flashcards/FlashcardsModule';
import SavedFlashcards from './components/Flashcards/SavedFlashcards';
import OCRScanner from './components/OCR/OCRScanner';
import Chatbot from './components/Chatbot/Chatbot';
import UploadSyllabus from './components/Syllabus/UploadSyllabus';
import DailyTest from './components/DailyTest/DailyTest';
import PYQModule from './components/PYQ/PYQModule';
import PIBNews from './components/PIBNews/PIBNews';
import Settings from './components/Settings/Settings';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import AdminDashboard from './components/Admin/AdminDashboard';
import { AuthProvider, useAuth } from './hooks/useAuth';
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
  '/polity': { title: 'Polity MCQs', subtitle: 'Constitutional Framework & Governance' },
  '/flashcards': { title: 'Global Flashcards', subtitle: 'Quick Revision' },
  '/saved-flashcards': { title: 'Saved Flashcards', subtitle: 'Your Collection' },
  '/ocr': { title: 'OCR Scanner', subtitle: 'Scan & Analyze Documents' },
  '/syllabus': { title: 'Custom Syllabus', subtitle: 'Upload & Generate Custom Questions' },
  '/pyq': { title: 'PYQ Archive', subtitle: 'Live Web PYQ Search' },
  '/pib-news': { title: 'PIB News', subtitle: 'Latest Press Information Bureau Updates' },
  '/settings': { title: 'Settings', subtitle: 'App Configuration & Preferences' },
  '/login': { title: 'Login', subtitle: 'Sign in to your account' },
  '/register': { title: 'Register', subtitle: 'Create a new account' },
  '/admin': { title: 'Admin Dashboard', subtitle: 'Manage users and metrics' },
};

import { Navigate } from 'react-router-dom';

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  
  if (loading) return <div className="flex-center" style={{ height: '100vh' }}>Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  
  return children;
}

function AppContent() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const { user } = useAuth();
  const pageInfo = PAGE_TITLES[location.pathname] || PAGE_TITLES['/'];

  // Initialize notifications on app load
  useNotification();
  
  useEffect(() => {
    initNotificationEngine();
  }, []);

  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';

  return (
    <div className="app-layout">
      {!isAuthPage && <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />}
      <main className="app-main">
        {!isAuthPage && (
          <Header
            title={pageInfo.title}
            subtitle={pageInfo.subtitle}
            onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
          />
        )}
        <div className="app-content">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            {/* Protected Routes */}
            <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
            <Route path="/daily-test" element={<PrivateRoute><DailyTest /></PrivateRoute>} />
            <Route path="/essay" element={<PrivateRoute><EssayModule /></PrivateRoute>} />
            <Route path="/sociology" element={<PrivateRoute><SociologyFlashcards /></PrivateRoute>} />
            <Route path="/current-affairs" element={<PrivateRoute><CurrentAffairs /></PrivateRoute>} />
            <Route path="/csat" element={<PrivateRoute><CSATModule /></PrivateRoute>} />
            <Route path="/prelims" element={<PrivateRoute><PrelimsModule /></PrivateRoute>} />
            <Route path="/polity" element={<PrivateRoute><PolityModule /></PrivateRoute>} />
            <Route path="/flashcards" element={<PrivateRoute><FlashcardsModule /></PrivateRoute>} />
            <Route path="/saved-flashcards" element={<PrivateRoute><SavedFlashcards /></PrivateRoute>} />
            <Route path="/ocr" element={<PrivateRoute><OCRScanner /></PrivateRoute>} />
            <Route path="/syllabus" element={<PrivateRoute><UploadSyllabus /></PrivateRoute>} />
            <Route path="/pyq" element={<PrivateRoute><PYQModule /></PrivateRoute>} />
            <Route path="/pib-news" element={<PrivateRoute><PIBNews /></PrivateRoute>} />
            <Route path="/settings" element={<PrivateRoute><Settings /></PrivateRoute>} />
            <Route path="/admin" element={<PrivateRoute><AdminDashboard /></PrivateRoute>} />
          </Routes>
        </div>
      </main>
      {!isAuthPage && <Chatbot />}
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;
