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
import CreateOpportunity from "./components/Opportunity/CreateOpportunity";
import SideMenu from "./components/ui/SideMenu";
import Header from "./components/ui/Header";

function App() {

  return (
    <BrowserRouter>
      <Provider store = {store}>
        <Header />
        <SideMenu />
        <div className="ml-[17%] mt-[100px]">
          <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/opportunity" element={<Opportunity />} />
          <Route path="/opportunity/create" element={<CreateOpportunity />} />
          <Route path="/contract" element={<Contracts />} />
          <Route path="/contracts/hr" element={<ContractsHR />} />
          <Route path="/project" element={<Project />} />
          <Route path="/job" element={<Jobs />} />
        </Routes>
        </div>
      </Provider>
    </BrowserRouter>
  );
} 
export default App
