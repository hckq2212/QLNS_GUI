import React from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import './App.css'
import Home from './screens/Home'
import Login from './screens/Login'
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
import ProjectList from "./components/Project/ProjectList";
import ProjectDetail from "./components/Project/ProjectDetail";
import ServiceJobList from "./components/Service Job/ServiceJobList";
import ServiceList from "./components/Service/ServiceList";
import ServiceJobDetail from "./components/Service Job/ServiceJobDetail";
import CreateServiceJob from "./components/Service Job/CreateServiceJob";
import PartnerList from "./components/Partner/PartnerList";
import CreatePartner from "./components/Partner/CreatePartner";
import PartnerDetail from "./components/Partner/PartnerDetail";
import CreateService from "./components/Service/CreateService";
import ServiceDetail from "./components/Service/ServiceDetail";
import AssigningProject from "./components/Project/AssigningProject";
import JobDetail from "./components/Job/JobDetail";
import MyJob from "./components/Job/MyJob";
import ReviewProject from "./components/Review/ReviewProject";
import ReviewDetail from "./components/Review/ReviewDetail";
import ReviewService from "./components/Review/ReviewService";

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
          <Route path="/project/:id" element={<ProjectDetail />} />
          <Route path="/project/assigning" element={<AssigningProject />} />
          <Route path="/project" element={<ProjectList />} />
          <Route path="/service/:id" element={<ServiceDetail />} />
          <Route path="/service" element={<ServiceList />} />
          <Route path="/service/create" element={<CreateService />} />
          <Route path="/service-job/:id" element={<ServiceJobDetail />} />
          <Route path="/service-job/create" element={<CreateServiceJob />} />
          <Route path="/service-job" element={<ServiceJobList />} />
          <Route path="/partner/:id" element={<PartnerDetail />} />
          <Route path="/partner" element={<PartnerList />} />
          <Route path="/partner/create" element={<CreatePartner />} />
          <Route path="/job/me" element={<MyJob />} />
          <Route path="/job/:id" element={<JobDetail />} />
          <Route path="/review/:id" element={<ReviewDetail />} />
          <Route path="/review/service/:id" element={<ReviewService />} />
          <Route path="/review" element={<ReviewProject />} />



          
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
