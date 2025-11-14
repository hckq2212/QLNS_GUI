import React, { useState } from "react";
import ChevronUp from '../../assets/chevron-up.png'
import ChevronDown from '../../assets/chevron-down.png'

export default function SideMenu () {
    const [opportunityList, setOpportunityList] = useState(false);
    const [contractList, setContractList] = useState(false);
    const [jobList, setJobList] = useState(false);
    const [projectList, setProjectList] = useState(false);
    const [serviceList, setServiceList] = useState(false);
    const [partnerList, setPartnerList] = useState(false);
    const [customerList, setCustomerList] = useState(false);

    const togglePartnerList = () => {
        setPartnerList(prevState => !prevState);
    };

    const toggleCustomerList = () => {
        setCustomerList(prevState => !prevState);
    };

    const toggleOpportunityList = () => {
        setOpportunityList(prevState => !prevState);
    };
    const toggleContractList = () => {
        setContractList(prevState => !prevState);
    };
    const toggleJobList = () => {
        setJobList(prevState => !prevState);
    };
    const toggleProjectList = () => {
        setProjectList(prevState => !prevState);
    };

    const toggleServiceList = () => {
        setServiceList(prevState => !prevState);
    };

    return (
        <div className="fixed left-0 w-[220px] bg-[#e7f1fd] top-[80px] bottom-0 shadow-md overflow-y-auto">
            <ul className="flex flex-col text-left p-0 m-0">
                <li className="p-4">
                    <a href="/" className="text-blue-600 text-lg font-semibold">Bảng điều khiển</a>
                </li>
                
                {/* Cơ hội */}
                <li className="p-4 cursor-pointer">
                    <div onClick={toggleOpportunityList} className="flex justify-between items-center">
                        <span className="text-blue-600 text-md font-semibold">Cơ hội</span>
                        {opportunityList ? <img src = {ChevronUp} /> : <img src = {ChevronDown } />}
                    </div>
                    {opportunityList && (
                        <ul className="p-2 flex flex-col gap-2">
                            <li><a href="/opportunity/create" className="text-blue-600">Tạo cơ hội</a></li>
                            <li><a href="/opportunity/me" className="text-blue-600">Cơ hội đã tạo</a></li>
                            <li><a href="/opportunity" className="text-blue-600">Danh sách cơ hội</a></li>
                        </ul>
                    )}
                </li>

                {/* Hợp đồng */}
                <li className="p-4 cursor-pointer">
                    <div onClick={toggleContractList} className="flex justify-between items-center">
                        <span className="text-blue-600 text-md font-semibold">Hợp đồng</span>
                        {contractList ? <img src = {ChevronUp} /> : <img src = {ChevronDown } />}
                    </div>
                    {contractList && (
                        <ul className="p-2 flex flex-col gap-2">
                            <li><a href="/contract" className="text-blue-600">Danh sách hợp đồng</a></li>
                        </ul>
                    )}
                </li>

                {/* Công việc */}
                <li className="p-4 cursor-pointer">
                    <div onClick={toggleJobList} className="flex justify-between items-center">
                        <span className="text-blue-600 text-md font-semibold">Công việc</span>
                        {jobList ? <img src = {ChevronUp} /> : <img src = {ChevronDown } />}
                    </div>
                    {jobList && (
                        <ul className="p-2 flex flex-col gap-2 ">
                            <li><a href="/job" className="text-blue-600">Danh sách công việc</a></li>
                        </ul>
                    )}
                </li>

                {/* Khách hàng */}
                <li className="p-4 cursor-pointer">
                    <div onClick={toggleCustomerList} className="flex justify-between items-center">
                        <span className="text-blue-600 text-md font-semibold">Khách hàng</span>
                        {contractList ? <img src = {ChevronUp} /> : <img src = {ChevronDown } />}
                    </div>
                    {customerList && (
                        <ul className="p-2 flex flex-col gap-2">
                            <li><a href="/customer" className="text-blue-600">Danh sách khách hàng</a></li>
                        </ul>
                    )}
                </li>
                
                {/* Dịch vụ */}
                <li className="p-4 cursor-pointer">
                    <div onClick={toggleServiceList} className="flex justify-between items-center">
                        <span className="text-blue-600 text-md font-semibold">Dịch vụ</span>
                        {serviceList ? <img src = {ChevronUp} /> : <img src = {ChevronDown } />}
                    </div>
                    {serviceList && (
                        <ul className="p-2 flex flex-col gap-2">
                            <li><a href="/service" className="text-blue-600">Danh sách dịch vụ</a></li>
                            <li><a href="/service/create" className="text-blue-600">Tạo dịch vụ</a></li>
                             <li><a href="/service-job" className="text-blue-600">Danh sách công việc của dịch vụ</a></li>
                            <li><a href="/service-job/create" className="text-blue-600">Tạo công việc của dịch vụ</a></li>
                        </ul>
                    )}
                </li>

                {/* Đối tác */}
                <li className="p-4 cursor-pointer">
                    <div onClick={togglePartnerList} className="flex justify-between items-center">
                        <span className="text-blue-600 text-md font-semibold">Đối tác</span>
                        {partnerList ? <img src = {ChevronUp} /> : <img src = {ChevronDown } />}
                    </div>
                    {partnerList && (
                        <ul className="p-2 flex flex-col gap-2">
                            <li><a href="/partner" className="text-blue-600">Danh sách đối tác</a></li>
                            <li><a href="/partner/create" className="text-blue-600">Tạo đối tác</a></li>
                        </ul>
                    )}
                </li>

                {/* Chương trình */}
                <li className="p-4 cursor-pointer">
                    <div onClick={toggleProjectList} className="flex justify-between items-center">
                        <span className="text-blue-600 text-md font-semibold">Dự án</span>
                        {projectList ? <img src = {ChevronUp} /> : <img src = {ChevronDown } />}
                    </div>
                    {projectList && (
                        <ul className="p-2 flex flex-col gap-2">
                            <li><a href="/project" className="text-blue-600">Danh sách dự án</a></li>
                            <li><a href="/project/assigning" className="text-blue-600">Danh sách dự án đợi chấp nhận</a></li>
                        </ul>
                    )}
                </li>
            </ul>
        </div>
    );
}
