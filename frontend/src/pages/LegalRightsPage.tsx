import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/LegalRightsPage.css';

const LegalRightsPage: React.FC = () => {
  return (
    <div className="legal-page">
      <div className="legal-container">
        <div className="page-header">
          <h1>Legal Rights & Information</h1>
        </div>
        
        <div className="legal-content">
          <div className="breadcrumbs">
            <Link to="/resources">Resources</Link> &gt; Legal Rights
          </div>
          
          <section className="legal-section">
            <h2>Federal Protections</h2>
            <div className="legal-card">
              <h3>Title IX of Education Amendments of 1972</h3>
              <p>
                Prohibits sex-based discrimination in education programs that receive federal funding.
                This has been interpreted to provide protections for LGBTQ+ students in schools and universities.
              </p>
            </div>
            
            <div className="legal-card">
              <h3>Bostock v. Clayton County (2020)</h3>
              <p>
                In this landmark case, the Supreme Court ruled that discrimination based on sexual orientation 
                and gender identity is considered sex discrimination under Title VII of the Civil Rights Act of 1964.
                This decision extends workplace protections to LGBTQ+ individuals across the United States.
              </p>
            </div>
          </section>
          
          <section className="legal-section">
            <h2>Bathroom Access Rights</h2>
            <p>
              Access to bathrooms that align with one's gender identity remains a contested issue in many parts of the United States.
            </p>
            
            <h3>Federal Guidance</h3>
            <ul>
              <li>No explicit federal law guarantees LGBTQ+ rights to use restrooms according to their gender identity</li>
              <li>Since 2016, federal government policies have explicitly protected restroom access in federal buildings</li>
              <li>Denying a person equal restroom access is considered sex discrimination (GSA Bulletin 2016-B1)</li>
              <li>Many government facilities now offer gender-neutral spaces, though availability varies by location</li>
            </ul>
            
            <h3>Title IX (Education)</h3>
            <ul>
              <li>Federally funded buildings have been a key focus in bathroom access debates</li>
              <li>Under the Obama administration, guidance was issued to protect restroom access based on gender identity</li>
              <li>This guidance was rescinded under the Trump administration</li>
              <li>Policies continue to evolve with changing administrations</li>
            </ul>
          </section>
          
          <section className="legal-section">
            <h2>Current Passport Situation (As of January 2025)</h2>
            <div className="alert-box">
              <h3>Important Notice</h3>
              <p>
                As of January 24, 2025, if you submit a passport application requesting a change of gender OR with an X gender marker, 
                it may be held indefinitely. This is due to an executive order signed on January 20, 2025.
              </p>
            </div>
            
            <h3>Key Information</h3>
            <ul>
              <li>Passports will only be issued with an M or an F marker, based on supporting documents and records from previous passports</li>
              <li>People have reported receiving passports with the sex changed to their assigned sex at birth without consent, even if their application didn't include intent to change gender markers</li>
              <li>Existing passports remain valid until their expiration date and can be used for travel</li>
              <li>When traveling, be aware of any restrictions for the countries you plan to visit</li>
            </ul>
            
            <h3>Risks to Consider</h3>
            <ul>
              <li>If you apply to renew your passport and your gender marker differs from what was assigned at birth, your passport may be held indefinitely or returned with a marker matching your assigned sex at birth</li>
              <li>This may occur even if all your current documents reflect your correct gender with no evidence of updates</li>
              <li>While there have been fewer issues with updating passports to reflect legal name changes (with court documents), renewing your passport could still bring your gender marker under scrutiny</li>
            </ul>
            
            <p className="source-note">
              Sources: chosenfamilylawcenter.org, sfstandard.com, travel.state.gov, lambdalegal.org, glad.org
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default LegalRightsPage;
