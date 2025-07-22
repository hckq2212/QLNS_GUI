import React from "react";
import user from '../assets/user.png'
import cart from '../assets/cart.png'
import search from '../assets/search.png'
import banner from '../assets/banner.png'
import laptop from '../assets/laptop.png'
import monitor from '../assets/monitor.png'
import keyboard from '../assets/keyboard.png'
import mouse from '../assets/mouse.png'
import headset from '../assets/headset.png'
import { FixedSizeGrid as Grid } from 'react-window';
import phone from '../assets/phone.png'
import mail from '../assets/mail.png'
import location from'../assets/location.png'

const products = [
  {
    id:1,
    image: 'https://cdn.tgdd.vn/Products/Images/42/332937/oppo-reoo13-pro-5g-purple-thumbnew-600x600.jpg',
    price: 400,
    name: 'Samsung Galaxy Fold '

  },
    {
    id:2,
    image: 'https://cdn.tgdd.vn/Products/Images/42/332937/oppo-reoo13-pro-5g-purple-thumbnew-600x600.jpg',
    price: 400,
    name: 'Samsung Galaxy Fold '

  },
      {
    id:3,
    image: 'https://cdn.tgdd.vn/Products/Images/42/332937/oppo-reoo13-pro-5g-purple-thumbnew-600x600.jpg',
    price: 400,
    name: 'Samsung Galaxy Fold '

  },
      {
    id:4,
    image: 'https://cdn.tgdd.vn/Products/Images/42/332937/oppo-reoo13-pro-5g-purple-thumbnew-600x600.jpg',
    price: 400,
    name: 'Samsung Galaxy Fold '

  },
      {
    id:5,
    image: 'https://cdn.tgdd.vn/Products/Images/42/332937/oppo-reoo13-pro-5g-purple-thumbnew-600x600.jpg',
    price: 400,
    name: 'Samsung Galaxy Fold '

  },
      {
    id:6,
    image: 'https://cdn.tgdd.vn/Products/Images/42/332937/oppo-reoo13-pro-5g-purple-thumbnew-600x600.jpg',
    price: 400,
    name: 'Samsung Galaxy Fold '

  },
      {
    id:7,
    image: 'https://cdn.tgdd.vn/Products/Images/42/332937/oppo-reoo13-pro-5g-purple-thumbnew-600x600.jpg',
    price: 400,
    name: 'Samsung Galaxy Fold '

  },
      {
    id:8,
    image: 'https://cdn.tgdd.vn/Products/Images/42/332937/oppo-reoo13-pro-5g-purple-thumbnew-600x600.jpg',
    price: 400,
    name: 'Samsung Galaxy Fold '

  },
        {
    id:9,
    image: 'https://cdn.tgdd.vn/Products/Images/42/332937/oppo-reoo13-pro-5g-purple-thumbnew-600x600.jpg',
    price: 400,
    name: 'Samsung Galaxy Fold '

  },
        {
    id:10,
    image: 'https://cdn.tgdd.vn/Products/Images/42/332937/oppo-reoo13-pro-5g-purple-thumbnew-600x600.jpg',
    price: 400,
    name: 'Samsung Galaxy Fold '

  },

]

const COLUMN_COUNT = 5;
const ROW_COUNT = Math.ceil(products.length / COLUMN_COUNT);

function TrendingList() {
  return (
    <Grid
      columnCount={COLUMN_COUNT}
      rowCount={ROW_COUNT}
      columnWidth={270}   // Item width (incl. margin/padding if needed)
      rowHeight={350}     // Item height
      width={COLUMN_COUNT * 270 } 
      height={700}        // Grid viewport height
    >
      {({ columnIndex, rowIndex, style }) => {
        const itemIndex = rowIndex * COLUMN_COUNT + columnIndex;
        const item = products[itemIndex];
        if (!item) return null; // No item for this cell (last row may be incomplete)
        return (
          <div style={style} key={item.id} className="flex flex-col items-center border bg-white rounded-lg  ">
            <img src={item.image} alt={item.name} className="w-[180px] h-[200px] mt-4" />
            <div className="mt-5 flex items-start flex-col w-[80%]">
              <div className="font-bold text-[18px]">{item.name}</div>
              <div className="text-red-600 font-bold text-[18px]">${item.price}</div>
              <div className="text-blue-500">Add to cart</div>
            </div>
          </div>
        );
      }}
    </Grid>
  );
}

export default function Home() {
  return (
    <>  
      {/* Header */}
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
          <button className="flex rounded-lg border-2 border-transparent absolute right-20 w-[150px] h-[50px] items-center justify-around bg-red-400 hover:bg-red-700">
            <h2 className="text-[22px] text-stone-100 font-bold">Log in</h2>
            <img src={user} alt="user" className="w-[30px] h-[30px]" />
          </button>
      </div>

      {/* Banner */}
      <div className="self-center flex justify-center w-full mt-20">
        <img src={banner} alt="" className="w-[80%] h-[600px] mt-20 rounded-lg" />
      </div>

      {/* Categories */}
      <div className="mt-20 flex items-center justify-center w-[90%] mx-auto ">
        <div className="flex flex-col items-center justify-around  border w-[240px] h-[300px] shadow-lg rounded-lg bg-gray-50 shadow-black/50  hover:bg-[#fffcf2]">
          <img src={laptop} alt="" className="w-[100px] h-[100px]"/>
          <h3 className="text-[25px] font-bold ">Laptop</h3>
        </div>
         <div className="flex flex-col items-center justify-around  border w-[240px] h-[300px] shadow-lg ml-10 rounded-lg  bg-gray-50 shadow-black/50  hover:bg-[#fffcf2]">
          <img src={monitor} alt="" className="w-[100px] h-[100px]"/>
          <h3 className="text-[25px] font-bold  ">Monitor</h3>
        </div>
         <div className="flex flex-col items-center justify-around  border w-[240px] h-[300px] shadow-lg ml-10 rounded-lg  bg-gray-50 shadow-black/50  hover:bg-[#fffcf2]">
          <img src={keyboard} alt="" className="w-[100px] h-[100px]"/>
          <h3 className="text-[25px] font-bold ">Keyboard</h3>
        </div>
        <div className="flex flex-col items-center justify-around  border w-[240px] h-[300px] shadow-lg ml-10 rounded-lg  bg-gray-50 shadow-black/50  hover:bg-[#fffcf2]">
          <img src={mouse} alt="" className="w-[100px] h-[100px]"/>
          <h3 className="text-[25px] font-bold ">Mouse</h3>
        </div>
        <div className="flex flex-col items-center justify-around  border w-[240px] h-[300px] shadow-lg ml-10 rounded-lg  bg-gray-50 shadow-black/50  hover:bg-[#fffcf2]">
          <img src={headset} alt="" className="w-[100px] h-[100px]"/>
          <h3 className="text-[25px] font-bold">Headset</h3>
        </div>
      </div>
      {/* Trending */}
      <div className="w-[80%] mt-20 h-auto flex mx-auto flex-col items-start">
        <h2 className="text-[30px] font-bold mb-10">Trending Now</h2>
        <div className="mx-auto w-[85%]">
          <TrendingList />
        </div>
      </div>

      {/* Footer */}
      <div className="w-full h-[400px] bg-gradient-to-b from-gray-600 to-gray-500 mt-10 ">
        <div className="absolute left-20 mt-10 w-[50%] flex flex-col">
          <h2 className="text-[25px] text-white self-start">Contacts:</h2>
          <div className="flex w-[250px] text-[20px] text-white mt-5 items-center">
            <img src={phone} alt="" className="mr-3 w-[20px] h-[20px]" />
            Hotline: 0923090945
          </div>
          <div className="flex w-[300px] text-[20px] text-white mt-5 items-center">
            <img src={mail} alt="" className="mr-3 w-[20px] h-[20px]" />
            E-mail: hckq2212@gmail.com
          </div>
          <div className="flex w-[300px] text-[20px] text-white mt-5 items-center">
            <img src={location} alt="" className="mr-3 w-[20px] h-[20px]" />
            Location: 281 Le Van Sy
          </div>
        </div>
      </div>
    </>
  );
}
