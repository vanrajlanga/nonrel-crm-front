import React, { useState, useEffect } from 'react';
import Axios from '../../services/api';
import { BsFileEarmark, BsCheckCircle, BsXCircle } from 'react-icons/bs';
import './pendingVerifications.css';

const PendingVerifications = () => {
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    fetchPendingVerifications();
  }, []);

  const fetchPendingVerifications = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await Axios.get('/consultants/pending-verifications');
      setPendingRequests(response.data.consultants);
    } catch (error) {
      console.error('Error fetching pending verifications:', error);
      if (error.response?.status === 403) {
        setError('Access forbidden: You do not have permission to view pending verifications');
      } else {
        setError(error.response?.data?.message || 'Failed to fetch pending verifications');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleViewDocument = async (consultantId, docNumber) => {
    try {
      const response = await Axios.get(`/consultants/${consultantId}/documents/${docNumber}`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const newWindow = window.open(url, '_blank');
      if (!newWindow) {
        setError('Please allow popups to view the document');
      }
    } catch (error) {
      console.error('Error fetching document:', error);
      if (error.response?.status === 403) {
        setError('You are not authorized to view this document');
      } else if (error.response?.status === 404) {
        setError('Document not found');
      } else {
        setError('Failed to fetch document. Please try again.');
      }
    }
  };

  const handleVerification = async (consultantId, action) => {
    try {
      setVerifying(true);
      setError('');
      
      const response = await Axios.post(`/consultants/${consultantId}/verify-documents`, {
        action: action // 'approve' or 'reject'
      });
      
      if (response.data.message === "Document verification completed successfully") {
        // Refresh the list
        await fetchPendingVerifications();
      } else {
        throw new Error('Unexpected response from server');
      }
    } catch (error) {
      console.error('Error verifying documents:', error);
      if (error.response) {
        setError(error.response.data.message || 'Failed to verify documents');
      } else {
        setError('Network error. Please check your connection and try again.');
      }
    } finally {
      setVerifying(false);
    }
  };

  if (loading) {
    return <div className="pending-verifications-container">Loading...</div>;
  }

  return (
    <div className="pending-verifications-container">
      <h2>Pending Document Verifications</h2>
      
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {pendingRequests.length === 0 ? (
        <div className="no-requests">
          No pending document verification requests
        </div>
      ) : (
        <div className="requests-grid">
          {pendingRequests.map(request => (
            <div key={request.id} className="request-card">
              <div className="request-header">
                <h3>{request.fullName}</h3>
                <div className="contact-info">
                  <p>Email: {request.email}</p>
                  <p>Phone: {request.phone}</p>
                </div>
              </div>

              <div className="documents-section">
                <h4>Documents</h4>
                <div className="documents-grid">
                  {request.documents.document1 && (
                    <button 
                      className="document-btn"
                      onClick={() => handleViewDocument(request.id, 1)}
                    >
                      <BsFileEarmark /> Passport
                    </button>
                  )}
                  {request.documents.document2 && (
                    <button 
                      className="document-btn"
                      onClick={() => handleViewDocument(request.id, 2)}
                    >
                      <BsFileEarmark /> Visa
                    </button>
                  )}
                  {request.documents.document3 && (
                    <button 
                      className="document-btn"
                      onClick={() => handleViewDocument(request.id, 3)}
                    >
                      <BsFileEarmark /> PAN Card
                    </button>
                  )}
                  {request.documents.document4 && (
                    <button 
                      className="document-btn"
                      onClick={() => handleViewDocument(request.id, 4)}
                    >
                      <BsFileEarmark /> Additional Doc 1
                    </button>
                  )}
                  {request.documents.document5 && (
                    <button 
                      className="document-btn"
                      onClick={() => handleViewDocument(request.id, 5)}
                    >
                      <BsFileEarmark /> Additional Doc 2
                    </button>
                  )}
                </div>
              </div>

              <div className="request-footer">
                <div className="staff-info">
                  {request.coordinator && (
                    <p>Coordinator: {request.coordinator.username}</p>
                  )}
                  {request.teamLead && (
                    <p>Team Lead: {request.teamLead.username}</p>
                  )}
                </div>
                <div className="verification-actions">
                  <button
                    className="approve-btn"
                    onClick={() => handleVerification(request.id, 'approve')}
                    disabled={verifying}
                  >
                    <BsCheckCircle /> Approve
                  </button>
                  <button
                    className="reject-btn"
                    onClick={() => handleVerification(request.id, 'reject')}
                    disabled={verifying}
                  >
                    <BsXCircle /> Reject
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PendingVerifications;