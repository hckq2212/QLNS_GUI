import React from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import './App.css'
import Home from './screens/Home'
import Login from './screens/Login'
import ContractsHR from "./screens/ContractsHR";
import Project from "./screens/Project";
import Jobs from "./screens/Jobs";
import { store } from './app/store'
import { Provider } from 'react-redux';
import CreateOpportunity from "./components/Opportunity/CreateOpportunity";
import SideMenu from "./components/ui/SideMenu";
import Header from "./components/ui/Header";
import MyOpportunity from "./components/Opportunity/MyOpportunity";
import OpportunityDetail from "./components/Opportunity/OpportunityDetail";
import OpporunityList from "./components/Opportunity/OpporunityList";
import ContractList from "./components/Contract/ContractList";
import ContractDetail from "./components/Contract/ContractDetail";

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
          <Route path="/opportunity/me" element={<MyOpportunity />} />
          <Route path="/opportunity/:id" element={<OpportunityDetail />} />
          <Route path="/opportunity" element={<OpporunityList />} />

          <Route path="/opportunity/create" element={<CreateOpportunity />} />
          <Route path="/contract/:id" element={<ContractDetail />} />
          <Route path="/contract" element={<ContractList />} />
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
