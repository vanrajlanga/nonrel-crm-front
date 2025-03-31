import React, { useState, useEffect } from 'react';
import { BsFilter } from 'react-icons/bs';
import { toast } from 'react-toastify';

const Filter = ({ onFilterApplied, filterConfig = [] }) => {
  const [showFilters, setShowFilters] = useState(false);
  const [filterOptions, setFilterOptions] = useState({});

  // Initialize filterOptions from filterConfig
  useEffect(() => {
    const initialOptions = {};
    filterConfig.forEach(filter => {
      initialOptions[filter.name] = filter.defaultValue || '';
    });
    setFilterOptions(initialOptions);
  }, [filterConfig]);

  const handleFilterChange = (field, value) => {
    setFilterOptions({
      ...filterOptions,
      [field]: value
    });
  };

  const applyFilters = () => {
    onFilterApplied(filterOptions);
    toast.info('Filters applied!', {
      position: "top-right",
      autoClose: 2000
    });
    setShowFilters(false);
  };

  const resetFilters = () => {
    const resetOptions = {};
    filterConfig.forEach(filter => {
      resetOptions[filter.name] = filter.defaultValue || '';
    });
    setFilterOptions(resetOptions);
    onFilterApplied(resetOptions);
    toast.info('Filters reset!', {
      position: "top-right",
      autoClose: 2000
    });
  };

  // Render filter controls based on the type
  const renderFilterControl = (filter) => {
    switch (filter.type) {
      case 'select':
        return (
          <select 
            className="form-select"
            value={filterOptions[filter.name] || filter.defaultValue}
            onChange={(e) => handleFilterChange(filter.name, e.target.value)}
          >
            {filter.options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );
      case 'date':
        return (
          <input 
            type="date" 
            className="form-control"
            value={filterOptions[filter.name] || ''}
            onChange={(e) => handleFilterChange(filter.name, e.target.value)}
          />
        );
      case 'dateRange':
        return (
          <div className="d-flex gap-2">
            <input 
              type="date" 
              className="form-control"
              value={filterOptions[`${filter.name}From`] || ''}
              onChange={(e) => handleFilterChange(`${filter.name}From`, e.target.value)}
              placeholder="From"
            />
            <input 
              type="date" 
              className="form-control"
              value={filterOptions[`${filter.name}To`] || ''}
              onChange={(e) => handleFilterChange(`${filter.name}To`, e.target.value)}
              placeholder="To"
            />
          </div>
        );
      default:
        return (
          <input 
            type="text" 
            className="form-control"
            value={filterOptions[filter.name] || ''}
            onChange={(e) => handleFilterChange(filter.name, e.target.value)}
            placeholder={filter.placeholder || ''}
          />
        );
    }
  };

  return (
    <div className="filter-section">
      <div className="d-flex justify-content-between align-items-center">
        <button 
          className="btn btn-filter"
          onClick={() => setShowFilters(!showFilters)}
        >
          <BsFilter className="me-2" />
          Filter 
        </button>
        
        <div>
          <span className="text-muted small me-2">Apply filters to narrow results</span>
        </div>
      </div>
      
      {showFilters && (
        <div className="filter-options-container mt-3 p-3">
          <div className="row g-3">
            {filterConfig.map((filter, index) => (
              <div key={filter.name} className={`col-md-${filter.type === 'dateRange' ? '6' : '4'}`}>
                <label className="form-label">{filter.label}</label>
                {renderFilterControl(filter)}
              </div>
            ))}
            
            <div className="col-12 d-flex justify-content-end mt-4">
              <div className="d-flex gap-2">
                <button className="btn btn-apply" onClick={applyFilters}>
                  Apply Filters
                </button>
                <button className="btn btn-reset" onClick={resetFilters}>
                  Reset
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Filter;
