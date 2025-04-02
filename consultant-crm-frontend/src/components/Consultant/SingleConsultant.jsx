import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { BsPersonCircle, BsEnvelope, BsPhone, BsCash, BsCalendar, BsArrowLeft, BsCheck, BsTrash, BsX } from 'react-icons/bs';
import Axios from '../../services/api';
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
          <button type="button" className="close-button" onClick={onHide}>
            <BsX />
          </button>
        </div>
        <div className="modal-body">{children}</div>
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
  const [modalType, setModalType] = useState(null);

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
        <img
          src={imageUrl}
          alt={title}
          className="proof-image"
        />
      </div>
    );
  };

  const renderBooleanValue = (value) => (
    <span className={`badge ${value ? 'bg-success' : 'bg-secondary'}`}>
      {value ? 'Yes' : 'No'}
    </span>
  );

  const openModal = (type) => {
    setModalType(type);
    setShowModal(true);
  };

  const handleVerifyPayment = async () => {
    try {
      await Axios.post(`/consultants/${id}/verify-payment`, { verifybtn: true });
      setShowModal(false);
      // Refresh consultant data to show updated payment status
      const response = await Axios.get(`/consultants/${id}`);
      setConsultant(response.data);
    } catch (err) {
      console.error('Error verifying payment:', err);
      setError(err.response?.data?.message || 'Failed to verify payment');
    }
  };

  const handleCancelRegistration = async () => {
    try {
      await Axios.delete(`/consultants/${id}`);
      setShowModal(false);
      navigate('/consultants/consultantsDetails');
    } catch (err) {
      console.error('Error canceling registration:', err);
      setError(err.response?.data?.message || 'Failed to cancel registration');
    }
  };

  if (loading) return <div className="loading-spinner-container">Loading...</div>;
  if (error) return <div className="error-container">{error}</div>;

  return (
    <div className="single-consultant-container">
      <button className="back-button" onClick={() => navigate('/consultants/consultantsDetails')}>
        <BsArrowLeft /> Back to List
      </button>

      <div className="consultant-profile">
        <div className="profile-header">
          <BsPersonCircle className="profile-icon" />
          <h2>{consultant?.fulllegalname}</h2>
          
          <div className="action-buttons">
            {!consultant?.paymentStatus && (
              <button 
                className="btn btn-success action-btn"
                onClick={() => openModal('verify')}
              >
                <BsCheck /> Verify Payment
              </button>
            )}
            <button 
              className="btn btn-danger action-btn"
              onClick={() => openModal('cancel')}
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

      <Modal 
        show={showModal} 
        onHide={() => setShowModal(false)}
        title={modalType === 'verify' ? 'Verify Payment' : 'Cancel Registration'}
      >
        <div className="modal-body">
          {modalType === 'verify' 
            ? 'Are you sure you want to verify this consultant\'s payment?'
            : 'Are you sure you want to cancel this consultant\'s registration? This action cannot be undone.'}
        </div>
        <div className="modal-footer">
          <button 
            className="btn btn-secondary" 
            onClick={() => setShowModal(false)}
          >
            Close
          </button>
          <button 
            className={`btn ${modalType === 'verify' ? 'btn-success' : 'btn-danger'}`}
            onClick={modalType === 'verify' ? handleVerifyPayment : handleCancelRegistration}
          >
            {modalType === 'verify' ? 'Verify' : 'Cancel Registration'}
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default SingleConsultant;
