'use client';
// The exported code uses Tailwind CSS. Install Tailwind CSS in your dev environment to ensure all styles work.
import React, { useState, useEffect, useRef } from 'react';
import * as echarts from 'echarts';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Autoplay } from 'swiper/modules';
import "@fortawesome/fontawesome-free/css/all.min.css";
import { useRouter } from 'next/navigation'; 
import ChatbotWidget from '../components/Chatbot';
const App: React.FC = () => {
const [showBalance, setShowBalance] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [isChatOpen, setIsChatOpen] = useState(false);
  
  const chartRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  // Fix for NextRouter issue by ensuring component only renders after mounting
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleOptionClick = (path: string) => {
    if (mounted) {
      router.push(path);
    }
  };

  const toggleChat = () => {
    setIsChatOpen(!isChatOpen);
  };const transactions = [
{
id: 1,
merchant: 'Amazon Prime',
amount: -299.99,
category: 'Shopping',
date: '2025-03-16 14:30',
icon: 'fa-shopping-cart'
},
{
id: 2,
merchant: 'Netflix Subscription',
amount: -15.99,
category: 'Entertainment',
date: '2025-03-15 09:45',
icon: 'fa-film'
},
{
id: 3,
merchant: 'Salary Deposit',
amount: 5000.00,
category: 'Income',
date: '2025-03-14 00:00',
icon: 'fa-money-bill-wave'
},
{
id: 4,
merchant: 'Starbucks Coffee',
amount: -6.75,
category: 'Food & Drinks',
date: '2025-03-13 08:15',
icon: 'fa-coffee'
},
{
id: 5,
merchant: 'Investment Return',
amount: 750.25,
category: 'Investment',
date: '2025-03-12 16:20',
icon: 'fa-chart-line'
}
];
useEffect(() => {
if (chartRef.current) {
const chart = echarts.init(chartRef.current);
const option = {
animation: false,
tooltip: {
trigger: 'item'
},
legend: {
top: '5%',
left: 'center',
textStyle: {
color: '#fff'
}
},
series: [
{
name: 'Expenses by Category',
type: 'pie',
radius: ['40%', '70%'],
avoidLabelOverlap: false,
itemStyle: {
borderRadius: 10,
borderColor: '#0a0a0f',
borderWidth: 2
},
label: {
show: false,
position: 'center'
},
emphasis: {
label: {
show: true,
fontSize: 20,
fontWeight: 'bold'
}
},
labelLine: {
show: false
},
data: [
{ value: 1048, name: 'Shopping', itemStyle: { color: '#00F0FF' } },
{ value: 735, name: 'Entertainment', itemStyle: { color: '#B026FF' } },
{ value: 580, name: 'Food & Drinks', itemStyle: { color: '#FF2E6C' } },
{ value: 484, name: 'Investment', itemStyle: { color: '#FFD700' } },
{ value: 300, name: 'Others', itemStyle: { color: '#4CAF50' } }
]
}
]
};
chart.setOption(option);
 const handleResize = () => {
        chart.resize();
      };
      
      window.addEventListener('resize', handleResize);
      
return () => {
        chart.dispose();
        window.removeEventListener('resize', handleResize);
      };
    }
  }, [mounted]);
if (!mounted) {
    return null; // Return empty until client-side hydration completes
  }

return (
<div className="min-h-screen bg-[#0A0A0F] text-white p-8">
<div className="max-w-[1440px] mx-auto">
{/* Header */}
<header className="flex justify-between items-center mb-8">
<div className="flex items-center gap-4">
<img
src="https://public.readdy.ai/ai/img_res/fccc00afc8cf87fecfa7ee277260bd9a.jpg"
alt="Logo"
className="w-12 h-12 rounded-full"
/>
<h1 className="text-3xl font-bold bg-gradient-to-r from-[#00F0FF] to-[#B026FF] bg-clip-text text-transparent">
Cyber Finance
</h1>
</div>
<div className="flex items-center gap-6">
<button className="!rounded-button text-[#00F0FF] hover:text-white transition-colors cursor-pointer">
<i className="fas fa-bell text-xl"></i>
</button>
<div className="flex items-center gap-3">
<img
src="https://public.readdy.ai/ai/img_res/d8bf110017aa3bd23d00e3b3165a642b.jpg"
alt="Profile"
className="w-10 h-10 rounded-full border-2 border-[#00F0FF]"
/>
<span className="font-medium">Alexander Mitchell</span>
</div>
</div>
</header>
{/* Main Grid Layout */}
<div className="grid grid-cols-3 gap-8">
{/* Left Column */}
<div className="col-span-2">
{/* Balance Row */}
<div className="mb-8">
<div className="bg-[#1A1A1F] rounded-xl p-6 border border-[#2A2A2F] backdrop-blur-lg mb-8">
<div className="flex justify-between items-center mb-4">
<h2 className="text-xl font-medium">Total Balance</h2>
<button
onClick={() => setShowBalance(!showBalance)}
className="!rounded-button text-[#00F0FF] hover:text-white transition-colors cursor-pointer"
>
<i className={`fas fa-${showBalance ? 'eye-slash' : 'eye'} text-xl`}></i>
</button>
</div>
<div className="text-4xl font-bold bg-gradient-to-r from-[#00F0FF] to-[#B026FF] bg-clip-text text-transparent">
{showBalance ? '₹3,78,116.19' : '••••••••'}
</div>
</div>
<div className="grid grid-cols-2 gap-8">
<div className="bg-[#1A1A1F] rounded-xl p-6 border border-[#2A2A2F] backdrop-blur-lg">
<div className="flex items-center gap-2 mb-4">
<i className="fas fa-chart-bar text-[#00F0FF]"></i>
<h3 className="text-lg font-medium">Monthly Spending</h3>
</div>
<div className="text-3xl font-bold">₹26,832.79</div>
<div className="text-[#FF2E6C] mt-2">
<i className="fas fa-arrow-up"></i> 12.5% vs last month
</div>
</div>
<div className="bg-[#1A1A1F] rounded-xl p-6 border border-[#2A2A2F] backdrop-blur-lg">
<div className="flex items-center gap-2 mb-4">
<i className="fas fa-wallet text-[#B026FF]"></i>
<h3 className="text-lg font-medium">Investment Value</h3>
</div>
<div className="text-3xl font-bold">₹2,36,662.50</div>
<div className="text-[#00F0FF] mt-2">
<i className="fas fa-arrow-up"></i> 8.3% return
</div>
</div>
</div>
</div>
{/* Analytics Section */}
<div className="bg-[#1A1A1F] rounded-xl p-6 border border-[#2A2A2F] backdrop-blur-lg mb-8">
<h3 className="text-xl font-medium mb-6">Expense Analytics</h3>
<div>
<div ref={chartRef} style={{ height: '300px' }}></div>
<div className="mt-6 space-y-3">
<div className="flex items-center justify-between text-sm">
<div className="flex items-center gap-2">
<div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#00F0FF' }}></div>
<span>Shopping</span>
</div>
<span>₹86,564.00</span>
</div>
<div className="flex items-center justify-between text-sm">
<div className="flex items-center gap-2">
<div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#B026FF' }}></div>
<span>Entertainment</span>
</div>
<span>₹60,717.50</span>
</div>
<div className="flex items-center justify-between text-sm">
<div className="flex items-center gap-2">
<div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#FF2E6C' }}></div>
<span>Food & Drinks</span>
</div>
<span>₹47,910.00</span>
</div>
<div className="flex items-center justify-between text-sm">
<div className="flex items-center gap-2">
<div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#FFD700' }}></div>
<span>Investment</span>
</div>
<span>₹39,976.00</span>
</div>
<div className="flex items-center justify-between text-sm">
<div className="flex items-center gap-2">
<div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#4CAF50' }}></div>
<span>Others</span>
</div>
<span>₹24,780.00</span>
</div>
</div>
</div>
</div>
</div>
{/* Right Column */}
<div className="space-y-8">
{/* Quick Actions */}
<div className="bg-[#1A1A1F] rounded-xl p-6 border border-[#2A2A2F] backdrop-blur-lg">
<h3 className="text-lg font-medium mb-6">Quick Actions</h3>
<div className="space-y-4">
<button
onClick={() => handleOptionClick('/MoneyTransfer')}
className="w-full flex items-center gap-2 bg-[#2A2A2F] hover:bg-[#3A3A3F] transition-colors px-4 py-3 !rounded-button whitespace-nowrap">
<i className="fas fa-exchange-alt text-[#00F0FF]"></i>
<span>Money Transfer</span>
</button>
<button
onClick={() => handleOptionClick('/InvestmentAdvisor')}
className="w-full flex items-center gap-2 bg-[#2A2A2F] hover:bg-[#3A3A3F] transition-colors px-4 py-3 !rounded-button whitespace-nowrap">
<i className="fas fa-chart-pie text-[#B026FF]"></i>
<span>Investment Advisor</span>
</button>
<button 
onClick={() => handleOptionClick('/Loans')}
className="w-full flex items-center gap-2 bg-[#2A2A2F] hover:bg-[#3A3A3F] transition-colors px-4 py-3 !rounded-button whitespace-nowrap">
<i className="fas fa-hand-holding-usd text-[#FFD700]"></i>
<span>Loans</span>
</button>
<button 
onClick={() => handleOptionClick('/FinancialGoals')}
className="w-full flex items-center gap-2 bg-[#2A2A2F] hover:bg-[#3A3A3F] transition-colors px-4 py-3 !rounded-button whitespace-nowrap">
<i className="fas fa-bullseye text-[#FF2E6C]"></i>
<span>Financial Goals</span>
</button>
</div>
</div>
{/* Transaction History */}
<div className="bg-[#1A1A1F] rounded-xl p-6 border border-[#2A2A2F] backdrop-blur-lg">
<div className="flex justify-between items-center mb-6">
<h3 className="text-xl font-medium">Recent Transactions</h3>
<select
value={selectedCategory}
onChange={(e) => setSelectedCategory(e.target.value)}
className="bg-[#2A2A2F] text-white border-none !rounded-button px-4 py-2 cursor-pointer"
>
<option value="All">All Categories</option>
<option value="Shopping">Shopping</option>
<option value="Entertainment">Entertainment</option>
<option value="Food & Drinks">Food & Drinks</option>
</select>
</div>
<div className="space-y-4">
{transactions.map(transaction => (
<div key={transaction.id} className="flex items-center justify-between p-4 rounded-lg hover:bg-[#2A2A2F] transition-colors cursor-pointer">
<div className="flex items-center gap-4">
<div className={`w-10 h-10 rounded-full flex items-center justify-center ${
transaction.amount > 0 ? 'bg-[#00F0FF]/20' : 'bg-[#FF2E6C]/20'
}`}>
<i className={`fas ${transaction.icon} ${
transaction.amount > 0 ? 'text-[#00F0FF]' : 'text-[#FF2E6C]'
}`}></i>
</div>
<div>
<div className="font-medium">{transaction.merchant}</div>
<div className="text-sm text-gray-400">{transaction.date}</div>
</div>
</div>
<div className={`font-bold ${
transaction.amount > 0 ? 'text-[#00F0FF]' : 'text-[#FF2E6C]'
}`}>
{transaction.amount > 0 ? '+' : ''}₹{Math.abs(transaction.amount * 82.65).toFixed(2)}
</div>
</div>
))}
</div>
</div>
</div>
</div>
</div>
<div className="fixed bottom-1 right-6 flex flex-col gap-6 z-50">
        {/* Chatbot Widget Button - Now First */}
        <button 
          onClick={toggleChat}
          className="w-16 h-16 rounded-full bg-gradient-to-br from-[#00F0FF] to-[#00A8FF] flex items-center justify-center shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 border border-[#80F8FF]/30 relative overflow-hidden group"
          style={{
            animation: "float 3s ease-in-out infinite",
            animationDelay: "0.5s"
          }}
        >
          <div className="absolute inset-0 bg-[#00F0FF] opacity-0 group-hover:opacity-20 transition-opacity"></div>
          <div className="absolute -inset-1 bg-gradient-to-r from-[#00F0FF]/20 to-transparent blur-sm rounded-full"></div>
          <i className="fas fa-comment-dots text-white text-2xl"></i>
        </button>
  {/* Query Solver Widget - Now Second */}
  <button 
    onClick={() => handleOptionClick('/support')}
    className="w-16 h-16 rounded-full bg-gradient-to-br from-[#B026FF] to-[#D041FF] flex items-center justify-center shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 border border-[#E366FF]/30 relative overflow-hidden group"
    style={{
      animation: "float 3s ease-in-out infinite",
      animationDelay: "0s"
    }}
  >
    <div className="absolute inset-0 bg-[#B026FF] opacity-0 group-hover:opacity-20 transition-opacity"></div>
    <div className="absolute -inset-1 bg-gradient-to-r from-[#B026FF]/20 to-transparent blur-sm rounded-full"></div>
    <i className="fas fa-question-circle text-white text-2xl"></i>
  </button>
</div>
      
      {/* Chatbot Widget Window */}
      {isChatOpen && <ChatbotWidget onClose={toggleChat} />}
</div>
);
};
export default App
