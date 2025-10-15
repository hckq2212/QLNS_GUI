import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import './App.css'
import Home from './screens/Home'
import Login from './screens/Login'
import Opportunity from "./screens/Opportunity";
import Contracts from "./screens/Contracts";
import PendingOpportunities from "./screens/PendingOpportunities";
import ContractsHR from "./screens/ContractsHR";
import PriceQuote from "./screens/PriceQuote";

function App() {

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/opportunity" element={<Opportunity />} />
        <Route path="/contract" element={<Contracts />} />
        <Route path="/contracts/hr" element={<ContractsHR />} />
        <Route path="/opportunities/pending" element={<PendingOpportunities />} />
        <Route path="/quote" element={<PriceQuote />} />
      </Routes>
    </BrowserRouter>
  );
}
export default App
