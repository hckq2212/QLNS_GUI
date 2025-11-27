import { useNavigate } from 'react-router-dom';
import { useMemo, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';

import user from '../../assets/default_avatar.jpg';
import { useGetPersonalInfoQuery } from '../../services/user';
import { setCredentials } from '../../features/auth/authSlice';

function Header(){
    const navigate = useNavigate();
    function login(){
        navigate('/login');
    }

        const dispatch = useDispatch();

        const token = useMemo(() => {
                try { return localStorage.getItem('accessToken'); } catch (e) { return null; }
        }, []);

        // prefer profile from auth slice (persisted on login); avoids refetch on route changes
        const storedUser = useSelector((s) => s.auth?.user);

        // Use RTK Query to fetch personal info only when we don't have it in the auth slice
        const { data: fetchedProfile } = useGetPersonalInfoQuery(undefined, { skip: !token || !!storedUser, refetchOnMountOrArgChange: false });

        // when we fetch profile and auth slice is empty, persist it to auth slice so subsequent mounts read from store
        useEffect(() => {
            if (fetchedProfile && !storedUser) {
                try {
                    dispatch(setCredentials({ accessToken: token, user: fetchedProfile }));
                } catch (e) {
                    // ignore
                }
            }
        }, [fetchedProfile, storedUser, dispatch, token]);

        const profile = storedUser || fetchedProfile || null;
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