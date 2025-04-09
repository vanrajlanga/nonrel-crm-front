import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Axios from '../../services/api';
import { BsArrowLeft, BsPersonCircle, BsEnvelope, BsPhone, BsFileText, BsCreditCard, BsCheckCircle, BsFileEarmarkText, BsUpload, BsFileEarmark } from 'react-icons/bs';
import './userProfile.css';
import PendingVerifications from '../PendingVerifications/PendingVerifications';

const UserProfile = () => {
  const navigate = useNavigate();
  const [userData, setUserData] = useState({
    id: '',
    fullName: '',
    email: '',
    phone: '',
    resumeStatus: '',
    paymentStatus: false,
    hasResume: false,
    isPlaced: false,
    hasAgreement: false,
    documentVerificationStatus: '',
    document1: '',
    document2: '',
    document3: '',
    document4: '',
    document5: '',
    createdBy: {
      username: '',
      email: '',
      role: ''
    },
    createdAt: '',
    updatedAt: '',
    teamLead: null,
    coordinator: null
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [documents, setDocuments] = useState({
    passport: null,
    visa: null,
    pancard: null,
    otherDoc1: null,
    otherDoc2: null
  });

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const response = await Axios.get('/my-profile');
      const consultantData = response.data.consultant;
      setUserData({
        ...consultantData,
        document1: consultantData.documents?.document1 || '',
        document2: consultantData.documents?.document2 || '',
        document3: consultantData.documents?.document3 || '',
        document4: consultantData.documents?.document4 || '',
        document5: consultantData.documents?.document5 || '',
        teamLead: consultantData.teamLead || null,
        coordinator: consultantData.coordinator || null
      });
    } catch (error) {
      if (error.response?.status === 403) {
        setError('You do not have permission to view this profile');
      } else {
        setError(error.response?.data?.message || 'Failed to load profile data');
      }
    } finally {
      setLoading(false);
    }
  };

  // Add debug logging for upload section visibility
  useEffect(() => { 
    const shouldShowUpload = userData.isPlaced || 
      (!userData.document1 && !userData.document2 && !userData.document3 && !userData.document4 && !userData.document5);
    
    console.log('Should show upload section:', shouldShowUpload);
  }, [userData]);

  const validateFile = (file) => {
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!allowedTypes.includes(file.type)) {
      return {
        valid: false,
        message: `Invalid file type. Only PDF, JPEG, and PNG files are allowed`
      };
    }

    if (file.size > maxSize) {
      return {
        valid: false,
        message: `File too large. Maximum size is 5MB`
      };
    }

    return { valid: true };
  };

  const handleFileChange = (documentType, event) => {
    const file = event.target.files[0];
    if (file) {
      const validation = validateFile(file);
      if (!validation.valid) {
        setUploadError(validation.message);
        event.target.value = ''; // Clear the file input
        return;
      }

      setDocuments(prev => ({
        ...prev,
        [documentType]: file
      }));
      setUploadError('');
    }
  };

  const handleUpload = async () => {
    // Check if all documents are uploaded
    const missingDocs = Object.entries(documents)
      .filter(([_, file]) => !file)
      .map(([type]) => type);

    if (missingDocs.length > 0) {
      setUploadError(`Please upload all required documents: ${missingDocs.join(', ')}`);
      return;
    }

    const formData = new FormData();
    // Add files in order: passport, visa, pancard, otherDoc1, otherDoc2
    const orderedDocs = ['passport', 'visa', 'pancard', 'otherDoc1', 'otherDoc2'];
    orderedDocs.forEach(type => {
      formData.append('documents', documents[type]);
      console.log(`Adding file to FormData: ${documents[type].name}, type: ${documents[type].type}, size: ${documents[type].size}`);
    });

    try {
      setUploading(true);
      setUploadError('');
      setUploadSuccess(false);

      
      const response = await Axios.post(`/consultants/${userData.id}/upload-documents`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      
      if (response.data.message === "Documents uploaded successfully. Waiting for verification.") {
        setUploadSuccess(true);
        setDocuments({
          passport: null,
          visa: null,
          pancard: null,
          otherDoc1: null,
          otherDoc2: null
        });
        // Refresh profile data to show new document status
        await fetchUserProfile();
      } else {
        throw new Error('Unexpected response from server');
      }
    } catch (error) {
      console.error('Error uploading documents:', error);
      console.error('Error response:', error.response);
      
      if (error.response) {
        if (error.response.status === 403) {
          if (error.response.data.message.includes('Only candidates can upload')) {
            setUploadError('Access forbidden: Only candidates can upload their documents');
          } else if (error.response.data.message.includes('own profile')) {
            setUploadError('Access forbidden: You can only upload documents for your own profile');
          } else {
            setUploadError('Access forbidden: You do not have permission to upload documents');
          }
        } else if (error.response.status === 400) {
          if (error.response.data.message.includes('not placed yet')) {
            setUploadError('Cannot upload documents: You are not placed yet');
          } else if (error.response.data.message.includes('Exactly 5 documents')) {
            setUploadError('Please upload exactly 5 documents');
          } else if (error.response.data.message.includes('Invalid file type')) {
            setUploadError(error.response.data.message);
          } else if (error.response.data.message.includes('File too large')) {
            setUploadError(error.response.data.message);
          } else {
            setUploadError(error.response.data.message || 'Invalid request. Please check your files and try again.');
          }
        } else {
          setUploadError(error.response.data.message || 'Failed to upload documents');
        }
      } else {
        setUploadError('Network error. Please check your connection and try again.');
      }
    } finally {
      setUploading(false);
    }
  };

  const handleViewDocument = async (docNumber) => {
    try {
      const response = await Axios.get(`/consultants/${userData.id}/documents/document${docNumber}`, {
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

  const handleRequestVerification = async () => {
    try {
      setUploading(true);
      setUploadError('');
      
      const response = await Axios.post(`/consultants/${userData.id}/request-verification`);
      
      if (response.data.message === "Document verification request sent successfully") {
        setUploadSuccess(true);
        // Refresh profile data to show updated verification status
        await fetchUserProfile();
      } else {
        throw new Error('Unexpected response from server');
      }
    } catch (error) {
      console.error('Error requesting verification:', error);
      if (error.response) {
        if (error.response.status === 400) {
          setUploadError(error.response.data.message);
        } else if (error.response.status === 404) {
          setUploadError('Consultant not found');
        } else {
          setUploadError(error.response.data.message || 'Failed to request verification');
        }
      } else {
        setUploadError('Network error. Please check your connection and try again.');
      }
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return <div className="profile-container">Loading...</div>;
  }

  return (
    <div className="profile-container">
      <button 
        className="back-btn"
        onClick={() => navigate('/')}
      >
        <BsArrowLeft /> Back to Dashboard
      </button>

      <div className="profile-header">
        <BsPersonCircle className="profile-icon" />
        <h2>My Profile</h2>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <div className="profile-info">
        <div className="info-item">
          <BsPersonCircle className="icon" />
          <div className="info-content">
            <label>Full Name</label>
            <span>{userData.fullName}</span>
          </div>
        </div>
        <div className="info-item">
          <BsEnvelope className="icon" />
          <div className="info-content">
            <label>Email</label>
            <span>{userData.email}</span>
          </div>
        </div>
        <div className="info-item">
          <BsPhone className="icon" />
          <div className="info-content">
            <label>Phone</label>
            <span>{userData.phone}</span>
          </div>
        </div>
        <div className="info-item">
          <BsFileText className="icon" />
          <div className="info-content">
            <label>Resume Status</label>
            <span>{userData.resumeStatus}</span>
          </div>
        </div>
        <div className="info-item">
          <BsCreditCard className="icon" />
          <div className="info-content">
            <label>Payment Status</label>
            <span>{userData.paymentStatus ? 'Paid' : 'Pending'}</span>
          </div>
        </div>
        <div className="info-item">
          <BsCheckCircle className="icon" />
          <div className="info-content">
            <label>Placement Status</label>
            <span>{userData.isPlaced ? 'Placed' : 'Not Placed'}</span>
          </div>
        </div>
        <div className="info-item">
          <BsFileEarmarkText className="icon" />
          <div className="info-content">
            <label>Document Verification Status</label>
            <span>{userData.documentVerificationStatus || 'Not Uploaded'}</span>
          </div>
        </div>

        {/* Document Fields */}
        {userData.document1 && (
          <div className="info-item">
            <BsFileEarmark className="icon" />
            <div className="info-content">
              <label>Passport</label>
              <button 
                className="document-link"
                onClick={() => handleViewDocument(1)}
              >
                View Document
              </button>
            </div>
          </div>
        )}
        {userData.document2 && (
          <div className="info-item">
            <BsFileEarmark className="icon" />
            <div className="info-content">
              <label>Visa</label>
              <button 
                className="document-link"
                onClick={() => handleViewDocument(2)}
              >
                View Document
              </button>
            </div>
          </div>
        )}
        {userData.document3 && (
          <div className="info-item">
            <BsFileEarmark className="icon" />
            <div className="info-content">
              <label>PAN Card</label>
              <button 
                className="document-link"
                onClick={() => handleViewDocument(3)}
              >
                View Document
              </button>
            </div>
          </div>
        )}
        {userData.document4 && (
          <div className="info-item">
            <BsFileEarmark className="icon" />
            <div className="info-content">
              <label>Additional Document 1</label>
              <button 
                className="document-link"
                onClick={() => handleViewDocument(4)}
              >
                View Document
              </button>
            </div>
          </div>
        )}
        {userData.document5 && (
          <div className="info-item">
            <BsFileEarmark className="icon" />
            <div className="info-content">
              <label>Additional Document 2</label>
              <button 
                className="document-link"
                onClick={() => handleViewDocument(5)}
              >
                View Document
              </button>
            </div>
          </div>
        )}

        <div className="info-item">
          <div className="info-content">
            <label>Created By</label>
            <span>{userData.createdBy?.username} ({userData.createdBy?.role})</span>
          </div>
        </div>

        {/* Team Lead Information */}
        {userData.teamLead && (
          <div className="info-item">
            <div className="info-content">
              <label>Team Lead</label>
              <div className="contact-details">
                <span className="contact-name">{userData.teamLead.username}</span>
                <span className="contact-email">{userData.teamLead.email}</span>
              </div>
            </div>
          </div>
        )}

        {/* Coordinator Information */}
        {userData.coordinator && (
          <div className="info-item">
            <div className="info-content">
              <label>Coordinator</label>
              <div className="contact-details">
                <span className="contact-name">{userData.coordinator.username}</span>
                <span className="contact-email">{userData.coordinator.email}</span>
              </div>
            </div>
          </div>
        )}

        <div className="info-item">
          <div className="info-content">
            <label>Member Since</label>
            <span>{new Date(userData.createdAt).toLocaleDateString()}</span>
          </div>
        </div>
      </div>

      {(userData.isPlaced || 
        (!userData.document1 && !userData.document2 && !userData.document3 && !userData.document4 && !userData.document5)) && (
        <div className="upload-section">
          <h3>Upload Documents</h3>
          <p className="upload-instructions">
            Please upload exactly 5 documents. Allowed file types: PDF, JPEG, PNG. Maximum file size: 5MB each.
          </p>
          
          <div className="document-upload-grid">
            <div className="document-upload-item">
              <h4>Passport</h4>
              <div className="file-input-container">
                <input
                  type="file"
                  id="passport"
                  onChange={(e) => handleFileChange('passport', e)}
                  accept=".pdf,.jpg,.jpeg,.png"
                />
                <label htmlFor="passport" className="file-input-label">
                  <BsFileEarmark /> Choose File
                </label>
                {documents.passport && (
                  <span className="file-name">{documents.passport.name}</span>
                )}
              </div>
            </div>

            <div className="document-upload-item">
              <h4>Visa</h4>
              <div className="file-input-container">
                <input
                  type="file"
                  id="visa"
                  onChange={(e) => handleFileChange('visa', e)}
                  accept=".pdf,.jpg,.jpeg,.png"
                />
                <label htmlFor="visa" className="file-input-label">
                  <BsFileEarmark /> Choose File
                </label>
                {documents.visa && (
                  <span className="file-name">{documents.visa.name}</span>
                )}
              </div>
            </div>

            <div className="document-upload-item">
              <h4>PAN Card</h4>
              <div className="file-input-container">
                <input
                  type="file"
                  id="pancard"
                  onChange={(e) => handleFileChange('pancard', e)}
                  accept=".pdf,.jpg,.jpeg,.png"
                />
                <label htmlFor="pancard" className="file-input-label">
                  <BsFileEarmark /> Choose File
                </label>
                {documents.pancard && (
                  <span className="file-name">{documents.pancard.name}</span>
                )}
              </div>
            </div>

            <div className="document-upload-item">
              <h4>Additional Document 1</h4>
              <div className="file-input-container">
                <input
                  type="file"
                  id="otherDoc1"
                  onChange={(e) => handleFileChange('otherDoc1', e)}
                  accept=".pdf,.jpg,.jpeg,.png"
                />
                <label htmlFor="otherDoc1" className="file-input-label">
                  <BsFileEarmark /> Choose File
                </label>
                {documents.otherDoc1 && (
                  <span className="file-name">{documents.otherDoc1.name}</span>
                )}
              </div>
            </div>

            <div className="document-upload-item">
              <h4>Additional Document 2</h4>
              <div className="file-input-container">
                <input
                  type="file"
                  id="otherDoc2"
                  onChange={(e) => handleFileChange('otherDoc2', e)}
                  accept=".pdf,.jpg,.jpeg,.png"
                />
                <label htmlFor="otherDoc2" className="file-input-label">
                  <BsFileEarmark /> Choose File
                </label>
                {documents.otherDoc2 && (
                  <span className="file-name">{documents.otherDoc2.name}</span>
                )}
              </div>
            </div>
          </div>

          <div className="submit-section">
            <button
              className="submit-btn"
              onClick={handleUpload}
              disabled={uploading || Object.values(documents).some(file => !file)}
            >
              <BsUpload /> {uploading ? 'Uploading...' : 'Submit All Documents'}
            </button>
          </div>

          {uploadSuccess && (
            <div className="success-message">
              Documents uploaded successfully! Waiting for verification.
            </div>
          )}

          {uploadError && (
            <div className="error-message">
              {uploadError}
            </div>
          )}
        </div>
      )}

      {userData.isPlaced && 
       userData.document1 && 
       userData.document2 && 
       userData.document3 && 
       userData.document4 && 
       userData.document5 && 
       userData.documentVerificationStatus !== 'pending' && 
       userData.documentVerificationStatus !== 'verified' && (
        <div className="verification-section">
          <button 
            className="request-verification-btn"
            onClick={handleRequestVerification}
          >
            Request Document Verification
          </button>
        </div>
      )}

      {userData.documentVerificationStatus === 'pending' && (
        <div className="verification-status">
          <p className="verification-message">
            Document verification request is pending. Your coordinator and support staff have been notified.
          </p>
          {userData.coordinator && (
            <div className="staff-info">
              <h4>Coordinator</h4>
              <p>{userData.coordinator.username} ({userData.coordinator.email})</p>
            </div>
          )}
          {userData.teamLead && (
            <div className="staff-info">
              <h4>Team Lead</h4>
              <p>{userData.teamLead.username} ({userData.teamLead.email})</p>
            </div>
          )}
        </div>
      )}

    </div>
  );
};

export default UserProfile; 