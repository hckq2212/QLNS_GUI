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
        <div className="bg-gradient-to-t from-red-600 to-red-400 fixed w-full left-0 h-[100px] top-0 flex items-center z-[1000]">
            <h1 className="text-stone-100 text-[40px] font-bold ml-20">TechGear</h1>
            <div className="flex items-center ml-10 relative">
                <img src={search} alt="" className="w-[25px] absolute left-3 " />
                <input
                className="h-[40px] w-[350px] rounded-lg pl-12 placeholder:text-lg" 
                placeholder="What you want to buy"/>
            </div>         
            <button className="flex rounded-lg border-2 border-transparent absolute right-60 w-[150px] h-[50px] items-center justify-around bg-red-400 mr-7 hover:bg-red-700">
                <h2 className="text-[22px] text-stone-100 font-bold">Cart</h2>
                <img src={cart} alt="cart" className="w-[30px] h-[30px]" />
            </button>
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