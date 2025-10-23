import React from "react";

export default function SideMenu () {
    return (
        <div
            className="fixed left-0 w-[15%] bg-[#e7f1fd] top-[80px] h-[100%]"
        >
           <ul className="flex flex-col gap-[1rem] text-left">
                <li className=" p-6 "><a href="/opportunity" className="text-[#184172] text-2xl">Cơ hội</a></li>
                <li className=" p-6 "><a href="/contract"  className="text-[#184172] text-2xl">Hợp đồng</a></li>
                <li className=" p-6 "><a href="/project"  className="text-[#184172] text-2xl">Dự án</a></li>
                <li className=" p-6 "><a href="/job"  className="text-[#184172] text-2xl">Công việc</a></li>
           </ul>
        </div>
    )
}