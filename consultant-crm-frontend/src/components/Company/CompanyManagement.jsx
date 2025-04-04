import React, { useState, useEffect } from 'react';
import Axios from '../../services/api';
import { toast, ToastContainer } from 'react-toastify';
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

    if (!token || !role || (role !== 'superAdmin' && role !== 'coordinator' && role !== 'Support')) {
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
    if (userRole === 'superAdmin' || userRole === 'coordinator' || userRole === 'Support') {
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
        toast.success('Company updated successfully');
      } else {
        await Axios.post('/companies', companyForm, config);
        toast.success('Company created successfully');
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
      toast.success('Job posting created successfully');
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
        toast.success('Company deleted successfully');
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
        toast.success('Job posting deleted successfully');
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
    <div className="company-management-container">
      <ToastContainer />
      
      <div className="header-section">
        <h2 className="title">Company Management</h2>
        {userRole === 'superAdmin' && (
          <Button 
            variant="primary" 
            className="add-company-btn"
            onClick={() => {
              resetCompanyForm();
              setShowCompanyModal(true);
            }}
          >
            <BsPlus /> Add Company
          </Button>
        )}
      </div>

      {loading ? (
        <div className="text-center p-5">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : (
        <div className="companies-list">
          <Accordion>
            {companies.map((company) => (
              <Accordion.Item key={company.id} eventKey={company.id.toString()}>
                <Accordion.Header>
                  <div className="company-header">
                    <BsBuilding className="company-icon" />
                    <span className="company-name">{company.companyName}</span>
                    <span className="company-location">
                      {company.city}, {company.country}
                    </span>
                  </div>
                </Accordion.Header>
                <Accordion.Body>
                  {userRole === 'superAdmin' && (
                    <div className="company-actions mb-3">
                      <Button 
                        variant="outline-primary" 
                        size="sm"
                        onClick={() => handleEditCompany(company)}
                      >
                        <BsPencil /> Edit Company
                      </Button>
                      <Button 
                        variant="outline-danger" 
                        size="sm"
                        onClick={() => handleDeleteCompany(company.id)}
                      >
                        <BsTrash /> Delete Company
                      </Button>
                      <Button 
                        variant="outline-success" 
                        size="sm"
                        onClick={() => handleAddJob(company.id)}
                      >
                        <BsBriefcase /> Add Job
                      </Button>
                    </div>
                  )}

                  <div className="jobs-list">
                    <h5>Job Postings</h5>
                    {company.CompanyJobs && company.CompanyJobs.length > 0 ? (
                      <div className="job-cards">
                        {company.CompanyJobs.map((job) => (
                          <Card key={job.id} className="job-card">
                            <Card.Body>
                              <div className="d-flex justify-content-between align-items-center">
                                <div>
                                  <h6 className="mb-0">{job.jobTitle}</h6>
                                  <small className="text-muted">
                                    Posted: {new Date(job.createdAt).toLocaleDateString()}
                                  </small>
                                </div>
                                {userRole === 'superAdmin' && (
                                  <Button
                                    variant="outline-danger"
                                    size="sm"
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
                      <p className="text-muted">No job postings yet</p>
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