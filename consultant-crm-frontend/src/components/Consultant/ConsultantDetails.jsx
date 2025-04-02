import React, { useState, useEffect, useRef } from 'react';
import Axios from '../../services/api';
import 'bootstrap/dist/css/bootstrap.min.css';
import { BsEnvelope, BsPhone, BsCash, BsCheck2Circle, BsChevronLeft, BsChevronRight, BsSearch, BsEye, BsColumns, BsCheck, BsLayoutThreeColumns, BsBriefcase } from 'react-icons/bs';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './ConsultantDetails.css';
import { useNavigate } from 'react-router-dom';
import Filter from '../Filter';
import Modal from 'react-bootstrap/Modal';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';

const ConsultantDetails = () => {
  const navigate = useNavigate();
  const [consultants, setConsultants] = useState([]);
  const [filteredConsultants, setFilteredConsultants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filterConfig, setFilterConfig] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [userRole, setUserRole] = useState(null);
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [pageSizeOptions] = useState([5, 10, 20, 50]);

  const [visibleColumns, setVisibleColumns] = useState({});
  const [showColumnToggle, setShowColumnToggle] = useState(false);
  const columnToggleRef = useRef(null);

  const [showJobModal, setShowJobModal] = useState(false);
  const [selectedConsultantId, setSelectedConsultantId] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [selectedCompanyJobs, setSelectedCompanyJobs] = useState([]);
  const [jobFormData, setJobFormData] = useState({
    companyId: '',
    jobId: '',
    dateOfJoining: '',
    jobType: ''
  });

  // Get user role on component mount
  useEffect(() => {
    const role = localStorage.getItem('role');
    setUserRole(role);
  }, []);


  // Update filter configuration when consultants data changes
  useEffect(() => {
    if (consultants.length > 0) {
      setFilterConfig([
        {
          name: 'paymentStatus',
          label: 'Payment Status',
          type: 'select',
          defaultValue: 'all',
          options: [
            { value: 'all', label: 'All' },
            { value: 'verified', label: 'Verified' },
            { value: 'pending', label: 'Pending' }
          ]
        },
        {
          name: 'registrationDate',
          label: 'Registration Date',
          type: 'dateRange',
          defaultValue: ''
        }
      ]);
    }
  }, [consultants]);

  const loadConsultants = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await Axios.get('/consultants');
      
      // Get all possible field names from the first consultant
      const allFields = res.data.length > 0 
        ? Object.keys(res.data[0])
            .filter(key => 
              !key.startsWith('_') && 
              key !== 'id' && 
              key !== 'updatedAt'
            )
        : [];

      // Transform the data to include all fields, even if null
      const consultantsWithFields = res.data.map(consultant => {
        const fields = allFields.map(fieldName => {
          // If the field is createdAt, rename it to "Date"
          // If the field is paymentStatus, rename it to "Payment Status"
          let displayName = fieldName;
          if (fieldName === 'createdAt') {
            displayName = 'date';
          } else if (fieldName === 'paymentStatus') {
            displayName = 'payment status';
          }
          
          return {
            fieldName: displayName,
            value: consultant[fieldName] ?? null
          };
        });

        return {
          ...consultant,
          fields,
          allFields
        };
      });

      setConsultants(consultantsWithFields);
      setFilteredConsultants(consultantsWithFields);
    } catch (error) {
      console.error('Error fetching consultants:', error);
      setError('Failed to fetch consultants. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConsultants();
  }, []);

  const handleConsultantClick = (consultantId) => {
    navigate(`/consultants/singleConsultant/${consultantId}`);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Function to handle search input changes
  const handleSearchChange = (searchValue) => {
    setSearchQuery(searchValue);
    applyFiltersAndSearch(searchValue);
  };

  // Combined function to apply both filters and search
  const applyFiltersAndSearch = (search = searchQuery, filterOptions = {}) => {
    let filtered = [...consultants];
    
    // Apply search filter across multiple fields
    if (typeof search === 'string' && search.trim() !== '') {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(consultant => {
        // Search through all visible fields
        return consultant.fields.some(field => {
          const value = field.value;
          if (value === null || value === undefined) return false;
          
          // Convert value to string for searching
          const stringValue = value.toString().toLowerCase();
          return stringValue.includes(searchLower);
        });
      });
    }
    
    // Apply other filters
    if (Object.keys(filterOptions).length > 0) {
      // Filter by payment status
      if (filterOptions.paymentStatus && filterOptions.paymentStatus !== 'all') {
        const isVerified = filterOptions.paymentStatus === 'verified';
        filtered = filtered.filter(consultant => 
          consultant.paymentStatus === isVerified
        );
      }
      
      // Filter by date range (registration date)
      if (filterOptions.registrationDateFrom || filterOptions.registrationDateTo) {
        const fromDate = filterOptions.registrationDateFrom ? new Date(filterOptions.registrationDateFrom) : null;
        const toDate = filterOptions.registrationDateTo ? new Date(filterOptions.registrationDateTo) : null;
        
        filtered = filtered.filter(consultant => {
          const registrationDate = new Date(consultant.createdAt);
          
          if (fromDate && toDate) {
            return registrationDate >= fromDate && registrationDate <= toDate;
          } else if (fromDate) {
            return registrationDate >= fromDate;
          } else if (toDate) {
            return registrationDate <= toDate;
          }
          return true;
        });
      }
    }
    
    setFilteredConsultants(filtered);
    setCurrentPage(1); // Reset to first page when filters/search are applied
  };

  // Handle filter application
  const handleFilterApplied = (filterOptions) => {
    applyFiltersAndSearch(searchQuery, filterOptions);
  };

  // Pagination handlers
  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  const handleItemsPerPageChange = (e) => {
    setItemsPerPage(parseInt(e.target.value));
    setCurrentPage(1); // Reset to first page when items per page changes
  };

  // Get current page's consultants
  const indexOfLastConsultant = currentPage * itemsPerPage;
  const indexOfFirstConsultant = indexOfLastConsultant - itemsPerPage;
  const currentConsultants = filteredConsultants.slice(indexOfFirstConsultant, indexOfLastConsultant);
  
  // Calculate total pages
  const totalPages = Math.ceil(filteredConsultants.length / itemsPerPage);

  // Generate page numbers array for pagination
  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxPagesToShow = 5;
    
    if (totalPages <= maxPagesToShow) {
      // If we have 5 or fewer pages, show all
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      // Always include first page
      pageNumbers.push(1);
      
      // Calculate start and end of page range around current page
      let startPage = Math.max(2, currentPage - 1);
      let endPage = Math.min(totalPages - 1, currentPage + 1);
      
      // Adjust if we're near the start or end
      if (currentPage <= 2) {
        endPage = 4;
      } else if (currentPage >= totalPages - 1) {
        startPage = totalPages - 3;
      }
      
      // Add ellipsis after first page if needed
      if (startPage > 2) {
        pageNumbers.push('...');
      }
      
      // Add page numbers in range
      for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(i);
      }
      
      // Add ellipsis before last page if needed
      if (endPage < totalPages - 1) {
        pageNumbers.push('...');
      }
      
      // Always include last page
      if (totalPages > 1) {
        pageNumbers.push(totalPages);
      }
    }
    
    return pageNumbers;
  };

  // Initialize visible columns when consultants data is loaded
  useEffect(() => {
    if (consultants.length > 0 && consultants[0]?.fields) {
      const initialColumns = {};
      consultants[0].fields.forEach(field => {
        initialColumns[field.fieldName] = true;
      });
      setVisibleColumns(initialColumns);
    }
  }, [consultants]);

  // Close column toggle dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (columnToggleRef.current && !columnToggleRef.current.contains(event.target)) {
        setShowColumnToggle(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleColumnToggle = (fieldName) => {
    setVisibleColumns(prev => ({
      ...prev,
      [fieldName]: !prev[fieldName]
    }));
  };

  const handleSelectAllColumns = () => {
    const allFields = consultants[0]?.fields || [];
    const areAllSelected = allFields.every(field => visibleColumns[field.fieldName]);
    
    const newVisibleColumns = {};
    allFields.forEach(field => {
      newVisibleColumns[field.fieldName] = !areAllSelected;
    });
    
    setVisibleColumns(newVisibleColumns);
  };

  const areAllColumnsSelected = () => {
    const allFields = consultants[0]?.fields || [];
    return allFields.every(field => visibleColumns[field.fieldName]);
  };

  // Update jobs when company is selected
  const handleCompanyChange = async (companyId) => {
    try {
      if (!companyId) {
        setJobFormData(prev => ({ ...prev, companyId: '', jobId: '' }));
        setSelectedCompanyJobs([]);
        return;
      }

      const selectedCompany = companies.find(company => company.id.toString() === companyId.toString());
      if (!selectedCompany) {
        toast.error('Invalid company selected');
        return;
      }

      setJobFormData(prev => ({ 
        ...prev, 
        companyId: companyId,
        jobId: '' 
      }));

      console.log('Fetching jobs for company:', companyId);
      const response = await Axios.get(`/companies/${companyId}/jobs`);
      console.log('Jobs response:', response.data);
      setSelectedCompanyJobs(response.data || []);
    } catch (error) {
      console.error('Error fetching jobs:', error.response || error);
      toast.error(error.response?.data?.message || 'Failed to load jobs for this company. Please ensure the company exists and try again.');
      setSelectedCompanyJobs([]);
    }
  };

  // Update job details modal
  const handleJobModalOpen = async (consultantId) => {
    try {
      setSelectedConsultantId(consultantId);
      setJobFormData({
        companyId: '',
        jobId: '',
        dateOfJoining: '',
        jobType: ''
      });
      // Fetch fresh list of companies when modal opens
      const response = await Axios.get('/companies');
      setCompanies(response.data);
      setShowJobModal(true);
    } catch (error) {
      toast.error('Failed to load companies');
    }
  };

  const handleJobSubmit = async (e) => {
    e.preventDefault();
    
    if (!jobFormData.companyId || !jobFormData.jobId || !jobFormData.dateOfJoining) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const selectedCompany = companies.find(company => company.id.toString() === jobFormData.companyId.toString());
      const selectedJob = selectedCompanyJobs.find(job => job.id.toString() === jobFormData.jobId.toString());

      if (!selectedCompany) {
        toast.error('Please select a valid company');
        return;
      }

      if (!selectedJob) {
        toast.error('Please select a valid job position');
        return;
      }

      console.log('Selected company:', selectedCompany);
      console.log('Selected job:', selectedJob);

      const payload = {
        companyName: selectedCompany.companyName,
        jobType: selectedJob.jobTitle,
        dateOfJoining: jobFormData.dateOfJoining
      };

      console.log('Submitting job details:', payload);

      await Axios.post(`/consultants/${selectedConsultantId}/job-details`, payload);
      
      toast.success('Job details added successfully');
      setShowJobModal(false);
      setJobFormData({
        companyId: '',
        jobId: '',
        dateOfJoining: '',
        jobType: ''
      });
      // Refresh the consultant list
      loadConsultants();
    } catch (error) {
      console.error('Error submitting job details:', error.response || error);
      toast.error(error.response?.data?.message || 'Failed to add job details');
    }
  };

  return (
    <div className="container">
      <ToastContainer />
      <div className="consultant-header text-center">
        <h2 className="display-6 fw-bold mb-3">
          Consultant Registration Details
        </h2>
        <p className="mb-0">
          View and manage consultant information
        </p>
      </div>

      {loading && (
        <div className="text-center p-5">
          <div className="spinner-border loading-spinner" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      )}

      {error && (
        <div className="alert alert-danger shadow-sm" role="alert">
          {error}
        </div>
      )}

      <div className="d-flex flex-wrap justify-content-between align-items-center mb-3">
        <div className="d-flex align-items-center gap-3 flex-grow-1">
          <Filter 
            onFilterApplied={handleFilterApplied}
            filterConfig={filterConfig}
            onSearch={handleSearchChange}
            searchPlaceholder="Search by full name..."
          />

          {/* Column visibility toggle */}
          <div className="column-toggle-container" ref={columnToggleRef}>
            <button
              className="column-visibility-btn"
              onClick={() => setShowColumnToggle(!showColumnToggle)}
              title="Show/Hide Table Columns"
            >
              <BsLayoutThreeColumns />
              <span>Columns</span>
            </button>
            
            {showColumnToggle && (
              <div className="column-visibility-dropdown">
                <div 
                  className="column-option select-all"
                  onClick={handleSelectAllColumns}
                >
                  <input
                    type="checkbox"
                    id="select-all-columns"
                    checked={areAllColumnsSelected()}
                    onChange={handleSelectAllColumns}
                  />
                  <label htmlFor="select-all-columns">
                    {areAllColumnsSelected() ? 'Deselect All' : 'Select All'}
                  </label>
                </div>
                {consultants[0]?.fields.map((field, index) => (
                  <div 
                    key={index} 
                    className="column-option"
                    onClick={() => handleColumnToggle(field.fieldName)}
                  >
                    <input
                      type="checkbox"
                      id={`column-${field.fieldName}`}
                      checked={visibleColumns[field.fieldName]}
                      onChange={() => handleColumnToggle(field.fieldName)}
                    />
                    <label htmlFor={`column-${field.fieldName}`}>
                      {field.fieldName.charAt(0).toUpperCase() + field.fieldName.slice(1).toLowerCase()}
                    </label>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="d-flex justify-content-between align-items-center mb-3">
        <div className="items-per-page-selector">
          <label className="me-2">Show:</label>
          <select 
            className="form-select form-select-sm d-inline-block w-auto"
            value={itemsPerPage}
            onChange={handleItemsPerPageChange}
          >
            {pageSizeOptions.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
          <span className="ms-2">entries</span>
        </div>
        <span className="text-muted">Total: {filteredConsultants.length} consultants</span>
      </div>

      <div className="table-responsive">
        <table className="table consultant-table">
          <thead className="table-dark">
            <tr>
              <th className="header-cell">Actions</th>
              {consultants[0]?.fields
                .filter(field => visibleColumns[field.fieldName])
                .map((field, index) => (
                  <th key={index} className="header-cell text-uppercase">
                    {field.fieldName}
                  </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {currentConsultants.map((consultant) => (
              <tr key={consultant.id} className="consultant-row">
                {(userRole === 'admin' || userRole === 'team') && (
                  <td className="data-cell">
                    <div className="d-flex gap-2">
                      {userRole === 'admin' && (
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => handleConsultantClick(consultant.id)}
                        >
                          <BsEye /> View
                        </button>
                      )}
                      {consultant.isPlaced ? (
                        <span className="badge placement-success">
                          <BsBriefcase /> Placed
                        </span>
                      ) : (
                        <button
                          className="btn btn-success btn-sm"
                          onClick={() => handleJobModalOpen(consultant.id)}
                        >
                          <BsBriefcase /> Job
                        </button>
                      )}
                    </div>
                  </td>
                )}
                {consultant.fields
                  .filter(field => visibleColumns[field.fieldName])
                  .map((field, index) => (
                    <td key={index} className="data-cell">
                      {field.fieldName === 'payment status' ? (
                        <span className={`badge ${field.value ? 'payment-verified' : 'payment-pending'}`}>
                          {field.value ? 'Verified' : 'Pending'}
                        </span>
                      ) : typeof field.value === 'boolean' ? (
                        <span className={`badge ${field.value ? 'bg-success' : 'bg-secondary'}`}>
                          {field.value ? 'Yes' : 'No'}
                        </span>
                      ) : !field.value && field.value !== 0 ? (
                        <span className="text-muted">----</span>
                      ) : field.fieldName.toLowerCase().includes('date') ? (
                        formatDate(field.value)
                      ) : (
                        field.value
                      )}
                    </td>
                ))}
              </tr>
            ))}
            
            {currentConsultants.length === 0 && (
              <tr>
                <td colSpan={consultants[0]?.fields.length} className="text-center py-4">
                  <p className="text-muted mb-0">No consultants found matching your criteria.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {filteredConsultants.length > 0 && (
        <div className="pagination-container">
          <div className="d-flex justify-content-between align-items-center">
            <div className="pagination-info">
              Showing {indexOfFirstConsultant + 1} to {Math.min(indexOfLastConsultant, filteredConsultants.length)} of {filteredConsultants.length} entries
            </div>
            
            <nav aria-label="Consultant table navigation">
              <ul className="pagination">
                <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                  <button 
                    className="page-link" 
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    <BsChevronLeft />
                  </button>
                </li>
                
                {getPageNumbers().map((pageNumber, index) => (
                  <li 
                    key={index}
                    className={`page-item ${pageNumber === '...' ? 'disabled' : ''} ${pageNumber === currentPage ? 'active' : ''}`}
                  >
                    <button 
                      className="page-link"
                      onClick={() => pageNumber !== '...' && handlePageChange(pageNumber)}
                    >
                      {pageNumber}
                    </button>
                  </li>
                ))}
                
                <li className={`page-item ${currentPage === totalPages || totalPages === 0 ? 'disabled' : ''}`}>
                  <button 
                    className="page-link" 
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages || totalPages === 0}
                  >
                    <BsChevronRight />
                  </button>
                </li>
              </ul>
            </nav>
          </div>
        </div>
      )}

      {/* Job Details Modal */}
      <Modal show={showJobModal} onHide={() => setShowJobModal(false)} centered backdrop={true}>
        <Modal.Header closeButton>
          <Modal.Title>Add Job Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleJobSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Company</Form.Label>
              <Form.Select
                value={jobFormData.companyId}
                onChange={(e) => handleCompanyChange(e.target.value)}
                required
              >
                <option value="">Select Company</option>
                {companies.map(company => (
                  <option key={company.id} value={company.id}>
                    {company.companyName}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Job Position</Form.Label>
              <Form.Select
                value={jobFormData.jobId}
                onChange={(e) => setJobFormData(prev => ({ ...prev, jobId: e.target.value }))}
                required
                disabled={!jobFormData.companyId}
              >
                <option value="">Select Job Position</option>
                {selectedCompanyJobs.map(job => (
                  <option key={job.id} value={job.id}>
                    {job.jobTitle}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Date of Joining</Form.Label>
              <Form.Control
                type="date"
                name="dateOfJoining"
                value={jobFormData.dateOfJoining}
                onChange={(e) => setJobFormData(prev => ({ ...prev, dateOfJoining: e.target.value }))}
                required
              />
            </Form.Group>

            <div className="d-flex justify-content-end gap-2">
              <Button variant="secondary" onClick={() => setShowJobModal(false)}>
                Cancel
              </Button>
              <Button variant="primary" type="submit">
                Save Job Details
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default ConsultantDetails;
