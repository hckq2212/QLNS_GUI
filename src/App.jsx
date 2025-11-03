import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import './App.css'
import Home from './screens/Home'
import Login from './screens/Login'
import Opportunity from "./screens/Opportunity";
import Contracts from "./screens/Contracts";
import ContractsHR from "./screens/ContractsHR";
import CreateConFromOppo from "./components/Opportunity/CreateConFromOppo";
import Project from "./screens/Project";
import Jobs from "./screens/Jobs";
import { store } from './app/store'
import { Provider } from 'react-redux';


function App() {

  return (
    <BrowserRouter>
      <Provider store = {store}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/opportunity" element={<Opportunity />} />
          <Route path="/contract" element={<Contracts />} />
          <Route path="/contracts/hr" element={<ContractsHR />} />
          <Route path="/opportunity/create-contract" element={<CreateConFromOppo />} />
          <Route path="/project" element={<Project />} />
          <Route path="/job" element={<Jobs />} />
        </Routes>
      </Provider>
    </BrowserRouter>
  );
} 
export default App
