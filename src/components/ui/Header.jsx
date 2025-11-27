import { useNavigate } from 'react-router-dom';
import { useMemo } from 'react';

import user from '../../assets/default_avatar.jpg';
import { useGetPersonalInfoQuery } from '../../services/user';

function Header(){
    const navigate = useNavigate();
    function login(){
        navigate('/login');
    }

    const token = useMemo(() => {
        try { return localStorage.getItem('accessToken'); } catch (e) { return null; }
    }, []);

    // Use RTK Query to fetch personal info; skip if no token present
    const { data: profile } = useGetPersonalInfoQuery(undefined, { skip: !token });

    const displayName = profile?.full_name;
    const avatarSrc = profile?.avatar || user;

    return(
        <div className="bg-gradient-to-t fixed w-full left-0 h-[80px] top-0 flex items-center z-[1000] border-b-2 bg-slate-50">
            <h1 className=" text-[40px] font-bold ml-4 text-blue-600">QLNS</h1>

            {!displayName ? (
                <button 
                    className="flex rounded-lg border-2 border-transparent absolute right-20 w-[150px] h-[50px] items-center justify-around"
                    onClick={login}  
                >
                    <h2 className="text-[22px] text-blue-600 font-bold">Đăng nhập</h2>
                </button>
            ) : (
                <div className="absolute right-20 flex items-center gap-3">
                    <img src={avatarSrc} alt="avatar" className="w-12 h-12 rounded-full object-cover" />
                    <span className="text-lg font-medium text-blue-600">{displayName}</span>
                </div>
            )}
        </div>
    )
}

export default Header;