import React, { useState, useEffect } from 'react';
import Axios from '../../services/api';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {  BsChevronLeft, BsChevronRight, BsCurrencyDollar } from 'react-icons/bs';
import Filter from '../Filter';
import Modal from 'react-bootstrap/Modal';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import './ConsultantJobDetails.css';

const ConsultantJobDetails = () => {
  const [jobDetails, setJobDetails] = useState([]);
  const [filteredJobDetails, setFilteredJobDetails] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [pageSizeOptions] = useState([5, 10, 20, 50]);

  const [showFeesModal, setShowFeesModal] = useState(false);
  const [showAgreementModal, setShowAgreementModal] = useState(false);
  const [selectedConsultant, setSelectedConsultant] = useState(null);
  const [agreementData, setAgreementData] = useState({
    agreementDate: '',
    emiDate: '',
    emiAmount: '',
    remark: ''
  });
  const [feesData, setFeesData] = useState({
    totalFees: '',
    receivedFees: '',
    remainingFees: '',
    feesStatus: ''
  });

  const [filterConfig, setFilterConfig] = useState([]);
  const [issuperAdmin, setIssuperAdmin] = useState(false);

  const loadJobDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const role = localStorage.getItem('role');
      let jobDetailsData = [];

      if (role === 'superAdmin') {
        // For superAdmin, use the new endpoint that returns all placed consultants
        const response = await Axios.get('/placed-consultants');
        // Ensure we're working with an array and map the data to a consistent structure
        jobDetailsData = Array.isArray(response.data) ? response.data : 
                        Array.isArray(response.data.jobDetails) ? response.data.jobDetails : [];
        
        // Map the data to ensure consistent structure
        jobDetailsData = jobDetailsData.map(detail => ({
          consultantId: detail.consultantId || detail.id,
          fullName: detail.fullName || detail.consultant?.fulllegalname,
          email: detail.email || detail.consultant?.email,
          companyName: detail.companyName,
          position: detail.position || detail.jobType,
          dateOfJoining: detail.dateOfJoining,
          createdBy: detail.createdBy,
          feesInfo: detail.feesInfo || {
            totalFees: detail.totalFees || 0,
            receivedFees: detail.receivedFees || 0,
            remainingFees: detail.remainingFees || 0
          },
          feesStatus: detail.feesStatus || 'pending',
          isAgreement: detail.isAgreement || false
        }));
      } else {
        // For other roles (coordinator, support), use the existing endpoint
        const consultantsResponse = await Axios.get('/consultants');
        const placedConsultants = Array.isArray(consultantsResponse.data) ? 
          consultantsResponse.data.filter(consultant => consultant.isPlaced === true) : [];
        
        // Fetch job details only for placed consultants
        const jobDetailsPromises = placedConsultants.map(consultant =>
          Axios.get(`/consultants/${consultant.id}/job-details`)
            .then(response => ({
              consultantId: consultant.id,
              fullName: consultant.fulllegalname,
              email: consultant.email,
              companyName: response.data.companyName,
              position: response.data.position || response.data.jobType,
              dateOfJoining: response.data.dateOfJoining,
              createdBy: response.data.createdBy,
              feesInfo: response.data.feesInfo || {
                totalFees: response.data.totalFees || 0,
                receivedFees: response.data.receivedFees || 0,
                remainingFees: response.data.remainingFees || 0
              },
              feesStatus: response.data.feesStatus || 'pending',
              isAgreement: response.data.isAgreement || false
            }))
            .catch(error => {
              console.error(`Error fetching job details for consultant ${consultant.id}:`, error);
              return null;
            })
        );

        const results = await Promise.all(jobDetailsPromises);
        jobDetailsData = results.filter(result => result !== null);
      }
      
      console.log('Job details:', jobDetailsData);
      
      // Ensure we always set arrays, even if empty
      setJobDetails(Array.isArray(jobDetailsData) ? jobDetailsData : []);
      setFilteredJobDetails(Array.isArray(jobDetailsData) ? jobDetailsData : []);

      // Only process filters if we have data
      if (Array.isArray(jobDetailsData) && jobDetailsData.length > 0) {
        const uniqueCompanies = [...new Set(jobDetailsData.map(item => item.companyName))].filter(Boolean);
        const uniquePositions = [...new Set(jobDetailsData.map(item => item.position))].filter(Boolean);
        const uniqueSupportNames = [...new Set(jobDetailsData.map(item => item.createdBy?.name))].filter(Boolean);

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
            name: 'position',
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
          },
          {
            name: 'supportName',
            label: 'Support Name',
            type: 'select',
            defaultValue: 'all',
            options: [
              { value: 'all', label: 'All Support Staff' },
              ...uniqueSupportNames.map(name => ({
                value: name,
                label: name
              }))
            ]
          },
          {
            name: 'feesStatus',
            label: 'Fees Status',
            type: 'select',
            defaultValue: 'all',
            options: [
              { value: 'all', label: 'All Statuses' },
              { value: 'pending', label: 'Pending' },
              { value: 'partial', label: 'Partial' },
              { value: 'completed', label: 'Completed' }
            ]
          },
          {
            name: 'dateOfJoining',
            label: 'Date of Joining',
            type: 'dateRange',
            defaultValue: ''
          }
        ]);
      } else {
        // Set empty filter config if no data
        setFilterConfig([]);
      }
    } catch (error) {
      console.error('Error fetching job details:', error);
      const errorMessage = error.response?.data?.message || 'Failed to fetch job details';
      setError(errorMessage);
      toast.error(errorMessage);
      // Ensure we set empty arrays on error
      setJobDetails([]);
      setFilteredJobDetails([]);
      setFilterConfig([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadJobDetails();
  }, []);

  // Get user role on component mount
  useEffect(() => {
    const role = localStorage.getItem('role');
    // Set superAdmin status
    setIssuperAdmin(role === 'superAdmin');
  }, []);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Update applyFiltersAndSearch function to include new filters
  const applyFiltersAndSearch = (search = searchQuery, filterOptions = {}) => {
    let filtered = [...jobDetails];
    
    // Apply search filter
    if (typeof search === 'string' && search.trim() !== '') {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(detail => 
        detail.fullName?.toLowerCase().includes(searchLower) ||
        detail.email?.toLowerCase().includes(searchLower) ||
        detail.companyName?.toLowerCase().includes(searchLower) ||
        detail.position?.toLowerCase().includes(searchLower) ||
        detail.createdBy?.name?.toLowerCase().includes(searchLower)
      );
    }
    
    // Apply filters
    if (Object.keys(filterOptions).length > 0) {
      // Filter by company
      if (filterOptions.companyName && filterOptions.companyName !== 'all') {
        filtered = filtered.filter(detail => detail.companyName === filterOptions.companyName);
      }
      
      // Filter by position
      if (filterOptions.position && filterOptions.position !== 'all') {
        filtered = filtered.filter(detail => detail.position === filterOptions.position);
      }

      // Filter by support name
      if (filterOptions.supportName && filterOptions.supportName !== 'all') {
        filtered = filtered.filter(detail => detail.createdBy?.name === filterOptions.supportName);
      }

      // Filter by fees status
      if (filterOptions.feesStatus && filterOptions.feesStatus !== 'all') {
        filtered = filtered.filter(detail => detail.feesStatus === filterOptions.feesStatus);
      }
      
      // Filter by date range
      if (filterOptions.dateOfJoiningFrom || filterOptions.dateOfJoiningTo) {
        const fromDate = filterOptions.dateOfJoiningFrom ? new Date(filterOptions.dateOfJoiningFrom) : null;
        const toDate = filterOptions.dateOfJoiningTo ? new Date(filterOptions.dateOfJoiningTo) : null;
        
        filtered = filtered.filter(detail => {
          const joiningDate = new Date(detail.dateOfJoining);
          
          if (fromDate && toDate) {
            return joiningDate >= fromDate && joiningDate <= toDate;
          } else if (fromDate) {
            return joiningDate >= fromDate;
          } else if (toDate) {
            return joiningDate <= toDate;
          }
          return true;
        });
      }
    }
    
    setFilteredJobDetails(filtered);
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
  const currentItems = filteredJobDetails.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredJobDetails.length / itemsPerPage);

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

  // Handle fees modal
  const handleFeesModalOpen = (consultant) => {
    setSelectedConsultant(consultant);
    if (consultant.feesInfo) {
      setFeesData({
        totalFees: consultant.feesInfo.totalFees || '0',
        receivedFees: '0',
        remainingFees: consultant.feesInfo.remainingFees || consultant.feesInfo.totalFees || '0',
        feesStatus: consultant.feesStatus
      });
    } else {
      setFeesData({
        totalFees: '',
        receivedFees: '0',
        remainingFees: '',
        feesStatus: ''
      });
    }
    setShowFeesModal(true);
  };

  const handleFeesSubmit = async (e) => {
    e.preventDefault();
    try {
      const previousReceived = parseFloat(selectedConsultant.feesInfo?.receivedFees) || 0;
      const newPayment = parseFloat(feesData.receivedFees) || 0;
      const totalFees = parseFloat(feesData.totalFees) || 0;
      const isTotalFeesUpdated = selectedConsultant.feesInfo?.totalFees !== totalFees;

      // Validate inputs
      if (newPayment <= 0 && !isTotalFeesUpdated) {
        toast.error('New payment amount must be greater than 0');
        return;
      }

      if (previousReceived + newPayment > totalFees) {
        toast.error('Total received amount cannot exceed total fees');
        return;
      }

      const newReceivedTotal = isTotalFeesUpdated ? previousReceived : previousReceived + newPayment;
      const newStatus = newReceivedTotal >= totalFees ? 'completed' : 
                       newReceivedTotal > 0 ? 'partial' : 'pending';

      const updatedData = {
        totalFees: totalFees,
        receivedFees: newReceivedTotal,
        feesStatus: newStatus
      };

      const response = await Axios.put(`/consultants/${selectedConsultant.consultantId}/job-details`, updatedData);

      if (response.data) {
        const updatedConsultant = response.data.jobDetails;
        
        const updateConsultantState = (prevDetails) =>
          prevDetails.map(consultant =>
            consultant.consultantId === selectedConsultant.consultantId
              ? {
                  ...consultant,
                  feesInfo: updatedConsultant.feesInfo,
                  feesStatus: newStatus
                }
              : consultant
          );

        setJobDetails(updateConsultantState);
        setFilteredJobDetails(updateConsultantState);
        setSelectedConsultant(prev => ({
          ...prev,
          feesInfo: updatedConsultant.feesInfo,
          feesStatus: newStatus
        }));

        toast.success(isTotalFeesUpdated ? 'Total fees updated successfully' : 'Payment recorded successfully');
        setShowFeesModal(false);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error updating fees');
    }
  };

  const handleFeesInputChange = (e) => {
    const { name, value } = e.target;
    setFeesData(prev => {
      const newData = { ...prev };
      
      if (name === 'totalFees') {
        const totalFees = parseFloat(value) || 0;
        const previousReceived = parseFloat(selectedConsultant.feesInfo?.receivedFees) || 0;
        
        newData.totalFees = value;
        newData.remainingFees = (totalFees - previousReceived).toString();
        
        // Calculate new status based on total fees change
        if (previousReceived >= totalFees && totalFees > 0) {
          newData.feesStatus = 'completed';
        } else if (previousReceived > 0) {
          newData.feesStatus = 'partial';
        } else {
          newData.feesStatus = 'pending';
        }
      }
      
      if (name === 'receivedFees') {
        const newPayment = parseFloat(value) || 0;
        const totalFees = parseFloat(selectedConsultant.feesInfo?.totalFees) || 0;
        const previousReceived = parseFloat(selectedConsultant.feesInfo?.receivedFees) || 0;
        const totalReceived = previousReceived + newPayment;
        
        newData.receivedFees = value;
        newData.remainingFees = Math.max(0, totalFees - totalReceived).toString();
        
        // Calculate new status based on payment
        if (totalReceived >= totalFees && totalFees > 0) {
          newData.feesStatus = 'completed';
        } else if (totalReceived > 0) {
          newData.feesStatus = 'partial';
        } else {
          newData.feesStatus = 'pending';
        }
      }
      
      return newData;
    });
  };

  const handleAgreementModalOpen = async (consultant) => {
    setSelectedConsultant(consultant);
    try {
      // Fetch existing agreement if any
      const response = await Axios.get(`/consultants/${consultant.consultantId}/agreement`);
      if (response.data) {
        setAgreementData({
          agreementDate: response.data.agreementDate || '',
          emiDate: response.data.emiDate?.toString() || '',
          emiAmount: response.data.emiAmount || '',
          remark: response.data.remark || ''
        });
      } else {
        setAgreementData({
          agreementDate: '',
          emiDate: '',
          emiAmount: '',
          remark: ''
        });
      }
    } catch (error) {
      console.error('Error fetching agreement:', error);
      setAgreementData({
        agreementDate: '',
        emiDate: '',
        emiAmount: '',
        remark: ''
      });
    }
    setShowAgreementModal(true);
  };

  const handleAgreementSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        agreementDate: agreementData.agreementDate,
        emiDate: parseInt(agreementData.emiDate, 10),
        emiAmount: parseFloat(agreementData.emiAmount),
        remark: agreementData.remark
      };

      const response = await Axios.post(`/consultants/${selectedConsultant.consultantId}/agreement`, payload);

      if (response.data) {
        const updateConsultantState = (prevDetails) =>
          prevDetails.map(consultant =>
            consultant.consultantId === selectedConsultant.consultantId
              ? {
                  ...consultant,
                  isAgreement: true,
                  ...payload
                }
              : consultant
          );

        setJobDetails(updateConsultantState);
        setFilteredJobDetails(updateConsultantState);
        toast.success('Agreement created successfully');
        setShowAgreementModal(false);
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Error creating agreement';
      if (error.response?.data?.errors) {
        const validationErrors = error.response.data.errors
          .map(err => `${err.field}: ${err.message}`)
          .join(', ');
        toast.error(`Validation error: ${validationErrors}`);
      } else {
        toast.error(errorMessage);
      }
    }
  };

  const handleAgreementInputChange = (e) => {
    const { name, value } = e.target;
    setAgreementData(prev => ({
      ...prev,
      [name]: value
    }));
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
          Consultant Job Details
        </h2>
        <p className="mb-0">
          View all consultant job placements
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
          searchPlaceholder="Search by name, email, company, position, or creator..."
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
              <th>FULL NAME</th>
              <th>EMAIL</th>
              <th>COMPANY NAME</th>
              <th>POSITION</th>
              <th>DATE OF JOINING</th>
              <th>Support Name</th>
              {issuperAdmin ? <th>FEES</th> : <th>FEES STATUS</th>}
              {issuperAdmin && <th>ACTIONS</th>}
            </tr>
          </thead>
          <tbody>
            {currentItems.map((detail, index) => (
              <tr key={index} className="consultant-row">
                <td>{detail.fullName || '----'}</td>
                <td>{detail.email || '----'}</td>
                <td>{detail.companyName || '----'}</td>
                <td>{detail.position || '----'}</td>
                <td>{detail.dateOfJoining ? formatDate(detail.dateOfJoining) : '----'}</td>
                <td>{detail.createdBy?.name || '----'}</td>
                {issuperAdmin ? (
                  <td>
                    <div className="fees-info">
                      <span className="fee-item total-fee">
                        ${detail.feesInfo?.totalFees || '0'}
                      </span>
                      <span className="fee-item received-fee">
                        ${detail.feesInfo?.receivedFees || '0'}
                      </span>
                      <span className="fee-item remaining-fee">
                        ${detail.feesInfo?.remainingFees || '0'}
                      </span>
                    </div>
                  </td>
                ) : (
                  <td>
                    <div className="fees-status-badge">
                      <span className={`status-badge status-${detail.feesStatus || 'pending'}`}>
                        {detail.feesStatus || 'pending'}
                      </span>
                    </div>
                  </td>
                )}
                {issuperAdmin && (
                  <td>
                    <div className="d-flex gap-2">
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={() => handleFeesModalOpen(detail)}
                        className="fees-btn"
                      >
                        <BsCurrencyDollar /> Manage Fees
                      </Button>
                      <Button
                        variant={detail.isAgreement ? "outline-success" : "outline-secondary"}
                        size="sm"
                        onClick={() => handleAgreementModalOpen(detail)}
                      >
                        {detail.isAgreement ? '✓ Agreement' : 'Agreement'}
                      </Button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
            
            {currentItems.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center py-4">
                  <p className="text-muted mb-0">No job details found matching your criteria.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Fees Management Modal */}
      <Modal show={showFeesModal} onHide={() => setShowFeesModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Manage Fees Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleFeesSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Total Fees ($)</Form.Label>
              <Form.Control
                type="number"
                name="totalFees"
                value={feesData.totalFees}
                onChange={handleFeesInputChange}
                required
                min="0"
                step="0.01"
                placeholder="Enter total fees amount"
              />
              {selectedConsultant?.feesInfo?.totalFees && (
                <Form.Text className="text-muted">
                  Current total fees: ${selectedConsultant.feesInfo.totalFees}
                </Form.Text>
              )}
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>New Payment ($)</Form.Label>
              <Form.Control
                type="number"
                name="receivedFees"
                value={feesData.receivedFees}
                onChange={handleFeesInputChange}
                required={!selectedConsultant?.feesInfo?.totalFees || selectedConsultant?.feesInfo?.totalFees === feesData.totalFees}
                min="0"
                step="0.01"
                placeholder="Enter new payment amount"
                disabled={selectedConsultant?.feesInfo?.totalFees !== feesData.totalFees}
              />
              {selectedConsultant?.feesInfo?.receivedFees > 0 && (
                <Form.Text className="text-muted">
                  Previously received: ${selectedConsultant.feesInfo.receivedFees}
                </Form.Text>
              )}
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Remaining Fees ($)</Form.Label>
              <Form.Control
                type="number"
                value={feesData.remainingFees}
                disabled
                className="bg-light"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Status</Form.Label>
              <Form.Control
                type="text"
                value={feesData.feesStatus || selectedConsultant?.feesStatus || 'pending'}
                disabled
                className={`text-capitalize ${
                  feesData.feesStatus === 'completed' ? 'text-success' :
                  feesData.feesStatus === 'partial' ? 'text-warning' :
                  'text-danger'
                }`}
              />
            </Form.Group>

            <div className="d-flex justify-content-end gap-2">
              <Button variant="secondary" onClick={() => setShowFeesModal(false)}>
                Cancel
              </Button>
              <Button variant="primary" type="submit">
                {selectedConsultant?.feesInfo?.totalFees !== feesData.totalFees ? 'Update Total Fees' : 'Record Payment'}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      {/* Agreement Management Modal */}
      <Modal show={showAgreementModal} onHide={() => setShowAgreementModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Manage Agreement Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleAgreementSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Agreement Date</Form.Label>
              <Form.Control
                type="date"
                name="agreementDate"
                value={agreementData.agreementDate}
                onChange={handleAgreementInputChange}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>EMI Day of Month (1-31)</Form.Label>
              <Form.Control
                type="number"
                name="emiDate"
                value={agreementData.emiDate}
                onChange={handleAgreementInputChange}
                required
                min="1"
                max="31"
                placeholder="Enter EMI day (1-31)"
              />
              <Form.Text className="text-muted">
                Enter the day of month when EMI payment is due
              </Form.Text>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Emi Amount</Form.Label>
              <Form.Control
                type="number"
                name="emiAmount"
                value={agreementData.emiAmount}
                onChange={handleAgreementInputChange}
                required
                min="0"
                step="0.01"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Remark</Form.Label>
              <Form.Control
                type="text"
                name="remark"
                value={agreementData.remark}
                onChange={handleAgreementInputChange}
              />
            </Form.Group>

            <div className="d-flex justify-content-end gap-2">
              <Button variant="secondary" onClick={() => setShowAgreementModal(false)}>
                Cancel
              </Button>
              <Button variant="primary" type="submit">
                Update Agreement
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      {/* Pagination */}
      {filteredJobDetails.length > 0 && (
        <div className="pagination-container">
          <div className="d-flex justify-content-between align-items-center">
            <div className="pagination-info">
              Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredJobDetails.length)} of {filteredJobDetails.length} entries
            </div>
            
            <nav aria-label="Job details table navigation">
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

export default ConsultantJobDetails; 