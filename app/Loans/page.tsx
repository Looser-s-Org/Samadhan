// The exported code uses Tailwind CSS. Install Tailwind CSS in your dev environment to ensure all styles work.
"use client";
// The exported code uses Tailwind CSS. Install Tailwind CSS in your dev environment to ensure all styles work.
import React, { useState, useEffect } from "react";
import * as echarts from "echarts";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, Autoplay } from "swiper/modules";
import "@fortawesome/fontawesome-free/css/all.min.css";
import { useRouter } from "next/navigation";
const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [showCreditScoreDetails, setShowCreditScoreDetails] = useState(false);
  const [loanAmount, setLoanAmount] = useState(50000);
  const [loanTerm, setLoanTerm] = useState(36);
  const [mounted, setMounted] = useState(false);
  const [isPreQualifyModalOpen, setIsPreQualifyModalOpen] = useState(false);
  const router = useRouter();

  // Fix for NextRouter issue by ensuring component only renders after mounting
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleOptionClick = (path: string) => {
    if (mounted) {
      router.push(path);
    }
  };
  useEffect(() => {
    const creditScoreChart = echarts.init(
      document.getElementById("creditScoreChart")
    );
    const creditScoreOption = {
      animation: false,
      backgroundColor: "transparent",
      tooltip: {
        trigger: "axis",
        backgroundColor: "rgba(17, 24, 39, 0.9)",
        borderColor: "#374151",
        textStyle: {
          color: "#fff",
        },
      },
      xAxis: {
        type: "category",
        data: ["Oct", "Nov", "Dec", "Jan", "Feb", "Mar"],
        axisLine: {
          lineStyle: {
            color: "#4B5563",
          },
        },
        axisLabel: {
          color: "#9CA3AF",
        },
      },
      yAxis: {
        type: "value",
        min: 600,
        max: 850,
        axisLine: {
          lineStyle: {
            color: "#4B5563",
          },
        },
        axisLabel: {
          color: "#9CA3AF",
        },
        splitLine: {
          lineStyle: {
            color: "#374151",
          },
        },
      },
      series: [
        {
          data: [720, 732, 741, 754, 768, 785],
          type: "line",
          smooth: true,
          lineStyle: {
            color: "#4F46E5",
          },
          areaStyle: {
            color: {
              type: "linear",
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                {
                  offset: 0,
                  color: "rgba(79, 70, 229, 0.3)",
                },
                {
                  offset: 1,
                  color: "rgba(79, 70, 229, 0.1)",
                },
              ],
            },
          },
        },
      ],
    };
    creditScoreChart.setOption(creditScoreOption);
    return () => {
      creditScoreChart.dispose();
    };
  }, []);
  const calculateMonthlyPayment = () => {
    const rate = 0.0499 / 12;
    const term = loanTerm;
    const principal = loanAmount;
    return (
      (principal * rate * Math.pow(1 + rate, term)) /
      (Math.pow(1 + rate, term) - 1)
    );
  };
  return (
    <div className="min-h-screen bg-gray-900">
  {/* Header */}
  <header className="bg-gray-800 shadow-sm">
    <div className="max-w-7xl mx-auto px-4">
      <div className="flex flex-col md:flex-row justify-between items-center py-4 md:h-16">
        <div className="flex flex-col md:flex-row items-center w-full md:w-auto">
          <img src="https://public.readdy.ai/ai/img_res/2fffcb0e446a3f3d3f81bb5d7012a852.jpg"
            alt="Bank Logo"
            className="h-8 mb-4 md:mb-0" />
          <nav className="flex flex-wrap justify-center md:ml-10 space-x-2 md:space-x-8 mt-4 md:mt-0 w-full md:w-auto">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`${activeTab === 'dashboard' ? 'text-indigo-400 border-b-2 border-indigo-400' : 'text-gray-300'} px-3 py-2 text-sm font-medium cursor-pointer whitespace-nowrap mb-2 md:mb-0`}>
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('loans')}
              className={`${activeTab === 'loans' ? 'text-indigo-400 border-b-2 border-indigo-400' : 'text-gray-300'} px-3 py-2 text-sm font-medium cursor-pointer whitespace-nowrap mb-2 md:mb-0`}>
              Loan Applications
            </button>
            <button
              onClick={() => setActiveTab('credit')}
              className={`${activeTab === 'credit' ? 'text-indigo-400 border-b-2 border-indigo-400' : 'text-gray-300'} px-3 py-2 text-sm font-medium cursor-pointer whitespace-nowrap mb-2 md:mb-0`}>
              Credit Health
            </button>
            <button
              onClick={() => setActiveTab('tools')}
              className={`${activeTab === 'tools' ? 'text-indigo-400 border-b-2 border-indigo-400' : 'text-gray-300'} px-3 py-2 text-sm font-medium cursor-pointer whitespace-nowrap mb-2 md:mb-0`}>
              Calculators & Tools
            </button>
          </nav>
        </div>
        <div className="flex items-center space-x-4 mt-4 md:mt-0">
          <button
            onClick={() => setIsPreQualifyModalOpen(true)}
            className="bg-indigo-600 text-white px-4 py-2 rounded-button text-sm font-medium hover:bg-indigo-700 cursor-pointer whitespace-nowrap">
            Get Pre-qualified
          </button>
          <button className="text-gray-500 hover:text-gray-700 cursor-pointer">
            <i className="fas fa-bell text-xl"></i>
          </button>
          <button className="text-gray-500 hover:text-gray-700 cursor-pointer">
            <i className="fas fa-user-circle text-xl"></i>
          </button>
        </div>
      </div>
    </div>
  </header>
  {/* Main Content */}
  <main className="max-w-7xl mx-auto px-4 py-8">
    {/* Dashboard Overview */}
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
      <div className="bg-gray-800 rounded-lg shadow p-4 md:p-6">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-lg font-semibold text-white">Active Loans</h3>
          <span className="text-sm text-gray-500">3 Total</span>
        </div>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-300">Mortgage</span>
            <span className="text-sm font-medium text-white">₹23,50,000</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-300">Auto Loan</span>
            <span className="text-sm font-medium text-white">₹2,67,000</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-300">Personal Loan</span>
            <span className="text-sm font-medium text-white">₹1,23,500</span>
          </div>
        </div>
      </div>
      <div className="bg-gray-800 rounded-lg shadow p-4 md:p-6">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-lg font-semibold text-white">Available Credit</h3>
          <span className="text-sm text-green-500">Good Standing</span>
        </div>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-300">Credit Cards</span>
            <span className="text-sm font-medium text-white">₹2,05,800</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-300">Line of Credit</span>
            <span className="text-sm font-medium text-white">₹4,11,600</span>
          </div>
        </div>
      </div>
      <div className="bg-gray-800 rounded-lg shadow p-4 md:p-6">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-lg font-semibold text-white">Credit Score</h3>
          <button
            onClick={() => setShowCreditScoreDetails(!showCreditScoreDetails)}
            className="text-indigo-600 hover:text-indigo-700 text-sm cursor-pointer">
            Details
          </button>
        </div>
        <div className="flex items-center justify-center">
          <div className="relative w-20 h-20 md:w-24 md:h-24">
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xl md:text-2xl font-bold text-white">785</span>
            </div>
            <svg className="w-full h-full" viewBox="0 0 36 36">
              <path
                d="M18 2.0845
                a 15.9155 15.9155 0 0 1 0 31.831
                a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="#E5E7EB"
                strokeWidth="3"
              />
              <path
                d="M18 2.0845
                a 15.9155 15.9155 0 0 1 0 31.831
                a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="#4F46E5"
                strokeWidth="3"
                strokeDasharray="85, 100"
              />
            </svg>
          </div>
        </div>
      </div>
      <div className="bg-gray-800 rounded-lg shadow p-4 md:p-6">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-lg font-semibold text-white">Next Payment</h3>
          <span className="text-sm text-gray-500">March 25, 2025</span>
        </div>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-300">Mortgage Payment</span>
            <span className="text-sm font-medium text-white">₹15,200</span>
          </div>
          <button className="w-full bg-indigo-600 text-white px-4 py-2 rounded-button text-sm font-medium hover:bg-indigo-700 cursor-pointer whitespace-nowrap">
            Pay Now
          </button>
        </div>
      </div>
    </div>
    {/* Credit Score Chart */}
    <div className="bg-gray-800 rounded-lg shadow mb-8">
      <div className="p-4 md:p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Credit Score History</h3>
        <div id="creditScoreChart" style={{ height: '250px', minHeight: '250px' }}></div>
      </div>
    </div>
    {/* Loan Calculator */}
    <div className="bg-gray-800 rounded-lg shadow mb-8">
      <div className="p-4 md:p-6">
        <h3 className="text-lg font-semibold text-white mb-4 md:mb-6">Loan Calculator</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Loan Amount: ₹{loanAmount.toLocaleString()}
              </label>
              <input
                type="range"
                min="82320"
                max="8232000"
                value={loanAmount}
                onChange={(e) => setLoanAmount(Number(e.target.value))}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Loan Term: {loanTerm} months
              </label>
              <input
                type="range"
                min="12"
                max="60"
                value={loanTerm}
                onChange={(e) => setLoanTerm(Number(e.target.value))}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
              />
            </div>
          </div>
          <div className="bg-gray-700 p-4 md:p-6 rounded-lg">
            <h4 className="text-lg font-medium text-white mb-4">Monthly Payment</h4>
            <div className="text-2xl md:text-3xl font-bold text-indigo-600">
              ₹{calculateMonthlyPayment().toFixed(2)}
            </div>
            <p className="text-sm text-gray-400 mt-2">
              Based on 4.99% APR
            </p>

            <button
              onClick={() => handleOptionClick('/LoanApplication')}
              className="mt-4 md:mt-6 w-full bg-indigo-600 text-white px-4 py-2 rounded-button text-sm font-medium hover:bg-indigo-700 cursor-pointer whitespace-nowrap">
              Apply Now
            </button>
          </div>
        </div>
      </div>
    </div>
    {/* Recommended Products */}
    <div className="bg-gray-900 rounded-lg shadow-xl">
      <div className="p-4 md:p-8">
        <h3 className="text-xl md:text-2xl font-semibold text-white mb-6 md:mb-8 flex items-center">
          <i className="fas fa-star text-yellow-400 mr-3"></i>
          Recommended Products
        </h3>
        <Swiper
          modules={[Pagination, Autoplay]}
          spaceBetween={10}
          slidesPerView={1}
          breakpoints={{
            640: {
              slidesPerView: 2,
              spaceBetween: 15
            },
            1024: {
              slidesPerView: 3,
              spaceBetween: 20
            }
          }}
          pagination={{ clickable: true }}
          autoplay={{ delay: 5000 }}
          className="loan-products-slider"
          direction="horizontal"
          wrapperClass="flex flex-row"
        >
          <SwiperSlide className="flex-shrink-0">
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-4 md:p-6 rounded-xl text-white shadow-lg border border-gray-700 hover:shadow-2xl hover:border-indigo-500 hover:-translate-y-1 transition-all duration-300">
              <div className="flex items-center mb-4">
                <i className="fas fa-home text-xl md:text-2xl text-purple-400 mr-3"></i>
                <h4 className="text-lg md:text-xl font-semibold">Home Equity Line</h4>
              </div>
              <p className="text-purple-400 font-medium mb-4">Rates from 4.25% APR</p>
              <ul className="space-y-3 mb-6 md:mb-8">
                <li className="flex items-center text-gray-300">
                  <i className="fas fa-check text-purple-400 mr-2"></i>
                  <span>Access up to 80% of equity</span>
                </li>
                <li className="flex items-center text-gray-300">
                  <i className="fas fa-check text-purple-400 mr-2"></i>
                  <span>Flexible drawing period</span>
                </li>
                <li className="flex items-center text-gray-300">
                  <i className="fas fa-check text-purple-400 mr-2"></i>
                  <span>Tax-deductible interest</span>
                </li>
              </ul>
              <button className="w-full bg-purple-500 text-white px-4 md:px-6 py-2 md:py-3 rounded-button text-sm font-medium hover:bg-purple-600 transition-colors duration-200 cursor-pointer whitespace-nowrap flex items-center justify-center">
                Learn More
                <i className="fas fa-arrow-right ml-2"></i>
              </button>
            </div>
          </SwiperSlide>
          
          <SwiperSlide className="flex-shrink-0">
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-4 md:p-6 rounded-xl text-white shadow-lg border border-gray-700 hover:shadow-2xl hover:border-purple-500 hover:-translate-y-1 transition-all duration-300">
              <div className="flex items-center mb-4">
                <i className="fas fa-wallet text-xl md:text-2xl text-indigo-400 mr-3"></i>
                <h4 className="text-lg md:text-xl font-semibold">Personal Loan</h4>
              </div>
              <p className="text-indigo-400 font-medium mb-4">Rates as low as 5.99% APR</p>
              <ul className="space-y-3 mb-6 md:mb-8">
                <li className="flex items-center text-gray-300">
                  <i className="fas fa-check text-indigo-400 mr-2"></i>
                  <span>Borrow up to ₹4,11,600</span>
                </li>
                <li className="flex items-center text-gray-300">
                  <i className="fas fa-check text-indigo-400 mr-2"></i>
                  <span>No collateral required</span>
                </li>
                <li className="flex items-center text-gray-300">
                  <i className="fas fa-check text-indigo-400 mr-2"></i>
                  <span>Fast approval process</span>
                </li>
              </ul>
              <button className="w-full bg-indigo-500 text-white px-4 md:px-6 py-2 md:py-3 rounded-button text-sm font-medium hover:bg-indigo-600 transition-colors duration-200 cursor-pointer whitespace-nowrap flex items-center justify-center">
                Learn More
                <i className="fas fa-arrow-right ml-2"></i>
              </button>
            </div>
          </SwiperSlide>
          
          <SwiperSlide className="flex-shrink-0">
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-4 md:p-6 rounded-xl text-white shadow-lg border border-gray-700 hover:shadow-2xl hover:border-rose-500 hover:-translate-y-1 transition-all duration-300">
              <div className="flex items-center mb-4">
                <i className="fas fa-car text-xl md:text-2xl text-rose-400 mr-3"></i>
                <h4 className="text-lg md:text-xl font-semibold">Auto Loan</h4>
              </div>
              <p className="text-rose-400 font-medium mb-4">Rates starting at 3.49% APR</p>
              <ul className="space-y-3 mb-6 md:mb-8">
                <li className="flex items-center text-gray-300">
                  <i className="fas fa-check text-rose-400 mr-2"></i>
                  <span>New & used vehicles</span>
                </li>
                <li className="flex items-center text-gray-300">
                  <i className="fas fa-check text-rose-400 mr-2"></i>
                  <span>Terms up to 72 months</span>
                </li>
                <li className="flex items-center text-gray-300">
                  <i className="fas fa-check text-rose-400 mr-2"></i>
                  <span>Quick pre-approval</span>
                </li>
              </ul>
              <button className="w-full bg-rose-500 text-white px-4 md:px-6 py-2 md:py-3 rounded-button text-sm font-medium hover:bg-rose-600 transition-colors duration-200 cursor-pointer whitespace-nowrap flex items-center justify-center">
                Learn More
                <i className="fas fa-arrow-right ml-2"></i>
              </button>
            </div>
          </SwiperSlide>
        </Swiper>
      </div>
    </div>
  </main>
  {/* Pre-qualify Modal */}
  {isPreQualifyModalOpen && (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg max-w-md w-full p-4 md:p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-white">Get Pre-qualified</h3>
          <button
            onClick={() => setIsPreQualifyModalOpen(false)}
            className="text-gray-400 hover:text-gray-500 cursor-pointer">
            <i className="fas fa-times"></i>
          </button>
        </div>
        <p className="text-sm text-gray-300 mb-4 md:mb-6">
          Check your rate without affecting your credit score
        </p>
        <form className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Loan Purpose
            </label>
            <select className="w-full bg-gray-700 border-gray-600 text-gray-200 rounded-lg shadow-sm">
              <option>Select purpose</option>
              <option>Debt Consolidation</option>
              <option>Home Improvement</option>
              <option>Major Purchase</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Desired Loan Amount
            </label>
            <input
              type="text"
              placeholder="Enter amount"
              className="w-full bg-gray-700 border-gray-600 text-gray-200 rounded-lg shadow-sm placeholder-gray-400"
            />
          </div>
          <button className="w-full bg-indigo-600 text-white px-4 py-2 rounded-button text-sm font-medium hover:bg-indigo-700 cursor-pointer whitespace-nowrap">
            Check Your Rate
          </button>
        </form>
      </div>
    </div>
  )}
</div>
  );
};
export default App;
