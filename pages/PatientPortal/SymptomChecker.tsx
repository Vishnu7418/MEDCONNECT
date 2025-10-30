
import React, { useState } from 'react';
import { getSymptomAnalysis } from '../../services/geminiService';
// A simple markdown to React component converter
import { Remarkable } from 'remarkable';

const md = new Remarkable();

const SymptomChecker: React.FC = () => {
  const [symptoms, setSymptoms] = useState('');
  const [analysis, setAnalysis] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCheckSymptoms = async () => {
    if (symptoms.trim().length < 10) {
      setError('Please describe your symptoms in more detail (at least 10 characters).');
      return;
    }
    setError('');
    setIsLoading(true);
    setAnalysis('');
    
    try {
      const result = await getSymptomAnalysis(symptoms);
      setAnalysis(result);
    } catch (e) {
      setError('An unexpected error occurred. Please try again.');
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-semibold text-gray-800 dark:text-dark-text mb-4">AI Symptom Checker</h2>
      <div className="bg-yellow-50 dark:bg-yellow-900/50 border-l-4 border-yellow-400 text-yellow-700 dark:text-yellow-300 p-4 mb-6 rounded-md" role="alert">
        <p className="font-bold">Important Disclaimer</p>
        <p>This tool is for informational purposes only and is not a substitute for professional medical advice, diagnosis, or treatment. Always seek the advice of your physician or other qualified health provider with any questions you may have regarding a medical condition.</p>
      </div>

      <div className="space-y-4">
        <div>
          <label htmlFor="symptoms" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Please describe your symptoms (e.g., "I have a sharp headache, a slight fever, and a sore throat.")
          </label>
          <textarea
            id="symptoms"
            rows={4}
            className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            value={symptoms}
            onChange={(e) => setSymptoms(e.target.value)}
            placeholder="Describe your symptoms here..."
          />
        </div>
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <div>
          <button
            onClick={handleCheckSymptoms}
            disabled={isLoading}
            className="bg-primary text-white font-semibold py-2 px-6 rounded-lg hover:bg-primary/90 transition disabled:bg-gray-400"
          >
            {isLoading ? 'Analyzing...' : 'Analyze Symptoms'}
          </button>
        </div>
      </div>

      {isLoading && (
        <div className="mt-6 text-center">
          <p className="dark:text-gray-300">Our AI is analyzing your symptoms. This may take a moment...</p>
          {/* Simple spinner */}
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary mt-4"></div>
        </div>
      )}

      {analysis && (
        <div className="mt-6 p-4 border border-gray-200 dark:border-dark-border rounded-lg bg-light dark:bg-dark-bg">
          <h3 className="text-xl font-semibold text-gray-800 dark:text-dark-text mb-4">Analysis Results</h3>
          <div 
            className="prose prose-blue dark:prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: md.render(analysis) }}
          />
        </div>
      )}
    </div>
  );
};

export default SymptomChecker;
