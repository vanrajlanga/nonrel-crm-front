import React, { useState, useEffect } from 'react';
import Axios from '../../services/api';
import Toast from '../common/Toast';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './CompanyManagement.css';
import { Modal, Form, Button, Accordion, Card } from 'react-bootstrap';
import { BsBuilding, BsPencil, BsTrash, BsPlus, BsBriefcase } from 'react-icons/bs';
import { useNavigate } from 'react-router-dom';

const CompanyManagement = () => {
  const navigate = useNavigate();
  const [companies, setCompanies] = useState([]);
  const [showCompanyModal, setShowCompanyModal] = useState(false);
  const [showJobModal, setShowJobModal] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [userRole, setUserRole] = useState(null);

  const [companyForm, setCompanyForm] = useState({
    companyName: '',
    city: '',
    country: ''
  });

  const [jobForm, setJobForm] = useState({
    jobTitle: '',
    companyId: null
  });

  // Check user role and set up axios interceptor on component mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');

    if (!token || !role || (role !== 'superAdmin' && role !== 'coordinator' && role !== 'teamLead')) {
      toast.error('Access forbidden: insufficient privileges');
      navigate('/');
      return;
    }

    // Set up axios default headers
    Axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    setUserRole(role);
  }, [navigate]);

  // Load companies on component mount
  useEffect(() => {
    if (userRole === 'superAdmin' || userRole === 'coordinator' || userRole === 'teamLead') {
      loadCompanies();
    }
  }, [userRole]);

  const loadCompanies = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await Axios.get('/companies', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setCompanies(response.data);
    } catch (error) {
      if (error.response?.status === 403) {
        toast.error('Access forbidden: insufficient privileges');
        navigate('/');
      } else if (error.response?.status === 401) {
        toast.error('Session expired. Please login again.');
        localStorage.clear();
        navigate('/login');
      } else {
        toast.error(error.response?.data?.message || 'Failed to load companies');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCompanySubmit = async (e) => {
    e.preventDefault();
    try {
      if (userRole !== 'superAdmin') {
        toast.error('Only superAdmin can perform this action');
        return;
      }

      const token = localStorage.getItem('token');
      const config = {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      };
      
      if (isEditing) {
        await Axios.put(`/companies/${selectedCompany.id}`, companyForm, config);
        Toast.success('Company updated successfully');
      } else {
        await Axios.post('/companies', companyForm, config);
        Toast.success('Company created successfully');
      }
      setShowCompanyModal(false);
      resetCompanyForm();
      loadCompanies();
    } catch (error) {
      if (error.response?.status === 403) {
        toast.error('Access forbidden: insufficient privileges');
      } else if (error.response?.status === 401) {
        toast.error('Session expired. Please login again.');
        localStorage.clear();
        navigate('/login');
      } else {
        toast.error(error.response?.data?.message || 'Failed to save company');
      }
    }
  };

  const handleJobSubmit = async (e) => {
    e.preventDefault();
    try {
      if (userRole !== 'superAdmin') {
        toast.error('Only superAdmin can perform this action');
        return;
      }

      const token = localStorage.getItem('token');
      const config = {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      };

      await Axios.post(`/companies/${jobForm.companyId}/jobs`, { jobTitle: jobForm.jobTitle }, config);
      Toast.success('Job posting created successfully');
      setShowJobModal(false);
      resetJobForm();
      loadCompanies();
    } catch (error) {
      if (error.response?.status === 403) {
        toast.error('Access forbidden: insufficient privileges');
      } else if (error.response?.status === 401) {
        toast.error('Session expired. Please login again.');
        localStorage.clear();
        navigate('/login');
      } else {
        toast.error(error.response?.data?.message || 'Failed to create job posting');
      }
    }
  };

  const handleDeleteCompany = async (companyId) => {
    if (userRole !== 'superAdmin') {
      toast.error('Only superAdmin can perform this action');
      return;
    }

    if (window.confirm('Are you sure you want to delete this company?')) {
      try {
        const token = localStorage.getItem('token');
        const config = {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        };

        await Axios.delete(`/companies/${companyId}`, config);
        Toast.success('Company deleted successfully');
        loadCompanies();
      } catch (error) {
        if (error.response?.status === 403) {
          toast.error('Access forbidden: insufficient privileges');
        } else if (error.response?.status === 401) {
          toast.error('Session expired. Please login again.');
          localStorage.clear();
          navigate('/login');
        } else {
          toast.error(error.response?.data?.message || 'Failed to delete company');
        }
      }
    }
  };

  const handleDeleteJob = async (companyId, jobId) => {
    if (userRole !== 'superAdmin') {
      toast.error('Only superAdmin can perform this action');
      return;
    }

    if (window.confirm('Are you sure you want to delete this job posting?')) {
      try {
        const token = localStorage.getItem('token');
        const config = {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        };

        await Axios.delete(`/companies/${companyId}/jobs/${jobId}`, config);
        Toast.success('Job posting deleted successfully');
        loadCompanies();
      } catch (error) {
        if (error.response?.status === 403) {
          toast.error('Access forbidden: insufficient privileges');
        } else if (error.response?.status === 401) {
          toast.error('Session expired. Please login again.');
          localStorage.clear();
          navigate('/login');
        } else {
          toast.error(error.response?.data?.message || 'Failed to delete job posting');
        }
      }
    }
  };

  const handleEditCompany = (company) => {
    setSelectedCompany(company);
    setCompanyForm({
      companyName: company.companyName,
      city: company.city,
      country: company.country
    });
    setIsEditing(true);
    setShowCompanyModal(true);
  };

  const handleAddJob = (companyId) => {
    setJobForm({ ...jobForm, companyId });
    setShowJobModal(true);
  };

  const resetCompanyForm = () => {
    setCompanyForm({
      companyName: '',
      city: '',
      country: ''
    });
    setSelectedCompany(null);
    setIsEditing(false);
  };

  const resetJobForm = () => {
    setJobForm({
      jobTitle: '',
      companyId: null
    });
  };

  const handleCloseCompanyModal = () => {
    setShowCompanyModal(false);
    resetCompanyForm();
  };

  const handleCloseJobModal = () => {
    setShowJobModal(false);
    resetJobForm();
  };

  return (
    <div className="company-mgmt-container">
      <Toast.ToastContainer />
      
      <div className="company-mgmt-header">
        <h2 className="company-mgmt-title">Company Management</h2>
        <p className="company-mgmt-subtitle">Manage your company listings and job postings</p>
        {userRole === 'superAdmin' && (
          <Button 
            variant="primary" 
            className="company-mgmt-add-btn"
            onClick={() => {
              resetCompanyForm();
              setShowCompanyModal(true);
            }}
          >
            <BsPlus size={20} /> Add New Company
          </Button>
        )}
      </div>

      {loading ? (
        <div className="company-mgmt-loading">
          <div className="company-mgmt-spinner spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="company-mgmt-loading-text">Loading companies...</p>
        </div>
      ) : (
        <div className="company-mgmt-list">
          <Accordion>
            {companies.map((company) => (
              <Accordion.Item key={company.id} eventKey={company.id.toString()} className="company-mgmt-item">
                <Accordion.Header className="company-mgmt-accordion-btn">
                  <div className="company-mgmt-header-content">
                    <BsBuilding className="company-mgmt-icon" />
                    <span className="company-mgmt-name">{company.companyName}</span>
                    <span className="company-mgmt-location">
                      {company.city}, {company.country}
                    </span>
                  </div>
                </Accordion.Header>
                <Accordion.Body>
                  {userRole === 'superAdmin' && (
                    <div className="company-mgmt-actions">
                      <Button 
                        variant="outline-primary" 
                        size="sm"
                        className="company-mgmt-btn"
                        onClick={() => handleEditCompany(company)}
                      >
                        <BsPencil /> Edit Details
                      </Button>
                      <Button 
                        variant="outline-success" 
                        size="sm"
                        className="company-mgmt-btn"
                        onClick={() => handleAddJob(company.id)}
                      >
                        <BsBriefcase /> Add Job Position
                      </Button>
                      <Button 
                        variant="outline-danger" 
                        size="sm"
                        className="company-mgmt-btn"
                        onClick={() => handleDeleteCompany(company.id)}
                      >
                        <BsTrash /> Remove Company
                      </Button>
                    </div>
                  )}

                  <div className="company-mgmt-jobs">
                    <h5 className="company-mgmt-jobs-title">Available Positions</h5>
                    {company.CompanyJobs && company.CompanyJobs.length > 0 ? (
                      <div className="company-mgmt-jobs-grid">
                        {company.CompanyJobs.map((job) => (
                          <Card key={job.id} className="company-mgmt-job-card">
                            <Card.Body>
                              <div className="d-flex justify-content-between align-items-center">
                                <div className="company-mgmt-job-info">
                                  <h6 className="company-mgmt-job-title">{job.jobTitle}</h6>
                                  <small className="text-muted">
                                    Posted: {new Date(job.createdAt).toLocaleDateString()}
                                  </small>
                                </div>
                                {userRole === 'superAdmin' && (
                                  <Button
                                    variant="outline-danger"
                                    size="sm"
                                    className="company-mgmt-btn"
                                    onClick={() => handleDeleteJob(company.id, job.id)}
                                  >
                                    <BsTrash />
                                  </Button>
                                )}
                              </div>
                            </Card.Body>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <p className="company-mgmt-no-jobs">No positions available at this time</p>
                    )}
                  </div>
                </Accordion.Body>
              </Accordion.Item>
            ))}
          </Accordion>
        </div>
      )}

      {/* Company Modal */}
      <Modal 
        show={showCompanyModal} 
        onHide={handleCloseCompanyModal} 
        centered
        backdrop={true}
      >
        <Modal.Header closeButton>
          <Modal.Title>{isEditing ? 'Edit Company' : 'Add New Company'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleCompanySubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Company Name</Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter company name"
                value={companyForm.companyName}
                onChange={(e) => setCompanyForm({ ...companyForm, companyName: e.target.value })}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>City</Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter city"
                value={companyForm.city}
                onChange={(e) => setCompanyForm({ ...companyForm, city: e.target.value })}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Country</Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter country"
                value={companyForm.country}
                onChange={(e) => setCompanyForm({ ...companyForm, country: e.target.value })}
                required
              />
            </Form.Group>

            <div className="d-flex justify-content-end gap-2">
              <Button 
                variant="secondary" 
                onClick={handleCloseCompanyModal}
              >
                Cancel
              </Button>
              <Button 
                variant="primary" 
                type="submit"
              >
                {isEditing ? 'Update Company' : 'Create Company'}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      {/* Job Modal */}
      <Modal 
        show={showJobModal} 
        onHide={handleCloseJobModal} 
        centered
        backdrop={true}
      >
        <Modal.Header closeButton>
          <Modal.Title>Add New Job Posting</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleJobSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Job Title</Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter job title"
                value={jobForm.jobTitle}
                onChange={(e) => setJobForm({ ...jobForm, jobTitle: e.target.value })}
                required
              />
            </Form.Group>

            <div className="d-flex justify-content-end gap-2">
              <Button 
                variant="secondary" 
                onClick={handleCloseJobModal}
              >
                Cancel
              </Button>
              <Button 
                variant="primary" 
                type="submit"
              >
                Create Job Posting
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default CompanyManagement; 