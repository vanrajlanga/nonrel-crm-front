import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Axios from '../../services/api';
import { 
  BsArrowLeft, 
  BsPersonCircle, 
  BsEnvelope, 
  BsPhone, 
  BsFileText, 
  BsCreditCard, 
  BsCheckCircle, 
  BsFileEarmarkText, 
  BsUpload, 
  BsFileEarmark,
  BsCalendar,
  BsPeople,
  BsBuilding,
  BsCheck2Circle,
  BsExclamationCircle,
  BsEye
} from 'react-icons/bs';
import './userProfile.css';
import PendingVerifications from '../PendingVerifications/PendingVerifications';
import axios from 'axios';

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
  const [emiUploadError, setEmiUploadError] = useState('');
  const [emiUploadSuccess, setEmiUploadSuccess] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [emiUploading, setEmiUploading] = useState(false);

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

  const uploadEmiProof = async (formData) => {
    try {
      const response = await Axios.post(
        `/consultants/${userData.id}/agreement/proof`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error uploading EMI proof:', error);
      throw error;
    }
  };

  const handleEmiProofUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    if (!selectedMonth) {
      setEmiUploadError('Please select a month first');
      return;
    }

    setEmiUploading(true);
    setEmiUploadError('');
    setEmiUploadSuccess('');

    const formData = new FormData();
    formData.append('proofFile', file);
    formData.append('monthNumber', selectedMonth);

    try {
      const response = await uploadEmiProof(formData);
      if (response.success) {
        setEmiUploadSuccess(`EMI proof for month ${selectedMonth} uploaded successfully`);
        setSelectedMonth('');
        event.target.value = '';
      } else {
        setEmiUploadError(response.message || 'Failed to upload EMI proof');
      }
    } catch (error) {
      setEmiUploadError(error.response?.data?.message || 'An error occurred while uploading the EMI proof');
    } finally {
      setEmiUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="user-profile-loading">
        <div className="user-profile-spinner"></div>
        <p>Loading profile information...</p>
      </div>
    );
  }

  return (
    <div className="user-profile-container">
      <button className="user-profile-back-btn" onClick={() => navigate('/')}>
        <BsArrowLeft /> Back to Dashboard
      </button>

      <div className="user-profile-header">
        <div className="user-profile-header-main">
          <BsPersonCircle className="user-profile-avatar" />
          <div className="user-profile-header-info">
            <h2>{userData.fullName || 'Profile'}</h2>
            <p className="user-profile-subtitle">{userData.email}</p>
          </div>
        </div>
        <div className="user-profile-status-badges">
          <span className={`user-profile-status-badge ${userData.paymentStatus ? 'verified' : 'pending'}`}>
            {userData.paymentStatus ? 'Payment Verified' : 'Payment Pending'}
          </span>
          <span className={`user-profile-status-badge ${userData.isPlaced ? 'success' : 'warning'}`}>
            {userData.isPlaced ? 'Placed' : 'Not Placed'}
          </span>
        </div>
      </div>

      {error && <div className="user-profile-error-message">{error}</div>}

      <div className="user-profile-content">
        {(localStorage.getItem('role') === 'coordinator' || localStorage.getItem('role') === 'teamLead') && (
          <PendingVerifications />
        )}

        <div className="user-profile-section">
          <h3 className="user-profile-section-title">Personal Information</h3>
          <div className="user-profile-info-grid">
            <div className="user-profile-info-item">
              <BsPersonCircle className="icon" />
              <div className="user-profile-info-content">
                <label>Full Name</label>
                <span>{userData.fullName || '----'}</span>
              </div>
            </div>
            <div className="user-profile-info-item">
              <BsEnvelope className="icon" />
              <div className="user-profile-info-content">
                <label>Email</label>
                <span>{userData.email || '----'}</span>
              </div>
            </div>
            <div className="user-profile-info-item">
              <BsPhone className="icon" />
              <div className="user-profile-info-content">
                <label>Phone</label>
                <span>{userData.phone || '----'}</span>
              </div>
            </div>
            <div className="user-profile-info-item">
              <BsCalendar className="icon" />
              <div className="user-profile-info-content">
                <label>Member Since</label>
                <span>{new Date(userData.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="user-profile-section">
          <h3 className="user-profile-section-title">Status Information</h3>
          <div className="user-profile-info-grid">
            <div className="user-profile-info-item">
              <BsFileText className="icon" />
              <div className="user-profile-info-content">
                <label>Resume Status</label>
                <span className={`user-profile-status-text ${userData.resumeStatus?.toLowerCase()}`}>
                  {userData.resumeStatus || 'Not Uploaded'}
                </span>
              </div>
            </div>
            <div className="user-profile-info-item">
              <BsCreditCard className="icon" />
              <div className="user-profile-info-content">
                <label>Payment Status</label>
                <span className={`user-profile-status-text ${userData.paymentStatus ? 'verified' : 'pending'}`}>
                  {userData.paymentStatus ? 'Verified' : 'Pending'}
                </span>
              </div>
            </div>
            <div className="user-profile-info-item">
              <BsCheckCircle className="icon" />
              <div className="user-profile-info-content">
                <label>Placement Status</label>
                <span className={`user-profile-status-text ${userData.isPlaced ? 'success' : 'warning'}`}>
                  {userData.isPlaced ? 'Placed' : 'Not Placed'}
                </span>
              </div>
            </div>
            <div className="user-profile-info-item">
              <BsFileEarmarkText className="icon" />
              <div className="user-profile-info-content">
                <label>Document Verification</label>
                <span className={`user-profile-status-text ${userData.documentVerificationStatus?.toLowerCase() || 'pending'}`}>
                  {userData.documentVerificationStatus || 'Not Uploaded'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {(userData.coordinator || userData.teamLead || localStorage.getItem('role') === 'coordinator' || localStorage.getItem('role') === 'teamLead') && (
          <div className="user-profile-section">
            <h3 className="user-profile-section-title">Team Information</h3>
            <div className="user-profile-info-grid">
              {userData.teamLead ? (
                <div className="user-profile-info-item">
                  <BsPeople className="icon" />
                  <div className="user-profile-info-content">
                    <label>Team Lead</label>
                    <div className="user-profile-contact-details">
                      <span className="user-profile-contact-name">{userData.teamLead.username}</span>
                      <span className="user-profile-contact-email">{userData.teamLead.email}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="user-profile-info-item">
                  <BsPeople className="icon" />
                  <div className="user-profile-info-content">
                    <label>Team Lead</label>
                    <span>Not Assigned</span>
                  </div>
                </div>
              )}
              {userData.coordinator ? (
                <div className="user-profile-info-item">
                  <BsBuilding className="icon" />
                  <div className="user-profile-info-content">
                    <label>Coordinator</label>
                    <div className="user-profile-contact-details">
                      <span className="user-profile-contact-name">{userData.coordinator.username}</span>
                      <span className="user-profile-contact-email">{userData.coordinator.email}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="user-profile-info-item">
                  <BsBuilding className="icon" />
                  <div className="user-profile-info-content">
                    <label>Coordinator</label>
                    <span>Not Assigned</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {userData.document1 && (
          <div className="user-profile-section">
            <h3 className="user-profile-section-title">Uploaded Documents</h3>
            <div className="user-profile-documents-grid">
              {[1, 2, 3, 4, 5].map(num => userData[`document${num}`] && (
                <div key={num} className="user-profile-document-item">
                  <BsFileEarmark className="icon" />
                  <div className="user-profile-document-content">
                    <label>{num === 1 ? 'Passport' : 
                           num === 2 ? 'Visa' : 
                           num === 3 ? 'PAN Card' : 
                           `Additional Document ${num-3}`}</label>
                    <button 
                      className="user-profile-view-document-btn"
                      onClick={() => handleViewDocument(num)}
                    >
                      View Document
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {userData.isPlaced && userData.documentVerificationStatus !== 'verified' && (
          <div className="user-profile-section user-profile-upload-section">
            <h3 className="user-profile-section-title">Document Upload</h3>
            <p className="user-profile-upload-instructions">
              Please upload exactly 5 documents. Allowed file types: PDF, JPEG, PNG. Maximum file size: 5MB each.
            </p>
            
            <div className="user-profile-document-upload-grid">
              {[
                { id: 'passport', label: 'Passport' },
                { id: 'visa', label: 'Visa' },
                { id: 'pancard', label: 'PAN Card' },
                { id: 'otherDoc1', label: 'Additional Document 1' },
                { id: 'otherDoc2', label: 'Additional Document 2' }
              ].map(doc => (
                <div key={doc.id} className="user-profile-document-upload-item">
                  <h4>{doc.label}</h4>
                  <div className="user-profile-file-input-container">
                    <input
                      type="file"
                      id={doc.id}
                      onChange={(e) => handleFileChange(doc.id, e)}
                      accept=".pdf,.jpg,.jpeg,.png"
                    />
                    <label htmlFor={doc.id} className="user-profile-file-input-label">
                      <BsFileEarmark /> Choose File
                    </label>
                    {documents[doc.id] && (
                      <span className="user-profile-file-name">{documents[doc.id].name}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="user-profile-submit-section">
              <button
                className="user-profile-submit-btn"
                onClick={handleUpload}
                disabled={uploading || Object.values(documents).some(file => !file)}
              >
                <BsUpload /> {uploading ? 'Uploading...' : 'Submit All Documents'}
              </button>
            </div>

            {uploadSuccess && (
              <div className="user-profile-success-message">
                Documents uploaded successfully! Waiting for verification.
              </div>
            )}

            {uploadError && (
              <div className="user-profile-error-message">
                {uploadError}
              </div>
            )}
          </div>
        )}

        {userData.isPlaced && 
         userData.document1 && 
         userData.documentVerificationStatus !== 'pending' && 
         userData.documentVerificationStatus !== 'verified' && (
          <div className="user-profile-verification-section">
            <button 
              className="user-profile-request-verification-btn"
              onClick={handleRequestVerification}
              disabled={uploading}
            >
              Request Document Verification
            </button>
          </div>
        )}

        {userData.documentVerificationStatus === 'pending' && (
          <div className="user-profile-verification-status">
            <div className="user-profile-verification-message">
              <BsCheckCircle className="icon" />
              <p>Document verification request is pending. Your coordinator and support staff have been notified.</p>
            </div>
            {(userData.coordinator || userData.teamLead) && (
              <div className="user-profile-verification-contacts">
                {userData.coordinator && (
                  <div className="user-profile-staff-info">
                    <h4>Coordinator</h4>
                    <p>{userData.coordinator.username} ({userData.coordinator.email})</p>
                  </div>
                )}
                {userData.teamLead && (
                  <div className="user-profile-staff-info">
                    <h4>Team Lead</h4>
                    <p>{userData.teamLead.username} ({userData.teamLead.email})</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {userData.hasAgreement && (
          <div className="user-profile-section">
            <h3 className="user-profile-section-title">
              <BsUpload /> EMI Agreement Proofs
            </h3>
            
            <div className="user-profile-agreement-summary">
              <div className="summary-grid">
                <div className="summary-item">
                  <label>Total Service Fee</label>
                  <span className="amount">${userData.agreementInfo?.totalServiceFee?.toFixed(2) || '0.00'}</span>
                </div>
                <div className="summary-item">
                  <label>Monthly Payment</label>
                  <span className="amount">${userData.agreementInfo?.monthlyPaymentAmount?.toFixed(2) || '0.00'}</span>
                </div>
                <div className="summary-item">
                  <label>Status</label>
                  <span className={`status-badge ${userData.agreementInfo?.paymentCompletionStatus || 'pending'}`}>
                    {(userData.agreementInfo?.paymentCompletionStatus || 'pending').replace('_', ' ').toUpperCase()}
                  </span>
                </div>
                <div className="summary-item">
                  <label>Total Paid</label>
                  <span className="amount">${userData.agreementInfo?.totalPaidSoFar?.toFixed(2) || '0.00'}</span>
                </div>
                <div className="summary-item">
                  <label>Remaining Balance</label>
                  <span className="amount">${userData.agreementInfo?.remainingBalance?.toFixed(2) || '0.00'}</span>
                </div>
                <div className="summary-item">
                  <label>Next Due Date</label>
                  <span className="date">
                    {userData.agreementInfo?.nextDueDate ? new Date(userData.agreementInfo.nextDueDate).toLocaleDateString() : '----'}
                  </span>
                </div>
              </div>
            </div>

            <div className="user-profile-emi-table">
              {emiUploadSuccess && (
                <div className="user-profile-success-message" style={{ marginBottom: '1rem' }}>
                  <BsCheck2Circle /> {emiUploadSuccess}
                </div>
              )}

              {emiUploadError && (
                <div className="user-profile-error-message" style={{ marginBottom: '1rem' }}>
                  <BsExclamationCircle /> {emiUploadError}
                </div>
              )}

              <div className="table-responsive">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Month</th>
                      <th>Due Amount</th>
                      <th>Due Date</th>
                      <th>Status</th>
                      <th>Upload Proof</th>
                    </tr>
                  </thead>
                  <tbody>
                    {userData.agreementInfo?.monthlyInfo?.map((monthData) => (
                      <tr key={monthData.monthNumber}>
                        <td>Month {monthData.monthNumber}</td>
                        <td>${userData.agreementInfo?.monthlyPaymentAmount?.toFixed(2) || '0.00'}</td>
                        <td>
                          {monthData.dueDate ? new Date(monthData.dueDate).toLocaleDateString() : '----'}
                        </td>
                        <td>
                          <span className={`status-badge ${monthData.status || 'pending'}`}>
                            {monthData.status.toUpperCase()}
                          </span>
                        </td>
                        <td>
                          {monthData.proofFile ? (
                            <button
                              className="btn btn-outline-info btn-sm"
                              onClick={(e) => {
                                e.preventDefault();
                                const baseUrl = Axios.defaults.baseURL?.replace("/api", "") || "";
                                const fullUrl = `${baseUrl}${monthData.proofFile}`;
                                window.open(fullUrl, "_blank");
                              }}
                            >
                              <BsEye /> View Proof
                            </button>
                          ) : (
                            <div className="user-profile-file-input-container">
                              <label
                                className={`user-profile-file-input-label ${emiUploading ? 'disabled' : ''}`}
                                disabled={emiUploading}
                              >
                                <BsUpload />
                                Upload Proof
                                <input
                                  type="file"
                                  accept=".pdf,.jpg,.jpeg,.png"
                                  onChange={(e) => {
                                    const file = e.target.files[0];
                                    if (!file) return;

                                    setEmiUploading(true);
                                    setEmiUploadError('');
                                    setEmiUploadSuccess('');

                                    const formData = new FormData();
                                    formData.append('proofFile', file);
                                    formData.append('monthNumber', monthData.monthNumber.toString());

                                    uploadEmiProof(formData)
                                      .then(response => {
                                        if (response.success) {
                                          setEmiUploadSuccess(`EMI proof for month ${monthData.monthNumber} uploaded successfully`);
                                          fetchUserProfile(); // Refresh the profile to show updated proofs
                                        } else {
                                          setEmiUploadError(response.message || 'Failed to upload EMI proof');
                                        }
                                      })
                                      .catch(error => {
                                        setEmiUploadError(error.response?.data?.message || 'An error occurred while uploading the EMI proof');
                                      })
                                      .finally(() => {
                                        setEmiUploading(false);
                                        e.target.value = ''; // Reset the file input
                                      });
                                  }}
                                  disabled={emiUploading}
                                />
                              </label>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserProfile; 