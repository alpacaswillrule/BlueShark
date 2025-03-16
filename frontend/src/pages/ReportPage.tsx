import React from 'react';
import RatingForm from '../components/RatingForm';
import '../styles/ReportPage.css';

const ReportPage: React.FC = () => {
  return (
    <div className="report-page">
      <div className="report-container">
        <div className="page-header">
          <h1>Submit a Rating</h1>
          <p>
            Help make our community safer by sharing your experiences at local establishments.
            Your feedback helps others find queer-friendly spaces.
          </p>
        </div>
        <RatingForm />
      </div>
    </div>
  );
};

export default ReportPage;
