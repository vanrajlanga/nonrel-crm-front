import React, { useState, useEffect } from 'react';
import Axios from '../../services/api';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { BsChevronLeft, BsChevronRight } from 'react-icons/bs';
import Filter from '../Filter';
import './ConsultantJobDetails.css';

const ConsultantAgreementDetails = () => {
  const [agreements, setAgreements] = useState([]);
  const [filteredAgreements, setFilteredAgreements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [pageSizeOptions] = useState([5, 10, 20, 50]);

  const [filterConfig, setFilterConfig] = useState([]);

  const loadAgreements = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get all consultants first
      const consultantsResponse = await Axios.get('/consultants');
      const consultants = consultantsResponse.data;
      
      // Fetch agreements for all consultants
      const agreementPromises = consultants.map(consultant =>
        Axios.get(`/consultants/${consultant.id}/agreement`)
          .then(response => ({
            ...response.data.agreement,
            consultantId: consultant.id
          }))
          .catch(error => {
            if (error.response?.status !== 404) {
              console.error(`Error fetching agreement for consultant ${consultant.id}:`, error);
            }
            return null;
          })
      );

      const results = await Promise.all(agreementPromises);
      const validResults = results.filter(result => result !== null);
      
      setAgreements(validResults);
      setFilteredAgreements(validResults);

      // Update filter configuration with unique companies and positions
      const uniqueCompanies = [...new Set(validResults.map(item => item.companyName))].filter(Boolean);
      const uniquePositions = [...new Set(validResults.map(item => item.jobTitle))].filter(Boolean);

      setFilterConfig([
        {
          name: 'companyName',
          label: 'Company',
          type: 'select',
          defaultValue: 'all',
          options: [
            { value: 'all', label: 'All Companies' },
            ...uniqueCompanies.map(company => ({
              value: company,
              label: company
            }))
          ]
        },
        {
          name: 'jobTitle',
          label: 'Position',
          type: 'select',
          defaultValue: 'all',
          options: [
            { value: 'all', label: 'All Positions' },
            ...uniquePositions.map(position => ({
              value: position,
              label: position
            }))
          ]
        }
      ]);
    } catch (error) {
      console.error('Error fetching agreements:', error);
      setError('Failed to fetch agreements. Please try again.');
      toast.error('Failed to fetch agreements');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAgreements();
  }, []);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Combined function to apply both filters and search
  const applyFiltersAndSearch = (search = searchQuery, filterOptions = {}) => {
    let filtered = [...agreements];
    
    // Apply search filter
    if (typeof search === 'string' && search.trim() !== '') {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(agreement => 
        agreement.consultantName?.toLowerCase().includes(searchLower) ||
        agreement.companyName?.toLowerCase().includes(searchLower) ||
        agreement.jobTitle?.toLowerCase().includes(searchLower)
      );
    }
    
    // Apply filters
    if (Object.keys(filterOptions).length > 0) {
      // Filter by company
      if (filterOptions.companyName && filterOptions.companyName !== 'all') {
        filtered = filtered.filter(agreement => agreement.companyName === filterOptions.companyName);
      }
      
      // Filter by position
      if (filterOptions.jobTitle && filterOptions.jobTitle !== 'all') {
        filtered = filtered.filter(agreement => agreement.jobTitle === filterOptions.jobTitle);
      }
    }
    
    setFilteredAgreements(filtered);
    setCurrentPage(1);
  };

  // Handle search change
  const handleSearchChange = (searchValue) => {
    setSearchQuery(searchValue);
    applyFiltersAndSearch(searchValue);
  };

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredAgreements.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredAgreements.length / itemsPerPage);

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  const handleItemsPerPageChange = (e) => {
    setItemsPerPage(parseInt(e.target.value));
    setCurrentPage(1);
  };

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxPagesToShow = 5;
    
    if (totalPages <= maxPagesToShow) {
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      pageNumbers.push(1);
      
      let startPage = Math.max(2, currentPage - 1);
      let endPage = Math.min(totalPages - 1, currentPage + 1);
      
      if (currentPage <= 2) {
        endPage = 4;
      } else if (currentPage >= totalPages - 1) {
        startPage = totalPages - 3;
      }
      
      if (startPage > 2) {
        pageNumbers.push('...');
      }
      
      for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(i);
      }
      
      if (endPage < totalPages - 1) {
        pageNumbers.push('...');
      }
      
      if (totalPages > 1) {
        pageNumbers.push(totalPages);
      }
    }
    
    return pageNumbers;
  };

  // Handle filter application
  const handleFilterApplied = (filterOptions) => {
    applyFiltersAndSearch(searchQuery, filterOptions);
  };

  return (
    <div className="container">
      <ToastContainer />
      <div className="consultant-header text-center">
        <h2 className="display-6 fw-bold mb-3">
          Consultant Agreement Details
        </h2>
        <p className="mb-0">
          View all consultant agreements
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
        <Filter 
          onFilterApplied={handleFilterApplied}
          filterConfig={filterConfig}
          onSearch={handleSearchChange}
          searchPlaceholder="Search by consultant name, company, or position..."
        />

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
      </div>

      <div className="table-responsive">
        <table className="table consultant-table">
          <thead className="table-dark">
            <tr>
              <th>CONSULTANT NAME</th>
              <th>COMPANY NAME</th>
              <th>POSITION</th>
              <th>AGREEMENT DATE</th>
              <th>EMI DAY</th>
              <th>EMI AMOUNT</th>
              <th>REMARKS</th>
            </tr>
          </thead>
          <tbody>
            {currentItems.map((agreement, index) => (
              <tr key={index} className="consultant-row">
                <td>{agreement.consultantName || '----'}</td>
                <td>{agreement.companyName || '----'}</td>
                <td>{agreement.jobTitle || '----'}</td>
                <td>{agreement.agreementDate ? formatDate(agreement.agreementDate) : '----'}</td>
                <td>
                  <div className="emi-info">
                    <span className="emi-item emi-date">
                      {agreement.emiDate || '----'}
                    </span>
                  </div>
                </td>
                <td>
                  <div className="emi-info">
                    <span className="emi-item emi-amount">
                      ${agreement.emiAmount?.toLocaleString() || '0'}
                    </span>
                  </div>
                </td>
                <td style={{ maxWidth: '200px' }} className="text-truncate">
                  {agreement.remarks || '----'}
                </td>
              </tr>
            ))}
            
            {currentItems.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center py-4">
                  <p className="text-muted mb-0">No agreements found matching your criteria.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {filteredAgreements.length > 0 && (
        <div className="pagination-container">
          <div className="d-flex justify-content-between align-items-center">
            <div className="pagination-info">
              Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredAgreements.length)} of {filteredAgreements.length} entries
            </div>
            
            <nav aria-label="Agreement details table navigation">
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
    </div>
  );
};

export default ConsultantAgreementDetails;