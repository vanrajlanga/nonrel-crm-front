import React, { useState, useEffect, useRef } from 'react';
import Axios from '../../services/api';
import 'bootstrap/dist/css/bootstrap.min.css';
import { BsChevronLeft, BsChevronRight, BsEye, BsLayoutThreeColumns, BsBriefcase, BsPeople, BsFileText, BsCalendarEvent } from 'react-icons/bs';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './ConsultantDetails.css';
import { useNavigate } from 'react-router-dom';
import Filter from '../Filter';
import Modal from 'react-bootstrap/Modal';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import PendingResumes from './PendingResumes';

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
    dateOfOffer: '',
    jobType: ''
  });

  // Staff Assignment States
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [selectedConsultantForStaff, setSelectedConsultantForStaff] = useState(null);
  const [coordinators, setCoordinators] = useState([]);
  const [teamLeads, setTeamLeads] = useState([]);
  const [staffAssignmentData, setStaffAssignmentData] = useState({
    coordinatorId: '',
    coordinator2Id: '',
    teamLeadId: ''
  });

  // Constants for interview form
  const INTERVIEW_DURATIONS = ["30", "45", "60", "90"];
  const INTERVIEW_ROUNDS = ["1st", "2nd", "3rd", "HR", "Final"];
  const INTERVIEW_COUNTRIES = ["India", "Canada", "USA", "Germany", "Australia"];

  const [showInterviewModal, setShowInterviewModal] = useState(false);
  const [selectedConsultantForInterview, setSelectedConsultantForInterview] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [interviewFormData, setInterviewFormData] = useState({
    date: '',
    timeEST: '',
    duration: '60',
    country: 'USA',
    isVideo: false,
    interviewSupportName: '',
    round: '1st',
    mode: '',
    panelDetails: '',
    comments: '',
    otterLink: ''
  });

  useEffect(() => {
    const role = localStorage.getItem('role');
    if (role !== 'superAdmin' && role !== 'coordinator' && role !== 'teamLead' && role !== 'resumeBuilder') {
      toast.error('Access forbidden: insufficient privileges');
      navigate('/');
      return;
    }
    setUserRole(role);
    loadConsultants();
  }, [navigate]);

  const loadConsultants = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await Axios.get('/consultants');
      
      if (!res.data || res.data.length === 0) {
        setConsultants([]);
        setFilteredConsultants([]);
        setLoading(false);
        return;
      }

      // Get all possible field names from the first consultant
      const allFields = res.data.length > 0 
        ? Object.keys(res.data[0])
            .filter(key => 
              !key.startsWith('_') && 
              key !== 'id' && 
              key !== 'updatedAt' &&
              key.toLowerCase() !== 'assignedcoordinatorid' &&
              key.toLowerCase() !== 'assignedteamleadid' &&
              key.toLowerCase() !== 'assignmentdate')
        : [];

      // Transform the data to include all fields, even if null
      const consultantsWithFields = res.data.map(consultant => {
        const fields = allFields.map(fieldName => {
          let displayName = fieldName;
          let value = consultant[fieldName];

          if (fieldName === 'createdAt') {
            displayName = 'date';
          } else if (fieldName === 'paymentStatus') {
            displayName = 'payment status';
          } else if (fieldName === 'coordinators') {
            // Skip the original coordinators field as we'll add two new fields
            return null;
          }
          
          return {
            fieldName: displayName,
            value: value ?? null
          };
        }).filter(Boolean); // Remove null entries

        // Add coordinator1 and coordinator2 as separate fields
        if (consultant.coordinators && Array.isArray(consultant.coordinators)) {
          fields.push({
            fieldName: 'coordinator1',
            value: consultant.coordinators[0]?.username || '----'
          });

          fields.push({
            fieldName: 'coordinator2',
            value: consultant.coordinators[1]?.username || '----'
          });
        } else {
          fields.push(
            { fieldName: 'coordinator1', value: '----' },
            { fieldName: 'coordinator2', value: '----' }
          );
        }

        return {
          ...consultant,
          isJob: consultant.ConsultantJobDetail?.isJob || false,
          isPlaced: consultant.isPlaced || false,
          isHold: consultant.isHold || false,
          isActive: consultant.isActive || false,
          fields,
          allFields: [...allFields.filter(field => field !== 'coordinators'), 'coordinator1', 'coordinator2']
        };
      });

      setConsultants(consultantsWithFields);
      setFilteredConsultants(consultantsWithFields);

      // Set up filter configuration
      const uniqueTechnologies = [...new Set(consultantsWithFields.map(item => item.technology))].filter(Boolean);
      const uniqueVisaStatuses = [...new Set(consultantsWithFields.map(item => item.visaStatus))].filter(Boolean);
      const uniqueTeamLeads = [...new Set(consultantsWithFields.map(item => item.teamLead?.username))].filter(Boolean);

      setFilterConfig([
        {
          name: 'paymentStatus',
          label: 'Payment Status',
          type: 'select',
          defaultValue: 'all',
          options: [
            { value: 'all', label: 'All Statuses' },
            { value: 'verified', label: 'Verified' },
            { value: 'pending', label: 'Pending' }
          ]
        },
        {
          name: 'resumeStatus',
          label: 'Resume Status',
          type: 'select',
          defaultValue: 'all',
          options: [
            { value: 'all', label: 'All Statuses' },
            { value: 'accepted', label: 'Accepted' },
            { value: 'rejected', label: 'Rejected' },
            { value: 'not_built', label: 'Not Built' }
          ]
        },
        {
          name: 'technology',
          label: 'Technology',
          type: 'select',
          defaultValue: 'all',
          options: [
            { value: 'all', label: 'All Technologies' },
            ...uniqueTechnologies.map(tech => ({
              value: tech,
              label: tech
            }))
          ]
        },
        {
          name: 'visaStatus',
          label: 'Visa Status',
          type: 'select',
          defaultValue: 'all',
          options: [
            { value: 'all', label: 'All Statuses' },
            ...uniqueVisaStatuses.map(status => ({
              value: status,
              label: status
            }))
          ]
        },
        {
          name: 'registrationDate',
          label: 'Registration Date',
          type: 'dateRange',
          defaultValue: ''
        }
      ]);

      // Initialize visible columns
      const initialColumns = {};
      const preSelectedFields = [
        'fulllegalname',
        'technology',
        'phone',
        'email',
        'resumestatus',
        'date',
        'coordinator1',
        'coordinator2',
        'teamlead',
        'resumebuilder'
      ];
      
      consultantsWithFields[0].fields.forEach(field => {
        const fieldNameLower = field.fieldName.toLowerCase();
        initialColumns[field.fieldName] = preSelectedFields.includes(fieldNameLower);
      });
      
      setVisibleColumns(initialColumns);
    } catch (error) {
      console.error('Error fetching consultants:', error);
      if (error.response?.status === 404) {
        setConsultants([]);
        setFilteredConsultants([]);
      } else {
        const errorMessage = error.response?.data?.message || 'Failed to fetch consultants';
        setError(errorMessage);
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

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
    
    // Apply search filter
    if (typeof search === 'string' && search.trim() !== '') {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(consultant => 
        consultant.fulllegalname?.toLowerCase().includes(searchLower) ||
        consultant.email?.toLowerCase().includes(searchLower) ||
        consultant.technology?.toLowerCase().includes(searchLower) ||
        consultant.phone?.toLowerCase().includes(searchLower)
      );
    }
    
    // Apply filters
    if (Object.keys(filterOptions).length > 0) {
      // Filter by payment status
      if (filterOptions.paymentStatus && filterOptions.paymentStatus !== 'all') {
        const isVerified = filterOptions.paymentStatus === 'verified';
        filtered = filtered.filter(consultant => 
          consultant.paymentStatus === isVerified
        );
      }

      // Filter by resume status
      if (filterOptions.resumeStatus && filterOptions.resumeStatus !== 'all') {
        filtered = filtered.filter(consultant => 
          consultant.resumeStatus?.toLowerCase() === filterOptions.resumeStatus.toLowerCase()
        );
      }

      // Filter by technology
      if (filterOptions.technology && filterOptions.technology !== 'all') {
        filtered = filtered.filter(consultant => 
          consultant.technology === filterOptions.technology
        );
      }

      // Filter by visa status
      if (filterOptions.visaStatus && filterOptions.visaStatus !== 'all') {
        filtered = filtered.filter(consultant => 
          consultant.visaStatus === filterOptions.visaStatus
        );
      }
      
      // Filter by date range
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
    setCurrentPage(1);
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
        dateOfOffer: '',
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
    
    if (!jobFormData.companyId || !jobFormData.jobId || !jobFormData.dateOfOffer) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const selectedCompany = companies.find(company => company.id.toString() === jobFormData.companyId.toString());
      const selectedJob = selectedCompanyJobs.find(job => job.id.toString() === jobFormData.jobId.toString());

      if (!selectedCompany || !selectedJob) {
        toast.error('Please select valid company and job position');
        return;
      }

      const payload = {
        companyName: selectedCompany.companyName,
        jobType: selectedJob.jobTitle,
        dateOfOffer: jobFormData.dateOfOffer
      };

      console.log('Submitting job with payload:', payload);
      console.log('Selected consultant ID:', selectedConsultantId);

      const response = await Axios.post(`/consultants/${selectedConsultantId}/job-details`, payload);
      
      console.log('Job creation response:', response.data);
      
      if (response.data) {
        // Update the local state to reflect job creation using the response data
        const updatedConsultants = consultants.map(consultant => {
          if (consultant.id === selectedConsultantId) {
            const jobDetails = response.data.jobDetails;
            console.log('Updating consultant with job details:', {
              consultantId: consultant.id,
              currentIsJob: consultant.isJob,
              newJobDetails: jobDetails
            });
            
            const updatedConsultant = {
              ...consultant,
              isJob: true,
              isPlaced: jobDetails.consultant.isPlaced,
              isHold: jobDetails.consultant.isHold,
              isActive: jobDetails.consultant.isActive,
              companyName: jobDetails.companyName,
              position: jobDetails.position,
              dateOfOffer: jobDetails.dateOfOffer,
              feesStatus: jobDetails.feesStatus,
              isAgreement: jobDetails.isAgreement,
              feesInfo: jobDetails.feesInfo,
              jobDetails: {
                ...jobDetails,
                isJob: true
              }
            };
            
            console.log('Updated consultant state:', updatedConsultant);
            return updatedConsultant;
          }
          return consultant;
        });

        console.log('Updated consultants array:', updatedConsultants);
        setConsultants(updatedConsultants);
        setFilteredConsultants(updatedConsultants);
        toast.success(response.data.message);
        setShowJobModal(false);
        setJobFormData({
          companyId: '',
          jobId: '',
          dateOfOffer: '',
          jobType: ''
        });
      }
    } catch (error) {
      console.error('Error submitting job details:', error);
      console.error('Error response:', error.response?.data);
      toast.error(error.response?.data?.message || 'Failed to add job details');
    }
  };

  // Add this function to fetch coordinators and team leads
  const fetchStaffMembers = async () => {
    try {
      // Initialize as empty arrays
      setCoordinators([]);
      setTeamLeads([]);

      // Fetch users with coordinator role
      const coordinatorsResponse = await Axios.get('/users?role=coordinator');
      if (coordinatorsResponse.data?.users && Array.isArray(coordinatorsResponse.data.users)) {
        setCoordinators(coordinatorsResponse.data.users);
      } else {
        console.warn('Coordinators response is not in expected format:', coordinatorsResponse.data);
        setCoordinators([]);
      }

      // Fetch users with teamLead role (using camelCase as per backend)
      const teamLeadResponse = await Axios.get('/users?role=teamLead');
      if (teamLeadResponse.data?.users && Array.isArray(teamLeadResponse.data.users)) {
        setTeamLeads(teamLeadResponse.data.users);
      } else {
        console.warn('Team Lead response is not in expected format:', teamLeadResponse.data);
        setTeamLeads([]);
      }
    } catch (error) {
      console.error('Error fetching staff members:', error);
      if (error.response?.status === 400) {
        toast.error('Invalid role specified. Please check the role name.');
      } else {
        toast.error('Failed to load staff members');
      }
      // Ensure state is set to empty arrays on error
      setCoordinators([]);
      setTeamLeads([]);
    }
  };

  // Add staff assignment handler
  const handleStaffAssignment = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        coordinatorId: staffAssignmentData.coordinatorId,
        coordinator2Id: staffAssignmentData.coordinator2Id,
        teamLeadId: staffAssignmentData.teamLeadId
      };

      const response = await Axios.post(`/consultants/${selectedConsultantForStaff}/assign-staff`, payload);
      
      if (response.data) {
        toast.success('Staff assigned successfully');
        setShowStaffModal(false);
        loadConsultants(); // Refresh the consultant list
      }
    } catch (error) {
      console.error('Error assigning staff:', error);
      toast.error(error.response?.data?.message || 'Failed to assign staff');
    }
  };

  const handleStaffModalOpen = async (consultantId) => {
    setSelectedConsultantForStaff(consultantId);
    await fetchStaffMembers();
    setShowStaffModal(true);
  };

  // Update handleAssignResumeBuilder and handleDisassignResumeBuilder
  const handleAssignResumeBuilder = async (consultantId) => {
    try {
      const response = await Axios.post(`/consultants/${consultantId}/assign-resume-builder`);
      
      if (response.data) {
        // Update the specific consultant's state
        setConsultants(prevConsultants => 
          prevConsultants.map(consultant => 
            consultant.id === consultantId 
              ? { ...consultant, assignedResumeBuilder: true }
              : consultant
          )
        );
        setFilteredConsultants(prevFiltered => 
          prevFiltered.map(consultant => 
            consultant.id === consultantId 
              ? { ...consultant, assignedResumeBuilder: true }
              : consultant
          )
        );
        toast.success('Assigned as resume builder successfully');
      }
    } catch (error) {
      console.error('Error assigning resume builder:', error);
      toast.error(error.response?.data?.message || 'Failed to assign resume builder');
    }
  };

  const handleDisassignResumeBuilder = async (consultantId) => {
    try {
      const response = await Axios.post(`/consultants/${consultantId}/disassign-resume-builder`);
      
      if (response.data) {
        // Update the specific consultant's state
        setConsultants(prevConsultants => 
          prevConsultants.map(consultant => 
            consultant.id === consultantId 
              ? { ...consultant, assignedResumeBuilder: false }
              : consultant
          )
        );
        setFilteredConsultants(prevFiltered => 
          prevFiltered.map(consultant => 
            consultant.id === consultantId 
              ? { ...consultant, assignedResumeBuilder: false }
              : consultant
          )
        );
        toast.success('Disassigned as resume builder successfully');
      }
    } catch (error) {
      console.error('Error disassigning resume builder:', error);
      toast.error(error.response?.data?.message || 'Failed to disassign resume builder');
    }
  };

  // Update handleUploadResume function
  const handleUploadResume = async (consultantId) => {
    try {
      // Create a file input element
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.pdf'; // Only accept PDF files
      
      input.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Check if file is PDF
        if (file.type !== 'application/pdf') {
          toast.error('Please upload a PDF file');
          return;
        }

        // Create form data
        const formData = new FormData();
        formData.append('resume', file);

        // Upload the file
        const response = await Axios.post(`/consultants/${consultantId}/upload-resume`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });

        if (response.data) {
          toast.success('Resume uploaded successfully');
          loadConsultants(); // Refresh the consultant list
        }
      };

      // Trigger file selection
      input.click();
    } catch (error) {
      console.error('Error uploading resume:', error);
      toast.error(error.response?.data?.message || 'Failed to upload resume');
    }
  };

  // Add this function to handle placement status update
  const handlePlacementStatusUpdate = async (consultantId, newStatus) => {
    if (!consultantId) {
      toast.error('Invalid consultant ID');
      return;
    }

    try {
      const response = await Axios.put(`/consultants/${consultantId}/placement-status`, {
        placementStatus: newStatus
      });

      if (response.data) {
        // Update the local state with the response data
        const updatedConsultants = consultants.map(consultant => {
          if (consultant.id === consultantId) {
            return {
              ...consultant,
              isPlaced: response.data.jobDetails.consultant.isPlaced,
              isHold: response.data.jobDetails.consultant.isHold,
              isActive: response.data.jobDetails.consultant.isActive
            };
          }
          return consultant;
        });

        setConsultants(updatedConsultants);
        setFilteredConsultants(updatedConsultants);
        toast.success(response.data.message);
      }
    } catch (error) {
      console.error('Error updating placement status:', error);
      toast.error(error.response?.data?.message || 'Failed to update placement status');
    }
  };

  const calculateIST = (estTime) => {
    // Add 9 hours and 30 minutes to EST to get IST
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
    setInterviewFormData(prev => ({
      ...prev,
      timeEST: estTime,
      timeIST: istTime
    }));
  };

  const handleInterviewModalOpen = (consultant) => {
    setSelectedConsultantForInterview(consultant);
    setInterviewFormData({
      date: '',
      timeEST: '',
      duration: '60',
      country: 'USA',
      isVideo: false,
      interviewSupportName: '',
      round: '1st',
      mode: '',
      panelDetails: '',
      comments: '',
      otterLink: ''
    });
    setShowInterviewModal(true);
  };

  const handleInterviewSubmit = async (e) => {
    e.preventDefault();
    try {
      // Validate required fields
      if (!interviewFormData.date || !interviewFormData.timeEST || !interviewFormData.interviewSupportName || !interviewFormData.mode) {
        toast.error('Please fill in all required fields');
        return;
      }

      // Validate duration
      if (!INTERVIEW_DURATIONS.includes(interviewFormData.duration)) {
        toast.error('Invalid duration selected');
        return;
      }

      // Validate round
      if (!INTERVIEW_ROUNDS.includes(interviewFormData.round)) {
        toast.error('Invalid round selected');
        return;
      }

      // Validate country
      if (!INTERVIEW_COUNTRIES.includes(interviewFormData.country)) {
        toast.error('Invalid country selected');
        return;
      }

      const payload = {
        date: interviewFormData.date,
        timeEST: interviewFormData.timeEST + ':00',
        duration: interviewFormData.duration,
        country: interviewFormData.country,
        isVideo: interviewFormData.isVideo,
        interviewSupportName: interviewFormData.interviewSupportName,
        round: interviewFormData.round,
        mode: interviewFormData.mode,
        panelDetails: interviewFormData.panelDetails || '',
        comments: interviewFormData.comments || '',
        otterLink: interviewFormData.otterLink || ''
      };

      await Axios.post(`/consultants/${selectedConsultantForInterview.id}/interviews`, payload);
      toast.success('Interview scheduled successfully');
      setShowInterviewModal(false);
      
      // Reset form
      setInterviewFormData({
        date: '',
        timeEST: '',
        duration: '60',
        country: 'USA',
        isVideo: false,
        interviewSupportName: '',
        round: '1st',
        mode: '',
        panelDetails: '',
        comments: '',
        otterLink: ''
      });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to schedule interview');
    }
  };

  return (
    <div className="container">
      <ToastContainer />
      <div className="consultant-header text-center">
        <h2 className="display-6 fw-bold mb-3">
          Consultant Registration Fee
        </h2>
        <p className="mb-0">
          View and manage consultant information
        </p>
      </div>

      {userRole === 'superAdmin' && (
        <div className="mb-4">
          <PendingResumes />
        </div>
      )}

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
            searchPlaceholder="Search consultants..."
          />
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
        <span className="text-muted">Total: {filteredConsultants.length} consultants</span>
      </div>

      <div className="table-responsive">
        <table className="table consultant-table">
          <thead>
            <tr>
              <th className="header-cell">Actions</th>
              {consultants.some(consultant => consultant.ConsultantJobDetail?.isJob) && (
                <th className="header-cell">Placement Status</th>
              )}
              {consultants[0]?.fields
                .filter(field => visibleColumns[field.fieldName])
                .map((field, index) => (
                  <th key={index} className="header-cell">
                    {field.fieldName.toLowerCase() === 'coordinator1' ? 'COORDINATOR 1' :
                     field.fieldName.toLowerCase() === 'coordinator2' ? 'COORDINATOR 2' :
                     field.fieldName.toUpperCase()}
                  </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {currentConsultants.map((consultant) => {
              console.log('Rendering consultant:', {
                id: consultant.id,
                isJob: consultant.isJob,
                jobDetails: consultant.jobDetails,
                placementStatus: consultant.isPlaced ? 'placed' : consultant.isHold ? 'hold' : 'active'
              });
              
              return (
                <tr key={consultant.id} className="consultant-row">
                  <td className="data-cell">
                    <div className="action-buttons-Details">
                      {userRole === 'superAdmin' && (
                        <button
                          className="btn btn-view"
                          onClick={() => handleConsultantClick(consultant.id)}
                        >
                          <BsEye />
                        </button>
                      )}
                      {(userRole === 'superAdmin' || userRole === 'teamLead' || userRole === 'coordinator') && (
                        <>
                          <button
                            className="btn btn-job"
                            onClick={() => handleJobModalOpen(consultant.id)}
                            title="Add Job Details"
                          >
                            <BsBriefcase />
                          </button>
                          {consultant.ConsultantJobDetail?.isJob && (
                            <button
                              className="btn btn-interview"
                              onClick={() => handleInterviewModalOpen(consultant)}
                              title="Schedule Interview"
                            >
                              <BsCalendarEvent />
                            </button>
                          )}
                        </>
                      )}
                      {userRole === 'superAdmin' && (
                        <button
                          className="btn btn-staff"
                          onClick={() => handleStaffModalOpen(consultant.id)}
                          title="Assign Staff"
                        >
                          <BsPeople />
                        </button>
                      )}
                      {userRole === 'resumeBuilder' && (
                        <>
                          {consultant.assignedResumeBuilder ? (
                            <button
                              className="btn btn-disassign-me"
                              onClick={() => handleDisassignResumeBuilder(consultant.id)}
                              title="Disassign ME"
                            >
                              <BsFileText /> Disassign ME
                            </button>
                          ) : (
                            <button
                              className="btn btn-assign-me"
                              onClick={() => handleAssignResumeBuilder(consultant.id)}
                              title="Assign ME"
                            >
                              <BsFileText /> Assign ME
                            </button>
                          )}
                          {consultant.assignedResumeBuilder && (
                            <button
                              className="btn btn-upload-resume"
                              onClick={() => handleUploadResume(consultant.id)}
                              title="Upload Resume"
                            >
                              <BsFileText /> Upload
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </td>
                  {consultants.some(consultant => consultant.ConsultantJobDetail?.isJob) && (
                    <td className="data-cell">
                      {consultant.ConsultantJobDetail?.isJob ? (
                        (userRole === 'superAdmin' || userRole === 'teamLead' || userRole === 'coordinator') ? (
                          <div className="placement-status-dropdown">
                            <select
                              className={`form-select form-select-sm ${
                                consultant.isPlaced ? 'status-placed' :
                                consultant.isHold ? 'status-hold' :
                                'status-active'
                              }`}
                              value={
                                consultant.isPlaced ? 'placed' :
                                consultant.isHold ? 'hold' :
                                'active'
                              }
                              onChange={(e) => handlePlacementStatusUpdate(consultant.id, e.target.value)}
                            >
                              <option value="placed">Placed</option>
                              <option value="hold">Hold</option>
                              <option value="active">Active</option>
                            </select>
                          </div>
                        ) : (
                          <span className={`badge px-3 py-2 ${
                            consultant.isPlaced ? 'bg-success' : 
                            consultant.isHold ? 'bg-warning' : 
                            'bg-info'
                          }`}>
                            {consultant.isPlaced ? 'Placed' : 
                             consultant.isHold ? 'Hold' : 
                             'Active'}
                          </span>
                        )
                      ) : (
                        <span className="text-muted">No Job</span>
                      )}
                    </td>
                  )}
                  {consultant.fields
                    .filter(field => visibleColumns[field.fieldName])
                    .map((field, index) => (
                      <td key={index} className="data-cell">
                        {field.fieldName.toLowerCase() === 'coordinator' ? (
                          <div style={{ whiteSpace: 'pre-line' }}>
                            {field.value || '----'}
                          </div>
                        ) : field.fieldName === 'payment status' ? (
                          <span className={`badge ${field.value ? 'payment-verified' : 'payment-pending'}`}>
                            {field.value ? 'Verified' : 'Pending'}
                          </span>
                        ) : field.fieldName.toLowerCase() === 'resumestatus' ? (
                          <span className={`badge ${field.value?.toLowerCase() === 'accepted' ? 'resume-accepted' : 
                                            field.value?.toLowerCase() === 'rejected' ? 'resume-rejected' : 
                                            'resume-not-built'}`}>
                            {field.value?.replace('_', ' ')}
                          </span>
                        ) : field.fieldName.toLowerCase() === 'resumefile' ? (
                          field.value ? (
                            <button
                              className="btn btn-view-resume"
                              onClick={async () => {
                                try {
                                  const response = await Axios.get(`/consultants/${consultant.id}/resume`, {
                                    responseType: 'blob'
                                  });
                                  
                                  const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
                                  const newWindow = window.open(url, '_blank');
                                  if (!newWindow) {
                                    toast.error('Please allow popups to view the resume');
                                  }
                                } catch (error) {
                                  console.error('Error fetching resume:', error);
                                  if (error.response?.status === 403) {
                                    toast.error('You are not authorized to view this resume');
                                  } else if (error.response?.status === 404) {
                                    toast.error('No resume found for this consultant');
                                  } else {
                                    toast.error('Failed to fetch resume. Please try again.');
                                  }
                                }
                              }}
                            >
                              <BsEye /> View Resume
                            </button>
                          ) : (
                            <span className="text-muted">No resume uploaded</span>
                          )
                        ) : field.fieldName.toLowerCase() === 'documentverificationstatus' ? (
                          <span className={`badge ${field.value?.toLowerCase() === 'verified' ? 'bg-success' : 'bg-warning'}`}>
                            {field.value?.charAt(0).toUpperCase() + field.value?.slice(1).toLowerCase()}
                          </span>
                        ) : field.fieldName.toLowerCase().includes('document') && 
                            !field.fieldName.toLowerCase().includes('verificationstatus') ? (
                          field.value ? (
                            <button
                              className="btn btn-view-document"
                              onClick={async () => {
                                try {
                                  const documentNumber = field.fieldName.toLowerCase().replace('document', '');
                                  const response = await Axios.get(`/consultants/${consultant.id}/documents/document${documentNumber}`, {
                                    responseType: 'blob'
                                  });
                                  
                                  const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
                                  const newWindow = window.open(url, '_blank');
                                  if (!newWindow) {
                                    toast.error('Please allow popups to view the document');
                                  }
                                } catch (error) {
                                  console.error('Error fetching document:', error);
                                  if (error.response?.status === 403) {
                                    toast.error('You are not authorized to view this document');
                                  } else if (error.response?.status === 404) {
                                    toast.error('Document not found');
                                  } else {
                                    toast.error('Failed to fetch document. Please try again.');
                                  }
                                }
                              }}
                            >
                              <BsEye /> View
                            </button>
                          ) : (
                            <span className="text-muted">Not uploaded</span>
                          )
                        ) : typeof field.value === 'boolean' ? (
                          <span className={`badge ${field.value ? 'bg-success' : 'bg-secondary'}`}>
                            {field.value ? 'Yes' : 'No'}
                          </span>
                        ) : !field.value && field.value !== 0 ? (
                          <span className="text-muted">----</span>
                        ) : field.fieldName.toLowerCase().includes('date') ? (
                          formatDate(field.value)
                        ) : typeof field.value === 'object' && field.value !== null ? (
                          field.value.username || field.value.name || JSON.stringify(field.value)
                        ) : (
                          String(field.value)
                        )}
                      </td>
                  ))}
                </tr>
              );
            })}
            
            {currentConsultants.length === 0 && (
              <tr>
                <td colSpan={(consultants[0]?.fields?.filter(field => visibleColumns[field.fieldName])?.length || 0) + 1} className="text-center py-4">
                  <p className="no-data-message">No consultants found matching your criteria.</p>
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
              <Form.Label>Date of Offer</Form.Label>
              <Form.Control
                type="date"
                name="dateOfOffer"
                value={jobFormData.dateOfOffer}
                onChange={(e) => setJobFormData(prev => ({ ...prev, dateOfOffer: e.target.value }))}
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

      {/* Add Staff Assignment Modal */}
      <Modal show={showStaffModal} onHide={() => setShowStaffModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Assign Staff Members</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleStaffAssignment}>
            <Form.Group className="mb-3">
              <Form.Label>Primary Coordinator</Form.Label>
              <Form.Select
                value={staffAssignmentData.coordinatorId}
                onChange={(e) => setStaffAssignmentData(prev => ({
                  ...prev,
                  coordinatorId: e.target.value
                }))}
              >
                <option value="">Select Primary Coordinator</option>
                {coordinators.map(coordinator => (
                  <option key={coordinator.id} value={coordinator.id}>
                    {coordinator.username} ({coordinator.email})
                  </option>
                ))}
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Secondary Coordinator (Optional)</Form.Label>
              <Form.Select
                value={staffAssignmentData.coordinator2Id}
                onChange={(e) => setStaffAssignmentData(prev => ({
                  ...prev,
                  coordinator2Id: e.target.value
                }))}
              >
                <option value="">Select Secondary Coordinator</option>
                {coordinators
                  .filter(coord => coord.id !== staffAssignmentData.coordinatorId)
                  .map(coordinator => (
                    <option key={coordinator.id} value={coordinator.id}>
                      {coordinator.username} ({coordinator.email})
                    </option>
                ))}
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Team Lead</Form.Label>
              <Form.Select
                value={staffAssignmentData.teamLeadId}
                onChange={(e) => setStaffAssignmentData(prev => ({
                  ...prev,
                  teamLeadId: e.target.value
                }))}
              >
                <option value="">Select Team Lead</option>
                {teamLeads.map(teamLead => (
                  <option key={teamLead.id} value={teamLead.id}>
                    {teamLead.username} ({teamLead.email})
                  </option>
                ))}
              </Form.Select>
            </Form.Group>

            <div className="d-flex justify-content-end gap-2">
              <Button variant="secondary" onClick={() => setShowStaffModal(false)}>
                Cancel
              </Button>
              <Button variant="primary" type="submit">
                Assign Staff
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      {/* Interview Modal */}
      <Modal show={showInterviewModal} onHide={() => setShowInterviewModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Schedule Interview</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleInterviewSubmit}>
            <div className="row">
              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label>Date *</Form.Label>
                  <Form.Control
                    type="date"
                    value={interviewFormData.date}
                    onChange={(e) => setInterviewFormData(prev => ({ ...prev, date: e.target.value }))}
                    required
                  />
                </Form.Group>
              </div>
              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label>Time (EST) *</Form.Label>
                  <Form.Control
                    type="time"
                    value={interviewFormData.timeEST}
                    onChange={(e) => setInterviewFormData(prev => ({ ...prev, timeEST: e.target.value }))}
                    required
                  />
                </Form.Group>
              </div>
            </div>

            <div className="row">
              <div className="col-md-4">
                <Form.Group className="mb-3">
                  <Form.Label>Duration (minutes) *</Form.Label>
                  <Form.Select
                    value={interviewFormData.duration}
                    onChange={(e) => setInterviewFormData(prev => ({ ...prev, duration: e.target.value }))}
                    required
                  >
                    {INTERVIEW_DURATIONS.map(duration => (
                      <option key={duration} value={duration}>{duration}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </div>
              <div className="col-md-4">
                <Form.Group className="mb-3">
                  <Form.Label>Round *</Form.Label>
                  <Form.Select
                    value={interviewFormData.round}
                    onChange={(e) => setInterviewFormData(prev => ({ ...prev, round: e.target.value }))}
                    required
                  >
                    {INTERVIEW_ROUNDS.map(round => (
                      <option key={round} value={round}>{round}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </div>
              <div className="col-md-4">
                <Form.Group className="mb-3">
                  <Form.Label>Country *</Form.Label>
                  <Form.Select
                    value={interviewFormData.country}
                    onChange={(e) => setInterviewFormData(prev => ({ ...prev, country: e.target.value }))}
                    required
                  >
                    {INTERVIEW_COUNTRIES.map(country => (
                      <option key={country} value={country}>{country}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </div>
            </div>

            <Form.Group className="mb-3">
              <Form.Label>Mode *</Form.Label>
              <Form.Control
                type="text"
                value={interviewFormData.mode}
                onChange={(e) => setInterviewFormData(prev => ({ ...prev, mode: e.target.value }))}
                required
                placeholder="e.g., Google Meet, Zoom, etc."
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Interview Support Name *</Form.Label>
              <Form.Control
                type="text"
                value={interviewFormData.interviewSupportName}
                onChange={(e) => setInterviewFormData(prev => ({ ...prev, interviewSupportName: e.target.value }))}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Check
                type="checkbox"
                label="Video Interview"
                checked={interviewFormData.isVideo}
                onChange={(e) => setInterviewFormData(prev => ({ ...prev, isVideo: e.target.checked }))}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Panel Details</Form.Label>
              <Form.Control
                type="text"
                value={interviewFormData.panelDetails}
                onChange={(e) => setInterviewFormData(prev => ({ ...prev, panelDetails: e.target.value }))}
                placeholder="e.g., Technical Lead - Frontend Team"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Comments</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={interviewFormData.comments}
                onChange={(e) => setInterviewFormData(prev => ({ ...prev, comments: e.target.value }))}
                placeholder="Interview focus areas, special instructions, etc."
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Otter Link</Form.Label>
              <Form.Control
                type="text"
                value={interviewFormData.otterLink}
                onChange={(e) => setInterviewFormData(prev => ({ ...prev, otterLink: e.target.value }))}
                placeholder="https://otter.ai/meeting/xyz"
              />
            </Form.Group>

            <div className="d-flex justify-content-end gap-2">
              <Button variant="secondary" onClick={() => setShowInterviewModal(false)}>
                Cancel
              </Button>
              <Button variant="primary" type="submit">
                Schedule Interview
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default ConsultantDetails;
