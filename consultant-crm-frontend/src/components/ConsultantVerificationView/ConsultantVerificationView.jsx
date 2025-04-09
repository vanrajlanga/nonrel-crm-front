import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Axios from '../../services/api';
import { BsFileEarmark, BsCheckCircle, BsXCircle, BsArrowLeft } from 'react-icons/bs';
import './consultantVerificationView.css';

const ConsultantVerificationView = () => {
  const navigate = useNavigate();
  const [consultants, setConsultants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedConsultant, setSelectedConsultant] = useState(null);

  const fetchPendingVerifications = async () => {
    try {
      const response = await Axios.get('/consultants/pending-verifications');
      setConsultants(response.data.consultants);
    } catch (error) {
      console.error('Error fetching pending verifications:', error);
      setError(error.response?.data?.message || 'Failed to fetch pending verifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingVerifications();
  }, []);

  const handleViewDocument = async (consultantId, docNumber) => {
    try {
      const response = await Axios.get(`/consultants/${consultantId}/documents/${docNumber}`, {
        responseType: 'blob'
      });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (error) {
      console.error('Error viewing document:', error);
      setError('Failed to view document');
    }
  };

  const handleApprove = async (consultantId) => {
    try {
      await Axios.post(`/consultants/${consultantId}/approve-verification`);
      // Refresh the list
      fetchPendingVerifications();
      // Dispatch event to update header count
      window.dispatchEvent(new Event('verificationStatusChange'));
    } catch (error) {
      console.error('Error approving verification:', error);
      setError(error.response?.data?.message || 'Failed to approve verification');
    }
  };

  const handleReject = async (consultantId) => {
    try {
      await Axios.post(`/consultants/${consultantId}/reject-verification`);
      // Refresh the list
      fetchPendingVerifications();
      // Dispatch event to update header count
      window.dispatchEvent(new Event('verificationStatusChange'));
    } catch (error) {
      console.error('Error rejecting verification:', error);
      setError(error.response?.data?.message || 'Failed to reject verification');
    }
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="verification-view">
      <div className="header-section">
        <button 
          className="back-btn"
          onClick={() => navigate(-1)}
        >
          <BsArrowLeft />
          Back
        </button>
        <h2>Pending Verifications</h2>
      </div>

      <div className="consultants-list">
        {consultants.length > 0 ? (
          consultants.map(consultant => (
            <div key={consultant.id} className="consultant-card">
              <div className="consultant-details-header">
                <h3>{consultant.fullName}</h3>
                <div className="contact-info">
                  <p>Email: {consultant.email}</p>
                  <p>Phone: {consultant.phone}</p>
                </div>
              </div>

              <div className="documents-section">
                <h4>Documents</h4>
                <div className="documents-grid">
                  <div className="document-item">
                    <button 
                      className="document-btn"
                      onClick={() => handleViewDocument(consultant.id, 1)}
                    >
                      <BsFileEarmark />
                      <span>Passport</span>
                    </button>
                  </div>
                  <div className="document-item">
                    <button 
                      className="document-btn"
                      onClick={() => handleViewDocument(consultant.id, 2)}
                    >
                      <BsFileEarmark />
                      <span>Visa</span>
                    </button>
                  </div>
                  <div className="document-item">
                    <button 
                      className="document-btn"
                      onClick={() => handleViewDocument(consultant.id, 3)}
                    >
                      <BsFileEarmark />
                      <span>PAN Card</span>
                    </button>
                  </div>
                  <div className="document-item">
                    <button 
                      className="document-btn"
                      onClick={() => handleViewDocument(consultant.id, 4)}
                    >
                      <BsFileEarmark />
                      <span>Additional Document 1</span>
                    </button>
                  </div>
                  <div className="document-item">
                    <button 
                      className="document-btn"
                      onClick={() => handleViewDocument(consultant.id, 5)}
                    >
                      <BsFileEarmark />
                      <span>Additional Document 2</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="staff-info">
                <div className="info-card">
                  <h4>Coordinator</h4>
                  <p>Name: {consultant.coordinator.username}</p>
                  <p>Email: {consultant.coordinator.email}</p>
                </div>
                <div className="info-card">
                  <h4>Team Lead</h4>
                  <p>Name: {consultant.teamLead.username}</p>
                  <p>Email: {consultant.teamLead.email}</p>
                </div>
              </div>

              <div className="verification-actions">
                <button 
                  className="approve-btn"
                  onClick={() => handleApprove(consultant.id)}
                >
                  <BsCheckCircle />
                  Approve
                </button>
                <button 
                  className="reject-btn"
                  onClick={() => handleReject(consultant.id)}
                >
                  <BsXCircle />
                  Reject
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="no-pending">
            No pending verifications
          </div>
        )}
      </div>
    </div>
  );
};

export default ConsultantVerificationView; 