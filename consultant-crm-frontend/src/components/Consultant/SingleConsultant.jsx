import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { BsPersonCircle, BsEnvelope, BsPhone,BsArrowLeft, BsCheck, BsTrash, BsX, BsEye } from 'react-icons/bs';
import { BiUndo } from 'react-icons/bi';
import Axios from '../../services/api';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import './SingleConsultant.css';

// Modal Component
const Modal = ({ show, onHide, title, children }) => {
  if (!show) return null;

  return (
    <div className="modal-overlay" onClick={onHide}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h5 className="modal-title">{title}</h5>
          <button type="button" className="btn-close" onClick={onHide} aria-label="Close">
            <BsX />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};

const SingleConsultant = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [consultant, setConsultant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showUndoModal, setShowUndoModal] = useState(false);
  const [undoType, setUndoType] = useState(null); // 'payment' or 'placement'
  const [jobFormData, setJobFormData] = useState({
    companyName: '',
    jobType: '',
    dateOfJoining: '',
    totalFees: '',
    receivedFees: '',
    isAgreement: false,
    feesStatus: 'pending'
  });
  const [showCancelModal, setShowCancelModal] = useState(false);

  useEffect(() => {
    const fetchConsultant = async () => {
      try {
        setLoading(true);
        const response = await Axios.get(`/consultants/${id}`);
        setConsultant(response.data);
      } catch (err) {
        setError('Failed to fetch consultant details');
      } finally {
        setLoading(false);
      }
    };

    fetchConsultant();
  }, [id]);

  const formatDate = (date) => {
    return date ? new Date(date).toLocaleDateString() : 'Not set';
  };

  const ProofImage = ({ imageUrl, title }) => {
    if (!imageUrl) return null;
    
    return (
      <div className="proof-image-container">
        <h6 className="proof-title">{title}</h6>
        <button
          className="btn btn-view-proof"
          onClick={async () => {
            try {
              const response = await Axios.get(`/consultants/${id}/proof`, {
                responseType: 'blob'
              });
              
              // Get the content type from the response
              const contentType = response.headers['content-type'];
              
              // Create a blob URL with the correct content type
              const url = window.URL.createObjectURL(new Blob([response.data], { type: contentType }));
              
              // Open in new tab
              const newWindow = window.open(url, '_blank');
              if (!newWindow) {
                toast.error('Please allow popups to view the proof');
              }
            } catch (error) {
              console.error('Error fetching proof:', error);
              if (error.response?.status === 403) {
                toast.error('You are not authorized to view this proof');
              } else if (error.response?.status === 404) {
                toast.error('No proof found for this consultant');
              } else {
                toast.error('Failed to fetch proof. Please try again.');
              }
            }
          }}
          title="View Proof"
        >
          <BsEye /> View Proof
        </button>
      </div>
    );
  };

  const renderBooleanValue = (value) => (
    <span className={`badge ${value ? 'bg-success' : 'bg-secondary'}`}>
      {value ? 'Yes' : 'No'}
    </span>
  );


  const handleVerifyPayment = async () => {
    try {
      await Axios.post(`/consultants/${id}/verify-payment`, { verifybtn: true });
      // Refresh consultant data to show updated payment status
      const response = await Axios.get(`/consultants/${id}`);
      setConsultant(response.data);
      toast.success('Payment verified successfully');
    } catch (err) {
      console.error('Error verifying payment:', err);
      toast.error(err.response?.data?.message || 'Failed to verify payment');
    }
  };

  const handleCancelRegistration = async () => {
    try {
      await Axios.delete(`/consultants/${id}`);
      toast.success('Registration cancelled successfully');
      navigate('/consultants/consultantsDetails');
    } catch (err) {
      console.error('Error canceling registration:', err);
      toast.error(err.response?.data?.message || 'Failed to cancel registration');
    }
  };

  // Update handleUndoPayment function
  const handleUndoPayment = async () => {
    try {
      await Axios.post(`/consultants/${id}/verify-payment`, {
        undoPaymentVerification: true
      });
      setShowUndoModal(false);
      // Refresh consultant data
      const response = await Axios.get(`/consultants/${id}`);
      setConsultant(response.data);
      toast.success('Payment verification undone successfully');
    } catch (err) {
      console.error('Error undoing payment verification:', err);
      toast.error(err.response?.data?.message || 'Failed to undo payment verification');
    }
  };

  // Add new function for handling undo placement
  const handleUndoPlacement = async () => {
    try {
      await Axios.put(`/consultants/${id}/job-details`, {
        undoPlacement: true
      });
      setShowUndoModal(false);
      // Refresh consultant data
      const response = await Axios.get(`/consultants/${id}`);
      setConsultant(response.data);
      toast.success('Placement undone successfully');
    } catch (err) {
      console.error('Error undoing placement:', err);
      toast.error(err.response?.data?.message || 'Failed to undo placement');
    }
  };

  const openUndoModal = (type) => {
    setUndoType(type);
    setShowUndoModal(true);
  };

  const handleJobSubmit = async (e) => {
    e.preventDefault();
    
    if (!jobFormData.companyName || !jobFormData.jobType || !jobFormData.dateOfJoining) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      console.log('Submitting job details:', jobFormData);
      
      const response = await Axios.post(`/consultants/${id}/job-details`, {
        companyName: jobFormData.companyName,
        jobType: jobFormData.jobType,
        dateOfJoining: jobFormData.dateOfJoining,
        totalFees: jobFormData.totalFees || undefined,
        receivedFees: jobFormData.receivedFees || undefined,
        isAgreement: jobFormData.isAgreement,
        feesStatus: jobFormData.feesStatus
      });

      console.log('Job details response:', response.data);
      
      toast.success('Job details added successfully');
      setShowModal(false);
      
      // Reset form
      setJobFormData({
        companyName: '',
        jobType: '',
        dateOfJoining: '',
        totalFees: '',
        receivedFees: '',
        isAgreement: false,
        feesStatus: 'pending'
      });

      // Refresh consultant data
      const consultantResponse = await Axios.get(`/consultants/${id}`);
      setConsultant(consultantResponse.data);
    } catch (error) {
      console.error('Error submitting job details:', error.response || error);
      const errorMessage = error.response?.data?.message || 'Failed to add job details';
      toast.error(errorMessage);
      
      if (error.response?.data?.missingFields) {
        toast.error(`Missing fields: ${error.response.data.missingFields.join(', ')}`);
      }
    }
  };

  if (loading) return <div className="loading-spinner-container">Loading...</div>;
  if (error) return <div className="error-container">{error}</div>;

  return (
    <div className="single-consultant-container">
      <ToastContainer />
      <button className="back-button" onClick={() => navigate('/consultants/consultantsDetails')}>
        <BsArrowLeft /> Back to List
      </button>

      <div className="consultant-profile">
        <div className="profile-header">
          <BsPersonCircle className="profile-icon" />
          <h2>{consultant?.fulllegalname}</h2>
          
          <div className="action-buttons">
            {consultant?.paymentStatus && (
              <button 
                className="btn btn-warning action-btn"
                onClick={() => openUndoModal('payment')}
              >
                <BiUndo /> Undo Payment
              </button>
            )}
            {consultant?.isPlaced && (
              <button 
                className="btn btn-warning action-btn"
                onClick={() => openUndoModal('placement')}
              >
                <BiUndo /> Undo Placement
              </button>
            )}
            {!consultant?.paymentStatus && (
              <button 
                className="btn btn-success action-btn"
                onClick={handleVerifyPayment}
              >
                <BsCheck /> Verify Payment
              </button>
            )}
            <button 
              className="btn btn-danger action-btn"
              onClick={() => setShowCancelModal(true)}
            >
              <BsTrash /> Cancel Registration
            </button>
          </div>
        </div>

        <div className="profile-sections">
          {/* Personal Information */}
          <section className="info-section">
            <h3>Personal Information</h3>
            <div className="info-grid">
              <div className="detail-item">
                <span><strong>Full Legal Name:</strong> {consultant?.fulllegalname}</span>
              </div>
              <div className="detail-item">
                <span><strong>Technology:</strong> {consultant?.technology}</span>
              </div>
              <div className="detail-item">
                <span><strong>Date of Birth:</strong> {formatDate(consultant?.dateOfBirth)}</span>
              </div>
              <div className="detail-item">
                <span><strong>State of Residence:</strong> {consultant?.stateOfResidence}</span>
              </div>
              <div className="detail-item">
                <span><strong>Visa Status:</strong> {consultant?.visaStatus}</span>
              </div>
              <div className="detail-item">
                <span><strong>Marital Status:</strong> {consultant?.maritalStatus}</span>
              </div>
              <div className="detail-item">
                <BsPhone className="icon" />
                <span><strong>Phone:</strong> {consultant?.phone}</span>
              </div>
              <div className="detail-item">
                <BsEnvelope className="icon" />
                <span><strong>Email:</strong> {consultant?.email}</span>
              </div>
              <div className="detail-item">
                <span><strong>Current Address:</strong> {consultant?.currentAddress}</span>
              </div>
              <div className="detail-item">
                <span><strong>USA Landing Date:</strong> {formatDate(consultant?.usaLandingDate)}</span>
              </div>
            </div>
          </section>

          {/* USA IT Experience */}
          <section className="info-section">
            <h3>USA IT Experience</h3>
            <div className="info-grid">
              <div className="detail-item">
                <span>
                  <strong>Has USA IT Experience:</strong> {renderBooleanValue(consultant?.hasUsaItExperience)}
                </span>
              </div>
              {consultant?.hasUsaItExperience && (
                <>
                  <div className="detail-item">
                    <span><strong>First Experience:</strong> {consultant?.usaFirstExperience || 'Not provided'}</span>
                  </div>
                  <div className="detail-item">
                    <span><strong>Second Experience:</strong> {consultant?.usaSecondExperience || 'Not provided'}</span>
                  </div>
                  <div className="detail-item">
                    <span><strong>Other Experiences:</strong> {consultant?.usaOtherExperiences || 'Not provided'}</span>
                  </div>
                </>
              )}
            </div>
          </section>

          {/* Outside USA IT Experience */}
          <section className="info-section">
            <h3>Outside USA IT Experience</h3>
            <div className="info-grid">
              <div className="detail-item">
                <span>
                  <strong>Has Outside USA IT Experience:</strong> {renderBooleanValue(consultant?.hasOutsideUsaItExperience)}
                </span>
              </div>
              {consultant?.hasOutsideUsaItExperience && (
                <>
                  <div className="detail-item">
                    <span><strong>First Experience:</strong> {consultant?.outsideUsaFirstExperience || 'Not provided'}</span>
                  </div>
                  <div className="detail-item">
                    <span><strong>Second Experience:</strong> {consultant?.outsideUsaSecondExperience || 'Not provided'}</span>
                  </div>
                  <div className="detail-item">
                    <span><strong>Other Experiences:</strong> {consultant?.outsideUsaOtherExperiences || 'Not provided'}</span>
                  </div>
                </>
              )}
            </div>
          </section>

          {/* USA Education */}
          <section className="info-section">
            <h3>USA Education</h3>
            <div className="info-grid">
              <div className="detail-item">
                <span>
                  <strong>Has USA Education:</strong> {renderBooleanValue(consultant?.hasUsaEducation)}
                </span>
              </div>
              {consultant?.hasUsaEducation && (
                <>
                  <div className="detail-item">
                    <span><strong>PG Diploma:</strong> {consultant?.usaPgDiploma || 'Not provided'}</span>
                  </div>
                  <div className="detail-item">
                    <span><strong>Masters Degree:</strong> {consultant?.usaMastersDegree || 'Not provided'}</span>
                  </div>
                  <div className="detail-item">
                    <span><strong>Other Certifications:</strong> {consultant?.usaOtherCertifications || 'Not provided'}</span>
                  </div>
                </>
              )}
            </div>
          </section>

          {/* Outside USA Education */}
          <section className="info-section">
            <h3>Outside USA Education</h3>
            <div className="info-grid">
              <div className="detail-item">
                <span>
                  <strong>Has Outside USA Education:</strong> {renderBooleanValue(consultant?.hasOutsideUsaEducation)}
                </span>
              </div>
              {consultant?.hasOutsideUsaEducation && (
                <>
                  <div className="detail-item">
                    <span><strong>Bachelors Degree:</strong> {consultant?.outsideUsaBachelorsDegree || 'Not provided'}</span>
                  </div>
                  <div className="detail-item">
                    <span><strong>Masters Degree:</strong> {consultant?.outsideUsaMastersDegree || 'Not provided'}</span>
                  </div>
                  <div className="detail-item">
                    <span><strong>Other Certifications:</strong> {consultant?.outsideUsaOtherCertifications || 'Not provided'}</span>
                  </div>
                </>
              )}
            </div>
          </section>

          {/* Registration Details */}
          <section className="info-section">
            <h3>Registration Details</h3>
            <div className="info-grid">
              <div className="detail-item">
                <span><strong>Passport ID:</strong> {consultant?.passportId}</span>
              </div>
              <div className="detail-item">
                <span>
                  <strong>Terms Accepted:</strong> {renderBooleanValue(consultant?.termsAccepted)}
                </span>
              </div>
              <div className="detail-item">
                <span>
                  <strong>Payment Status:</strong>
                  <span className={`badge ${consultant?.paymentStatus ? 'payment-verified' : 'payment-pending'}`}>
                    {consultant?.paymentStatus ? 'Verified' : 'Pending'}
                  </span>
                </span>
              </div>
              <div className="detail-item">
                <ProofImage 
                  imageUrl={consultant?.registrationProof}
                  title="Registration Proof"
                />
              </div>
            </div>
          </section>

          {/* Timestamps */}
          <section className="info-section timestamps">
            <div className="timestamp-item">
              <small>Created: {formatDate(consultant?.createdAt)}</small>
            </div>
            <div className="timestamp-item">
              <small>Last Updated: {formatDate(consultant?.updatedAt)}</small>
            </div>
          </section>
        </div>
      </div>

      {/* Cancel Registration Modal */}
      <Modal 
        show={showCancelModal} 
        onHide={() => setShowCancelModal(false)}
        title="Cancel Registration"
      >
        <div className="modal-body">
          Are you sure you want to cancel this consultant's registration? This action cannot be undone.
        </div>
        <div className="modal-footer">
          <button 
            className="btn btn-secondary" 
            onClick={() => setShowCancelModal(false)}
          >
            Close
          </button>
          <button 
            className="btn btn-danger"
            onClick={handleCancelRegistration}
          >
            Cancel Registration
          </button>
        </div>
      </Modal>

      {/* Undo Modal */}
      <Modal 
        show={showUndoModal} 
        onHide={() => setShowUndoModal(false)}
        title={`Undo ${undoType === 'payment' ? 'Payment Verification' : 'Placement'}`}
      >
        <div className="modal-body">
          {undoType === 'payment' 
            ? 'Are you sure you want to undo this consultant\'s payment verification?'
            : 'Are you sure you want to undo this consultant\'s placement status?'}
        </div>
        <div className="modal-footer">
          <button 
            className="btn btn-secondary" 
            onClick={() => setShowUndoModal(false)}
          >
            Close
          </button>
          <button 
            className="btn btn-warning"
            onClick={undoType === 'payment' ? handleUndoPayment : handleUndoPlacement}
          >
            Confirm Undo
          </button>
        </div>
      </Modal>

      {/* Job Modal */}
      <Modal 
        show={showModal} 
        onHide={() => setShowModal(false)}
        title="Add Job Details"
      >
        <div className="modal-body">
          <form onSubmit={handleJobSubmit}>
            <div className="form-group mb-3">
              <label>Company Name</label>
              <input
                type="text"
                className="form-control"
                value={jobFormData.companyName}
                onChange={(e) => setJobFormData(prev => ({ ...prev, companyName: e.target.value }))}
                required
              />
            </div>

            <div className="form-group mb-3">
              <label>Job Position</label>
              <input
                type="text"
                className="form-control"
                value={jobFormData.jobType}
                onChange={(e) => setJobFormData(prev => ({ ...prev, jobType: e.target.value }))}
                required
              />
            </div>

            <div className="form-group mb-3">
              <label>Date of Joining</label>
              <input
                type="date"
                className="form-control"
                value={jobFormData.dateOfJoining}
                onChange={(e) => setJobFormData(prev => ({ ...prev, dateOfJoining: e.target.value }))}
                required
              />
            </div>

            {localStorage.getItem('role') === 'superAdmin' && (
              <>
                <div className="form-group mb-3">
                  <label>Total Fees</label>
                  <input
                    type="number"
                    className="form-control"
                    value={jobFormData.totalFees}
                    onChange={(e) => setJobFormData(prev => ({ ...prev, totalFees: e.target.value }))}
                  />
                </div>

                <div className="form-group mb-3">
                  <label>Received Fees</label>
                  <input
                    type="number"
                    className="form-control"
                    value={jobFormData.receivedFees}
                    onChange={(e) => setJobFormData(prev => ({ ...prev, receivedFees: e.target.value }))}
                  />
                </div>
              </>
            )}

            <div className="form-check mb-3">
              <input
                type="checkbox"
                className="form-check-input"
                id="isAgreement"
                checked={jobFormData.isAgreement}
                onChange={(e) => setJobFormData(prev => ({ ...prev, isAgreement: e.target.checked }))}
              />
              <label className="form-check-label" htmlFor="isAgreement">
                Agreement Completed
              </label>
            </div>

            <div className="form-group mb-3">
              <label>Fees Status</label>
              <select
                className="form-select"
                value={jobFormData.feesStatus}
                onChange={(e) => setJobFormData(prev => ({ ...prev, feesStatus: e.target.value }))}
              >
                <option value="pending">Pending</option>
                <option value="partial">Partial</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            <div className="modal-footer">
              <button 
                type="button" 
                className="btn btn-secondary"
                onClick={() => setShowModal(false)}
              >
                Close
              </button>
              <button type="submit" className="btn btn-primary">
                Save Job Details
              </button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
};

export default SingleConsultant;
