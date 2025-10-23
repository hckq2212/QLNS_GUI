
import React, { useState } from 'react';
import CreateOpportunity from '../components/Opportunity/CreateOpportunity.jsx';
import PendingOpportunities from '../components/Opportunity/PendingOpportunities.jsx';
import Header from '../components/ui/Header.jsx'
import SideMenu from '../components/ui/SideMenu.jsx';
import PriceQuote from '../components/Opportunity/PriceQuote.jsx'


export default function Opportunity() {
    const [view, setView] = useState('create'); 

    return(
        <div>
            <Header />
            <SideMenu />
            <div className='mt-[80px]'>
                <div className="max-w-4xl mx-auto px-4 py-3 flex gap-3">
                    <button
                        type="button"
                        onClick={() => setView('create')}
                        className={`px-4 py-2 rounded ${view === 'create' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-800'}`}
                    >
                        Tạo cơ hội
                    </button>
                    <button
                        type="button"
                        onClick={() => setView('pending')}
                        className={`px-4 py-2 rounded ${view === 'pending' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-800'}`}
                    >
                        Các cơ hội chờ duyệt
                    </button>
                    <button
                        type="button"
                        onClick={() => setView('quote')}
                        className={`px-4 py-2 rounded ${view === 'quote' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-800'}`}
                    >
                        Cơ hội chờ báo giá
                    </button>
                </div>

                <div className='overflow-hidden'>
                    {view === 'create' && <CreateOpportunity />}
                    {view === 'pending' && <PendingOpportunities />}
                    {view === 'quote' && <PriceQuote />}
                </div>
            </div>
        </div>
    )

}