import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/ResourcesPage.css';

const ResourcesPage: React.FC = () => {
  return (
    <div className="resources-page">
      <div className="resources-container">
        <div className="page-header">
          <h1>LGBTQ+ Resources</h1>
        </div>
        
        <div className="resources-content">
          <section className="resources-section">
            <h2>Welcome to Our Resources Center</h2>
            <p>
              We've compiled a comprehensive collection of resources to support the LGBTQ+ community.
              These resources cover legal rights, support services, and research on experiences in public spaces.
            </p>
          </section>
          
          <div className="resources-grid">
            <div className="resource-card">
              <div className="resource-icon legal-icon"></div>
              <h3>Legal Rights</h3>
              <p>Information about federal protections, bathroom access rights, and the current passport situation for LGBTQ+ individuals.</p>
              <Link to="/resources/legal" className="resource-link">View Legal Resources</Link>
            </div>
            
            <div className="resource-card">
              <div className="resource-icon support-icon"></div>
              <h3>Support Resources</h3>
              <p>Crisis intervention, mental health resources, and healthcare services for the LGBTQ+ community.</p>
              <Link to="/resources/support" className="resource-link">View Support Resources</Link>
            </div>
            
            <div className="resource-card">
              <div className="resource-icon research-icon"></div>
              <h3>Research & Statistics</h3>
              <p>Data on discrimination, personal accounts, and research findings on LGBTQ+ experiences in public facilities.</p>
              <Link to="/resources/research" className="resource-link">View Research</Link>
            </div>
          </div>
          
          <section className="resources-section">
            <h2>Why These Resources Matter</h2>
            <p>
              Access to safe public spaces is a fundamental right that many LGBTQ+ individuals continue to struggle with.
              By providing these resources, we aim to empower the community with knowledge and support.
            </p>
            <p>
              If you're experiencing an emergency situation, please contact emergency services immediately.
              For immediate mental health support, consider reaching out to The Trevor Project or Trans Lifeline.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default ResourcesPage;
