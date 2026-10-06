import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Diseases from './pages/Diseases';
import Tasks from './pages/Tasks';
import Inventory from './pages/Inventory';
import Finances from './pages/Finances';
import Chatbot from './components/Chatbot';
import './index.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/diseases" element={<Diseases />} />
        <Route path="/tasks" element={<Tasks />} />
        <Route path="/inventory" element={<Inventory />} />
        <Route path="/finances" element={<Finances />} />
      </Routes>
      <Chatbot />
    </Router>
  );
}

export default App;
