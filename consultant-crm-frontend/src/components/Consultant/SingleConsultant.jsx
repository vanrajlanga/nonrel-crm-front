import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { BsPersonCircle, BsEnvelope, BsPhone, BsCash, BsCalendar, BsArrowLeft } from 'react-icons/bs';
import Axios from '../../services/api';
import './SingleConsultant.css';

const SingleConsultant = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [consultant, setConsultant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
          onClick={() => window.open(imageUrl, '_blank')}
        />
      </div>
    );
  };

  if (loading) {
    return <div className="loading-spinner-container">Loading...</div>;
  }

  if (error) {
    return <div className="error-container">{error}</div>;
  }

  return (
    <div className="single-consultant-container">
      <button className="back-button" onClick={() => navigate('/consultants/consultantsDetails')}>
        <BsArrowLeft /> Back to List
      </button>

      <div className="consultant-profile">
        <div className="profile-header">
          {consultant?.image ? (
            <img src={consultant.image} alt={consultant.name} className="profile-image" />
          ) : (
            <BsPersonCircle className="profile-icon" />
          )}
          <h2>{consultant?.name}</h2>
        </div>

        <div className="profile-sections">
          {/* Basic Information */}
          <section className="info-section">
            <h3>Basic Information</h3>
            <div className="info-grid">
              <div className="detail-item">
                <BsEnvelope className="icon" />
                <span><strong>Email:</strong> {consultant?.email}</span>
              </div>
              <div className="detail-item">
                <BsPhone className="icon" />
                <span><strong>Phone:</strong> {consultant?.phone}</span>
              </div>
            </div>
          </section>

          {/* Registration Details */}
          <section className="info-section">
            <h3>Registration Details</h3>
            <div className="info-grid">
              <div className="detail-item">
                <BsCash className="icon" />
                <span><strong>Registration Fee:</strong> ${consultant?.registrationFee}</span>
              </div>
              <div className="detail-item">
                <BsCalendar className="icon" />
                <span><strong>Registration Date:</strong> {formatDate(consultant?.registrationDate)}</span>
              </div>
              <div className="detail-item">
                <ProofImage 
                  imageUrl={consultant?.registrationProof}
                  title="Registration Proof"
                />
              </div>
            </div>
          </section>

          {/* Onboarding Details */}
          <section className="info-section">
            <h3>Onboarding Information</h3>
            <div className="info-grid">
              <div className="detail-item">
                <BsCash className="icon" />
                <span><strong>Onboarding Fee:</strong> {consultant?.onboardingFee ? `$${consultant.onboardingFee}` : 'Not set'}</span>
              </div>
              <div className="detail-item">
                <BsCalendar className="icon" />
                <span><strong>Onboarding Date:</strong> {formatDate(consultant?.onboardingDate)}</span>
              </div>
              <div className="detail-item">
                <ProofImage 
                  imageUrl={consultant?.onboardingProof}
                  title="Onboarding Proof"
                />
              </div>
            </div>
          </section>

          {/* Contract Details */}
          <section className="info-section">
            <h3>Contract Details</h3>
            <div className="info-grid">
              <div className="detail-item">
                <BsCash className="icon" />
                <span><strong>Consultant Salary:</strong> {consultant?.consultantSalary ? `$${consultant.consultantSalary}` : 'Not set'}</span>
              </div>
              <div className="detail-item">
                <BsCalendar className="icon" />
                <span><strong>Date of Joining:</strong> {formatDate(consultant?.dateOfJoining)}</span>
              </div>
              <div className="detail-item">
                <BsCalendar className="icon" />
                <span><strong>Contract Duration:</strong> {consultant?.contractDuration ? `${consultant.contractDuration} months` : 'Not set'}</span>
              </div>
            </div>
          </section>

          {/* Monthly Details */}
          <section className="info-section">
            <h3>Monthly Details</h3>
            <div className="info-grid">
              <div className="detail-item">
                <BsCash className="icon" />
                <span><strong>Monthly Fee:</strong> {consultant?.monthlyFee ? `$${consultant.monthlyFee}` : 'Not set'}</span>
              </div>
              <div className="detail-item">
                <BsCalendar className="icon" />
                <span><strong>Monthly Start Date:</strong> {formatDate(consultant?.monthlyStartDate)}</span>
              </div>
              <div className="detail-item">
                <BsCalendar className="icon" />
                <span><strong>Monthly Due Day:</strong> {consultant?.monthlyDueDay || 'Not set'}</span>
              </div>
            </div>
          </section>

          {/* Extra Services */}
          {consultant?.extraServices && consultant.extraServices.length > 0 && (
            <section className="info-section">
              <h3>Extra Services</h3>
              <div className="extra-services">
                {consultant.extraServices.map((service, index) => (
                  <div key={service._id || index} className="service-card">
                    <h4>Service {index + 1}</h4>
                    <p><strong>Description:</strong> {service.description}</p>
                    <p><strong>Fee:</strong> ${service.fee}</p>
                    <p><strong>Payment Date:</strong> {formatDate(service.paymentDate)}</p>
                    <p><strong>Proof:</strong> {service.proof || 'Not provided'}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

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
    </div>
  );
};

export default SingleConsultant;
