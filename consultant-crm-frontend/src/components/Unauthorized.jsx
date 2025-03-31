import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';

const Unauthorized = () => {
  return (
    <div className="vh-100 bg-dark d-flex align-items-center justify-content-center">
      <div className="container">
        <div className="text-center text-white">
          <div className="mb-4">
            <span className="fs-1 text-danger">⛔</span>
          </div>
          <h1 className="display-1 fw-bold">401</h1>
          <h2 className="mb-4">Unauthorized Access</h2>
          <p className="lead">
            Sorry, you don't have permission to access this page.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Unauthorized;
