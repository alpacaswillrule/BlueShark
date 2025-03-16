import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/SupportResourcesPage.css';

const SupportResourcesPage: React.FC = () => {
  return (
    <div className="support-page">
      <div className="support-container">
        <div className="page-header">
          <h1>LGBTQ+ Support Resources</h1>
        </div>
        
        <div className="support-content">
          <div className="breadcrumbs">
            <Link to="/resources">Resources</Link> &gt; Support Resources
          </div>
          
          <section className="support-section">
            <h2>Crisis Intervention & Mental Health</h2>
            
            <div className="resource-grid">
              <div className="resource-item">
                <h3>The Trevor Project</h3>
                <p className="resource-description">
                  Provides crisis intervention and suicide prevention services for LGBTQ+ youth.
                  Available via phone, text, and online chat support.
                </p>
                <div className="resource-contact">
                  <p><strong>Phone:</strong> 1-866-488-7386</p>
                  <p><strong>Text:</strong> Text START to 678-678</p>
                  <p><strong>Website:</strong> <a href="https://www.thetrevorproject.org/" target="_blank" rel="noopener noreferrer">thetrevorproject.org</a></p>
                </div>
              </div>
              
              <div className="resource-item">
                <h3>Trans Lifeline</h3>
                <p className="resource-description">
                  Peer support hotline run by and for transgender individuals.
                </p>
                <div className="resource-contact">
                  <p><strong>Phone:</strong> 1-877-565-8860</p>
                  <p><strong>Website:</strong> <a href="https://translifeline.org/" target="_blank" rel="noopener noreferrer">translifeline.org</a></p>
                </div>
              </div>
              
              <div className="resource-item">
                <h3>988 Suicide and Crisis Lifeline</h3>
                <p className="resource-description">
                  24/7 free and confidential support for people in distress.
                </p>
                <div className="resource-contact">
                  <p><strong>Phone:</strong> 988</p>
                  <p><strong>Website:</strong> <a href="https://988lifeline.org/" target="_blank" rel="noopener noreferrer">988lifeline.org</a></p>
                </div>
              </div>
            </div>
          </section>
          
          <section className="support-section">
            <h2>Mental Health Resources</h2>
            
            <div className="resource-grid">
              <div className="resource-item">
                <h3>National Queer and Trans Therapists of Color Network</h3>
                <p className="resource-description">
                  Connects queer and trans people of color with mental health professionals who share their identities and experiences.
                </p>
                <div className="resource-contact">
                  <p><strong>Website:</strong> <a href="https://www.nqttcn.com/" target="_blank" rel="noopener noreferrer">nqttcn.com</a></p>
                </div>
              </div>
              
              <div className="resource-item">
                <h3>LGBTQ+ Affirming Therapists</h3>
                <p className="resource-description">
                  Helps people find therapists who are knowledgeable and supportive of LGBTQ+ identities.
                </p>
                <div className="resource-contact">
                  <p><strong>Website:</strong> <a href="https://www.psychologytoday.com/us/therapists/lgbtq" target="_blank" rel="noopener noreferrer">psychologytoday.com/us/therapists/lgbtq</a></p>
                </div>
              </div>
              
              <div className="resource-item">
                <h3>The Human Rights Campaign</h3>
                <p className="resource-description">
                  Provides resources on LGBTQ+ mental health, including guides and tip sheets.
                </p>
                <div className="resource-contact">
                  <p><strong>Website:</strong> <a href="https://www.hrc.org/resources/mental-health-and-the-lgbtq-community" target="_blank" rel="noopener noreferrer">hrc.org/resources/mental-health</a></p>
                </div>
              </div>
            </div>
          </section>
          
          <section className="support-section">
            <h2>Healthcare Resources</h2>
            
            <div className="resource-grid">
              <div className="resource-item">
                <h3>LGBTQ+ Health Centers</h3>
                <p className="resource-description">
                  Community healthcare centers that specialize in providing culturally competent care to LGBTQ+ individuals.
                </p>
                <div className="resource-contact">
                  <p><strong>Find a Center:</strong> <a href="https://www.lgbtqhealthlink.org/community-partners" target="_blank" rel="noopener noreferrer">lgbtqhealthlink.org</a></p>
                </div>
              </div>
              
              <div className="resource-item">
                <h3>Gender-Affirming Care</h3>
                <p className="resource-description">
                  Resources providing information and access to hormone therapy, surgeries, and other gender-affirming health services.
                </p>
                <div className="resource-contact">
                  <p><strong>Website:</strong> <a href="https://transequality.org/know-your-rights/healthcare" target="_blank" rel="noopener noreferrer">transequality.org/healthcare</a></p>
                </div>
              </div>
              
              <div className="resource-item">
                <h3>National Coalition for LGBTQ+ Health</h3>
                <p className="resource-description">
                  Works on improving health and wellbeing of LGBTQ+ people through advocacy, education, and research.
                </p>
                <div className="resource-contact">
                  <p><strong>Website:</strong> <a href="https://healthlgbt.org/" target="_blank" rel="noopener noreferrer">healthlgbt.org</a></p>
                </div>
              </div>
            </div>
          </section>
          
          <section className="support-section">
            <h2>Additional Resources</h2>
            <p>
              If you're experiencing discrimination or harassment in public facilities, consider documenting the incident
              and reaching out to local LGBTQ+ advocacy organizations or legal aid services. Many cities and states have
              specific protections for LGBTQ+ individuals that may apply to your situation.
            </p>
            <p>
              Remember that you are not alone, and there are communities and resources available to support you.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default SupportResourcesPage;
