import React, { useState, useEffect } from 'react';
import 'react-toastify/dist/ReactToastify.css';
import Axios from '../../services/api';
import { BsChevronDown,BsArrowLeft, BsChevronUp, BsEye, BsCheck, BsCurrencyDollar, BsChevronLeft, BsChevronRight } from 'react-icons/bs';
import { BiUndo } from 'react-icons/bi';
import Toast from '../common/Toast';
import { useNavigate } from 'react-router-dom';
import Modal from 'react-bootstrap/Modal';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import './ConsultantFeesDetails.css';

const ConsultantFeesDetails = () => {
  const [consultants, setConsultants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFeesModal, setShowFeesModal] = useState(false);
  const [showAgreementModal, setShowAgreementModal] = useState(false);
  const [selectedConsultant, setSelectedConsultant] = useState(null);
  const navigate = useNavigate();
  const [feesData, setFeesData] = useState({
    totalFees: '',
    receivedFees: '0',
    remainingFees: '',
    feesStatus: ''
  });
  const [agreementData, setAgreementData] = useState({
    emiDate: '',
    totalSalary: '',
    remarks: ''
  });
  const [expandedRow, setExpandedRow] = useState(null);
  const [issuperAdmin] = useState(localStorage.getItem('role') === 'superAdmin');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentData, setPaymentData] = useState({
    month: '',
    amount: '',
    receivedDate: '',
    notes: ''
  });

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSizeOptions] = useState([5, 10, 20, 50]);

  useEffect(() => {
    loadConsultants();
  }, [currentPage, itemsPerPage]);

  const loadConsultants = async () => {
    try {
      setLoading(true);
      const response = await Axios.get('/consultants', {
        params: {
          page: currentPage,
          limit: itemsPerPage
        }
      });
      
      if (!response.data) {
        throw new Error('No data received from server');
      }

      const consultantsData = Array.isArray(response.data) ? response.data : response.data.consultants || [];
      
      // Process all consultants, but only fetch additional details for placed ones
      const consultantsWithDetails = await Promise.all(
        consultantsData.map(async (consultant) => {
          let jobDetails = null;
          let agreementData = null;

          if (consultant.isPlaced) {
            try {
              const jobDetailsResponse = await Axios.get(`/consultants/${consultant.id}/job-details`);
              jobDetails = jobDetailsResponse.data;

              if (jobDetails.isAgreement) {
                try {
                  const agreementResponse = await Axios.get(`/consultants/${consultant.id}/agreement`);
                  agreementData = agreementResponse.data.agreement;
                } catch (agreementError) {
                  if (agreementError.response?.status !== 404) {
                    console.error('Error fetching agreement:', agreementError);
                  }
                }
              }
            } catch (error) {
              console.error(`Error fetching details for consultant ${consultant.id}:`, error);
            }
          }

          return {
            ...consultant,
            isAgreement: !!agreementData,
            agreement: agreementData,
            feesInfo: jobDetails?.feesInfo || {
              totalFees: 0,
              receivedFees: 0,
              remainingFees: 0
            },
            feesStatus: jobDetails?.feesStatus || 'pending',
            jobDetails: jobDetails
          };
        })
      );

      setConsultants(consultantsWithDetails);
      
      // Set pagination data
      if (response.data.totalItems) {
        setTotalItems(response.data.totalItems);
        setTotalPages(response.data.totalPages || Math.ceil(response.data.totalItems / itemsPerPage));
      } else {
        setTotalItems(consultantsWithDetails.length);
        setTotalPages(Math.ceil(consultantsWithDetails.length / itemsPerPage));
      }
    } catch (error) {
      console.error('Error loading consultants:', error);
      Toast.error(error.response?.data?.message || 'Failed to load consultants');
    } finally {
      setLoading(false);
    }
  };

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
        Toast.error('New payment amount must be greater than 0');
        return;
      }

      if (previousReceived + newPayment > totalFees) {
        Toast.error('Total received amount cannot exceed total fees');
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

      const response = await Axios.put(`/consultants/${selectedConsultant.id}/job-details`, updatedData);

      if (response.data) {
        const updatedConsultant = response.data.jobDetails;
        
        const updateConsultantState = (prevDetails) =>
          prevDetails.map(consultant =>
            consultant.id === selectedConsultant.id
              ? {
                  ...consultant,
                  feesInfo: updatedConsultant.feesInfo,
                  feesStatus: newStatus
                }
              : consultant
          );

        setConsultants(updateConsultantState);
        setSelectedConsultant(prev => ({
          ...prev,
          feesInfo: updatedConsultant.feesInfo,
          feesStatus: newStatus
        }));

        Toast.success(isTotalFeesUpdated ? 'Total fees updated successfully' : 'Payment recorded successfully');
        setShowFeesModal(false);
      }
    } catch (error) {
      Toast.error(error.response?.data?.message || 'Error updating fees');
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
    console.log('Opening agreement modal for consultant:', consultant);
    setSelectedConsultant(consultant);
    try {
      setAgreementData({
        emiDate: '',
        totalSalary: '',
        remarks: ''
      });
    } catch (error) {
      console.error('Error in handleAgreementModalOpen:', error);
      Toast.error('Error initializing agreement form');
    }
    setShowAgreementModal(true);
  };

  const handleAgreementSubmit = async (e) => {
    e.preventDefault();
    try {
      if (!selectedConsultant) {
        throw new Error('No consultant selected');
      }

      if (!agreementData.emiDate || !agreementData.totalSalary) {
        Toast.error('EMI date and Total Salary are required');
        return;
      }

      const emiDateNum = parseInt(agreementData.emiDate, 10);
      if (isNaN(emiDateNum) || emiDateNum < 1 || emiDateNum > 31) {
        Toast.error('EMI date must be between 1 and 31');
        return;
      }

      const totalSalary = parseFloat(agreementData.totalSalary);
      if (isNaN(totalSalary) || totalSalary <= 0) {
        Toast.error('Total salary must be greater than 0');
        return;
      }

      const payload = {
        emiDate: emiDateNum,
        totalSalary: totalSalary,
        remarks: agreementData.remarks || ''
      };

      const response = await Axios.post(`/consultants/${selectedConsultant.id}/agreement`, payload);

      if (response.data) {
        const updatedConsultantState = (prevDetails) =>
          prevDetails.map(consultant =>
            consultant.id === selectedConsultant.id
              ? {
                  ...consultant,
                  isAgreement: true
                }
              : consultant
          );

        setConsultants(updatedConsultantState);
        Toast.success('Agreement created successfully');
        setShowAgreementModal(false);
      }
    } catch (error) {
      console.error('Error creating agreement:', error);
      
      if (error.response?.status === 400 && 
          error.response?.data?.message?.includes('An agreement already exists')) {
        const updatedConsultantState = (prevDetails) =>
          prevDetails.map(consultant =>
            consultant.id === selectedConsultant.id
              ? {
                  ...consultant,
                  isAgreement: true
                }
              : consultant
          );

        setConsultants(updatedConsultantState);
        Toast.error(error.response.data.message);
      } else {
        const errorMessage = error.response?.data?.message || 'Error creating agreement';
        if (error.response?.data?.errors) {
          const validationErrors = error.response.data.errors
            .map(err => `${err.field}: ${err.message}`)
            .join(', ');
          Toast.error(`Validation error: ${validationErrors}`);
        } else {
          Toast.error(errorMessage);
        }
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

  const handleCancelAgreement = async (consultant) => {
    try {
      const response = await Axios.delete(`/consultants/${consultant.id}/agreement`);
      if (response.data) {
        const updatedConsultantState = (prevDetails) =>
          prevDetails.map(c =>
            c.id === consultant.id
              ? {
                  ...c,
                  isAgreement: false
                }
              : c
          );

        setConsultants(updatedConsultantState);
        Toast.success('Agreement cancelled successfully');
      }
    } catch (error) {
      console.error('Error cancelling agreement:', error);
      Toast.error(error.response?.data?.message || 'Error cancelling agreement');
    }
  };

  const handleRowClick = (consultantId) => {
    setExpandedRow(expandedRow === consultantId ? null : consultantId);
  };

  const handleVerifyPayment = async (consultantId) => {
    try {
      const response = await Axios.post(`/consultants/${consultantId}/verify-payment`, {
        verifybtn: true,
      });

      if (response.data) {
        setConsultants(prevConsultants => 
          prevConsultants.map(consultant => 
            consultant.id === consultantId 
              ? { ...consultant, paymentStatus: true }
              : consultant
          )
        );
        Toast.success("Payment verified successfully");
      }
    } catch (err) {
      console.error("Error verifying payment:", err);
      Toast.error(err.response?.data?.message || "Failed to verify payment");
    }
  };

  const handleUndoPayment = async (consultantId) => {
    try {
      const response = await Axios.post(`/consultants/${consultantId}/verify-payment`, {
        undoPaymentVerification: true,
      });

      if (response.data) {
        setConsultants(prevConsultants => 
          prevConsultants.map(consultant => 
            consultant.id === consultantId 
              ? { ...consultant, paymentStatus: false }
              : consultant
          )
        );
        Toast.success("Payment verification undone successfully");
      }
    } catch (err) {
      console.error("Error undoing payment verification:", err);
      Toast.error(err.response?.data?.message || "Failed to undo payment verification");
    }
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

  const handlePaymentUpdate = async (e) => {
    e.preventDefault();
    try {
      // Validate amount
      const monthlyPaymentAmount = selectedConsultant.agreement.monthlyPaymentAmount;
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

      // Use the agreement ID instead of consultant ID
      const agreementId = selectedConsultant.agreement.id;
      
      const response = await Axios.put(`/agreement-details/${agreementId}/payment`, {
        monthNumber: parseInt(paymentData.month),
        amountReceived: receivedAmount,
        receivedDate: paymentData.receivedDate,
        notes: paymentData.notes
      });

      if (response.data) {
        // Update the local state
        const updatedConsultants = consultants.map(consultant => {
          if (consultant.id === selectedConsultant.id) {
            return {
              ...consultant,
              agreement: {
                ...consultant.agreement,
                [`month${paymentData.month}AmountReceived`]: receivedAmount,
                [`month${paymentData.month}ReceivedDate`]: paymentData.receivedDate,
                [`month${paymentData.month}Notes`]: paymentData.notes,
                [`month${paymentData.month}Status`]: 'paid',
                totalPaidSoFar: (consultant.agreement.totalPaidSoFar || 0) + receivedAmount,
                remainingBalance: consultant.agreement.remainingBalance - receivedAmount
              }
            };
          }
          return consultant;
        });

        setConsultants(updatedConsultants);
        setShowPaymentModal(false);
        Toast.success('Payment updated successfully');
        
        // Reset payment data
        setPaymentData({
          month: '',
          amount: '',
          receivedDate: '',
          notes: ''
        });
      }
    } catch (error) {
      console.error('Error updating payment:', error);
      Toast.error(error.response?.data?.message || 'Error updating payment');
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

  const handleResetFees = async () => {
    try {
      if (!selectedConsultant) return;
      
      const response = await Axios.post(`/consultants/${selectedConsultant.id}/reset-fees`);
      
      if (response.data) {
        const updatedConsultants = consultants.map(consultant => {
          if (consultant.id === selectedConsultant.id) {
            return {
              ...consultant,
              feesInfo: {
                totalFees: 0,
                receivedFees: 0,
                remainingFees: 0
              },
              feesStatus: 'pending'
            };
          }
          return consultant;
        });

        setConsultants(updatedConsultants);
        setFeesData({
          totalFees: '0',
          receivedFees: '0',
          remainingFees: '0',
          feesStatus: 'pending'
        });
        Toast.success('Fees reset successfully');
        setShowFeesModal(false);
      }
    } catch (error) {
      Toast.error(error.response?.data?.message || 'Error resetting fees');
    }
  };

  const handleViewProof = (proofPath) => {
    if (!proofPath) {
      Toast.error('No proof file available');
      return;
    }

    try {
      const baseUrl = Axios.defaults.baseURL?.replace("/api", "") || "";
      const fullImageUrl = `${baseUrl}/uploads/emi-proofs/${proofPath}`;
      window.open(fullImageUrl, "_blank");
    } catch (error) {
      console.error('Error viewing proof:', error);
      Toast.error('Failed to view proof file');
    }
  };

  // Pagination handlers
  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  const handleItemsPerPageChange = (e) => {
    const newLimit = parseInt(e.target.value);
    setItemsPerPage(newLimit);
    setCurrentPage(1); // Reset to first page when changing items per page
  };

  // Get current page's consultants
  const indexOfLastConsultant = currentPage * itemsPerPage;
  const indexOfFirstConsultant = indexOfLastConsultant - itemsPerPage;
  const currentConsultants = consultants.slice(indexOfFirstConsultant, indexOfLastConsultant);

  // Generate page numbers array for pagination
  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }

    return pageNumbers;
  };

  if (loading) {
    return (
      <div className="text-center p-5">
        <div className="spinner-border loading-spinner" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mt-4">
      <Toast.ToastContainer />
      <button 
        className="user-mgmt-back-btn"
        onClick={() => navigate('/consultants')}
      >
        <BsArrowLeft /> Back to Consultants
      </button>
      
      <div className="user-mgmt-header" style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <div className="user-mgmt-header-actions" style={{ justifyContent: 'center' }}>
          <h2 className="user-mgmt-title">Consultant Fees Management</h2>
        </div>
      </div>

      <div className="d-flex justify-content-between align-items-center mb-3">
        <div className="items-per-page-selector">
          <label>Show:</label>
          <select 
            className="form-select form-select-sm"
            value={itemsPerPage}
            onChange={handleItemsPerPageChange}
          >
            {pageSizeOptions.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
          <span>entries</span>
        </div>
        <span className="text-muted">Total: {totalItems} consultants</span>
      </div>

      <div className="table-responsive">
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Phone Number</th>
            </tr>
          </thead>
          <tbody>
            {currentConsultants.map(consultant => (
              <React.Fragment key={consultant.id}>
                <tr 
                  className={`consultant-row ${expandedRow === consultant.id ? 'expanded' : ''}`}
                  onClick={() => handleRowClick(consultant.id)}
                >
                  <td className="name-cell">
                    <div className="d-flex align-items-center justify-content-between">
                      <span>{consultant.fulllegalname || '----'}</span>
                      <span className="expand-icon">
                        {expandedRow === consultant.id ? <BsChevronUp /> : <BsChevronDown />}
                      </span>
                    </div>
                  </td>
                  <td>{consultant.email || '----'}</td>
                  <td>{consultant.phone || '----'}</td>
                </tr>
                {expandedRow === consultant.id && (
                  <tr className="expanded-content">
                    <td colSpan="3">
                      <div className="fees-details">
                        <div className="fees-row">
                          <div className="d-flex justify-content-between align-items-center mb-3">
                            <h2>Registration Fees</h2>
                            <div className="d-flex gap-2 align-items-center">
                              <div className="detail-item">
                                <ProofImage
                                  consultantId={consultant.id}
                                  title="Registration Proof"
                                />
                              </div>
                              {!consultant.paymentStatus ? (
                                <button
                                  className="btn btn-success"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleVerifyPayment(consultant.id);
                                  }}
                                >
                                  <BsCheck /> Verify Payment
                                </button>
                              ) : (
                                <button
                                  className="btn btn-warning"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleUndoPayment(consultant.id);
                                  }}
                                >
                                  <BiUndo /> Undo Payment
                                </button>
                              )}
                            </div>
                          </div>
                          <div className="payment-status">
                            <strong>Payment Status: </strong>
                            <span className={`badge ${consultant.paymentStatus ? 'bg-success' : 'bg-warning'}`}>
                              {consultant.paymentStatus ? 'Verified' : 'Pending'}
                            </span>
                          </div>
                        </div>
                        {consultant.isPlaced && (
                          <div className="fees-row">
                            <div className="d-flex justify-content-between align-items-center mb-3">
                              <h2>Consultant Fees</h2>
                              {issuperAdmin && (
                                <div className="d-flex gap-2">
                                  <div className="fees-info">
                                    <span className="fee-item total-fee">
                                      ${consultant.feesInfo?.totalFees || '0'}
                                    </span>
                                    <span className="fee-item received-fee">
                                      ${consultant.feesInfo?.receivedFees || '0'}
                                    </span>
                                    <span className="fee-item remaining-fee">
                                      ${consultant.feesInfo?.remainingFees || '0'}
                                    </span>
                                  </div>
                                  <Button
                                    variant="outline-primary"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleFeesModalOpen(consultant);
                                    }}
                                    className="fees-btn"
                                  >
                                    <BsCurrencyDollar /> Manage Fees
                                  </Button>
                                  {consultant.isAgreement ? (
                                    <Button
                                      variant="outline-danger"
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleCancelAgreement(consultant);
                                      }}
                                    >
                                      Cancel Agreement
                                    </Button>
                                  ) : (
                                    <Button
                                      variant="outline-secondary"
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleAgreementModalOpen(consultant);
                                      }}
                                    >
                                      Agreement
                                    </Button>
                                  )}
                                </div>
                              )}
                            </div>
                            {!issuperAdmin && (
                              <div className="fees-status-badge">
                                <span className={`status-badge status-${consultant.feesStatus || 'pending'}`}>
                                  {consultant.feesStatus || 'pending'}
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                        {consultant.isPlaced && consultant.isAgreement && (
                          <div className="fees-row">
                            <div className="d-flex justify-content-between align-items-center mb-3">
                              <h2>Agreement Fees</h2>
                            </div>
                            {consultant.agreement ? (
                              <div className="agreement-details">
                                <div className="row mb-3">
                                  <div className="col-md-4">
                                    <strong>Total Service Fee (20%):</strong>
                                    <span className="ms-2">
                                      ${Number(consultant.agreement.totalServiceFee || 0).toLocaleString()}
                                    </span>
                                  </div>
                                  <div className="col-md-4">
                                    <strong>Monthly Payment:</strong>
                                    <span className="ms-2">
                                      ${Number(consultant.agreement.monthlyPaymentAmount || 0).toLocaleString()}
                                    </span>
                                  </div>
                                  <div className="col-md-4">
                                    <strong>Status:</strong>
                                    <span className={`badge ms-2 bg-${getStatusBadgeColor(consultant.agreement.paymentCompletionStatus)}`}>
                                      {(consultant.agreement.paymentCompletionStatus || 'pending').replace('_', ' ').toUpperCase()}
                                    </span>
                                  </div>
                                </div>
                                <div className="table-responsive">
                                  <table className="table table-bordered">
                                    <thead>
                                      <tr>
                                        <th>Month</th>
                                        <th>Due Date</th>
                                        <th>Amount Received</th>
                                        <th>Received Date</th>
                                        <th>Status</th>
                                        <th>Notes</th>
                                        <th>Proof</th>
                                        <th>Action</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {Array.from({ length: 8 }, (_, i) => i + 1).map(month => (
                                        <tr key={month}>
                                          <td>Month {month}</td>
                                          <td>
                                            {consultant.agreement[`month${month}DueDate`] 
                                              ? formatDate(consultant.agreement[`month${month}DueDate`]) 
                                              : '----'}
                                          </td>
                                          <td>
                                            ${Number(consultant.agreement[`month${month}AmountReceived`] || 0).toLocaleString()}
                                          </td>
                                          <td>
                                            {consultant.agreement[`month${month}ReceivedDate`]
                                              ? formatDate(consultant.agreement[`month${month}ReceivedDate`])
                                              : '----'}
                                          </td>
                                          <td>
                                            <span className={`badge bg-${getStatusBadgeColor(consultant.agreement[`month${month}Status`])}`}>
                                              {(consultant.agreement[`month${month}Status`] || 'pending').toUpperCase()}
                                            </span>
                                          </td>
                                          <td>{consultant.agreement[`month${month}Notes`] || '----'}</td>
                                          <td>
                                            {consultant.agreement[`month${month}Proof`] ? (
                                              <Button
                                                variant="outline-info"
                                                size="sm"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  handleViewProof(consultant.agreement[`month${month}Proof`]);
                                                }}
                                              >
                                                <BsEye /> View Proof
                                              </Button>
                                            ) : (
                                              '----'
                                            )}
                                          </td>
                                          <td>
                                            <Button
                                              variant="outline-primary"
                                              size="sm"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                setSelectedConsultant(consultant);
                                                setPaymentData({
                                                  ...paymentData,
                                                  month: month.toString()
                                                });
                                                setShowPaymentModal(true);
                                              }}
                                              disabled={consultant.agreement[`month${month}Status`] === 'paid'}
                                            >
                                              Update Payment
                                            </Button>
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                                <div className="row mt-3">
                                  <div className="col-md-4">
                                    <strong>Total Paid So Far:</strong>
                                    <span className="ms-2">
                                      ${Number(consultant.agreement.totalPaidSoFar || 0).toLocaleString()}
                                    </span>
                                  </div>
                                  <div className="col-md-4">
                                    <strong>Remaining Balance:</strong>
                                    <span className="ms-2">
                                      ${Number(consultant.agreement.remainingBalance || 0).toLocaleString()}
                                    </span>
                                  </div>
                                  <div className="col-md-4">
                                    <strong>Next Due Date:</strong>
                                    <span className="ms-2">
                                      {consultant.agreement.nextDueDate 
                                        ? formatDate(consultant.agreement.nextDueDate)
                                        : '----'}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="text-center text-muted">
                                <p>No agreement details available</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {consultants.length > 0 && (
        <div className="pagination-container">
          <div className="d-flex justify-content-between align-items-center">
            <div className="pagination-info">
              Showing {indexOfFirstConsultant + 1} to {Math.min(indexOfLastConsultant, totalItems)} of {totalItems} entries
            </div>
            
            <nav aria-label="Consultant fees table navigation">
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
                
                {getPageNumbers().map((pageNumber) => (
                  <li 
                    key={pageNumber}
                    className={`page-item ${pageNumber === currentPage ? 'active' : ''}`}
                  >
                    <button 
                      className="page-link"
                      onClick={() => handlePageChange(pageNumber)}
                    >
                      {pageNumber}
                    </button>
                  </li>
                ))}
                
                <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                  <button 
                    className="page-link" 
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    <BsChevronRight />
                  </button>
                </li>
              </ul>
            </nav>
          </div>
        </div>
      )}

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
              <Button variant="danger" onClick={handleResetFees}>
                Reset Fees
              </Button>
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
          <Modal.Title>Create Agreement Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleAgreementSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>EMI Day of Month (1-31) <span className="text-danger">*</span></Form.Label>
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
              <Form.Label>Total Salary <span className="text-danger">*</span></Form.Label>
              <Form.Control
                type="number"
                name="totalSalary"
                value={agreementData.totalSalary}
                onChange={handleAgreementInputChange}
                required
                min="0"
                step="0.01"
                placeholder="Enter total salary amount"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Remarks</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="remarks"
                value={agreementData.remarks}
                onChange={handleAgreementInputChange}
                placeholder="Enter any additional notes"
              />
            </Form.Group>

            <div className="d-flex justify-content-end gap-2">
              <Button variant="secondary" onClick={() => setShowAgreementModal(false)}>
                Cancel
              </Button>
              <Button 
                variant="primary" 
                type="submit"
                disabled={!agreementData.emiDate || !agreementData.totalSalary}
              >
                Create Agreement
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

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
    </div>
  );
};

const ProofImage = ({ consultantId }) => {
  const handleViewProof = async () => {
    try {
      const response = await Axios.get(`/consultants/${consultantId}`);
      if (response.data && response.data.registrationProof) {
        const baseUrl = Axios.defaults.baseURL?.replace("/api", "") || "";
        const fullImageUrl = `${baseUrl}${response.data.registrationProof}`;
        window.open(fullImageUrl, "_blank");
      } else {
        Toast.error('No registration proof available');
      }
    } catch (error) {
      console.error('Error fetching proof:', error);
      Toast.error('Failed to fetch registration proof');
    }
  };

  return (
    <div className="proof-image-container">
      <button
        className="btn btn-view-proof"
        onClick={(e) => {
          e.stopPropagation();
          handleViewProof();
        }}
        title="View Proof"
      >
        <BsEye /> View Proof
      </button>
    </div>
  );
};

export default ConsultantFeesDetails; 