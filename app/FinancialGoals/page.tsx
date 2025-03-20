// The exported code uses Tailwind CSS. Install Tailwind CSS in your dev environment to ensure all styles work.
"use client";

// The exported code uses Tailwind CSS. Install Tailwind CSS in your dev environment to ensure all styles work.
import React, { useState } from "react";
import * as echarts from "echarts";
const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState("all");
  const [showContributeModal, setShowContributeModal] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState("");
  const [contributionAmount, setContributionAmount] = useState("");
  const [selectedGoalId, setSelectedGoalId] = useState<number | null>(null);
  const [goals, setGoals] = useState([
    {
      id: 1,
      title: "Home Purchase",
      target: 40000000,
      monthly: 200000,
      complete: 30,
      currentAmount: 12000000,
      image:
        "https://public.readdy.ai/ai/img_res/d7ff4a606edd9f32ce7333431486d138.jpg",
    },
    {
      id: 2,
      title: "Retirement Fund",
      target: 150000000,
      monthly: 400000,
      complete: 40,
      currentAmount: 60000000,
      image:
        "https://public.readdy.ai/ai/img_res/eba32d19a361fff32904ab46f32d2cab.jpg",
    },
    {
      id: 3,
      title: "Emergency Fund",
      target: 3000000,
      monthly: 75000,
      complete: 70,
      currentAmount: 2100000,
      image:
        "https://public.readdy.ai/ai/img_res/72e9b40cef7d6c7ca36ad2ab684aa82e.jpg",
    },
  ]);
  const handleContribute = (goalId: number, goalTitle: string) => {
    setSelectedGoal(goalTitle);
    setSelectedGoalId(goalId);
    setShowContributeModal(true);
  };
  const handleSubmitContribution = () => {
    if (selectedGoalId && contributionAmount) {
      const amount = parseFloat(contributionAmount);
      if (!isNaN(amount)) {
        setGoals(
          goals.map((goal) => {
            if (goal.id === selectedGoalId) {
              const newCurrentAmount = goal.currentAmount + amount;
              const newComplete = Math.min(
                Math.round((newCurrentAmount / goal.target) * 100),
                100
              );
              return {
                ...goal,
                currentAmount: newCurrentAmount,
                complete: newComplete,
              };
            }
            return goal;
          })
        );
      }
    }
    setShowContributeModal(false);
    setContributionAmount("");
    setSelectedGoalId(null);
  };
  React.useEffect(() => {
    // Initialize monthly budget chart
    const budgetChart = echarts.init(document.getElementById("budget-chart"));
    const budgetOption = {
      animation: false,
      tooltip: {
        trigger: "axis",
        axisPointer: {
          type: "shadow",
        },
      },
      legend: {
        data: ["Budget", "Actual"],
        textStyle: {
          color: "#fff",
        },
      },
      grid: {
        left: "3%",
        right: "4%",
        bottom: "3%",
        containLabel: true,
      },
      xAxis: {
        type: "value",
        axisLabel: {
          color: "#fff",
          formatter: (value: number) => `₹${value / 1000}K`,
        },
      },
      yAxis: {
        type: "category",
        data: [
          "Entertainment",
          "Utilities",
          "Food",
          "Transportation",
          "Housing",
        ],
        axisLabel: {
          color: "#fff",
        },
      },
      series: [
        {
          name: "Budget",
          type: "bar",
          data: [30000, 45000, 80000, 60000, 200000],
          itemStyle: {
            color: "#4ade80",
          },
        },
        {
          name: "Actual",
          type: "bar",
          data: [35000, 42000, 75000, 55000, 220000],
          itemStyle: {
            color: "#3b82f6",
          },
        },
      ],
    };
    budgetChart.setOption(budgetOption);
    // Initialize retirement projection chart
    const retirementChart = echarts.init(
      document.getElementById("retirement-chart")
    );
    const retirementOption = {
      animation: false,
      grid: {
        left: "10%",
        right: "5%",
        top: "10%",
        bottom: "15%",
      },
      xAxis: {
        type: "category",
        data: ["2025", "2030", "2035", "2040", "2045"],
        axisLabel: { color: "#fff" },
      },
      yAxis: {
        type: "value",
        name: "Amount (₹)",
        axisLabel: { color: "#fff" },
      },
      series: [
        {
          data: [1000000, 2000000, 3000000, 4000000, 4500000],
          type: "line",
          smooth: true,
          lineStyle: { color: "#3b82f6" },
        },
      ],
    };
    retirementChart.setOption(retirementOption);
    // Initialize monthly savings analysis chart
    const savingsChart = echarts.init(document.getElementById("savings-chart"));
    const savingsOption = {
      animation: false,
      tooltip: {
        trigger: "item",
      },
      series: [
        {
          name: "Monthly Savings",
          type: "pie",
          radius: ["40%", "70%"],
          itemStyle: {
            borderRadius: 10,
            borderColor: "#fff",
            borderWidth: 2,
          },
          label: {
            color: "#fff",
          },
          data: [
            { value: 40, name: "Home Fund" },
            { value: 30, name: "Travel" },
            { value: 20, name: "Emergency" },
            { value: 10, name: "Others" },
          ],
        },
      ],
    };
    savingsChart.setOption(savingsOption);
    return () => {
      budgetChart.dispose();
      retirementChart.dispose();
      savingsChart.dispose();
    };
  }, []);
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4">
        <header className="py-6 flex items-center justify-between">
          <div className="flex items-center space-x-8">
            <img
              src="https://public.readdy.ai/ai/img_res/aa254986b68142823a41d4d787f71588.jpg"
              alt="Logo"
              className="h-8"
            />
            <nav className="space-x-6">
              <button className="text-gray-300 hover:text-white">
                Overview
              </button>
              <button className="text-gray-300 hover:text-white">
                Savings
              </button>
              <button className="text-gray-300 hover:text-white">
                Expenses
              </button>
            </nav>
          </div>
          <button className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg flex items-center space-x-2 !rounded-button">
            <i className="fas fa-plus"></i>
            <span>New Goal</span>
          </button>
        </header>
        <div className="my-8">
          <div className="flex space-x-4 mb-8">
            <button
              onClick={() => setActiveTab("all")}
              className={`px-6 py-2 rounded-lg ${
                activeTab === "all" ? "bg-blue-600" : "bg-gray-800"
              } !rounded-button`}
            >
              All Goals
            </button>
            <button
              onClick={() => setActiveTab("active")}
              className={`px-6 py-2 rounded-lg ${
                activeTab === "active" ? "bg-blue-600" : "bg-gray-800"
              } !rounded-button`}
            >
              Active
            </button>
            <button
              onClick={() => setActiveTab("completed")}
              className={`px-6 py-2 rounded-lg ${
                activeTab === "completed" ? "bg-blue-600" : "bg-gray-800"
              } !rounded-button`}
            >
              Completed
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {goals.map((goal) => (
              <div
                key={goal.id}
                className="bg-gray-800 rounded-xl overflow-hidden"
              >
                <div className="h-48 relative overflow-hidden">
                  <img
                    src={goal.image}
                    alt={goal.title}
                    className="w-full h-full object-cover object-top"
                  />
                </div>
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-semibold">{goal.title}</h3>
                    <button
                      onClick={() => handleContribute(goal.id, goal.title)}
                      className="bg-blue-600 hover:bg-blue-700 px-4 py-2 text-sm rounded-lg !rounded-button whitespace-nowrap"
                    >
                      Contribute
                    </button>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Current</span>
                        <span>₹{goal.currentAmount.toLocaleString()}</span>
                      </div>
                      <div className="h-2 bg-gray-700 rounded-full mb-2">
                        <div
                          className="h-full bg-blue-600 rounded-full transition-all duration-300"
                          style={{ width: `${goal.complete}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Target</span>
                        <span>₹{goal.target.toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="flex justify-between text-sm text-gray-400">
                      <div className="flex items-center">
                        <span>Monthly:</span>
                        <span className="ml-2">
                          ₹{goal.monthly.toLocaleString()}
                        </span>
                      </div>
                      <span>{goal.complete}% Complete</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <div className="bg-gray-800 rounded-xl p-6">
                <h3 className="text-xl font-semibold mb-4">
                  Retirement Projection
                </h3>
                <div id="retirement-chart" className="w-full h-80"></div>
              </div>
              <div className="bg-gray-800 rounded-xl p-6">
                <h3 className="text-xl font-semibold mb-4">
                  Monthly Savings Analysis
                </h3>
                <div id="savings-chart" className="w-full h-80"></div>
              </div>
            </div>
            <div className="bg-gray-800 rounded-xl p-6 mb-8">
              <h3 className="text-xl font-semibold mb-4">Monthly Budget</h3>
              <div id="budget-chart" className="w-full h-80"></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-gray-800 rounded-xl p-6">
                <h4 className="text-lg font-semibold mb-2">Total Savings</h4>
                <p className="text-3xl font-bold text-blue-500">₹2,450,000</p>
                <p className="text-sm text-gray-400 mt-2">
                  +12.5% from last month
                </p>
              </div>
              <div className="bg-gray-800 rounded-xl p-6">
                <h4 className="text-lg font-semibold mb-2">Monthly Income</h4>
                <p className="text-3xl font-bold text-green-500">₹180,000</p>
                <p className="text-sm text-gray-400 mt-2">
                  Next payment in 12 days
                </p>
              </div>
              <div className="bg-gray-800 rounded-xl p-6">
                <h4 className="text-lg font-semibold mb-2">Monthly Expenses</h4>
                <p className="text-3xl font-bold text-red-500">₹85,000</p>
                <p className="text-sm text-gray-400 mt-2">
                  -5.2% from last month
                </p>
              </div>
              <div className="bg-gray-800 rounded-xl p-6">
                <h4 className="text-lg font-semibold mb-2">
                  Investment Returns
                </h4>
                <p className="text-3xl font-bold text-purple-500">₹45,000</p>
                <p className="text-sm text-gray-400 mt-2">+8.3% this quarter</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      {showContributeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-gray-800 rounded-xl p-6 w-full max-w-md">
            <h3 className="text-xl font-semibold mb-4">
              Contribute to {selectedGoal}
            </h3>
            <div className="relative mb-4">
              <span className="absolute right-3 top-1/2 -translate-y-1/2">
                ₹
              </span>
              <input
                type="text"
                value={contributionAmount}
                onChange={(e) => setContributionAmount(e.target.value)}
                className="w-full bg-gray-700 rounded-lg py-2 pl-3 pr-8 text-white"
                placeholder="Enter amount"
              />
            </div>
            <div className="flex space-x-4">
              <button
                onClick={handleSubmitContribution}
                className="flex-1 bg-blue-600 hover:bg-blue-700 py-2 rounded-lg !rounded-button"
              >
                Contribute
              </button>
              <button
                onClick={() => setShowContributeModal(false)}
                className="flex-1 bg-gray-700 hover:bg-gray-600 py-2 rounded-lg !rounded-button"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default App;
