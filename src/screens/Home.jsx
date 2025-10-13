import { useNavigate } from 'react-router-dom';

import Header from '../components/ui/Header.jsx';
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
  const navigate = useNavigate()
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header (fixed) */}
      <Header />

    </div>
  );
}
