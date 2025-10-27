import { useNavigate } from 'react-router-dom';
import React, { useEffect, useState } from 'react';
import api from '../../api/apiConfig.js';
import userImg from '../../assets/user.png';

function Header(){
    const navigate = useNavigate();
    const [profile, setProfile] = useState(null);

    function login(){
        navigate('/login');
    }

    useEffect(() => {
        // Try to load cached profile from localStorage
        const keys = ['user', 'profile', 'currentUser', 'me', 'userProfile'];
        let found = null;
        for (const k of keys) {
            try {
                const v = localStorage.getItem(k);
                if (v) {
                    const parsed = JSON.parse(v);
                    if (parsed && typeof parsed === 'object') { found = parsed; break; }
                }
            } catch (e) {
                // ignore parse errors
            }
        }
        if (found) {
            setProfile(found);
            return;
        }

        // If access token present, try fetching profile from API endpoints used by backend
        const token = (() => { try { return localStorage.getItem('accessToken'); } catch (e) { return null; } })();
        if (!token) return;

        let mounted = true;
        (async () => {
            const endpoints = ['/api/user/me', '/api/auth/me', '/api/profile/me'];
            for (const ep of endpoints) {
                try {
                    const res = await api.get(ep);
                    if (res && res.data && mounted) {
                        setProfile(res.data);
                        try { localStorage.setItem('userProfile', JSON.stringify(res.data)); } catch (e) {}
                        break;
                    }
                } catch (err) {
                    // try next
                }
            }
        })();
        return () => { mounted = false; };
    }, []);

    const displayName =  profile?.full_name  || null;
    const avatar = profile?.avatar || userImg;

    return(
        <div className="bg-gradient-to-t fixed w-full left-0 h-[80px] top-0 flex items-center z-[1000] border-b-2 bg-slate-50">
            <h1 className=" text-[40px] font-bold ml-4 text-[#184172]">QLNS</h1>
            {displayName ? (
                <button
                    className="flex items-center gap-3 absolute right-20 w-auto h-[50px] px-3"
                    onClick={() => navigate('/profile')}
                >
                    <img src={avatar} alt="avatar" className="w-10 h-10 rounded-full object-cover" />
                    <span className="text-[18px] font-medium text-[#184172]">{displayName}</span>
                </button>
            ) : (
                <button 
                    className="flex rounded-lg border-2 border-transparent absolute right-20 w-[150px] h-[50px] items-center justify-around"
                    onClick={login}  
                >
                    <h2 className="text-[22px] text-[#184172] font-bold">Đăng nhập</h2>
                </button>
            )}
        </div>
    )
}

export default Header;