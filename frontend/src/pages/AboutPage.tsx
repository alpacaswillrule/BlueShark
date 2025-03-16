import React from 'react';
import '../styles/AboutPage.css';

const AboutPage: React.FC = () => {
  return (
    <div className="about-page">
      <div className="about-container">
        <div className="page-header">
          <h1>About Blue Shark</h1>
        </div>
        
        <div className="about-content">
          <section className="about-section">
            <h2>Our Mission</h2>
            <p>
              Blue Shark is dedicated to creating a safer community for LGBTQ+ individuals by providing 
              information about queer-friendly spaces. We believe that everyone deserves to feel safe 
              and welcome in public spaces, restaurants, and when interacting with public services.
            </p>
          </section>
          
          <section className="about-section">
            <h2>How It Works</h2>
            <p>
              Our platform allows users to rate and review public restrooms, restaurants, and police 
              departments based on their experiences as LGBTQ+ individuals. These ratings help others 
              in the community make informed decisions about where to go and what to expect.
            </p>
            <div className="how-it-works-steps">
              <div className="step">
                <div className="step-number">1</div>
                <div className="step-content">
                  <h3>Explore the Map</h3>
                  <p>Browse locations near you and see their ratings and reviews.</p>
                </div>
              </div>
              
              <div className="step">
                <div className="step-number">2</div>
                <div className="step-content">
                  <h3>Submit Ratings</h3>
                  <p>Share your experiences to help others in the community.</p>
                </div>
              </div>
              
              <div className="step">
                <div className="step-number">3</div>
                <div className="step-content">
                  <h3>Stay Informed</h3>
                  <p>Use the information to make safer choices about where to go.</p>
                </div>
              </div>
            </div>
          </section>
          
          <section className="about-section">
            <h2>Privacy & Safety</h2>
            <p>
              We take privacy seriously. All ratings and reviews are anonymous by default. We do not 
              collect or store any personally identifiable information unless explicitly provided.
            </p>
            <p>
              If you encounter an emergency situation, please contact local emergency services immediately.
              Blue Shark is an informational resource and not a substitute for emergency assistance.
            </p>
          </section>
          
          <section className="about-section">
            <h2>Contact Us</h2>
            <p>
              Have questions, suggestions, or feedback? We'd love to hear from you! 
              Please reach out to us at <a href="mailto:contact@blueshark.example.com">contact@blueshark.example.com</a>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;
