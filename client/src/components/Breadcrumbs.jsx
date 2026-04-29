import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

const Breadcrumbs = () => {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter((x) => x);

  // If we are on home, don't show breadcrumbs
  if (pathnames.length === 0) return null;

  return (
    <nav className="breadcrumb">
      <Link to="/">Beranda</Link>
      {pathnames.map((value, index) => {
        const last = index === pathnames.length - 1;
        const to = `/${pathnames.slice(0, index + 1).join('/')}`;

        // Custom labels
        let label = value.charAt(0).toUpperCase() + value.slice(1);
        if (value === 'explore') label = 'Katalog Trip';
        if (value === 'trip') return null; // Skip "trip" part in /trip/:id
        if (index > 0 && pathnames[index-1] === 'trip') label = 'Detail Trip'; // Label for the ID
        if (value === 'my-dashboard') label = 'Dashboard';
        if (value === 'profile') label = 'Profil';

        return (
          <React.Fragment key={to}>
            <ChevronRight size={14} />
            {last ? (
              <span className="active">{label}</span>
            ) : (
              <Link to={to}>{label}</Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};

export default Breadcrumbs;
