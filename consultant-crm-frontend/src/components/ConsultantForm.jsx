// src/components/ConsultantForm.js
import React, { useState } from "react";
import Axios from "../services/api";
import "./ConsultantForm.css";
import imageCompression from "browser-image-compression";
import { FiUpload, FiCheckCircle, FiInfo, FiCreditCard } from "react-icons/fi";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const ConsultantForm = () => {
	const [formData, setFormData] = useState({
		fulllegalname: "",
		technology: "",
		dateOfBirth: "",
		stateOfResidence: "",
		visaStatus: "",
		maritalStatus: "",
		phone: "",
		email: "",
		currentAddress: "",
		usaLandingDate: "",
		// USA IT Experience
		hasUsaItExperience: false,
		usaFirstExperience: "",
		usaSecondExperience: "",
		usaOtherExperiences: "",
		// Outside USA IT Experience
		hasOutsideUsaItExperience: false,
		outsideUsaFirstExperience: "",
		outsideUsaSecondExperience: "",
		outsideUsaOtherExperiences: "",
		// USA Education
		hasUsaEducation: false,
		usaPgDiploma: "",
		usaMastersDegree: "",
		usaOtherCertifications: "",
		// Outside USA Education
		hasOutsideUsaEducation: false,
		outsideUsaBachelorsDegree: "",
		outsideUsaMastersDegree: "",
		outsideUsaOtherCertifications: "",
		// Documents
		passportId: "",
		termsAccepted: false,
	});

	// New state to store the actual file object
	const [registrationProofFile, setRegistrationProofFile] = useState(null);
	// State for preview display
	const [registrationProofPreview, setRegistrationProofPreview] = useState("");

	const [notification, setNotification] = useState({ message: "", type: "" });

	const [errors, setErrors] = useState({
		fulllegalname: "",
		technology: "",
		dateOfBirth: "",
		stateOfResidence: "",
		visaStatus: "",
		maritalStatus: "",
		phone: "",
		email: "",
		currentAddress: "",
		usaLandingDate: "",
		passportId: "",
	});

	const [fieldNotifications, setFieldNotifications] = useState({
		registrationProof: { message: "", type: "" },
	});

	const validateForm = () => {
		const newErrors = {};
		let isValid = true;

		// All required fields in one go since we removed steps
		const requiredFields = [
			"fulllegalname",
			"technology",
			"dateOfBirth",
			"stateOfResidence",
			"visaStatus",
			"maritalStatus",
			"phone",
			"email",
			"currentAddress",
			"usaLandingDate",
			"passportId",
			"termsAccepted",
		];

		requiredFields.forEach((key) => {
			if (!formData[key]) {
				newErrors[key] = `${
					key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, " $1")
				} is required`;
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

	const isFormValid = () => {
		// Check if all required fields are filled and valid
		const requiredFields = [
			"fulllegalname",
			"technology",
			"dateOfBirth",
			"stateOfResidence",
			"visaStatus",
			"maritalStatus",
			"phone",
			"email",
			"currentAddress",
			"usaLandingDate",
			"passportId",
			"termsAccepted",
		];

		// Check if all required fields have values
		const allFieldsFilled = requiredFields.every((field) => formData[field]);

		// Check if there are no validation errors
		const noErrors = Object.values(errors).every((error) => error === "");

		return allFieldsFilled && noErrors;
	};

	const handleSubmit = async (e) => {
		e.preventDefault();

		if (!validateForm()) {
			toast.error("Please fill in all required fields correctly", {
				position: "top-right",
				autoClose: 5000,
				hideProgressBar: false,
				closeOnClick: true,
				pauseOnHover: true,
				draggable: true,
				progress: undefined,
			});
			return;
		}

		try {
			// Create data for submission (excluding the file)
			const dataToSubmit = { ...formData };
			delete dataToSubmit.registrationProof; // Remove this as we'll upload it separately

			const res = await Axios.post("/consultants", dataToSubmit);
			console.log("Consultant created:", res.data);

			// Get the newly created consultant ID
			const consultantId = res.data.consultant.id;

			// If we have a registration proof file, upload it
			if (registrationProofFile) {
				await uploadRegistrationProof(consultantId, registrationProofFile);
			}

			toast.success("Consultant registered successfully!", {
				position: "top-right",
				autoClose: 5000,
				hideProgressBar: false,
				closeOnClick: true,
				pauseOnHover: true,
				draggable: true,
				progress: undefined,
			});

			// Reset form
			setFormData({
				fulllegalname: "",
				technology: "",
				dateOfBirth: "",
				stateOfResidence: "",
				visaStatus: "",
				maritalStatus: "",
				phone: "",
				email: "",
				currentAddress: "",
				usaLandingDate: "",
				hasUsaItExperience: false,
				usaFirstExperience: "",
				usaSecondExperience: "",
				usaOtherExperiences: "",
				hasOutsideUsaItExperience: false,
				outsideUsaFirstExperience: "",
				outsideUsaSecondExperience: "",
				outsideUsaOtherExperiences: "",
				hasUsaEducation: false,
				usaPgDiploma: "",
				usaMastersDegree: "",
				usaOtherCertifications: "",
				hasOutsideUsaEducation: false,
				outsideUsaBachelorsDegree: "",
				outsideUsaMastersDegree: "",
				outsideUsaOtherCertifications: "",
				passportId: "",
				termsAccepted: false,
			});
			setRegistrationProofFile(null);
			setRegistrationProofPreview("");
		} catch (error) {
			console.error("Error creating consultant:", error);

			const errorMessage =
				error.response?.data?.message ||
				error.message ||
				"Failed to register consultant. Please try again.";

			toast.error(errorMessage, {
				position: "top-right",
				autoClose: 5000,
				hideProgressBar: false,
				closeOnClick: true,
				pauseOnHover: true,
				draggable: true,
				progress: undefined,
			});
		}
	};

	// New function to upload the registration proof file
	const uploadRegistrationProof = async (consultantId, file) => {
		try {
			// Create FormData for file upload
			const formData = new FormData();
			formData.append("proof", file);

			await Axios.post(`/consultants/${consultantId}/upload-proof`, formData, {
				headers: {
					"Content-Type": "multipart/form-data",
				},
			});

			console.log("Registration proof uploaded successfully");
			return true;
		} catch (error) {
			console.error("Error uploading registration proof:", error);
			toast.error(
				"Registration was successful but proof upload failed. Please contact support.",
				{
					position: "top-right",
					autoClose: 5000,
					hideProgressBar: false,
					closeOnClick: true,
					pauseOnHover: true,
					draggable: true,
					progress: undefined,
				}
			);
			return false;
		}
	};

	const validateField = (name, value) => {
		switch (name) {
			case "fulllegalname":
				return value.length < 2
					? "Full legal name must be at least 2 characters long"
					: !/^[a-zA-Z\s.'-]+$/.test(value)
					? "Name can only contain letters, spaces, and basic punctuation"
					: "";

			case "technology":
				return value.length < 2
					? "Technology field must be at least 2 characters long"
					: "";

			case "email":
				return !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
					? "Please enter a valid email address"
					: "";

			case "phone":
				// Allow international format: +CountryCode PhoneNumber
				return !/^\+?[1-9]\d{0,3}[-\s]?(?:\d[-\s]?){8,14}$/.test(value)
					? "Please enter a valid phone number with country code (e.g., +1 234-567-8900)"
					: "";

			case "stateOfResidence":
				return value.length < 2
					? "Please enter a valid state name"
					: !/^[a-zA-Z\s]+$/.test(value)
					? "State name can only contain letters and spaces"
					: "";

			case "currentAddress":
				return value.length < 10
					? "Please enter a complete address (minimum 10 characters)"
					: "";

			case "passportId":
				// Passport ID validation: alphanumeric, minimum 6 characters, no spaces
				return !/^[A-Z0-9]{6,20}$/.test(value)
					? "Passport ID must be 6-20 characters long and contain only capital letters and numbers"
					: "";

			case "dateOfBirth":
				if (!value) return "Date of birth is required";
				const dob = new Date(value);
				const today = new Date();
				const age = today.getFullYear() - dob.getFullYear();
				return dob > today
					? "Date cannot be in the future"
					: age < 18
					? "You must be at least 18 years old"
					: age > 100
					? "Please enter a valid date of birth"
					: "";

			case "usaLandingDate":
				if (!value) return "Landing date is required";
				const landingDate = new Date(value);
				const now = new Date();
				return landingDate > now
					? "Landing date cannot be in the future"
					: landingDate < new Date("1900-01-01")
					? "Please enter a valid landing date"
					: "";

			default:
				return "";
		}
	};

	const handleChange = (e) => {
		const { name, value, type, checked } = e.target;
		const fieldValue = type === "checkbox" ? checked : value;

		// Validate the field
		const error = validateField(name, fieldValue);
		setErrors((prev) => ({
			...prev,
			[name]: error,
		}));

		// Update form data
		setFormData((prev) => ({
			...prev,
			[name]: fieldValue,
		}));
	};

	const handleFileChange = async (e) => {
		const fieldName = e.target.name;
		try {
			const file = e.target.files[0];

			if (!file) {
				setFieldNotifications((prev) => ({
					...prev,
					[fieldName]: { message: "Please select a file", type: "error" },
				}));
				return;
			}

			// Check initial file size
			if (file.size > 5 * 1024 * 1024) {
				setFieldNotifications((prev) => ({
					...prev,
					[fieldName]: {
						message: "File is too large. Please select a file smaller than 5MB",
						type: "error",
					},
				}));
				return;
			}

			// Validate file type
			const allowedTypes = [
				"image/jpeg",
				"image/png",
				"image/gif",
				"application/pdf",
			];
			if (!allowedTypes.includes(file.type)) {
				setFieldNotifications((prev) => ({
					...prev,
					[fieldName]: {
						message:
							"Invalid file type. Only JPEG, PNG, GIF images and PDF files are allowed",
						type: "error",
					},
				}));
				return;
			}

			let processedFile = file;
			let previewBase64;

			if (file.type === "application/pdf") {
				if (file.size > 1024 * 1024) {
					setFieldNotifications((prev) => ({
						...prev,
						[fieldName]: {
							message: "PDF file size should be less than 1MB",
							type: "error",
						},
					}));
					return;
				}
				previewBase64 = await convertToBase64(file);
			} else {
				// For images, compress for preview but keep original for upload
				const compressedFile = await compressImage(file);
				previewBase64 = await convertToBase64(compressedFile);
				processedFile = file; // Keep the original file for upload
			}

			// Store the actual file for later upload
			setRegistrationProofFile(processedFile);

			// Store the base64 just for preview purposes
			setRegistrationProofPreview(previewBase64);

			setFieldNotifications((prev) => ({
				...prev,
				[fieldName]: { message: "File ready for upload", type: "success" },
			}));
		} catch (error) {
			console.error("Error processing file:", error);
			setFieldNotifications((prev) => ({
				...prev,
				[fieldName]: {
					message: error.message || "Error processing file. Please try again.",
					type: "error",
				},
			}));
		}
	};

	const compressImage = async (file) => {
		const options = {
			maxSizeMB: 0.3, // Reduce to 300KB
			maxWidthOrHeight: 600, // Reduce dimensions further
			useWebWorker: true,
			initialQuality: 0.5, // Reduce initial quality further
		};

		try {
			const compressedFile = await imageCompression(file, options);
			// Check if file is still too large
			if (compressedFile.size > 500 * 1024) {
				// If still larger than 500KB
				throw new Error("File is too large even after compression");
			}
			return compressedFile;
		} catch (error) {
			console.error("Error compressing image:", error);
			throw error;
		}
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

	return (
		<div className="consultant-form-container">
			<ToastContainer />
			<h2>Consultant Registration</h2>
			{notification.message && (
				<div className={`notification ${notification.type}`}>
					{notification.message}
				</div>
			)}
			<form onSubmit={handleSubmit} className="consultant-form">
				<fieldset className="form-section">
					<legend>Personal Information</legend>
					<div className="form-row">
						<div className="form-group">
							<label className="floating-input">
								<input
									className={`floating-input__field ${
										errors.fulllegalname ? "error" : ""
									}`}
									name="fulllegalname"
									value={formData.fulllegalname}
									onChange={handleChange}
									required
									placeholder=" "
								/>
								<span className="floating-input__label">Full Legal Name</span>
							</label>
							{errors.fulllegalname && (
								<span className="error-message">{errors.fulllegalname}</span>
							)}
						</div>

						<div className="form-group">
							<label className="floating-input">
								<input
									className={`floating-input__field ${
										errors.technology ? "error" : ""
									}`}
									name="technology"
									value={formData.technology}
									onChange={handleChange}
									required
									placeholder=" "
								/>
								<span className="floating-input__label">Technology</span>
							</label>
							{errors.technology && (
								<span className="error-message">{errors.technology}</span>
							)}
						</div>

						<div className="form-group">
							<label className="floating-input">
								<input
									className={`floating-input__field ${
										errors.dateOfBirth ? "error" : ""
									}`}
									type="date"
									name="dateOfBirth"
									value={formData.dateOfBirth}
									onChange={handleChange}
									required
									placeholder=" "
								/>
								<span className="floating-input__label">Date of Birth</span>
							</label>
							{errors.dateOfBirth && (
								<span className="error-message">{errors.dateOfBirth}</span>
							)}
						</div>

						<div className="form-group">
							<label className="floating-input">
								<input
									className={`floating-input__field ${
										errors.stateOfResidence ? "error" : ""
									}`}
									name="stateOfResidence"
									value={formData.stateOfResidence}
									onChange={handleChange}
									required
									placeholder=" "
								/>
								<span className="floating-input__label">
									State of Residence
								</span>
							</label>
							{errors.stateOfResidence && (
								<span className="error-message">{errors.stateOfResidence}</span>
							)}
						</div>

						<div className="form-group">
							<label className="floating-input">
								<select
									className={`floating-input__field ${
										errors.visaStatus ? "error" : ""
									}`}
									name="visaStatus"
									value={formData.visaStatus}
									onChange={handleChange}
									required
								>
									<option value="">Select Visa Status</option>
									<option value="H1B">H1B</option>
									<option value="F1">F1</option>
									<option value="L1">L1</option>
									<option value="GC">Green Card</option>
									<option value="Citizen">US Citizen</option>
									<option value="Other">Other</option>
								</select>
								<span className="floating-input__label">Visa Status</span>
							</label>
							{errors.visaStatus && (
								<span className="error-message">{errors.visaStatus}</span>
							)}
						</div>

						<div className="form-group">
							<label className="floating-input">
								<select
									className={`floating-input__field ${
										errors.maritalStatus ? "error" : ""
									}`}
									name="maritalStatus"
									value={formData.maritalStatus}
									onChange={handleChange}
									required
								>
									<option value="">Select Marital Status</option>
									<option value="Single">Single</option>
									<option value="Married">Married</option>
									<option value="Divorced">Divorced</option>
									<option value="Widowed">Widowed</option>
								</select>
								<span className="floating-input__label">Marital Status</span>
							</label>
							{errors.maritalStatus && (
								<span className="error-message">{errors.maritalStatus}</span>
							)}
						</div>

						<div className="form-group">
							<label className="floating-input">
								<input
									className={`floating-input__field ${
										errors.phone ? "error" : ""
									}`}
									type="tel"
									name="phone"
									value={formData.phone}
									onChange={handleChange}
									required
									placeholder=" "
								/>
								<span className="floating-input__label">Phone Number</span>
							</label>
							{errors.phone && (
								<span className="error-message">{errors.phone}</span>
							)}
						</div>

						<div className="form-group">
							<label className="floating-input">
								<input
									className={`floating-input__field ${
										errors.email ? "error" : ""
									}`}
									type="email"
									name="email"
									value={formData.email}
									onChange={handleChange}
									required
									placeholder=" "
								/>
								<span className="floating-input__label">Email</span>
							</label>
							{errors.email && (
								<span className="error-message">{errors.email}</span>
							)}
						</div>

						<div className="form-group">
							<label className="floating-input">
								<textarea
									className={`floating-input__field ${
										errors.currentAddress ? "error" : ""
									}`}
									name="currentAddress"
									value={formData.currentAddress}
									onChange={handleChange}
									required
									placeholder=" "
								/>
								<span className="floating-input__label">Current Address</span>
							</label>
							{errors.currentAddress && (
								<span className="error-message">{errors.currentAddress}</span>
							)}
						</div>

						<div className="form-group">
							<label className="floating-input">
								<input
									className={`floating-input__field ${
										errors.usaLandingDate ? "error" : ""
									}`}
									type="date"
									name="usaLandingDate"
									value={formData.usaLandingDate}
									onChange={handleChange}
									required
									placeholder=" "
								/>
								<span className="floating-input__label">
									Date of Landing in USA
								</span>
							</label>
							{errors.usaLandingDate && (
								<span className="error-message">{errors.usaLandingDate}</span>
							)}
						</div>
					</div>
				</fieldset>

				<fieldset className="form-section">
					<legend>USA IT Experience</legend>
					<div className="form-row">
						<div className="form-group checkbox-group">
							<label htmlFor="hasUsaItExperience">
								<input
									type="checkbox"
									id="hasUsaItExperience"
									name="hasUsaItExperience"
									checked={formData.hasUsaItExperience}
									onChange={handleChange}
								/>
								<span className="checkbox"></span>
								Do you have any IT Work Experience in USA?
							</label>
						</div>
						{formData.hasUsaItExperience && (
							<>
								<div className="form-group">
									<label>First Experience:</label>
									<textarea
										className="form-input"
										name="usaFirstExperience"
										value={formData.usaFirstExperience}
										onChange={handleChange}
										placeholder="Company, Role, Duration, Technologies used"
									/>
								</div>
								<div className="form-group">
									<label>Second Experience:</label>
									<textarea
										className="form-input"
										name="usaSecondExperience"
										value={formData.usaSecondExperience}
										onChange={handleChange}
										placeholder="Company, Role, Duration, Technologies used"
									/>
								</div>
								<div className="form-group">
									<label>Other Experiences:</label>
									<textarea
										className="form-input"
										name="usaOtherExperiences"
										value={formData.usaOtherExperiences}
										onChange={handleChange}
										placeholder="List other experiences here"
									/>
								</div>
							</>
						)}
					</div>
				</fieldset>

				<fieldset className="form-section">
					<legend>Outside USA IT Experience</legend>
					<div className="form-row">
						<div className="form-group checkbox-group">
							<label htmlFor="hasOutsideUsaItExperience">
								<input
									type="checkbox"
									id="hasOutsideUsaItExperience"
									name="hasOutsideUsaItExperience"
									checked={formData.hasOutsideUsaItExperience}
									onChange={handleChange}
								/>
								<span className="checkbox"></span>
								Do you have any IT work experience Outside USA?
							</label>
						</div>
						{formData.hasOutsideUsaItExperience && (
							<>
								<div className="form-group">
									<label>First Experience:</label>
									<textarea
										className="form-input"
										name="outsideUsaFirstExperience"
										value={formData.outsideUsaFirstExperience}
										onChange={handleChange}
										placeholder="Company, Role, Duration, Technologies used"
									/>
								</div>
								<div className="form-group">
									<label>Second Experience:</label>
									<textarea
										className="form-input"
										name="outsideUsaSecondExperience"
										value={formData.outsideUsaSecondExperience}
										onChange={handleChange}
										placeholder="Company, Role, Duration, Technologies used"
									/>
								</div>
								<div className="form-group">
									<label>Other Experiences:</label>
									<textarea
										className="form-input"
										name="outsideUsaOtherExperiences"
										value={formData.outsideUsaOtherExperiences}
										onChange={handleChange}
										placeholder="List other experiences here"
									/>
								</div>
							</>
						)}
					</div>
				</fieldset>

				<fieldset className="form-section">
					<legend>USA Education</legend>
					<div className="form-row">
						<div className="form-group checkbox-group">
							<label htmlFor="hasUsaEducation">
								<input
									type="checkbox"
									id="hasUsaEducation"
									name="hasUsaEducation"
									checked={formData.hasUsaEducation}
									onChange={handleChange}
								/>
								<span className="checkbox"></span>
								Do you have Education in USA?
							</label>
						</div>
						{formData.hasUsaEducation && (
							<>
								<div className="form-group">
									<label>PG-Diploma:</label>
									<textarea
										className="form-input"
										name="usaPgDiploma"
										value={formData.usaPgDiploma}
										onChange={handleChange}
										placeholder="Institution, Field of Study, Year"
									/>
								</div>
								<div className="form-group">
									<label>Masters Degree:</label>
									<textarea
										className="form-input"
										name="usaMastersDegree"
										value={formData.usaMastersDegree}
										onChange={handleChange}
										placeholder="Institution, Field of Study, Year"
									/>
								</div>
								<div className="form-group">
									<label>Other Certifications:</label>
									<textarea
										className="form-input"
										name="usaOtherCertifications"
										value={formData.usaOtherCertifications}
										onChange={handleChange}
										placeholder="List other certifications here"
									/>
								</div>
							</>
						)}
					</div>
				</fieldset>

				<fieldset className="form-section">
					<legend>Outside USA Education</legend>
					<div className="form-row">
						<div className="form-group checkbox-group">
							<label htmlFor="hasOutsideUsaEducation">
								<input
									type="checkbox"
									id="hasOutsideUsaEducation"
									name="hasOutsideUsaEducation"
									checked={formData.hasOutsideUsaEducation}
									onChange={handleChange}
								/>
								<span className="checkbox"></span>
								Do you have any Educational Background outside USA?
							</label>
						</div>
						{formData.hasOutsideUsaEducation && (
							<>
								<div className="form-group">
									<label>Bachelors Degree:</label>
									<textarea
										className="form-input"
										name="outsideUsaBachelorsDegree"
										value={formData.outsideUsaBachelorsDegree}
										onChange={handleChange}
										placeholder="Institution, Field of Study, Year"
									/>
								</div>
								<div className="form-group">
									<label>Masters Degree:</label>
									<textarea
										className="form-input"
										name="outsideUsaMastersDegree"
										value={formData.outsideUsaMastersDegree}
										onChange={handleChange}
										placeholder="Institution, Field of Study, Year"
									/>
								</div>
								<div className="form-group">
									<label>Other Certifications:</label>
									<textarea
										className="form-input"
										name="outsideUsaOtherCertifications"
										value={formData.outsideUsaOtherCertifications}
										onChange={handleChange}
										placeholder="List other certifications here"
									/>
								</div>
							</>
						)}
					</div>
				</fieldset>

				{/* Documents and Terms Container */}
				<div className="documents-terms-container">
					{/* Documents section */}
					<fieldset className="document-section">
						<legend>Documents</legend>
						<div className="form-row">
							<div className="form-group">
								<label>
									<FiCreditCard className="icon" />
									Please enter your Passport ID
								</label>
								<input
									className={`form-input ${errors.passportId ? "error" : ""}`}
									type="text"
									name="passportId"
									value={formData.passportId}
									onChange={handleChange}
									required
									placeholder="Enter your passport ID (e.g., A1234567)"
								/>
								{errors.passportId && (
									<span className="error-message">{errors.passportId}</span>
								)}
							</div>

							<div className="file-upload-group">
								<label>
									<FiUpload className="icon" />
									Upload your payment proof
								</label>
								<div className="file-upload-wrapper">
									<input
										className="file-upload-input"
										type="file"
										name="registrationProof"
										onChange={handleFileChange}
										accept="image/*,.pdf"
									/>
									<div className="file-upload-placeholder">
										<FiUpload size={48} color="#4299e1" />
										<p>Drop your image here, or click to browse</p>
									</div>
									{fieldNotifications.registrationProof.message && (
										<div
											className={`field-notification ${fieldNotifications.registrationProof.type}`}
										>
											{fieldNotifications.registrationProof.message}
										</div>
									)}
									<div className="upload-progress">
										<div
											className="upload-progress-bar"
											style={{
												width: formData.registrationProof ? "100%" : "0%",
											}}
										/>
									</div>
									{registrationProofFile && (
										<div className="upload-status">
											<span className="upload-status-text">
												<FiCheckCircle className="icon success-icon" />
												File ready for upload: {registrationProofFile.name}
											</span>
											<div className="upload-actions">
												<button
													type="button"
													className="upload-action-button"
													onClick={() => {
														setRegistrationProofFile(null);
														setRegistrationProofPreview("");
														setFieldNotifications((prev) => ({
															...prev,
															registrationProof: { message: "", type: "" },
														}));
													}}
												>
													Remove
												</button>
											</div>
										</div>
									)}
								</div>
								<div className="file-info">
									<FiInfo className="icon" />
									Supports: JPG, JPEG2000, PNG (Max size: 5MB)
								</div>
							</div>
						</div>
					</fieldset>

					{/* Terms and Conditions section */}
					<fieldset className="terms-section">
						<legend>Terms and Conditions</legend>
						<div className="terms-content">
							<div className="terms-image">
								<img src="assets/images/terms.jpg" alt="Terms and Conditions" />
							</div>
							<div className="form-row">
								<div className="terms-checkbox">
									<label htmlFor="termsAccepted">
										<input
											type="checkbox"
											id="termsAccepted"
											name="termsAccepted"
											checked={formData.termsAccepted}
											onChange={handleChange}
											required
										/>
										<span className="checkbox"></span>I have read and agree to
										the Terms and Conditions
									</label>
									{errors.termsAccepted && (
										<span className="error-message">
											{errors.termsAccepted}
										</span>
									)}
								</div>
							</div>
							<div className="form-navigation">
								<button
									type="submit"
									className={`submit-button ${
										!isFormValid() ? "disabled" : ""
									}`}
									disabled={!isFormValid()}
								>
									Submit Registration
								</button>
							</div>
						</div>
					</fieldset>
				</div>
			</form>
		</div>
	);
};

export default ConsultantForm;
