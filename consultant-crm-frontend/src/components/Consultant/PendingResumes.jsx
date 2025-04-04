import React, { useState, useEffect } from 'react';
import Axios from '../../services/api';
import { toast } from 'react-toastify';
import { BsEye, BsCheck, BsX } from 'react-icons/bs';
import './PendingResumes.css';

const PendingResumes = () => {
  const [pendingResumes, setPendingResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPendingResumes = async () => {
    try {
      setLoading(true);
      const response = await Axios.get('/consultants/pending-resumes');
      const resumes = response.data?.consultants || [];
      setPendingResumes(resumes);
      setError(null);
    } catch (err) {
      console.error('Error fetching pending resumes:', err);
      setError('Failed to fetch pending resumes');
      toast.error('Failed to fetch pending resumes');
      setPendingResumes([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingResumes();
  }, []);

  const handleViewResume = async (consultantId) => {
    try {
      const response = await Axios.get(`/consultants/${consultantId}/resume`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const newWindow = window.open(url, '_blank');
      if (!newWindow) {
        toast.error('Please allow popups to view the resume');
      }
    } catch (error) {
      console.error('Error viewing resume:', error);
      if (error.response?.status === 403) {
        toast.error('You are not authorized to view this resume');
      } else if (error.response?.status === 404) {
        toast.error('No resume found for this consultant');
      } else {
        toast.error('Failed to fetch resume. Please try again.');
      }
    }
  };

  const handleUpdateStatus = async (consultantId, action) => {
    try {
      const status = action === 'accept' ? 'accepted' : 'rejected';
      await Axios.put(`/consultants/${consultantId}/resume-status`, { status });
      toast.success(`Resume ${status} successfully`);
      fetchPendingResumes(); // Refresh the list
    } catch (error) {
      console.error('Error updating resume status:', error);
      toast.error(`Failed to ${action} resume`);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="loading-container">
        Loading pending resumes...
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        {error}
      </div>
    );
  }

  if (pendingResumes.length === 0) {
    return (
      <div className="no-resumes">
        No pending resumes found
      </div>
    );
  }

  return (
    <div className="pending-resumes-container">
      <h2>Pending Resumes</h2>
      <div className="resumes-table">
        <table>
          <thead>
            <tr>
              <th>Consultant Name</th>
              <th>Resume Builder</th>
              <th>Status</th>
              <th>Last Updated</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {pendingResumes.map((resume) => (
              <tr key={resume.id}>
                <td>{resume.fullName}</td>
                <td>{resume.resumeBuilder?.username || 'Not assigned'}</td>
                <td>
                  <span className={`status-badge ${resume.resumeStatus}`}>
                    {resume.resumeStatus.replace('_', ' ')}
                  </span>
                </td>
                <td>{formatDate(resume.updatedAt)}</td>
                <td className="actions-cell">
                  {resume.resumeFile && (
                    <button
                      className="btn btn-view"
                      onClick={() => handleViewResume(resume.id)}
                      title="View Resume"
                    >
                      <BsEye /> View
                    </button>
                  )}
                  <button
                    className="btn btn-accept"
                    onClick={() => handleUpdateStatus(resume.id, 'accept')}
                    title="Accept Resume"
                  >
                    <BsCheck /> Accept
                  </button>
                  <button
                    className="btn btn-reject"
                    onClick={() => handleUpdateStatus(resume.id, 'reject')}
                    title="Reject Resume"
                  >
                    <BsX /> Reject
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PendingResumes; 