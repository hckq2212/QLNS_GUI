import React, { useState } from 'react';
import username from '../assets/username.png';
import password from '../assets/password.png';
import login from '../assets/login.png';
import email from '../assets/email.png'

export default function Login() {
  const [activeTab, setActiveTab] = useState('login'); 

  return(
    <form action="">
      <div className='w-screen h-screen flex items-center justify-center border bg-[#fffcf2]'>
        <div className="border w-[40rem] h-[800px] absolute top-20 flex flex-col bg-gray-50 border-stone-500 rounded-lg">
          
          <div className="flex justify-between w-full">
            <button
              type="button"
              onClick={() => setActiveTab('login')} 
              className={`flex justify-center items-center border w-[50%] h-[60px] text-[20px]  ${activeTab === 'login' ? 'bg-white font-bold' : ''}`}
            >
              Log in
            </button>
            <button 
              type="button"
              onClick={() => setActiveTab('signup')} 
              className={`flex justify-center items-center border w-[50%] h-[60px] text-[20px]  ${activeTab === 'signup' ? 'bg-white font-bold' : ''}`}
            >
              Sign up
            </button>
          </div>
          
          {/* Login Form */}
          {activeTab === 'login' && (
            <div className="mt-20">
              <div className="text-[50px] font-bold">
                Log in
              </div>
              <div className="mt-14">
                <div className='relative w-[75%] h-[50px] mx-auto'>
                  <img src={username} alt="" className='absolute left-3 top-1/2 transform -translate-y-1/2 w-6 h-6 opacity-70'/>
                  <input 
                    type="text" placeholder="Username" name="username"
                    className="w-full h-[50px] border pl-12 rounded-md hover:bg-sky-100 hover:border-white hover:border-10"
                  />            
                </div>
                <div className='relative w-[75%] h-[50px] mx-auto mt-10'>
                  <img src={password} alt="" className='absolute left-3 top-1/2 transform -translate-y-1/2 w-6 h-6 opacity-70'/>
                  <input 
                    type="password" placeholder="Password" name="password"
                    className="w-full h-[50px] border pl-12 rounded-md hover:bg-sky-100 hover:border-white hover:border-10"
                  />            
                </div>
              </div>
              <div className='w-full flex justify-center'>
                <button className='mt-12 bg-sky-100 w-20 h-20 rounded-full flex justify-center items-center hover:bg-[#54A2D2] border'>
                  <img src={login} alt="" className='w-[30px] h-[30px] opacity-50 hover:opacity-100' />
                </button>
              </div>
            </div>
          )}
          
          {/* Sign Up Form */}
          {activeTab === 'signup' && (
            <div className="mt-20">
              <div className="text-[50px] font-bold">
                Sign up
              </div>
              <div className="mt-14">
                <div className='relative w-[75%] h-[50px] mx-auto'>
                  <img src={username} alt="" className='absolute left-3 top-1/2 transform -translate-y-1/2 w-6 h-6 opacity-70'/>
                  <input 
                    type="text" placeholder="Username" name="username"
                    className="w-full h-[50px] border pl-12 rounded-md hover:bg-sky-100 hover:border-white hover:border-10"
                  />            
                </div>
                <div className='relative w-[75%] h-[50px] mx-auto mt-10'>
                  <img src={password} alt="" className='absolute left-3 top-1/2 transform -translate-y-1/2 w-6 h-6 opacity-70'/>
                  <input 
                    type="password" placeholder="Password" name="password"
                    className="w-full h-[50px] border pl-12 rounded-md hover:bg-sky-100 hover:border-white hover:border-10"
                  />            
                </div>
                <div className='relative w-[75%] h-[50px] mx-auto mt-10'>
                  <img src={email} alt="" className='absolute left-3 top-1/2 transform -translate-y-1/2 w-6 h-6 opacity-70'/>
                  <input 
                    type="email" placeholder="Email" name="email"
                    className="w-full h-[50px] border pl-12 rounded-md hover:bg-sky-100 hover:border-white hover:border-10"
                  />            
                </div>
              </div>
              <div className='w-full flex justify-center'>
                <button className='mt-12 bg-sky-100 w-20 h-20 rounded-full flex justify-center items-center hover:bg-[#54A2D2] border'>
                  <img src={login} alt="" className='w-[30px] h-[30px] opacity-50 hover:opacity-100' />
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </form>
  )
}
