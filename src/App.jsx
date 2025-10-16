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
import CreateConFromOppo from "./screens/createConFromOppo";

function App() {

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/opportunity" element={<Opportunity />} />
        <Route path="/contract" element={<Contracts />} />
        <Route path="/contracts/hr" element={<ContractsHR />} />
        <Route path="/opportunity/pending" element={<PendingOpportunities />} />
        <Route path="/quote" element={<PriceQuote />} />
        <Route path="/opportunity/create-contract" element={<CreateConFromOppo />} />
      </Routes>
    </BrowserRouter>
  );
}
export default App
