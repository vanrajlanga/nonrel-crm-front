import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import { BsPersonFill, BsBuildingsFill, BsPeopleFill, BsFileEarmarkText, BsPersonLinesFill } from 'react-icons/bs';
import { MdOutlinePayment } from "react-icons/md";
import './ConsultantMain.css';

const ConsultantMain = () => {
  const navigate = useNavigate();
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    const role = localStorage.getItem('role');
    setUserRole(role);
  }, []);

  const registrationCards = [
    {
      title: 'Users',
      description: 'Manage user accounts and permissions',
      path: '/consultants/userManagement',
      icon: <BsPersonFill size={24} />,
      showForRoles: ['superAdmin']
    },
    {
      title: 'All Registration',
      description: 'View and manage all consultant registrations in one centralized dashboard',
      path: '/consultants/consultantsDetails',
      icon: <BsBuildingsFill size={24} />,
      showForRoles: ['superAdmin', 'coordinator', 'teamLead', 'resumeBuilder']
    },
    {
      title: 'Consultants Job Details',
      description: 'Track and manage consultant job placements and assignments',
      path: '/consultants/consultantJobDetails',
      icon: <BsPeopleFill size={24} />,
      showForRoles: ['superAdmin', 'coordinator', 'teamLead']
    },
    {
      title: 'Consultants Agreement Details',
      description: 'Handle consultant agreements and contract management',
      path: '/consultants/consultantAggrementDetails',
      icon: <BsFileEarmarkText size={24} />,
      showForRoles: ['superAdmin']
    },
    {
      title: 'Consultants Interview Details',
      description: 'Schedule and track consultant interviews and assessments',
      path: '/consultants/consultantInterviewDetails',
      icon: <BsPersonLinesFill size={24} />,
      showForRoles: ['superAdmin', 'coordinator', 'teamLead']
    },
    {
      title: 'Consultants Fees Details',
      description: 'Manage consultant fees, payments, and financial records',
      path: '/consultants/consultantFeesDetails',
      icon: <MdOutlinePayment size={24} />,
      showForRoles: ['superAdmin', 'admin']
    },
    {
      title: 'Personal Details',
      description: 'View and update your personal information and profile',
      path: '/consultants/personalDetails',
      icon: <BsPersonFill size={24} />,
      showForRoles: ['Candidate']
    }
  ];

  const filteredCards = registrationCards.filter(card => 
    card.showForRoles.includes(userRole)
  );

  return (
    <div className="consultant-main-container">
      <div className="container">
        <div className={`consultant-main-header consultant-main-fade-in`}>
          <h1 className="consultant-main-title">
            Welcome to Consultant Portal
          </h1>
          <p className="consultant-main-subtitle">
            Access and manage all your consultant-related tasks from one central location
          </p>
        </div>

        <div className="consultant-main-grid">
          {filteredCards.map((card, index) => (
            <div 
              key={index}
              className={`consultant-main-card consultant-main-slide-up`}
              onClick={() => navigate(card.path)}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="consultant-main-card-icon">
                {card.icon}
              </div>
              <h3 className="consultant-main-card-title">
                {card.title}
              </h3>
              <p className="consultant-main-card-description">
                {card.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ConsultantMain;
