"use client";
// The exported code uses Tailwind CSS. Install Tailwind CSS in your dev environment to ensure all styles work.
import React, { useState } from 'react';
import "@fortawesome/fontawesome-free/css/all.min.css";
const App: React.FC = () => {
const [currentStep, setCurrentStep] = useState(1);
const [formData, setFormData] = useState({
personalInfo: {
fullName: '',
dateOfBirth: '',
phone: '',
email: '',
address: '',
idType: 'passport'
},
employment: {
type: 'full-time',
employer: '',
jobTitle: '',
yearsEmployed: '',
workAddress: ''
},
income: {
monthlyIncome: '',
additionalIncome: '',
monthlyExpenses: ''
},
documents: {
idProof: null,
addressProof: null,
incomeProof: null,
bankStatements: null
}
});
const loanDetails = {
amount: 50000,
term: 36,
monthlyPayment: 1499.27
};
const handleInputChange = (section: string, field: string, value: string) => {
setFormData(prev => ({
...prev,
[section]: {
...prev[section as keyof typeof prev],
[field]: value
}
}));
};
const handleFileUpload = (section: string, field: string, file: File | null) => {
setFormData(prev => ({
...prev,
[section]: {
...prev[section as keyof typeof prev],
[field]: file
}
}));
};
const handleSubmit = (e: React.FormEvent) => {
e.preventDefault();
if (currentStep < 5) {
setCurrentStep(currentStep + 1);
}
};
return (
<div className="min-h-screen bg-gray-900">
<header className="bg-gray-800 shadow-sm">
<div className="max-w-7xl mx-auto px-4">
<div className="flex items-center h-16">
<a
href="https://readdy.ai/home/24a0faca-3343-4b3c-816d-ad17b742d684/ea8fccbb-c46b-48a5-b51c-fa6d83e804d2"
data-readdy="true"
className="flex items-center text-gray-300 hover:text-white"
>
<i className="fas fa-arrow-left mr-2"></i>
Back to Dashboard
</a>
</div>
</div>
</header>
<main className="max-w-3xl mx-auto px-4 py-8">
<div className="bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
<h1 className="text-2xl font-bold text-white mb-6">Loan Application</h1>
<div className="mb-8">
<div className="flex justify-between mb-2">
{[1, 2, 3, 4, 5].map(step => (
<div
key={step}
className={`w-1/5 h-2 rounded-full ${
step <= currentStep ? 'bg-indigo-600' : 'bg-gray-200'
}`}
/>
))}
</div>
<div className="flex justify-between text-sm">
<span className={currentStep >= 1 ? 'text-indigo-600' : 'text-gray-500'}>Personal</span>
<span className={currentStep >= 2 ? 'text-indigo-600' : 'text-gray-500'}>Employment</span>
<span className={currentStep >= 3 ? 'text-indigo-600' : 'text-gray-500'}>Income</span>
<span className={currentStep >= 4 ? 'text-indigo-600' : 'text-gray-500'}>Documents</span>
<span className={currentStep >= 5 ? 'text-indigo-600' : 'text-gray-500'}>Review</span>
</div>
</div>
<div className="bg-gray-700 rounded-lg p-4 mb-8">
<h3 className="text-lg font-semibold text-white mb-2">Loan Details</h3>
<div className="grid grid-cols-3 gap-4">
<div>
<p className="text-sm text-gray-300">Amount</p>
<p className="text-lg font-medium text-white">₹{loanDetails.amount.toLocaleString()}</p>
</div>
<div>
<p className="text-sm text-gray-300">Term</p>
<p className="text-lg font-medium text-white">{loanDetails.term} months</p>
</div>
<div>
<p className="text-sm text-gray-300">Monthly Payment</p>
<p className="text-lg font-medium text-white">₹{loanDetails.monthlyPayment.toFixed(2)}</p>
</div>
</div>
</div>
<form onSubmit={handleSubmit}>
{currentStep === 1 && (
<div className="space-y-6">
<div>
<label className="block text-sm font-medium text-gray-300 mb-1">Full Name</label>
<input
type="text"
value={formData.personalInfo.fullName}
onChange={(e) => handleInputChange('personalInfo', 'fullName', e.target.value)}
className="w-full border border-gray-600 rounded-lg p-2 bg-gray-700 text-white placeholder-gray-400"
required
/>
</div>
<div>
<label className="block text-sm font-medium text-gray-300 mb-1">Date of Birth</label>
<input
type="date"
value={formData.personalInfo.dateOfBirth}
onChange={(e) => handleInputChange('personalInfo', 'dateOfBirth', e.target.value)}
className="w-full border border-gray-600 rounded-lg p-2 bg-gray-700 text-white"
required
/>
</div>
<div>
<label className="block text-sm font-medium text-gray-300 mb-1">Phone Number</label>
<input
type="tel"
value={formData.personalInfo.phone}
onChange={(e) => handleInputChange('personalInfo', 'phone', e.target.value)}
className="w-full border border-gray-600 rounded-lg p-2 bg-gray-700 text-white"
required
/>
</div>
<div>
<label className="block text-sm font-medium text-gray-300 mb-1">Email</label>
<input
type="email"
value={formData.personalInfo.email}
onChange={(e) => handleInputChange('personalInfo', 'email', e.target.value)}
className="w-full border border-gray-600 rounded-lg p-2 bg-gray-700 text-white"
required
/>
</div>
</div>
)}
{currentStep === 2 && (
<div className="space-y-6">
<div>
<label className="block text-sm font-medium text-gray-300 mb-1">Employment Type</label>
<select
value={formData.employment.type}
onChange={(e) => handleInputChange('employment', 'type', e.target.value)}
className="w-full border border-gray-600 rounded-lg p-2 bg-gray-700 text-white"
required
>
<option value="full-time">Full Time</option>
<option value="part-time">Part Time</option>
<option value="self-employed">Self Employed</option>
<option value="contract">Contract</option>
</select>
</div>
<div>
<label className="block text-sm font-medium text-gray-300 mb-1">Employer Name</label>
<input
type="text"
value={formData.employment.employer}
onChange={(e) => handleInputChange('employment', 'employer', e.target.value)}
className="w-full border border-gray-600 rounded-lg p-2 bg-gray-700 text-white"
required
/>
</div>
<div>
<label className="block text-sm font-medium text-gray-300 mb-1">Job Title</label>
<input
type="text"
value={formData.employment.jobTitle}
onChange={(e) => handleInputChange('employment', 'jobTitle', e.target.value)}
className="w-full border border-gray-600 rounded-lg p-2 bg-gray-700 text-white"
required
/>
</div>
</div>
)}
{currentStep === 3 && (
<div className="space-y-6">
<div>
<label className="block text-sm font-medium text-gray-300 mb-1">Monthly Income</label>
<input
type="number"
value={formData.income.monthlyIncome}
onChange={(e) => handleInputChange('income', 'monthlyIncome', e.target.value)}
className="w-full border border-gray-600 rounded-lg p-2 bg-gray-700 text-white"
required
/>
</div>
<div>
<label className="block text-sm font-medium text-gray-300 mb-1">Additional Income</label>
<input
type="number"
value={formData.income.additionalIncome}
onChange={(e) => handleInputChange('income', 'additionalIncome', e.target.value)}
className="w-full border border-gray-600 rounded-lg p-2 bg-gray-700 text-white"
/>
</div>
<div>
<label className="block text-sm font-medium text-gray-300 mb-1">Monthly Expenses</label>
<input
type="number"
value={formData.income.monthlyExpenses}
onChange={(e) => handleInputChange('income', 'monthlyExpenses', e.target.value)}
className="w-full border border-gray-600 rounded-lg p-2 bg-gray-700 text-white"
required
/>
</div>
</div>
)}
{currentStep === 4 && (
<div className="space-y-6">
<div>
<label className="block text-sm font-medium text-gray-300 mb-1">ID Proof</label>
<input
type="file"
onChange={(e) => handleFileUpload('documents', 'idProof', e.target.files?.[0] || null)}
className="w-full border border-gray-600 rounded-lg p-2 bg-gray-700 text-white file:bg-gray-600 file:text-white file:border-0 file:rounded-lg file:px-4 file:py-2 file:mr-4 file:hover:bg-gray-500"
required
/>
</div>
<div>
<label className="block text-sm font-medium text-gray-300 mb-1">Address Proof</label>
<input
type="file"
onChange={(e) => handleFileUpload('documents', 'addressProof', e.target.files?.[0] || null)}
className="w-full border border-gray-600 rounded-lg p-2 bg-gray-700 text-white file:bg-gray-600 file:text-white file:border-0 file:rounded-lg file:px-4 file:py-2 file:mr-4 file:hover:bg-gray-500"
required
/>
</div>
<div>
<label className="block text-sm font-medium text-gray-300 mb-1">Income Proof</label>
<input
type="file"
onChange={(e) => handleFileUpload('documents', 'incomeProof', e.target.files?.[0] || null)}
className="w-full border border-gray-600 rounded-lg p-2 bg-gray-700 text-white file:bg-gray-600 file:text-white file:border-0 file:rounded-lg file:px-4 file:py-2 file:mr-4 file:hover:bg-gray-500"
required
/>
</div>
</div>
)}
{currentStep === 5 && (
<div className="space-y-6">
<h3 className="text-lg font-medium text-white">Review Your Application</h3>
<div className="bg-gray-700 p-4 rounded-lg">
<h4 className="font-medium mb-2 text-white">Personal Information</h4>
<p className="text-gray-300">Name: {formData.personalInfo.fullName}</p>
<p className="text-gray-300">Email: {formData.personalInfo.email}</p>
<p className="text-gray-300">Phone: {formData.personalInfo.phone}</p>
</div>
<div className="bg-gray-700 p-4 rounded-lg">
<h4 className="font-medium mb-2 text-white">Employment Details</h4>
<p className="text-gray-300">Employer: {formData.employment.employer}</p>
<p className="text-gray-300">Job Title: {formData.employment.jobTitle}</p>
<p className="text-gray-300">Type: {formData.employment.type}</p>
</div>
<div className="bg-gray-700 p-4 rounded-lg">
<h4 className="font-medium mb-2 text-white">Income Details</h4>
<p className="text-gray-300">Monthly Income: ₹{formData.income.monthlyIncome}</p>
<p className="text-gray-300">Additional Income: ₹{formData.income.additionalIncome}</p>
<p className="text-gray-300">Monthly Expenses: ₹{formData.income.monthlyExpenses}</p>
</div>
<div className="flex items-center">
<input type="checkbox" id="terms" className="mr-2" required />
<label htmlFor="terms" className="text-sm text-gray-300">
I agree to the terms and conditions
</label>
</div>
</div>
)}
<div className="flex justify-between mt-8">
{currentStep > 1 && (
<button
type="button"
onClick={() => setCurrentStep(currentStep - 1)}
className="px-4 py-2 text-gray-300 border border-gray-600 rounded-button hover:bg-gray-700 cursor-pointer whitespace-nowrap"
>
Previous
</button>
)}
<button
type="submit"
className="ml-auto px-6 py-2 bg-indigo-600 text-white rounded-button hover:bg-indigo-700 cursor-pointer whitespace-nowrap"
>
{currentStep === 5 ? 'Submit Application' : 'Next'}
</button>
</div>
</form>
</div>
</main>
</div>
);
};
export default App
