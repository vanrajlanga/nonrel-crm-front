import React, { useState, useEffect } from 'react';
import Axios from '../../services/api';
import 'bootstrap/dist/css/bootstrap.min.css';
import { BsEnvelope, BsPhone, BsCash, BsCheck2Circle, BsTrash, BsChevronLeft, BsChevronRight, BsSearch } from 'react-icons/bs';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './ConsultantDetails.css';
import { useNavigate } from 'react-router-dom';
import Filter from '../Filter';

const ConsultantDetails = () => {
  const navigate = useNavigate();
  const [consultants, setConsultants] = useState([]);
  const [filteredConsultants, setFilteredConsultants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedConsultantId, setSelectedConsultantId] = useState(null);
  const [filterConfig, setFilterConfig] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [pageSizeOptions] = useState([5, 10, 20, 50]);

  // Function to get unique contract durations from consultants data
  const getUniqueContractDurations = (consultantsData) => {
    const durations = consultantsData.map(consultant => consultant.contractDuration);
    const uniqueDurations = [...new Set(durations)].filter(Boolean).sort((a, b) => a - b);
    
    return [
      { value: 'all', label: 'All' },
      ...uniqueDurations.map(duration => ({
        value: duration.toString(),
        label: `${duration} months`
      }))
    ];
  };

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
          name: 'contractDuration',
          label: 'Contract Duration',
          type: 'select',
          defaultValue: 'all',
          options: getUniqueContractDurations(consultants)
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
      setConsultants(res.data);
      setFilteredConsultants(res.data);
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
    navigate(`/singleConsultant/${consultantId}`);
  };

  const handleVerifyPayment = async (consultantId, e) => {
    e.stopPropagation();
    try {
      const response = await Axios.put(`/consultants/${consultantId}/verify-payment`, {
        verifybtn: true
      });
      
      if (response.status === 200) {
        setConsultants(consultants.map(consultant => 
          consultant._id === consultantId 
            ? { ...consultant, paymentStatus: true }
            : consultant
        ));
        toast.success('Payment verified successfully', {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true
        });
      }
    } catch (error) {
      console.error('Error verifying payment:', error);
      toast.error('Failed to verify payment', {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true
      });
    }
  };

  const handleCancelRegistration = async (consultantId, e) => {
    e.stopPropagation();
    setSelectedConsultantId(consultantId);
    setShowModal(true);
  };

  const confirmCancellation = async () => {
    try {
      const response = await Axios.delete(`/consultants/${selectedConsultantId}`);
      if (response.status === 200) {
        setConsultants(consultants.filter(consultant => consultant._id !== selectedConsultantId));
        toast.success('Registration cancelled successfully', {
          position: "top-right",
          autoClose: 3000
        });
        setShowModal(false);
      }
    } catch (error) {
      console.error('Error cancelling registration:', error);
      const errorMessage = error.response?.data?.message || 'Failed to cancel registration';
      toast.error(errorMessage, {
        position: "top-right",
        autoClose: 5000
      });
      setShowModal(false);
    }
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
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    applyFiltersAndSearch(e.target.value);
  };

  // Combined function to apply both filters and search
  const applyFiltersAndSearch = (search = searchQuery, filterOptions = {}) => {
    let filtered = [...consultants];
    
    // Apply search filter by username
    if (search.trim() !== '') {
      filtered = filtered.filter(consultant => 
        consultant.name && consultant.name.toLowerCase().includes(search.toLowerCase())
      );
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
      
      // Filter by contract duration
      if (filterOptions.contractDuration && filterOptions.contractDuration !== 'all') {
        filtered = filtered.filter(consultant => 
          consultant.contractDuration === parseInt(filterOptions.contractDuration)
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

  // Update the original handleFilterApplied function to use the combined function
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

  return (
    <div className="container">
      <ToastContainer />
      <div className="consultant-header text-center">
        <h2 className="display-6 fw-bold mb-3">
          Consultant Payment Details
        </h2>
        <p className="mb-0">
          Manage and verify consultant payments
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
        <div className="filter-search-container d-flex flex-wrap align-items-center gap-3 mb-2">
          {/* Search bar */}
          <div className="search-container position-relative">
            <input
              type="text"
              className="form-control form-control-sm search-input"
              placeholder="Search by username..."
              value={searchQuery}
              onChange={handleSearchChange}
              style={{ paddingLeft: '30px', width: '250px' }}
            />
            <BsSearch className="position-absolute" style={{ left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
          </div>
          
          {/* Filter component */}
          <Filter 
            onFilterApplied={handleFilterApplied} 
            filterConfig={filterConfig} 
          />
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
          <thead>
            <tr>
              <th>Username</th>
              <th>Registration Date</th>
              <th>Contact Details</th>
              <th>Contract Details</th>
              <th>Fees</th>
              <th>Payment Verification</th>
              <th>Extra Services</th>
            </tr>
          </thead>
          <tbody>
            {currentConsultants.map((consultant) => (
              <tr key={consultant._id} onClick={() => handleConsultantClick(consultant._id)}>
                <td>
                  <h5 className="mb-1">{consultant.name || "Not set yet"}</h5>
                </td>
                <td>
                  <p className="mb-0">
                    {consultant.createdAt ? formatDate(consultant.createdAt) : "Not set yet"}
                  </p>
                </td>
                <td>
                  <p className="mb-1">
                    <BsEnvelope className="me-1 text-primary" />
                    {consultant.email || "Not set yet"}
                  </p>
                  <p className="mb-0">
                    <BsPhone className="me-1 text-primary" />
                    {consultant.phone || "Not set yet"}
                  </p>
                </td>
                <td>
                  <p className="mb-1">
                    <BsCash className="me-1 text-primary" />
                    Monthly: {consultant.monthlyFee ? `$${consultant.monthlyFee}` : "Not set yet"}
                  </p>
                  <p className="mb-0">
                    Duration: {consultant.contractDuration ? `${consultant.contractDuration} months` : "Not set yet"}
                  </p>
                </td>
                <td>
                  <div className="d-flex flex-column gap-2">
                    <div className="fee-item">
                      <strong>Onboarding Fee:</strong>
                      <span className="ms-2">
                        {consultant.onboardingFee !== undefined && consultant.onboardingFee !== null 
                          ? `$${consultant.onboardingFee}` 
                          : "Not set yet"}
                      </span>
                    </div>
                    <div className="fee-item">
                      <strong>Registration Fee:</strong>
                      <span className="ms-2">
                        {consultant.registrationFee !== undefined && consultant.registrationFee !== null
                          ? `$${consultant.registrationFee}` 
                          : "Not set yet"}
                      </span>
                    </div>
                  </div>
                </td>
                <td>
                  <div className="d-flex gap-2">
                    {consultant.paymentStatus ? (
                      <span className="badge bg-success">Payment Verified</span>
                    ) : (
                      <button 
                        className="btn btn-sm btn-outline-primary"
                        onClick={(e) => handleVerifyPayment(consultant._id, e)}
                      >
                        <BsCheck2Circle className="me-1" />
                        Verify Payment
                      </button>
                    )}
                    <button 
                      className="btn btn-sm btn-outline-danger"
                      onClick={(e) => handleCancelRegistration(consultant._id, e)}
                    >
                      <BsTrash className="me-1" />
                      Cancel
                    </button>
                  </div>
                </td>
                <td>
                  {consultant.extraServices && Array.isArray(consultant.extraServices) && consultant.extraServices.length > 0 ? (
                    <span className="badge bg-info">Services Added</span>
                  ) : (
                    <span className="badge bg-secondary">No Extra Services</span>
                  )}
                </td>
              </tr>
            ))}
            
            {currentConsultants.length === 0 && (
              <tr>
                <td colSpan="7" className="text-center py-4">
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

      <div className={`modal fade ${showModal ? 'show' : ''}`} 
           style={{ display: showModal ? 'block' : 'none' }}
           tabIndex="-1"
           role="dialog"
           aria-labelledby="cancelModalLabel"
           aria-hidden="true">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title" id="cancelModalLabel">Confirm Cancellation</h5>
              <button type="button" 
                      className="btn-close" 
                      onClick={() => setShowModal(false)} 
                      aria-label="Close">
              </button>
            </div>
            <div className="modal-body">
              Are you sure you want to cancel this registration? This action cannot be undone.
            </div>
            <div className="modal-footer">
              <button type="button" 
                      className="btn btn-secondary" 
                      onClick={() => setShowModal(false)}>
                No, Keep Registration
              </button>
              <button type="button" 
                      className="btn btn-danger" 
                      onClick={confirmCancellation}>
                Yes, Cancel Registration
              </button>
            </div>
          </div>
        </div>
      </div>
      {showModal && <div className="modal-backdrop fade show"></div>}
    </div>
  );
};

export default ConsultantDetails;
