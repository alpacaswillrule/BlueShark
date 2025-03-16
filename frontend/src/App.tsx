import React, { useEffect } from 'react';
import { HashRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Navigation from './components/Navigation';
import MapPage from './pages/MapPage';
import ReportPage from './pages/ReportPage';
import AboutPage from './pages/AboutPage';
import ResourcesPage from './pages/ResourcesPage';
import LegalRightsPage from './pages/LegalRightsPage';
import SupportResourcesPage from './pages/SupportResourcesPage';
import ResearchPage from './pages/ResearchPage';
import './App.css';

// Create a wrapper component that uses useLocation
const AppContent = () => {
  const location = useLocation();
  
  // Log navigation for debugging
  useEffect(() => {
    console.log('Navigation to:', location.pathname);
  }, [location]);
  
  return (
    <div className="App">
      <Navigation />
      <main className="App-main">
        <Routes key={location.pathname}>
          <Route path="/" element={<MapPage />} />
          <Route path="/report" element={<ReportPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/resources" element={<ResourcesPage />} />
          <Route path="/resources/legal" element={<LegalRightsPage />} />
          <Route path="/resources/support" element={<SupportResourcesPage />} />
          <Route path="/resources/research" element={<ResearchPage />} />
        </Routes>
      </main>
    </div>
  );
};

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
