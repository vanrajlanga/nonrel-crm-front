import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import { BsPersonFill, BsBuildingsFill, BsPeopleFill, BsFileEarmarkText, BsPersonLinesFill } from 'react-icons/bs';
import { MdOutlineDocumentScanner } from "react-icons/md";

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
      description: 'User Details',
      path: '/consultants/userManagement',
      icon: <BsPersonFill size={40} className="text-primary" />,
      showForRoles: ['superAdmin']
    },
    {
      title: 'All Registration',
      description: 'View and manage all consultant registrations in one place',
      path: '/consultants/consultantsDetails',
      icon: <BsBuildingsFill size={40} className="text-primary" />,
      showForRoles: ['superAdmin', 'coordinator', 'teamLead', 'resumeBuilder']
    },
    {
      title: 'Consultants Job Details',
      description: 'Consultants Job Details',
      path: '/consultants/consultantJobDetails',
      icon: <BsPeopleFill size={40} className="text-primary" />,
      showForRoles: ['superAdmin', 'coordinator', 'teamLead']
    },
    {
      title: 'Consultants Agreement Details',
      description: 'Consultants Agreement Details',
      path: '/consultants/consultantAggrementDetails',
      icon: <BsFileEarmarkText size={40} className="text-primary" />,
      showForRoles: ['superAdmin']
    },
    {
      title: 'Consultants Interview Details',
      description: 'Consultants Interview Details',
      path: '/consultants/consultantInterviewDetails',
      icon: <BsPersonLinesFill size={40} className="text-primary" />,
      showForRoles: ['superAdmin', 'coordinator', 'teamLead']
    },
    {
      title: 'Consultants Resume Builder',
      description: 'Consultants Resume Builder',
      path: '/consultants/consultantResumeBuilder',
      icon: <MdOutlineDocumentScanner size={40} className="text-primary" />,
      showForRoles: ['superAdmin', 'coordinator', 'resumeBuilder']
    }
  ];

  const filteredCards = registrationCards.filter(card => 
    card.showForRoles.includes(userRole)
  );

  return (
    <div className="min-vh-100 py-4" style={{ background: 'linear-gradient(120deg, #f0f2f5 0%, #e3f2fd 100%)' }}>
      <div className="container">
        <div className="text-center mb-5">
          <h1 className="display-4 fw-bold text-primary mb-3">
            Welcome to Consultant Portal
          </h1>
          <h5 className="text-secondary mb-4">
            Choose your registration type to get started
          </h5>
        </div>

        <div className="row g-4 justify-content-center">
          {filteredCards.map((card, index) => (
            <div className="col-12 col-sm-6 col-md-4" key={index}>
              <div 
                className="card h-100 border-0 shadow-sm" 
                style={{ 
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  cursor: 'pointer'
                }}
                onClick={() => navigate(card.path)}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'translateY(-8px)';
                  e.currentTarget.style.boxShadow = '0 8px 40px -12px rgba(0,0,0,0.3)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'none';
                  e.currentTarget.style.boxShadow = '';
                }}
              >
                <div className="card-body text-center p-4">
                  <div className="mb-3">
                    {card.icon}
                  </div>
                  <h4 className="card-title mb-3 text-primary">
                    {card.title}
                  </h4>
                  <p className="card-text text-secondary">
                    {card.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ConsultantMain;
