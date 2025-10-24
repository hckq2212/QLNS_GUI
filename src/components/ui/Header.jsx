import { useNavigate } from 'react-router-dom';
import search from '../../assets/search.png';
import cart from '../../assets/cart.png';
import user from '../../assets/user.png';

function Header(){
    const navigate = useNavigate();
    function login(){
        navigate('/login');
    }
    return(
        <div className="bg-gradient-to-t fixed w-full left-0 h-[80px] top-0 flex items-center z-[1000] border-b-2 bg-slate-50">
            <h1 className=" text-[40px] font-bold ml-6 text-[#184172]">QLNS</h1>        
            <button 
                className="flex rounded-lg border-2 border-transparent absolute right-20 w-[150px] h-[50px] items-center justify-around bg-red-400 hover:bg-red-700"
                onClick={login}  
            >
                <h2 className="text-[22px] text-stone-100 font-bold">Log in</h2>
                <img src={user} alt="user" className="w-[30px] h-[30px]" />
            </button>
        </div>
    )
}

export default Header;