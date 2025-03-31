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
import Unauthorized from '../components/Unauthorized';
import UserManagement from '../components/UserManagement/UserManagement';
import PrivateRoute from '../components/PrivateRoute'; // Adjust the import path as needed

const Router = () => {
  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/home" element={<Home />} />
        <Route path="/login" element={<LoginForm />} />
        <Route path='/signup' element={<SignupForm/>}/>
        <Route path="/unauthorized" element={<Unauthorized />} />
        <Route
          path="/consultants"
          element={
            <PrivateRoute allowedRoles={['admin', 'team']}>
              <ConsultantMain />
            </PrivateRoute>
          }
        />
        <Route
          path="/consultants/consultantsDetails"
          element={
            <PrivateRoute allowedRoles={['admin', 'team']}>
              <ConsultantDetails />
            </PrivateRoute>
          }
        />
        <Route
          path="/consultants/userManagement"
          element={
            <PrivateRoute allowedRoles={['admin']}>
              <UserManagement/>
            </PrivateRoute>
          }
        />
        <Route
          path="/singleConsultant/:id"
          element={
            <PrivateRoute allowedRoles={['admin', 'team']}>
              <SingleConsultatnt />
            </PrivateRoute>
          }
        />
        <Route
          path="/registration"
          element={
            <PrivateRoute allowedRoles={['admin', 'team','user']}>
              <ConsultantForm />
            </PrivateRoute>
          }
        />
        {/* Optionally add routes for login, signup, unauthorized, etc. */}
      </Routes>
    </>
  );
};

export default Router;
