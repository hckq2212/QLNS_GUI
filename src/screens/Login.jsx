import React, { useState, useEffect } from 'react';
import username from '../assets/username.png';
import password from '../assets/password.png';
import login from '../assets/login.png';
import email from '../assets/email.png'
import authAPI from '../api/auth.js'
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [activeTab, setActiveTab] = useState('login'); 
  const [form, setForm] = useState({ username: '', password: '', fullName: '', email: '', phoneNumber: '' });
  const [message, setMessage] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const navigate = useNavigate()

  // Reset form fields and messages whenever user switches between Login/Sign up tabs
  useEffect(() => {
    setForm({ username: '', password: '', fullName: '', email: '', phoneNumber: '' });
    setMessage('');
  }, [activeTab]);

  async function handleSubmit(e) {
    e.preventDefault();
      if (activeTab == 'login'){
        try {
          const payload = { username: form.username, password: form.password };
          console.log('Login payload:', payload);
          const data = await authAPI.login(payload);
          console.log('login success', data);
          setMessage('Đăng nhập thành công');
          setErrorMsg('');
          // only navigate after access token is set (authAPI.login throws if no token)
          navigate('/');
      } catch (err) {
          console.error('login failed', err?.response?.status, err?.response?.data || err.message);
          const msg = err?.response?.data?.error || err.message || 'Login failed';
          setErrorMsg(msg);
      }
  } else if (activeTab !== 'login') {
        try {
          const payload = {
            username: form.username,
            password: form.password,
            fullName: form.fullName,
            phoneNumber: form.phoneNumber,
            email: form.email,
          };
          console.log('Register payload:', payload);
          const data = await authAPI.register(payload);
          console.log('Register success', data);
            // switch to login tab and clear the form via state setters
            setActiveTab('login');
            setForm({ username: '', password: '', fullName: '', email: '', phoneNumber: '' });
            setMessage('Registration successful — please log in');
        } catch (err) {
            console.error('Register failed', err?.response?.status, err?.response?.data || err.message);
            const msg = err?.response?.data?.error || err.message || 'Register failed';
            setErrorMsg(msg);
        }
    }
  }

  return(
    <form action="" onSubmit={handleSubmit}>
      <div className='w-screen h-screen flex items-center justify-center border bg-[#fffcf2]'>
        <div className="border w-[40rem] absolute top-20 flex flex-col bg-gray-50 border-stone-500 rounded-lg h-fit pb-10 ">
          {message && <div className="p-2 text-green-700">{message}</div>}
          {errorMsg && <div className="p-2 text-red-700">{errorMsg}</div>}
          
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
                    value={form.username}
                    onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                    className="w-full h-[50px] border pl-12 rounded-md hover:bg-sky-100 hover:border-white hover:border-10"
                  />            
                </div>
                <div className='relative w-[75%] h-[50px] mx-auto mt-10'>
                  <img src={password} alt="" className='absolute left-3 top-1/2 transform -translate-y-1/2 w-6 h-6 opacity-70'/>
                  <input 
                    type="password" placeholder="Password" name="password"
                    value={form.password}
                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                    className="w-full h-[50px] border pl-12 rounded-md hover:bg-sky-100 hover:border-white hover:border-10"
                  />            
                </div>
              </div>
              <div className='w-full flex justify-center'>
                <button type="submit" className='mt-12 bg-sky-100 w-20 h-20 rounded-full flex justify-center items-center hover:bg-[#54A2D2] border'>
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
                <div className='relative w-[75%] h-[50px] mx-auto mb-10'>
                  <img src={email} alt="" className='absolute left-3 top-1/2 transform -translate-y-1/2 w-6 h-6 opacity-70'/>
                  <input 
                    type="text" placeholder="Họ và tên" name="fullName"
                    value={form.fullName}
                    onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))}
                    className="w-full h-[50px] border pl-12 rounded-md hover:bg-sky-100 hover:border-white hover:border-10"
                  />            
                </div>
                <div className='relative w-[75%] h-[50px] mx-auto'>
                  <img src={username} alt="" className='absolute left-3 top-1/2 transform -translate-y-1/2 w-6 h-6 opacity-70'/>
                  <input 
                    type="text" placeholder="Username" name="username"
                    value={form.username}
                    onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                    className="w-full h-[50px] border pl-12 rounded-md hover:bg-sky-100 hover:border-white hover:border-10"
                  />            
                </div>
                <div className='relative w-[75%] h-[50px] mx-auto mt-10'>
                  <img src={password} alt="" className='absolute left-3 top-1/2 transform -translate-y-1/2 w-6 h-6 opacity-70'/>
                  <input 
                    type="password" placeholder="Password" name="password"
                    value={form.password}
                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                    className="w-full h-[50px] border pl-12 rounded-md hover:bg-sky-100 hover:border-white hover:border-10"
                  />            
                </div>
                <div className='relative w-[75%] h-[50px] mx-auto mt-10'>
                  <img src={email} alt="" className='absolute left-3 top-1/2 transform -translate-y-1/2 w-6 h-6 opacity-70'/>
                  <input 
                    type="email" placeholder="Email" name="email"
                    value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    className="w-full h-[50px] border pl-12 rounded-md hover:bg-sky-100 hover:border-white hover:border-10"
                  />            
                </div>
                <div className='relative w-[75%] h-[50px] mx-auto mt-10'>
                  <img src={email} alt="" className='absolute left-3 top-1/2 transform -translate-y-1/2 w-6 h-6 opacity-70'/>
                  <input 
                    type="number" placeholder="Số điện thoại" name="phoneNumber"
                    value={form.phoneNumber}
                    onChange={e => setForm(f => ({ ...f, phoneNumber: e.target.value }))}
                    className="w-full h-[50px] border pl-12 rounded-md hover:bg-sky-100 hover:border-white hover:border-10"
                  />            
                </div>
              </div>
                <div className='w-full flex justify-center'>
                <button type="submit" className='mt-12 bg-sky-100 w-20 h-20 rounded-full flex justify-center items-center hover:bg-[#54A2D2] border'>
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
