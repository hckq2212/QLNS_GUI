import React, { useState } from "react";
import { FaChevronDown, FaChevronUp } from "react-icons/fa"; // Sử dụng icon từ react-icons

export default function SideMenu () {
    const [opportunityList, setOpportunityList] = useState(false);
    const [contractList, setContractList] = useState(false);
    const [jobList, setJobList] = useState(false);
    const [projectList, setProjectList] = useState(false);

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

    return (
        <div className="fixed left-0 w-[220px] bg-[#e7f1fd] top-[80px] h-[100%] shadow-md">
            <ul className="flex flex-col text-left p-4">
                <li className="p-4">
                    <a href="/" className="text-[#184172] text-lg font-semibold">Bảng điều khiển</a>
                </li>
                
                {/* Cơ hội */}
                <li className="p-4 cursor-pointer">
                    <div onClick={toggleOpportunityList} className="flex justify-between items-center">
                        <span className="text-[#184172] text-md font-semibold">Cơ hội</span>
                        {opportunityList ? <FaChevronUp /> : <FaChevronDown />}
                    </div>
                    {opportunityList && (
                        <ul className="p-2 flex flex-col gap-2">
                            <li><a href="/opportunity/create" className="text-[#184172]">Tạo cơ hội</a></li>
                            <li><a href="/opportunity" className="text-[#184172]">Danh sách cơ hội</a></li>
                        </ul>
                    )}
                </li>

                {/* Công việc */}
                <li className="p-4 cursor-pointer">
                    <div onClick={toggleJobList} className="flex justify-between items-center">
                        <span className="text-[#184172] text-md font-semibold">Công việc</span>
                        {jobList ? <FaChevronUp /> : <FaChevronDown />}
                    </div>
                    {jobList && (
                        <ul className="p-2 flex flex-col gap-2 ">
                            <li><a href="/jobs" className="text-[#184172]">Danh sách công việc</a></li>
                        </ul>
                    )}
                </li>

                {/* Khách hàng */}
                <li className="p-4 cursor-pointer">
                    <div onClick={toggleContractList} className="flex justify-between items-center">
                        <span className="text-[#184172] text-md font-semibold">Khách hàng</span>
                        {contractList ? <FaChevronUp /> : <FaChevronDown />}
                    </div>
                    {contractList && (
                        <ul className="p-2 flex flex-col gap-2">
                            <li><a href="/customers" className="text-[#184172]">Danh sách khách hàng</a></li>
                        </ul>
                    )}
                </li>


                {/* Chương trình */}
                <li className="p-4 cursor-pointer">
                    <div onClick={toggleProjectList} className="flex justify-between items-center">
                        <span className="text-[#184172] text-md font-semibold">Chương trình</span>
                        {projectList ? <FaChevronUp /> : <FaChevronDown />}
                    </div>
                    {projectList && (
                        <ul className="p-2 flex flex-col gap-2">
                            <li><a href="/projects" className="text-[#184172]">Danh sách chương trình</a></li>
                        </ul>
                    )}
                </li>
            </ul>
        </div>
    );
}
