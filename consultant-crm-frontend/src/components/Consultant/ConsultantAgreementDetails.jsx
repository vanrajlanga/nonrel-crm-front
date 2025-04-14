import React, { useState, useEffect } from 'react';
import Axios from '../../services/api';
import Toast from '../common/Toast';
import { BsChevronLeft, BsChevronRight } from 'react-icons/bs';
import Filter from '../Filter';
import './ConsultantJobDetails.css';
import { Button, Modal, Form } from 'react-bootstrap';

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

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showJobLostModal, setShowJobLostModal] = useState(false);
  const [selectedAgreement, setSelectedAgreement] = useState(null);
  const [paymentData, setPaymentData] = useState({
    month: '',
    amount: '',
    receivedDate: '',
    notes: ''
  });
  const [jobLostDate, setJobLostDate] = useState('');

  const loadAgreements = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await Axios.get('/agreement-details');
      const agreementsData = response.data;

      // Map the data to ensure consistent structure
      const formattedAgreements = agreementsData.map(agreement => ({
        id: agreement.id,
        consultantName: agreement.consultantName,
        email: agreement.email,
        phone: agreement.phone,
        companyName: agreement.ConsultantJobDetail?.companyName,
        jobTitle: agreement.ConsultantJobDetail?.jobType,
        jobStartDate: agreement.jobStartDate,
        totalSalary: agreement.totalSalary,
        totalServiceFee: agreement.totalServiceFee,
        monthlyPaymentAmount: agreement.monthlyPaymentAmount,
        emiDate: agreement.emiDate,
        remarks: agreement.remarks,
        nextDueDate: agreement.nextDueDate,
        totalPaidSoFar: agreement.totalPaidSoFar,
        remainingBalance: agreement.remainingBalance,
        jobLostDate: agreement.jobLostDate,
        paymentCompletionStatus: agreement.paymentCompletionStatus,
        consultantJobDetailsId: agreement.consultantJobDetailsId,
        createdBy: agreement.createdBy,
        // Include all month details
        ...Object.fromEntries(
          Array.from({ length: 8 }, (_, i) => i + 1).map(month => [
            `month${month}DueDate`, agreement[`month${month}DueDate`]
          ])
        ),
        ...Object.fromEntries(
          Array.from({ length: 8 }, (_, i) => i + 1).map(month => [
            `month${month}AmountReceived`, agreement[`month${month}AmountReceived`]
          ])
        ),
        ...Object.fromEntries(
          Array.from({ length: 8 }, (_, i) => i + 1).map(month => [
            `month${month}ReceivedDate`, agreement[`month${month}ReceivedDate`]
          ])
        ),
        ...Object.fromEntries(
          Array.from({ length: 8 }, (_, i) => i + 1).map(month => [
            `month${month}Status`, agreement[`month${month}Status`]
          ])
        ),
        ...Object.fromEntries(
          Array.from({ length: 8 }, (_, i) => i + 1).map(month => [
            `month${month}Notes`, agreement[`month${month}Notes`]
          ])
        )
      }));
      
      setAgreements(formattedAgreements);
      setFilteredAgreements(formattedAgreements);

      // Update filter configuration with unique companies and positions
      const uniqueCompanies = [...new Set(formattedAgreements.map(item => item.companyName))].filter(Boolean);
      const uniquePositions = [...new Set(formattedAgreements.map(item => item.jobTitle))].filter(Boolean);

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
        },
        {
          name: 'paymentCompletionStatus',
          label: 'Payment Status',
          type: 'select',
          defaultValue: 'all',
          options: [
            { value: 'all', label: 'All Statuses' },
            { value: 'in_progress', label: 'In Progress' },
            { value: 'completed', label: 'Completed' },
            { value: 'terminated', label: 'Terminated' }
          ]
        }
      ]);
    } catch (error) {
      console.error('Error fetching agreements:', error);
      const errorMessage = error.response?.data?.message || 'Failed to fetch agreements';
      setError(errorMessage);
      Toast.error('Failed to fetch agreements');
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

  const getStatusBadgeColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'paid':
        return 'success';
      case 'pending':
        return 'warning';
      case 'overdue':
        return 'danger';
      case 'in_progress':
        return 'info';
      case 'completed':
        return 'success';
      case 'terminated':
        return 'danger';
      default:
        return 'secondary';
    }
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

  const handlePaymentUpdate = async (e) => {
    e.preventDefault();
    try {
      // Validate amount
      const monthlyPaymentAmount = selectedAgreement.monthlyPaymentAmount;
      const receivedAmount = parseFloat(paymentData.amount);
      
      if (receivedAmount > monthlyPaymentAmount) {
        Toast.error(`Amount cannot exceed monthly payment amount of $${monthlyPaymentAmount}`);
        return;
      }

      // Validate received date
      const receivedDate = new Date(paymentData.receivedDate);
      const currentDate = new Date();
      currentDate.setHours(0, 0, 0, 0); // Reset time part for accurate date comparison
      
      if (receivedDate > currentDate) {
        Toast.error('Received date cannot be a future date');
        return;
      }

      const response = await Axios.put(`/agreement-details/${selectedAgreement.id}/payment`, {
        monthNumber: parseInt(paymentData.month),
        amountReceived: receivedAmount,
        receivedDate: paymentData.receivedDate,
        notes: paymentData.notes
      });

      if (response.data) {
        // Update the local state
        const updatedAgreements = agreements.map(agreement => {
          if (agreement.id === selectedAgreement.id) {
            return {
              ...agreement,
              [`month${paymentData.month}AmountReceived`]: receivedAmount,
              [`month${paymentData.month}ReceivedDate`]: paymentData.receivedDate,
              [`month${paymentData.month}Notes`]: paymentData.notes,
              [`month${paymentData.month}Status`]: 'paid',
              totalPaidSoFar: agreement.totalPaidSoFar + receivedAmount,
              remainingBalance: agreement.remainingBalance - receivedAmount
            };
          }
          return agreement;
        });

        setAgreements(updatedAgreements);
        setFilteredAgreements(updatedAgreements);
        setShowPaymentModal(false);
        Toast.success('Payment updated successfully');
      }
    } catch (error) {
      console.error('Error updating payment:', error);
      Toast.error(error.response?.data?.message || 'Error updating payment');
    }
  };

  const handleJobLostUpdate = async (e) => {
    e.preventDefault();
    try {
      const response = await Axios.put(`/agreement-details/${selectedAgreement.id}/job-lost`, {
        jobLostDate: jobLostDate
      });

      if (response.data) {
        // Update the local state
        const updatedAgreements = agreements.map(agreement => {
          if (agreement.id === selectedAgreement.id) {
            return {
              ...agreement,
              jobLostDate: jobLostDate,
              paymentCompletionStatus: 'terminated'
            };
          }
          return agreement;
        });

        setAgreements(updatedAgreements);
        setFilteredAgreements(updatedAgreements);
        setShowJobLostModal(false);
        Toast.success('Job lost date updated successfully');
      }
    } catch (error) {
      console.error('Error updating job lost date:', error);
      Toast.error(error.response?.data?.message || 'Error updating job lost date');
    }
  };

  return (
    <div className="container">
      <Toast.ToastContainer />
      <div className="consultant-header text-center">
        <h2 className="display-6 fw-bold mb-3">
            Placement Fee
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
              <th>Consultant Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Job Start Date</th>
              <th>Total Salary</th>
              <th>Total Service Fee (20%)</th>
              <th>Monthly Payment Amount</th>
              {Array.from({ length: 8 }, (_, i) => i + 1).map(month => (
                <React.Fragment key={month}>
                  <th>Month {month} Due Date</th>
                  <th>Month {month} Payment Received</th>
                  <th>Month {month} Payment Received Date</th>
                  <th>Month {month} Payment Status</th>
                  <th>Month {month} Notes</th>
                  <th>Month {month} Action</th>
                </React.Fragment>
              ))}
              <th>Next Due Date</th>
              <th>Total Paid So Far</th>
              <th>Remaining Balance</th>
              <th>Job Lost Date</th>
              <th>Payment Completion Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentItems.map((agreement, index) => (
              <tr key={index} className="consultant-row">
                <td>{agreement.consultantName || '----'}</td>
                <td>{agreement.email || '----'}</td>
                <td>{agreement.phone || '----'}</td>
                <td>{agreement.jobStartDate ? formatDate(agreement.jobStartDate) : '----'}</td>
                <td>${agreement.totalSalary?.toLocaleString() || '0'}</td>
                <td>${agreement.totalServiceFee?.toLocaleString() || '0'}</td>
                <td>${agreement.monthlyPaymentAmount?.toLocaleString() || '0'}</td>
                {Array.from({ length: 8 }, (_, i) => i + 1).map(month => (
                  <React.Fragment key={month}>
                    <td>{agreement[`month${month}DueDate`] ? formatDate(agreement[`month${month}DueDate`]) : '----'}</td>
                    <td>${agreement[`month${month}AmountReceived`]?.toLocaleString() || '0'}</td>
                    <td>{agreement[`month${month}ReceivedDate`] ? formatDate(agreement[`month${month}ReceivedDate`]) : '----'}</td>
                    <td>
                      <span className={`badge rounded-pill bg-${getStatusBadgeColor(agreement[`month${month}Status`])} p-2`}>
                        {agreement[`month${month}Status`]?.toUpperCase() || 'PENDING'}
                      </span>
                    </td>
                    <td>{agreement[`month${month}Notes`] || '----'}</td>
                    <td>
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={() => {
                          setSelectedAgreement(agreement);
                          setPaymentData({
                            ...paymentData,
                            month: month.toString()
                          });
                          setShowPaymentModal(true);
                        }}
                        disabled={agreement[`month${month}Status`] === 'paid'}
                        className="btn-sm"
                      >
                        Update Payment
                      </Button>
                    </td>
                  </React.Fragment>
                ))}
                <td>{agreement.nextDueDate ? formatDate(agreement.nextDueDate) : '----'}</td>
                <td>${agreement.totalPaidSoFar?.toLocaleString() || '0'}</td>
                <td>${agreement.remainingBalance?.toLocaleString() || '0'}</td>
                <td>{agreement.jobLostDate ? formatDate(agreement.jobLostDate) : '----'}</td>
                <td>
                  <span className={`badge rounded-pill bg-${getStatusBadgeColor(agreement.paymentCompletionStatus)} p-2`}>
                    {agreement.paymentCompletionStatus?.replace('_', ' ').toUpperCase() || '----'}
                  </span>
                </td>
                <td>
                  <div className="d-flex gap-2">
                    <Button
                      variant="outline-danger"
                      size="sm"
                      onClick={() => {
                        setSelectedAgreement(agreement);
                        setShowJobLostModal(true);
                      }}
                    >
                      Mark Job Lost
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            
            {currentItems.length === 0 && (
              <tr>
                <td colSpan={13} className="text-center py-4">
                  <p className="text-muted mb-0">No agreements found matching your criteria.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Payment Update Modal */}
      <Modal show={showPaymentModal} onHide={() => setShowPaymentModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Update Payment for Month {paymentData.month}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handlePaymentUpdate}>
            <Form.Group className="mb-3">
              <Form.Label>Amount Received</Form.Label>
              <Form.Control
                type="number"
                value={paymentData.amount}
                onChange={(e) => setPaymentData({ ...paymentData, amount: e.target.value })}
                required
                min="0"
                step="0.01"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Received Date</Form.Label>
              <Form.Control
                type="date"
                value={paymentData.receivedDate}
                onChange={(e) => setPaymentData({ ...paymentData, receivedDate: e.target.value })}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Notes</Form.Label>
              <Form.Control
                as="textarea"
                value={paymentData.notes}
                onChange={(e) => setPaymentData({ ...paymentData, notes: e.target.value })}
                placeholder="Enter payment notes (e.g., payment method, reference number)"
              />
            </Form.Group>
            <Button variant="primary" type="submit">
              Update Payment
            </Button>
          </Form>
        </Modal.Body>
      </Modal>

      {/* Job Lost Modal */}
      <Modal show={showJobLostModal} onHide={() => setShowJobLostModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Mark Job Lost</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleJobLostUpdate}>
            <Form.Group className="mb-3">
              <Form.Label>Job Lost Date</Form.Label>
              <Form.Control
                type="date"
                value={jobLostDate}
                onChange={(e) => setJobLostDate(e.target.value)}
                required
              />
            </Form.Group>
            <Button variant="danger" type="submit">
              Mark Job Lost
            </Button>
          </Form>
        </Modal.Body>
      </Modal>

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