import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import AppAdmin from '../pages/AppAdmin';
import Login from '../pages/Login.js';

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/admin/*" element={<AppAdmin />} />
        
      </Routes>
    </Router>
  );
};

export default App;