import React from 'react';
import UserProfile from '../UserProfile/UserProfile';
import './personalDetails.css';

const PersonalDetails = () => {
  return (
    <div className="personal-details-container">
      <div className="profile-wrapper">
        <UserProfile />
      </div>
    </div>
  );
};

export default PersonalDetails;
