import React from 'react';
import { useLocation } from 'react-router-dom';
import { getStoredUser } from '../services/api';
import LandownerGISExplorer from './LandownerGISExplorer';
import AgencyGISExplorer from './AgencyGISExplorer';
import GovernmentGISExplorer from './GovernmentGISExplorer';

export const GISExplorer: React.FC = () => {
  const location = useLocation();
  const user = getStoredUser();

  // If user is an Agency officer or accessing /agency/gis, render dedicated Agency GIS Explorer
  const isAgencyUser = user?.role === 'AGENCY' || user?.user_type === 'AGENCY' || location.pathname.startsWith('/agency');
  if (isAgencyUser) {
    return <AgencyGISExplorer />;
  }

  // If user is a Government officer or accessing /government/gis, render dedicated Government GIS Explorer
  const isGovernmentOfficer = user?.role === 'GOVERNMENT' || user?.user_type === 'GOVERNMENT' || location.pathname.startsWith('/government');
  if (isGovernmentOfficer) {
    return <GovernmentGISExplorer />;
  }

  // Default to Landowner GIS Explorer for landowners and general public
  return <LandownerGISExplorer />;
};

export default GISExplorer;
