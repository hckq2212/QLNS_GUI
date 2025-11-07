import React from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
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
import MyOpportunity from "./components/Opportunity/MyOpportunity";
import OpportunityDetail from "./components/Opportunity/OpportunityDetail";

function AppContent() {
  const location = useLocation();

  // Kiểm tra nếu đang ở trang login
  const isLoginPage = location.pathname === "/login";

  return (
    <>
      {!isLoginPage && <Header />}
      {!isLoginPage && <SideMenu />}

      <div className={!isLoginPage ? "ml-[220px] mt-[100px]" : ""}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/opportunity" element={<MyOpportunity />} />
          <Route path="/opportunity/:id" element={<OpportunityDetail />} />
          <Route path="/opportunity/create" element={<CreateOpportunity />} />
          <Route path="/contract" element={<Contracts />} />
          <Route path="/contracts/hr" element={<ContractsHR />} />
          <Route path="/project" element={<Project />} />
          <Route path="/job" element={<Jobs />} />
        </Routes>
      </div>
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Provider store={store}>
        <AppContent />
      </Provider>
    </BrowserRouter>
  );
}

export default App;
