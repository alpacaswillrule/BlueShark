import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/ResearchPage.css';

const ResearchPage: React.FC = () => {
  return (
    <div className="research-page">
      <div className="research-container">
        <div className="page-header">
          <h1>Research & Statistics</h1>
        </div>
        
        <div className="research-content">
          <div className="breadcrumbs">
            <Link to="/resources">Resources</Link> &gt; Research & Statistics
          </div>
          
          <section className="research-section">
            <h2>Discrimination and Harassment Statistics</h2>
            <div className="stats-card">
              <h3>2015 Survey of Transgender Individuals</h3>
              <p className="stats-source">Source: U.S. Transgender Survey (27,715 respondents)</p>
              <div className="stats-grid">
                <div className="stat-item">
                  <div className="stat-number">12%</div>
                  <div className="stat-description">Reported mistreatment in restrooms</div>
                </div>
                <div className="stat-item">
                  <div className="stat-number">1%</div>
                  <div className="stat-description">Physically attacked for being transgender</div>
                </div>
                <div className="stat-item">
                  <div className="stat-number">1%</div>
                  <div className="stat-description">Sexually assaulted in a restroom</div>
                </div>
                <div className="stat-item">
                  <div className="stat-number">9%</div>
                  <div className="stat-description">Denied access to bathrooms due to being transgender</div>
                </div>
              </div>
            </div>
            
            <div className="stats-card">
              <h3>Avoidance Behaviors</h3>
              <div className="stats-grid">
                <div className="stat-item">
                  <div className="stat-number">59%</div>
                  <div className="stat-description">Reported not using public restrooms in the past year due to fear</div>
                </div>
                <div className="stat-item">
                  <div className="stat-number">32%</div>
                  <div className="stat-description">Limited how much they ate or drank to avoid using public restrooms</div>
                </div>
                <div className="stat-item">
                  <div className="stat-number">8%</div>
                  <div className="stat-description">Developed kidney or urinary tract infections from avoiding restroom use</div>
                </div>
              </div>
            </div>
            
            <div className="stats-card">
              <h3>Harassment in Government Settings</h3>
              <div className="stats-grid">
                <div className="stat-item">
                  <div className="stat-number">32%</div>
                  <div className="stat-description">Of trans people who showed ID with a name/gender that did not match their appearance reported being harassed or denied service</div>
                </div>
              </div>
              <p>
                This harassment primarily occurred in places like DMV, security checkpoints, courthouses, or other government offices where ID is required.
              </p>
            </div>
          </section>
          
          <section className="research-section">
            <h2>Personal Accounts</h2>
            
            <div className="account-card">
              <h3>Lauren Jackson</h3>
              <p>
                A transgender woman who was brutally beaten in 2019 by a man after she used a women's restroom in an Oregon public park.
              </p>
            </div>
            
            <div className="account-card">
              <h3>Gunner Scott</h3>
              <p>
                A transgender man serving jury duty in Boston who was so scared of harassment in the courthouse men's restroom that he would leave the building during breaks to find a private restroom.
              </p>
            </div>
            
            <div className="account-card">
              <h3>Anonymous Parent in Texas</h3>
              <p>
                The parent of a transgender boy in Texas shared that her son would restrict fluids in fear of needing to use the restroom and would come home dehydrated.
              </p>
            </div>
            
            <p className="impact-statement">
              These accounts demonstrate the mental stress, humiliation, and physical risks that come with the lack of safe facilities for transgender individuals.
            </p>
          </section>
          
          <section className="research-section">
            <h2>Comparison of Restroom Resources</h2>
            <p>
              Resources like <a href="https://www.refugerestrooms.org" target="_blank" rel="noopener noreferrer">Refuge Restrooms</a> attempt to help by providing a database of safe restrooms, but often have limitations:
            </p>
            <ul>
              <li>Limited explanations for why locations are rated highly or poorly</li>
              <li>Inconsistent or outdated information</li>
              <li>Limited coverage in many geographic areas</li>
              <li>Lack of verification systems for ratings</li>
            </ul>
            <p>
              These limitations highlight the need for more comprehensive and reliable resources for the LGBTQ+ community.
            </p>
          </section>
          
          <section className="research-section">
            <h2>Research Conclusions</h2>
            <p>
              The research clearly shows that access to safe public facilities remains a significant challenge for many LGBTQ+ individuals, particularly transgender people. The consequences extend beyond inconvenience to serious physical and mental health impacts.
            </p>
            <p>
              Fear of public restrooms leads many people to alter their daily routines, restrict fluid intake, and develop health issues from holding their need to use the restroom for too long.
            </p>
            <p>
              These findings underscore the importance of creating more inclusive public spaces and providing resources to help LGBTQ+ individuals navigate existing facilities safely.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default ResearchPage;
