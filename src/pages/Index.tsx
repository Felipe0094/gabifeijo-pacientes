import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from '../components/Dashboard';
import PatientList from '../components/PatientList';
import PatientProfile from '../components/PatientProfile';
import AddPatient from '../components/AddPatient';
import ImportCSVPage from '../components/ImportCSVPage';
import Navigation from '../components/Navigation';

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-white">
      <Navigation />
      <main className="container mx-auto px-4 py-8 pt-20">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/patients" element={<PatientList />} />
          <Route path="/patients/:id" element={<PatientProfile />} />
          <Route path="/add-patient" element={<AddPatient />} />
          <Route path="/import-csv" element={<ImportCSVPage />} />
        </Routes>
      </main>
    </div>
  );
};

export default Index;
