import React from 'react';
import StudentApp from '../student/src/App';
import AdminApp from '../admin/src/App';

export function App() {
  const isAdmin =
    typeof window !== 'undefined' &&
    (window.location.hostname.includes('admin') ||
      window.location.pathname.startsWith('/admin') ||
      import.meta.env.VITE_APP_ROLE === 'admin');

  return isAdmin ? <AdminApp /> : <StudentApp />;
}

export default App;
