'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { submitSupportRequest, SupportRequest, SupportResponse } from '@/app/api/text-support';
import '@/app/styles/text.css';

export default function SupportFormPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<SupportRequest>({
    name: '',
    email: '',
    phone: '',
    subject: '',
    description: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [response, setResponse] = useState<SupportResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastSubmittedData, setLastSubmittedData] = useState<SupportRequest | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    
    // Store a copy of the current form data before submission
    const currentSubmission = { ...formData };
    setLastSubmittedData(currentSubmission);
    
    try {
      const result = await submitSupportRequest(formData);

      if (result.success) {
        setResponse(result);
        
        // Clear form after successful submission
        setFormData({
          name: '',
          email: '',
          phone: '',
          subject: '',
          description: ''
        });
      } else {
        throw new Error(result.error || result.analysis?.solution || 'Failed to submit support request');
      }
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBackToHome = () => {
    router.push('/support');
  };

  // Use this function to safely get request data (either from response or lastSubmittedData)
  const getRequestData = () => {
    if (response?.requestData) {
      return response.requestData;
    }
    return lastSubmittedData || formData;
  };

  // Get the request data safely
  const requestData = getRequestData();

  return (
    <div className="support-container min-h-screen flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8" style={{ 
      backgroundImage: "url('/audio.jpg')",
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat'
    }}>
      <h1 className="support-title text-4xl font-bold mb-8 text-white drop-shadow-lg">Submit a Support Request</h1>
      
      {response ? (
        <div className="response-container max-w-3xl w-full backdrop-filter backdrop-blur-md bg-white/10 dark:bg-black/30 border border-white/20 rounded-xl shadow-xl p-6 relative overflow-hidden">
          {/* Glass highlight effect */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-white/10 rounded-full mix-blend-overlay"></div>
          
          <h2 className="response-header text-2xl font-semibold mb-6 text-white">Request Submitted Successfully</h2>
          
          <div className="ticket-section backdrop-filter backdrop-blur-sm bg-white/10 dark:bg-white/5 rounded-lg p-4 mb-6 border border-white/10">
            <h3 className="section-title text-lg font-medium mb-2 text-blue-200">Ticket Information</h3>
            <div className="ticket-info">
              <p className="text-white"><strong className="text-blue-200">Ticket ID:</strong> {response.ticketId}</p>
            </div>
          </div>
          
          <div className="understanding-section backdrop-filter backdrop-blur-sm bg-white/10 dark:bg-white/5 rounded-lg p-4 mb-6 border border-white/10">
            <h3 className="section-title text-lg font-medium mb-3 text-blue-200">Your Request Details</h3>
            <div className="understanding-content text-white">
              <div className="request-details-grid grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                <p><strong className="text-blue-200">Name:</strong> {requestData.name}</p>
                <p><strong className="text-blue-200">Email:</strong> {requestData.email}</p>
              </div>
              <div className="request-details-grid grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                <p><strong className="text-blue-200">Phone:</strong> {requestData.phone || 'Not provided'}</p>
                <p><strong className="text-blue-200">Subject:</strong> {requestData.subject || 'Not provided'}</p>
              </div>
              <p><strong className="text-blue-200">Description:</strong></p>
              <p className="description-content mt-1">{requestData.description}</p>
            </div>
          </div>
          
          <div className="solution-section backdrop-filter backdrop-blur-sm bg-white/10 dark:bg-white/5 rounded-lg p-4 mb-6 border border-white/10">
            <h3 className="section-title text-lg font-medium mb-2 text-blue-200">Our Response</h3>
            <div className="solution-content text-white">
              <p>{response.analysis?.solution || "Thank you for contacting us. We've received your request and will respond shortly."}</p>
            </div>
          </div>
          
          <div className="next-steps-section backdrop-filter backdrop-blur-sm bg-white/10 dark:bg-white/5 rounded-lg p-4 mb-6 border border-white/10">
            <h3 className="section-title text-lg font-medium mb-2 text-blue-200">Next Steps</h3>
            <div className="next-steps-content text-white">
              <p>
                We have scheduled a call with one of our support specialists to discuss your request in detail.
                {requestData.phone ? ` Our team will call you at ${requestData.phone} shortly.` : ' Please expect a call from our team soon.'}
              </p>
            </div>
          </div>
          
          <div className="footer-section flex justify-center mt-6">
            <button
              onClick={handleBackToHome}
              className="back-link px-6 py-2 bg-blue-600/50 hover:bg-blue-700/60 text-white rounded-lg backdrop-blur-sm transition-all duration-300 border border-blue-400/20"
            >
              Back to Support Options
            </button>
          </div>
          
          {/* Bottom glass highlight effect */}
          <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-blue-300/10 rounded-full mix-blend-overlay"></div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="form-container max-w-2xl w-full backdrop-filter backdrop-blur-md bg-white/10 dark:bg-black/30 border border-white/20 rounded-xl shadow-xl p-6 relative overflow-hidden">
          {/* Glass highlight effect */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-white/10 rounded-full mix-blend-overlay"></div>
          
          {error && (
            <div className="error-message bg-red-500/20 border border-red-400/30 text-white p-4 rounded-lg mb-6">
              {error}
            </div>
          )}
          
          <div className="form-field mb-4">
            <label htmlFor="name" className="form-label block text-blue-200 font-medium mb-1">
              Name *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="form-input w-full bg-white/5 border border-white/20 rounded-lg p-3 text-white placeholder-blue-200/50 focus:ring-2 focus:ring-blue-500/50 focus:border-transparent"
            />
          </div>
          
          <div className="form-field mb-4">
            <label htmlFor="email" className="form-label block text-blue-200 font-medium mb-1">
              Email *
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="form-input w-full bg-white/5 border border-white/20 rounded-lg p-3 text-white placeholder-blue-200/50 focus:ring-2 focus:ring-blue-500/50 focus:border-transparent"
            />
          </div>
          
          <div className="form-field mb-4">
            <label htmlFor="phone" className="form-label block text-blue-200 font-medium mb-1">
              Phone Number
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="e.g., 9881679994"
              className="form-input w-full bg-white/5 border border-white/20 rounded-lg p-3 text-white placeholder-blue-200/50 focus:ring-2 focus:ring-blue-500/50 focus:border-transparent"
            />
            <p className="form-hint text-blue-100/70 text-sm mt-1">
              If provided, our support team will call you to discuss your issue.
            </p>
          </div>
          
          <div className="form-field mb-4">
            <label htmlFor="subject" className="form-label block text-blue-200 font-medium mb-1">
              Subject
            </label>
            <input
              type="text"
              id="subject"
              name="subject"
              value={formData.subject}
              onChange={handleChange}
              className="form-input w-full bg-white/5 border border-white/20 rounded-lg p-3 text-white placeholder-blue-200/50 focus:ring-2 focus:ring-blue-500/50 focus:border-transparent"
            />
          </div>
          
          <div className="form-field mb-6">
            <label htmlFor="description" className="form-label block text-blue-200 font-medium mb-1">
              Description *
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              rows={5}
              className="form-textarea w-full bg-white/5 border border-white/20 rounded-lg p-3 text-white placeholder-blue-200/50 focus:ring-2 focus:ring-blue-500/50 focus:border-transparent resize-y"
            />
          </div>
          
          <div className="form-actions flex justify-between">
            <button
              type="button"
              onClick={handleBackToHome}
              className="back-button px-6 py-2 bg-transparent border border-blue-400/30 text-blue-200 rounded-lg hover:bg-blue-900/20 transition-all duration-300"
            >
              Back
            </button>
            
            <button
              type="submit"
              disabled={isSubmitting}
              className={`send-button px-6 py-2 bg-blue-600/60 hover:bg-blue-700/70 text-white rounded-lg transition-all duration-300 ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Request'}
            </button>
          </div>
          
          {/* Bottom glass highlight effect */}
          <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-blue-300/10 rounded-full mix-blend-overlay"></div>
        </form>
      )}
    </div>
  );
}