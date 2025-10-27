import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';

import user from '../../assets/default_avatar.jpg';
import userAPI from '../../api/user.js';

function Header(){
    const navigate = useNavigate();
    const [profile, setProfile] = useState(null);

    function login(){
        navigate('/login');
    }

    useEffect(() => {
        // If we have an access token, try to fetch the current user's profile
        const token = (() => {
            try { return localStorage.getItem('accessToken'); } catch (e) { return null; }
        })();

        if (!token) return;

        let mounted = true;
        (async () => {
            try {
                const data = await userAPI.getPersonalInfo();
                if (mounted) setProfile(data);
            } catch (err) {
                // ignore fetch errors (user may be logged out / token expired)
                // eslint-disable-next-line no-console
                console.debug('Could not load personal info for header', err.message || err);
            }
        })();

        return () => { mounted = false; };
    }, []);

    const displayName = profile?.full_name ;
    const avatarSrc = profile?.avatar || user;

    return(
        <div className="bg-gradient-to-t fixed w-full left-0 h-[80px] top-0 flex items-center z-[1000] border-b-2 bg-slate-50">
            <h1 className=" text-[40px] font-bold ml-4 text-[#184172]">QLNS</h1>

            {!displayName ? (
                <button 
                    className="flex rounded-lg border-2 border-transparent absolute right-20 w-[150px] h-[50px] items-center justify-around"
                    onClick={login}  
                >
                    <h2 className="text-[22px] text-[#184172] font-bold">Đăng nhập</h2>
                </button>
            ) : (
                <div className="absolute right-20 flex items-center gap-3">
                    <img src={avatarSrc} alt="avatar" className="w-12 h-12 rounded-full object-cover" />
                    <span className="text-lg font-medium text-[#184172]">{displayName}</span>
                </div>
            )}
        </div>
    )
}

export default Header;