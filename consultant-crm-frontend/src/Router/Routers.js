// src/Router/Routers.jsx
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import ScrollToTop from '../utils/scrolltoTop';
import ConsultantForm from '../components/ConsultantForm';
import Home from '../pages/Home';
import SingleConsultatnt from '../components/Consultant/SingleConsultant';
import ConsultantMain from '../components/Consultant/ConsultantMain';
import ConsultantDetails from '../components/Consultant/ConsultantDetails';
import LoginForm from '../components/Login/LoginForm';
import SignupForm from '../components/Signup/SignupForm';
import CompanyManagement from '../components/Company/CompanyManagement';
import ConsultantJobDetails from '../components/Consultant/ConsultantJobDetails';
import ConsultantAggrementDetails from '../components/Consultant/ConsultantAgreementDetails';
import UserProfile from '../components/UserProfile/UserProfile';
import ConsultantInterviewDetails from '../components/Consultant/ConsultantInterviewDetails';
import ConsultantFeesDetails from '../components/Consultant/ConsultantFeesDetails';
import Unauthorized from '../components/Unauthorized';
import UserManagement from '../components/UserManagement/UserManagement';
import PrivateRoute from '../components/PrivateRoute'; // Adjust the import path as needed
import AuthRoute from '../components/AuthRoute';
import ConsultantVerificationView from '../components/ConsultantVerificationView/ConsultantVerificationView';

const Router = () => {
  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/home" element={<Home />} />
        <Route 
          path="/login" 
          element={
            <AuthRoute>
              <LoginForm />
            </AuthRoute>
          } 
        />
        <Route 
          path="/signup" 
          element={
            <AuthRoute>
              <SignupForm />
            </AuthRoute>
          }
        />
        <Route path="/unauthorized" element={<Unauthorized />} />
        <Route
          path="/consultants"
          element={
            <PrivateRoute allowedRoles={['superAdmin', 'coordinator', 'resumeBuilder', 'teamLead']}>
              <ConsultantMain />
            </PrivateRoute>
          }
        />
        <Route
          path="/consultants/consultantsDetails"
          element={
            <PrivateRoute allowedRoles={['superAdmin', 'coordinator', 'teamLead', 'resumeBuilder']}>
              <ConsultantDetails />
            </PrivateRoute>
          }
        />
        <Route
          path="/consultants/userManagement"
          element={
            <PrivateRoute allowedRoles={['superAdmin']}>
              <UserManagement/>
            </PrivateRoute>
          }
        />
        <Route
          path="/consultants/singleConsultant/:id"
          element={
            <PrivateRoute allowedRoles={['superAdmin']}>
              <SingleConsultatnt />
            </PrivateRoute>
          }
        />
        <Route
          path="/registration"
          element={
            <PrivateRoute allowedRoles={['superAdmin', 'coordinator', 'teamLead', 'Candidate']}>
              <ConsultantForm />
            </PrivateRoute>
          }
        />
        <Route
          path="/companies"
          element={
            <PrivateRoute allowedRoles={['superAdmin', 'coordinator']}>
              <CompanyManagement />
            </PrivateRoute>
          }
        />
        <Route
          path="/consultants/consultantJobDetails"
          element={
            <PrivateRoute allowedRoles={['superAdmin', 'coordinator', 'teamLead']}>
              <ConsultantJobDetails />
            </PrivateRoute>
          }
        />  
        <Route
          path="/consultants/consultantAggrementDetails"
          element={
            <PrivateRoute allowedRoles={['superAdmin', 'coordinator']}>
              <ConsultantAggrementDetails />
            </PrivateRoute>
          }
        />
        <Route
          path="/my-profile"
          element={
            <PrivateRoute allowedRoles={['superAdmin', 'coordinator', 'teamLead', 'Candidate']}>
              <UserProfile />
            </PrivateRoute> 
          }
        />
        <Route
          path="/consultant-verification"
          element={
            <PrivateRoute allowedRoles={['teamLead', 'coordinator']}>
              <ConsultantVerificationView />
            </PrivateRoute>
          }
        />
        <Route
          path="/consultants/consultantInterviewDetails"
          element={
            <PrivateRoute allowedRoles={['superAdmin', 'coordinator','admin']}>
              <ConsultantInterviewDetails />
            </PrivateRoute>
          }
        />    
        <Route
          path="/consultants/consultantFeesDetails"
          element={
            <PrivateRoute allowedRoles={['superAdmin', 'admin']}>
              <ConsultantFeesDetails />
            </PrivateRoute>
         }
        /> 
        {/* Optionally add routes for login, signup, unauthorized, etc. */}
      </Routes>
    </>
  );
};

export default Router;
