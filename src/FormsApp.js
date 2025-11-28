import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Model } from 'survey-core';
import { Survey } from 'survey-react-ui';
import 'survey-core/survey-core.min.css';
import './forms.css';

const API_URL = 'http://localhost:3001/api';

const FormsApp = () => {
  const { surveyId } = useParams();
  const [surveyModel, setSurveyModel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadSurvey();
  }, [surveyId]);

  const loadSurvey = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`${API_URL}/surveys/${surveyId}/schema`);
      
      if (!response.ok) {
        throw new Error('Survey not found');
      }
      
      const data = await response.json();
      const model = new Model(data);
      
      // Handle survey completion
      model.onComplete.add(async (sender) => {
        await submitResults(sender.data);
      });
      
      setSurveyModel(model);
    } catch (err) {
      console.error('Error loading survey:', err);
      setError(err.message || 'Failed to load survey');
    } finally {
      setLoading(false);
    }
  };

  const submitResults = async (results) => {
    try {
      setSubmitting(true);
      
      const response = await fetch(`${API_URL}/surveys/${surveyId}/results`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ results })
      });

      if (!response.ok) {
        throw new Error('Failed to submit survey');
      }

      console.log('Survey submitted successfully');
    } catch (err) {
      console.error('Error submitting survey:', err);
      alert('Failed to submit survey. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="forms-container">
        <div className="forms-loading">
          <div className="loading-spinner"></div>
          <p>Loading survey...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="forms-container">
        <div className="forms-error">
          <div className="error-icon">⚠️</div>
          <h2>Survey Not Found</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="forms-container">
      <div className="forms-content">
        {submitting && (
          <div className="submitting-overlay">
            <div className="loading-spinner"></div>
            <p>Submitting your response...</p>
          </div>
        )}
        <Survey model={surveyModel} />
      </div>
    </div>
  );
};

export default FormsApp;