import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import Axios from '../../services/api';
import { BsPencil, BsTrash } from 'react-icons/bs';
import Modal from 'react-bootstrap/Modal';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import Filter from '../Filter';
import './ConsultantInterviewDetails.css';

const ConsultantInterviewDetails = () => {
  const [interviews, setInterviews] = useState([]);
  const [filteredInterviews, setFilteredInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedInterview, setSelectedInterview] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [filterConfig, setFilterConfig] = useState([]);

  const [formData, setFormData] = useState({
    date: '',
    timeEST: '',
    timeIST: '',
    duration: '30',
    country: 'USA',
    isVideo: false,
    interviewSupportName: '',
    round: '1st',
    callStatus: 'active',
    mode: '',
    interviewStatus: 'Pending',
    rejectionReason: '',
    comments: '',
    panelDetails: '',
    otterLink: ''
  });

  const COUNTRIES = ["India", "Canada", "USA", "Germany", "Australia"];
  const DURATIONS = ['30', '45', '60', '90'];
  const ROUNDS = ['1st', '2nd', '3rd', 'HR', 'Final'];
  const CALL_STATUSES = ['active', 'hold', 'done'];
  const INTERVIEW_STATUSES = ['Pending', 'InProgress', 'Reschedule', 'Rejected', 'Completed'];

  useEffect(() => {
    const role = localStorage.getItem('role');
    setUserRole(role);
    loadInterviews();
  }, []);

  useEffect(() => {
    if (interviews.length > 0) {
      const uniqueRounds = [...new Set(interviews.map(item => item.round))].filter(Boolean);
      const uniqueStatuses = [...new Set(interviews.map(item => item.interviewStatus))].filter(Boolean);
      const uniqueCountries = [...new Set(interviews.map(item => item.country))].filter(Boolean);

      setFilterConfig([
        {
          name: 'round',
          label: 'Round',
          type: 'select',
          defaultValue: 'all',
          options: [
            { value: 'all', label: 'All Rounds' },
            ...uniqueRounds.map(round => ({
              value: round,
              label: round
            }))
          ]
        },
        {
          name: 'interviewStatus',
          label: 'Interview Status',
          type: 'select',
          defaultValue: 'all',
          options: [
            { value: 'all', label: 'All Statuses' },
            ...uniqueStatuses.map(status => ({
              value: status,
              label: status
            }))
          ]
        },
        {
          name: 'country',
          label: 'Country',
          type: 'select',
          defaultValue: 'all',
          options: [
            { value: 'all', label: 'All Countries' },
            ...uniqueCountries.map(country => ({
              value: country,
              label: country
            }))
          ]
        },
        {
          name: 'date',
          label: 'Interview Date',
          type: 'dateRange'
        }
      ]);
    }
  }, [interviews]);

  const loadInterviews = async () => {
    try {
      setLoading(true);
      const response = await Axios.get('/interviews');
      setInterviews(response.data);
      setFilteredInterviews(response.data);
    } catch (error) {
      console.error('Error loading interviews:', error);
      toast.error(error.response?.data?.message || 'Failed to load interviews');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterApplied = (filterOptions) => {
    let filtered = [...interviews];
    
    if (filterOptions.round && filterOptions.round !== 'all') {
      filtered = filtered.filter(interview => interview.round === filterOptions.round);
    }

    if (filterOptions.interviewStatus && filterOptions.interviewStatus !== 'all') {
      filtered = filtered.filter(interview => interview.interviewStatus === filterOptions.interviewStatus);
    }

    if (filterOptions.country && filterOptions.country !== 'all') {
      filtered = filtered.filter(interview => interview.country === filterOptions.country);
    }

    if (filterOptions.dateFrom || filterOptions.dateTo) {
      const fromDate = filterOptions.dateFrom ? new Date(filterOptions.dateFrom) : null;
      const toDate = filterOptions.dateTo ? new Date(filterOptions.dateTo) : null;

      filtered = filtered.filter(interview => {
        const interviewDate = new Date(interview.date);
        if (fromDate && toDate) {
          return interviewDate >= fromDate && interviewDate <= toDate;
        } else if (fromDate) {
          return interviewDate >= fromDate;
        } else if (toDate) {
          return interviewDate <= toDate;
        }
        return true;
      });
    }

    setFilteredInterviews(filtered);
  };

  const handleSearch = (searchValue) => {
    if (!searchValue.trim()) {
      setFilteredInterviews(interviews);
      return;
    }

    const searchLower = searchValue.toLowerCase();
    const filtered = interviews.filter(interview =>
      interview.consultant?.fulllegalname?.toLowerCase().includes(searchLower) ||
      interview.company?.companyName?.toLowerCase().includes(searchLower) ||
      interview.mode?.toLowerCase().includes(searchLower) ||
      interview.interviewSupportName?.toLowerCase().includes(searchLower)
    );

    setFilteredInterviews(filtered);
  };

  const handleEdit = (interview) => {
    setSelectedInterview(interview);
    setFormData({
      date: interview.date,
      timeEST: interview.timeEST?.slice(0, 5) || '',
      timeIST: interview.timeIST?.slice(0, 5) || '',
      duration: interview.duration,
      country: interview.country,
      isVideo: interview.isVideo,
      interviewSupportName: interview.interviewSupportName,
      round: interview.round,
      callStatus: interview.callStatus,
      mode: interview.mode,
      interviewStatus: interview.interviewStatus,
      rejectionReason: interview.rejectionReason || '',
      comments: interview.comments || '',
      panelDetails: interview.panelDetails || '',
      otterLink: interview.otterLink || ''
    });
    setShowEditModal(true);
  };

  const handleDeleteClick = (interview) => {
    if (userRole !== 'superAdmin' && userRole !== 'admin') {
      toast.error('You do not have permission to delete interviews');
      return;
    }
    setSelectedInterview(interview);
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    try {
      await Axios.delete(`/interviews/${selectedInterview.id}`);
      toast.success('Interview deleted successfully');
      loadInterviews();
      setShowDeleteModal(false);
    } catch (error) {
      if (error.response?.status === 403) {
        toast.error('You do not have permission to delete interviews');
      } else {
        toast.error(error.response?.data?.message || 'Failed to delete interview');
      }
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        date: formData.date,
        timeEST: formData.timeEST + ':00',
        timeIST: formData.timeIST + ':00',
        duration: formData.duration,
        country: formData.country,
        isVideo: formData.isVideo,
        interviewSupportName: formData.interviewSupportName,
        round: formData.round,
        callStatus: formData.callStatus,
        mode: formData.mode,
        interviewStatus: formData.interviewStatus,
        rejectionReason: formData.rejectionReason || '',
        comments: formData.comments || '',
        panelDetails: formData.panelDetails || '',
        otterLink: formData.otterLink || ''
      };

      const response = await Axios.put(`/interviews/${selectedInterview.id}`, payload);
      
      if (response.data) {
        toast.success('Interview updated successfully');
        setShowEditModal(false);
        loadInterviews();
      }
    } catch (error) {
      console.error('Error updating interview:', error);
      toast.error(error.response?.data?.message || 'Failed to update interview');
    }
  };

  const calculateIST = (estTime) => {
    const [hours, minutes] = estTime.split(':');
    let istHours = parseInt(hours) + 9;
    let istMinutes = parseInt(minutes) + 30;
    
    if (istMinutes >= 60) {
      istHours += 1;
      istMinutes -= 60;
    }
    if (istHours >= 24) {
      istHours -= 24;
    }
    
    return `${istHours.toString().padStart(2, '0')}:${istMinutes.toString().padStart(2, '0')}`;
  };

  const handleTimeESTChange = (e) => {
    const estTime = e.target.value;
    const istTime = calculateIST(estTime);
    setFormData(prev => ({
      ...prev,
      timeEST: estTime,
      timeIST: istTime
    }));
  };

  if (loading) {
    return (
      <div className="text-center p-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mt-4">
      <div className="interview-header text-center">
        <h2 className="display-6 fw-bold mb-3">Interview Schedules</h2>
        <p className="mb-0">Manage and track all interview schedules</p>
      </div>

      <div className="filter-section">
        <Filter
          onFilterApplied={handleFilterApplied}
          filterConfig={filterConfig}
          onSearch={handleSearch}
          searchPlaceholder="Search by name, company, mode..."
        />
      </div>
      
      <div className="table-responsive">
        <table className="interview-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Consultant Name</th>
              <th>Consultant Email</th>
              <th>Job Position</th>
              <th>Company</th>
              <th>Time (EST)</th>
              <th>Time (IST)</th>
              <th>Duration</th>
              <th>Country</th>
              <th>Support Name</th>
              <th>Round</th>
              <th>Call Status</th>
              <th>Mode</th>
              <th>Status</th>
              <th>Video</th>
              <th>Panel Details</th>
              <th>Comments</th>
              <th>Otter Link</th>
              <th>Coordinator</th>
              <th>Created At</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredInterviews.map((interview) => (
              <tr key={interview.id}>
                <td>{new Date(interview.date).toLocaleDateString()}</td>
                <td>{interview.consultant?.fulllegalname}</td>
                <td>{interview.consultant?.email}</td>
                <td className="job-position-cell">
                  <span className="job-position-badge">
                    {interview.jobDetails?.jobPosition}
                  </span>
                </td>
                <td>{interview.company?.companyName}</td>
                <td>{interview.timeEST?.slice(0, 5)}</td>
                <td>{interview.timeIST?.slice(0, 5)}</td>
                <td>{interview.duration} min</td>
                <td>{interview.country}</td>
                <td>{interview.interviewSupportName}</td>
                <td>{interview.round}</td>
                <td>
                  <span className={`status-badge ${interview.callStatus}`}>
                    {interview.callStatus}
                  </span>
                </td>
                <td>{interview.mode}</td>
                <td>
                  <span className={`interview-status status-${interview.interviewStatus}`}>
                    {interview.interviewStatus}
                  </span>
                </td>
                <td>
                  <span className={interview.isVideo ? 'video-badge' : 'no-video-badge'}>
                    {interview.isVideo ? 'Yes' : 'No'}
                  </span>
                </td>
                <td>{interview.panelDetails || '-'}</td>
                <td>
                  <div className="comments-cell" title={interview.comments}>
                    {interview.comments || '-'}
                  </div>
                </td>
                <td>
                  {interview.otterLink ? (
                    <a href={interview.otterLink} target="_blank" rel="noopener noreferrer">
                      View
                    </a>
                  ) : '-'}
                </td>
                <td>
                  <div className="coordinator-info">
                    <div>{interview.coordinator?.name}</div>
                    <small>{interview.coordinator?.email}</small>
                  </div>
                </td>
                <td>{new Date(interview.createdAt).toLocaleString()}</td>
                <td>
                  <div className="btn-group">
                    <button
                      className="btn btn-edit"
                      onClick={() => handleEdit(interview)}
                      title="Edit Interview"
                    >
                      <BsPencil />
                    </button>
                    {(userRole === 'superAdmin' || userRole === 'admin') && (
                      <button
                        className="btn btn-delete"
                        onClick={() => handleDeleteClick(interview)}
                        title="Delete Interview"
                      >
                        <BsTrash />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {filteredInterviews.length === 0 && (
              <tr>
                <td colSpan="21" className="text-center py-4">
                  No interviews found matching your criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Edit Modal */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Edit Interview Schedule</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleUpdate}>
            <div className="row">
              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label>Date</Form.Label>
                  <Form.Control
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                    required
                  />
                </Form.Group>
              </div>
              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label>Time (EST)</Form.Label>
                  <Form.Control
                    type="time"
                    value={formData.timeEST}
                    onChange={handleTimeESTChange}
                    required
                  />
                </Form.Group>
              </div>
            </div>

            <div className="row">
              <div className="col-md-4">
                <Form.Group className="mb-3">
                  <Form.Label>Duration (minutes)</Form.Label>
                  <Form.Select
                    value={formData.duration}
                    onChange={(e) => setFormData(prev => ({ ...prev, duration: e.target.value }))}
                    required
                  >
                    {DURATIONS.map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </div>
              <div className="col-md-4">
                <Form.Group className="mb-3">
                  <Form.Label>Country</Form.Label>
                  <Form.Select
                    value={formData.country}
                    onChange={(e) => setFormData(prev => ({ ...prev, country: e.target.value }))}
                    required
                  >
                    {COUNTRIES.map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </div>
              <div className="col-md-4">
                <Form.Group className="mb-3">
                  <Form.Label>Round</Form.Label>
                  <Form.Select
                    value={formData.round}
                    onChange={(e) => setFormData(prev => ({ ...prev, round: e.target.value }))}
                    required
                  >
                    {ROUNDS.map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </div>
            </div>

            <div className="row">
              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label>Call Status</Form.Label>
                  <Form.Select
                    value={formData.callStatus}
                    onChange={(e) => setFormData(prev => ({ ...prev, callStatus: e.target.value }))}
                    required
                  >
                    {CALL_STATUSES.map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </div>
              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label>Interview Status</Form.Label>
                  <Form.Select
                    value={formData.interviewStatus}
                    onChange={(e) => setFormData(prev => ({ ...prev, interviewStatus: e.target.value }))}
                    required
                  >
                    {INTERVIEW_STATUSES.map(status => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </div>
            </div>

            <Form.Group className="mb-3">
              <Form.Label>Mode</Form.Label>
              <Form.Control
                type="text"
                value={formData.mode}
                onChange={(e) => setFormData(prev => ({ ...prev, mode: e.target.value }))}
                required
                placeholder="e.g., Google Meet, Zoom, etc."
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Interview Support Name</Form.Label>
              <Form.Control
                type="text"
                value={formData.interviewSupportName}
                onChange={(e) => setFormData(prev => ({ ...prev, interviewSupportName: e.target.value }))}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Check
                type="checkbox"
                label="Video Interview"
                checked={formData.isVideo}
                onChange={(e) => setFormData(prev => ({ ...prev, isVideo: e.target.checked }))}
              />
            </Form.Group>

            {formData.interviewStatus === 'Rejected' && (
              <Form.Group className="mb-3">
                <Form.Label>Reason for Rejection</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={formData.rejectionReason}
                  onChange={(e) => setFormData(prev => ({ ...prev, rejectionReason: e.target.value }))}
                  required
                />
              </Form.Group>
            )}

            <Form.Group className="mb-3">
              <Form.Label>Comments</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={formData.comments}
                onChange={(e) => setFormData(prev => ({ ...prev, comments: e.target.value }))}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Panel Details</Form.Label>
              <Form.Control
                type="text"
                value={formData.panelDetails}
                onChange={(e) => setFormData(prev => ({ ...prev, panelDetails: e.target.value }))}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Otter Link</Form.Label>
              <Form.Control
                type="text"
                value={formData.otterLink}
                onChange={(e) => setFormData(prev => ({ ...prev, otterLink: e.target.value }))}
                placeholder="https://otter.ai/meeting/xyz"
              />
            </Form.Group>

            <div className="d-flex justify-content-end gap-2">
              <Button variant="secondary" onClick={() => setShowEditModal(false)}>
                Cancel
              </Button>
              <Button variant="primary" type="submit">
                Update Interview
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Delete</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Are you sure you want to delete this interview schedule?</p>
          <p><strong>Consultant:</strong> {selectedInterview?.consultant?.fulllegalname}</p>
          <p><strong>Company:</strong> {selectedInterview?.company?.companyName}</p>
          <p><strong>Date:</strong> {selectedInterview && new Date(selectedInterview.date).toLocaleDateString()}</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDelete}>
            Delete
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default ConsultantInterviewDetails; 