// src/components/ConsultantForm.js
import React, { useState } from 'react';
import Axios from '../services/api';
import './ConsultantForm.css';
import imageCompression from 'browser-image-compression';

const ConsultantForm = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    registrationFee: '',
    registrationDate: '',
    registrationProof: '',
    onboardingFee: '',
    onboardingDate: '',
    onboardingProof: '',
    consultantSalary: '',
    dateOfJoining: '',
    contractDuration: '',
    monthlyFee: '',
    monthlyStartDate: '',
    monthlyDueDay: '',
    extraServices: [],
  });

  // For simplicity, we'll only handle a single extra service in this example.
  const [extraService, setExtraService] = useState({
    description: '',
    fee: '',
    paymentDate: '',
    proof: '',
  });

  const [notification, setNotification] = useState({ message: '', type: '' });

  const [errors, setErrors] = useState({
    name: '',
    email: '',
    phone: '',
    registrationFee: '',
    registrationDate: '',
    consultantSalary: '',
    monthlyFee: '',
  });

  const steps = [
    "Personal Information",
    "Registration Details",
    "Onboarding Details",
    "Contract Details",
    "Monthly Payment Details",
    "Extra Services"
  ];

  const nextStep = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const renderStepIndicator = () => (
    <div className="step-indicator">
      {steps.map((step, index) => (
        <div 
          key={index} 
          className={`step ${currentStep === index + 1 ? 'active' : ''} 
                           ${currentStep > index + 1 ? 'completed' : ''}`}
        >
          <div className="step-number">{index + 1}</div>
          <div className="step-title">{step}</div>
        </div>
      ))}
    </div>
  );

  const validateField = (name, value) => {
    switch (name) {
      case 'name':
        return value.length < 2 ? 'Name must be at least 2 characters long' : '';
      
      case 'email':
        return !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) 
          ? 'Please enter a valid email address'
          : '';
      
      case 'phone':
        return value && !/^\+?[\d\s-]{10,}$/.test(value)
          ? 'Please enter a valid phone number'
          : '';
      
      case 'registrationFee':
      case 'consultantSalary':
      case 'monthlyFee':
        return value && (isNaN(value) || Number(value) < 0)
          ? 'Please enter a valid amount'
          : '';
      
      case 'registrationDate':
      case 'dateOfJoining':
      case 'monthlyStartDate':
        return value && new Date(value) > new Date()
          ? 'Date cannot be in the future'
          : '';
      
      default:
        return '';
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Validate the field
    const error = validateField(name, value);
    setErrors(prev => ({
      ...prev,
      [name]: error
    }));

    // Update form data
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleExtraChange = (e) => {
    const { name, value } = e.target;
    setExtraService((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const convertToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const fileReader = new FileReader();
      fileReader.readAsDataURL(file);
      fileReader.onload = () => {
        resolve(fileReader.result);
      };
      fileReader.onerror = (error) => {
        reject(error);
      };
    });
  };

  const compressImage = async (file) => {
    const options = {
      maxSizeMB: 0.5, // Reduce to 500KB
      maxWidthOrHeight: 800, // Reduce dimensions
      useWebWorker: true,
      initialQuality: 0.7 // Reduce initial quality
    };
    
    try {
      const compressedFile = await imageCompression(file, options);
      // Check if file is still too large
      if (compressedFile.size > 1024 * 1024) { // If still larger than 1MB
        throw new Error('File is too large even after compression');
      }
      return compressedFile;
    } catch (error) {
      console.error('Error compressing image:', error);
      throw error;
    }
  };

  const handleFileChange = async (e) => {
    try {
      const { name } = e.target;
      const file = e.target.files[0];
      
      if (!file) {
        setNotification({ 
          message: 'Please select a file', 
          type: 'error' 
        });
        return;
      }

      // Check initial file size
      if (file.size > 5 * 1024 * 1024) { // 5MB
        setNotification({ 
          message: 'File is too large. Please select a file smaller than 5MB', 
          type: 'error' 
        });
        return;
      }

      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        setNotification({ 
          message: 'Invalid file type. Only JPEG, PNG, GIF images and PDF files are allowed', 
          type: 'error' 
        });
        return;
      }

      let base64;
      if (file.type === 'application/pdf') {
        // For PDFs, check if size is less than 1MB
        if (file.size > 1024 * 1024) {
          setNotification({ 
            message: 'PDF file size should be less than 1MB', 
            type: 'error' 
          });
          return;
        }
        base64 = await convertToBase64(file);
      } else {
        // Process images with compression
        const processedFile = await compressImage(file);
        base64 = await convertToBase64(processedFile);
      }

      // Final size check of base64 string
      if (base64.length > 1024 * 1024) { // If larger than 1MB
        throw new Error('Processed file is too large');
      }

      setFormData(prev => ({
        ...prev,
        [name]: base64
      }));
      
      setNotification({ 
        message: 'File processed successfully', 
        type: 'success' 
      });
    } catch (error) {
      console.error('Error processing file:', error);
      setNotification({ 
        message: error.message || 'Error processing file. Please select a smaller file.', 
        type: 'error' 
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    let isValid = true;

    // Required fields by step
    const requiredFields = {
      1: ['name', 'email', 'phone'],
      2: ['registrationFee', 'registrationDate'],
      3: ['onboardingFee', 'onboardingDate'],
      4: ['consultantSalary', 'dateOfJoining', 'contractDuration'],
      5: ['monthlyFee', 'monthlyStartDate', 'monthlyDueDay'],
    };

    // Validate current step's required fields
    const currentFields = requiredFields[currentStep] || [];
    currentFields.forEach(key => {
      if (!formData[key]) {
        newErrors[key] = `${key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')} is required`;
        isValid = false;
      } else {
        const error = validateField(key, formData[key]);
        if (error) {
          newErrors[key] = error;
          isValid = false;
        }
      }
    });

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate current step before proceeding
    if (!validateForm()) {
      setNotification({
        message: 'Please correct the errors in the form',
        type: 'error'
      });
      return;
    }

    if (currentStep < steps.length) {
      nextStep();
      return;
    }

    // Add extraService to formData if provided
    const dataToSend = {
      ...formData,
      extraServices: extraService.description ? [extraService] : [],
    };

    try {
      const res = await Axios.post('/consultants', dataToSend);
      console.log('Consultant created:', res.data);
      setNotification({ message: 'Consultant registered successfully!', type: 'success' });
      // Reset form and step
      setFormData({
        name: '', email: '', phone: '', registrationFee: '',
        registrationDate: '', registrationProof: '', onboardingFee: '',
        onboardingDate: '', onboardingProof: '', consultantSalary: '',
        dateOfJoining: '', contractDuration: '', monthlyFee: '',
        monthlyStartDate: '', monthlyDueDay: '', extraServices: [],
      });
      setExtraService({ description: '', fee: '', paymentDate: '', proof: '' });
      setCurrentStep(1); // Reset to first step
      
      // Clear notification after 5 seconds
      setTimeout(() => setNotification({ message: '', type: '' }), 5000);
    } catch (error) {
      console.error('Error creating consultant:', error);
      setNotification({ message: 'Failed to register consultant. Please try again.', type: 'error' });
      setTimeout(() => setNotification({ message: '', type: '' }), 5000);
    }
  };

  return (
    <div className="consultant-form-container">
      <h2>Consultant Registration</h2>
      {notification.message && (
        <div className={`notification ${notification.type}`}>
          {notification.message}
        </div>
      )}
      {renderStepIndicator()}
      <form onSubmit={handleSubmit} className="consultant-form">
        {currentStep === 1 && (
          <fieldset className="form-section">
            <legend>Personal Information</legend>
            <div className="form-row">
              <div className="form-group">
                <label>Name:</label>
                <input
                  className={`form-input ${errors.name ? 'error' : ''}`}
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
                {errors.name && <span className="error-message">{errors.name}</span>}
              </div>
              <div className="form-group">
                <label>Email:</label>
                <input
                  className={`form-input ${errors.email ? 'error' : ''}`}
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
                {errors.email && <span className="error-message">{errors.email}</span>}
              </div>
              <div className="form-group">
                <label>Phone:</label>
                <input
                  className={`form-input ${errors.phone ? 'error' : ''}`}
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                />
                {errors.phone && <span className="error-message">{errors.phone}</span>}
              </div>
            </div>
          </fieldset>
        )}

        {currentStep === 2 && (
          <fieldset className="form-section">
            <legend>Registration Details</legend>
            <div className="form-row">
              <div className="form-group">
                <label>Registration Fee:</label>
                <input 
                  className={`form-input ${errors.registrationFee ? 'error' : ''}`}
                  name="registrationFee" 
                  type="number" 
                  value={formData.registrationFee} 
                  onChange={handleChange} 
                  required
                />
                {errors.registrationFee && <span className="error-message">{errors.registrationFee}</span>}
              </div>
              <div className="form-group">
                <label>Registration Date:</label>
                <input 
                  className={`form-input ${errors.registrationDate ? 'error' : ''}`}
                  name="registrationDate" 
                  type="date" 
                  value={formData.registrationDate} 
                  onChange={handleChange} 
                  required
                />
                {errors.registrationDate && <span className="error-message">{errors.registrationDate}</span>}
              </div>
              <div className="form-group">
                <label>Registration Proof:</label>
                <input
                  className="form-input"
                  type="file"
                  name="registrationProof"
                  onChange={handleFileChange}
                  accept="image/*,.pdf"
                />
              </div>
            </div>
          </fieldset>
        )}

        {currentStep === 3 && (
          <fieldset className="form-section">
            <legend>Onboarding Details</legend>
            <div className="form-row">
              <div className="form-group">
                <label>Onboarding Fee:</label>
                <input 
                  className="form-input" 
                  name="onboardingFee" 
                  type="number" 
                  value={formData.onboardingFee} 
                  onChange={handleChange} 
                />
              </div>
              <div className="form-group">
                <label>Onboarding Date:</label>
                <input 
                  className="form-input" 
                  name="onboardingDate" 
                  type="date" 
                  value={formData.onboardingDate} 
                  onChange={handleChange} 
                />
              </div>
              <div className="form-group">
                <label>Onboarding Proof:</label>
                <input
                  className="form-input"
                  type="file"
                  name="onboardingProof"
                  onChange={handleFileChange}
                  accept="image/*,.pdf"
                />
              </div>
            </div>
          </fieldset>
        )}

        {currentStep === 4 && (
          <fieldset className="form-section">
            <legend>Contract Details</legend>
            <div className="form-row">
              <div className="form-group">
                <label>Consultant Salary:</label>
                <input 
                  className={`form-input ${errors.consultantSalary ? 'error' : ''}`}
                  name="consultantSalary" 
                  type="number" 
                  value={formData.consultantSalary} 
                  onChange={handleChange} 
                  required
                />
                {errors.consultantSalary && <span className="error-message">{errors.consultantSalary}</span>}
              </div>
              <div className="form-group">
                <label>Date of Joining:</label>
                <input 
                  className={`form-input ${errors.dateOfJoining ? 'error' : ''}`}
                  name="dateOfJoining" 
                  type="date" 
                  value={formData.dateOfJoining} 
                  onChange={handleChange} 
                  required
                />
                {errors.dateOfJoining && <span className="error-message">{errors.dateOfJoining}</span>}
              </div>
              <div className="form-group">
                <label>Contract Duration (months):</label>
                <select 
                  className={`form-input ${errors.contractDuration ? 'error' : ''}`}
                  name="contractDuration" 
                  value={formData.contractDuration} 
                  onChange={handleChange}
                  required
                >
                  <option value="">Select Duration</option>
                  <option value="8">8 months</option>
                  <option value="10">10 months</option>
                  <option value="12">12 months</option>
                </select>
                {errors.contractDuration && <span className="error-message">{errors.contractDuration}</span>}
              </div>
            </div>
          </fieldset>
        )}

        {currentStep === 5 && (
          <fieldset className="form-section">
            <legend>Monthly Payment Details</legend>
            <div className="form-row">
              <div className="form-group">
                <label>Monthly Fee:</label>
                <input 
                  className={`form-input ${errors.monthlyFee ? 'error' : ''}`}
                  name="monthlyFee" 
                  type="number" 
                  value={formData.monthlyFee} 
                  onChange={handleChange} 
                  required
                />
                {errors.monthlyFee && <span className="error-message">{errors.monthlyFee}</span>}
              </div>
              <div className="form-group">
                <label>Monthly Start Date:</label>
                <input 
                  className={`form-input ${errors.monthlyStartDate ? 'error' : ''}`}
                  name="monthlyStartDate" 
                  type="date" 
                  value={formData.monthlyStartDate} 
                  onChange={handleChange} 
                  required
                />
                {errors.monthlyStartDate && <span className="error-message">{errors.monthlyStartDate}</span>}
              </div>
              <div className="form-group">
                <label>Monthly Due Day:</label>
                <input 
                  className={`form-input ${errors.monthlyDueDay ? 'error' : ''}`}
                  name="monthlyDueDay" 
                  type="number" 
                  min="1" 
                  max="31" 
                  value={formData.monthlyDueDay} 
                  onChange={handleChange} 
                  required
                />
                {errors.monthlyDueDay && <span className="error-message">{errors.monthlyDueDay}</span>}
              </div>
            </div>
          </fieldset>
        )}

        {currentStep === 6 && (
          <fieldset className="form-section">
            <legend>Extra Services</legend>
            <div className="form-row">
              <div className="form-group">
                <label>Description:</label>
                <input className="form-input" name="description" value={extraService.description} onChange={handleExtraChange} />
              </div>
              <div className="form-group">
                <label>Fee:</label>
                <input className="form-input" name="fee" type="number" value={extraService.fee} onChange={handleExtraChange} />
              </div>
              <div className="form-group">
                <label>Payment Date:</label>
                <input className="form-input" name="paymentDate" type="date" value={extraService.paymentDate} onChange={handleExtraChange} />
              </div>
            </div>
          </fieldset>
        )}

        <div className="form-navigation">
          {currentStep > 1 && (
            <button type="button" onClick={prevStep} className="nav-button">
              Previous
            </button>
          )}
          <button type="submit" className="submit-button">
  {currentStep === steps.length ? 'Submit' : 'Next'}
</button>

        </div>
      </form>
    </div>
  );
};

export default ConsultantForm;
