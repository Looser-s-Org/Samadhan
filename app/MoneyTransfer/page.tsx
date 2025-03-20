// The exported code uses Tailwind CSS. Install Tailwind CSS in your dev environment to ensure all styles work.
"use client";

import React, { useState } from "react";

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"contacts" | "manual">("contacts");
  const [searchTerm, setSearchTerm] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [showCurrencyDropdown, setShowCurrencyDropdown] = useState(false);
  const currencies = [
    { code: "USD", symbol: "$" },
    { code: "INR", symbol: "₹" },
    { code: "EUR", symbol: "€" },
    { code: "GBP", symbol: "£" },
  ];
  const [purpose, setPurpose] = useState("");
  const [showPurposeDropdown, setShowPurposeDropdown] = useState(false);
  const contacts = [
    {
      id: 1,
      name: "Emma Thompson",
      accountNumber: "**** 4582",
      avatar:
        "https://public.readdy.ai/ai/img_res/a5424fe4024d9cf8f7b114d67197e4a4.jpg",
    },
    {
      id: 2,
      name: "Michael Chen",
      accountNumber: "**** 7891",
      avatar:
        "https://public.readdy.ai/ai/img_res/7ba67324bfd7939b648bb52bd8f48819.jpg",
    },
    {
      id: 3,
      name: "Sarah Williams",
      accountNumber: "**** 3456",
      avatar:
        "https://public.readdy.ai/ai/img_res/8825f7a7b8def59ed28a023bd38dfc98.jpg",
    },
  ];
  const recentTransfers = [
    {
      id: 1,
      name: "Emma Thompson",
      amount: -1250.0,
      currency: "USD",
      purpose: "Rent Payment",
      date: "2025-03-10",
    },
    {
      id: 2,
      name: "Michael Chen",
      amount: -385.5,
      currency: "EUR",
      purpose: "Dinner Split",
      date: "2025-03-09",
    },
    {
      id: 3,
      name: "Sarah Williams",
      amount: -750.0,
      currency: "GBP",
      purpose: "Project Payment",
      date: "2025-03-08",
    },
  ];
  const purposes = [
    "Rent Payment",
    "Dinner Split",
    "Project Payment",
    "Utilities",
    "Services",
  ];
  const handleTransfer = () => {
    if (!amount || !purpose) {
      return;
    }
    // Handle transfer logic here
    console.log(`Transferring ${amount} ${currency} for ${purpose}`);
  };
  return (
    <div className="min-h-screen bg-[#0A0A0F] text-white p-6">
      <header className="flex justify-between items-center mb-8">
        <div className="flex flex-col items-start gap-2">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
            Samadhan
          </h1>
          <button className="text-cyan-400 hover:text-cyan-300 transition-colors !rounded-button whitespace-nowrap cursor-pointer">
            <i className="fas fa-arrow-left mr-2"></i>
            Back to Dashboard
          </button>
        </div>
        <div className="w-12 h-12 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 flex items-center justify-center cursor-pointer">
          <i className="fas fa-user text-lg"></i>
        </div>
      </header>
      <div className="flex gap-6">
        <div className="flex-1 bg-[#1A1A1F] rounded-xl p-6 shadow-lg">
          <h2 className="text-2xl font-bold mb-6 bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
            Money Transfer
          </h2>
          <div className="flex mb-6 bg-[#2A2A2F] rounded-lg p-1">
            <button
              className={`flex-1 py-3 px-4 rounded-lg transition-all duration-300 !rounded-button whitespace-nowrap cursor-pointer ${
                activeTab === "contacts"
                  ? "bg-gradient-to-r from-cyan-500 to-blue-600"
                  : ""
              }`}
              onClick={() => setActiveTab("contacts")}
            >
              From Contacts
            </button>
            <button
              className={`flex-1 py-3 px-4 rounded-lg transition-all duration-300 !rounded-button whitespace-nowrap cursor-pointer ${
                activeTab === "manual"
                  ? "bg-gradient-to-r from-cyan-500 to-blue-600"
                  : ""
              }`}
              onClick={() => setActiveTab("manual")}
            >
              Manual Input
            </button>
          </div>
          <div className="relative mb-6">
            <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"></i>
            <input
              type="text"
              placeholder="Search contacts..."
              className="w-full bg-[#2A2A2F] rounded-lg py-3 pl-12 pr-4 text-white placeholder-gray-400 outline-none border-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="max-h-64 overflow-y-auto mb-6 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800 hover:scrollbar-thumb-gray-500 pr-2">
            {contacts
              .filter(
                (contact) =>
                  contact.name
                    .toLowerCase()
                    .includes(searchTerm.toLowerCase()) ||
                  contact.accountNumber.includes(searchTerm)
              )
              .map((contact) => (
                <div
                  key={contact.id}
                  className="flex items-center gap-4 p-4 hover:bg-[#2A2A2F] rounded-lg cursor-pointer transition-colors mb-2"
                >
                  <img
                    src={contact.avatar}
                    alt=""
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div>
                    <div className="font-medium">{contact.name}</div>
                    <div className="text-gray-400 text-sm">
                      {contact.accountNumber}
                    </div>
                  </div>
                </div>
              ))}
          </div>
          <div className="relative mb-6">
            <div className="flex">
              <div className="relative flex-1">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-cyan-400">
                  {currencies.find((c) => c.code === currency)?.symbol}
                </div>
                <input
                  type="number"
                  placeholder="Amount"
                  className="w-full bg-[#2A2A2F] rounded-l-lg py-3 pl-12 pr-4 text-white placeholder-gray-400 outline-none border-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>
              <div className="relative">
                <button
                  className="h-full px-4 bg-[#2A2A2F] rounded-r-lg border-l border-[#3A3A3F] flex items-center gap-2 hover:bg-[#3A3A3F] transition-colors !rounded-button whitespace-nowrap"
                  onClick={() => setShowCurrencyDropdown(!showCurrencyDropdown)}
                >
                  <span>{currency}</span>
                  <i
                    className={`fas fa-chevron-down transition-transform ${
                      showCurrencyDropdown ? "rotate-180" : ""
                    }`}
                  ></i>
                </button>
                {showCurrencyDropdown && (
                  <div className="absolute top-full right-0 mt-2 bg-[#2A2A2F] rounded-lg shadow-lg z-10 min-w-[120px]">
                    {currencies.map((c) => (
                      <div
                        key={c.code}
                        className="px-4 py-3 hover:bg-[#1A1A1F] cursor-pointer first:rounded-t-lg last:rounded-b-lg flex items-center gap-2"
                        onClick={() => {
                          setCurrency(c.code);
                          setShowCurrencyDropdown(false);
                        }}
                      >
                        <span className="text-cyan-400">{c.symbol}</span>
                        <span>{c.code}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="relative mb-6">
            <div
              className="w-full bg-[#2A2A2F] rounded-lg py-3 px-4 cursor-pointer flex justify-between items-center"
              onClick={() => setShowPurposeDropdown(!showPurposeDropdown)}
            >
              <span className={purpose ? "text-white" : "text-gray-400"}>
                {purpose || "Select Purpose"}
              </span>
              <i
                className={`fas fa-chevron-down transition-transform ${
                  showPurposeDropdown ? "rotate-180" : ""
                }`}
              ></i>
            </div>
            {showPurposeDropdown && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-[#2A2A2F] rounded-lg shadow-lg z-10">
                {purposes.map((p, index) => (
                  <div
                    key={index}
                    className="px-4 py-3 hover:bg-[#1A1A1F] cursor-pointer first:rounded-t-lg last:rounded-b-lg"
                    onClick={() => {
                      setPurpose(p);
                      setShowPurposeDropdown(false);
                    }}
                  >
                    {p}
                  </div>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={handleTransfer}
            className="w-full py-4 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 transition-all duration-300 font-medium !rounded-button whitespace-nowrap cursor-pointer"
          >
            Transfer Money
          </button>
        </div>
        <div className="w-96 bg-[#1A1A1F] rounded-xl p-6 shadow-lg">
          <h2 className="text-2xl font-bold mb-6 bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
            Recent Transfers
          </h2>
          <div className="space-y-4 max-h-[500px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800 hover:scrollbar-thumb-gray-500 pr-2">
            {recentTransfers.map((transfer) => (
              <div key={transfer.id} className="bg-[#2A2A2F] rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <div className="font-medium">{transfer.name}</div>
                  <div className="text-red-500">
                    {
                      currencies.find((c) => c.code === transfer.currency)
                        ?.symbol
                    }
                    {transfer.amount.toFixed(2)}
                  </div>
                </div>
                <div className="flex justify-between text-sm">
                  <div className="text-gray-400">{transfer.purpose}</div>
                  <div className="text-gray-400">{transfer.date}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
export default App;
