// src/context/MaintenanceContext.jsx
import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export const MaintenanceContext = createContext();

export const MaintenanceProvider = ({ children }) => {
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);

  useEffect(() => {
    const fetchMaintenanceMode = async () => {
      try {
        const response = await axios.get('http://localhost:8080/api/admin/maintenance-mode');
        setIsMaintenanceMode(response.data === 'Maintenance mode is on'); // Example logic
      } catch (error) {
        console.error('Error fetching maintenance mode:', error);
      }
    };
    fetchMaintenanceMode();
  }, []);

  return (
    <MaintenanceContext.Provider value={{ isMaintenanceMode }}>
      {children}
    </MaintenanceContext.Provider>
  );
};