import React, { useState, useEffect } from "react";
import { X, SmartphoneNfc, AlertCircle } from "lucide-react";
import { Expense } from "../types";

interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (expense: any) => void;
  sessionId?: number;
  expenseToEdit?: Expense | null;
}

export default function AddExpenseModal({ isOpen, onClose, onAdd, sessionId, expenseToEdit }: AddExpenseModalProps) {
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Food");
  const [payment, setPayment] = useState("PhonePe");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [type, setType] = useState<"Income" | "Expense">("Expense");
  const [isPendingUpi, setIsPendingUpi] = useState(false);
  const [pendingSessionId, setPendingSessionId] = useState<number | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (expenseToEdit) {
        setTitle(expenseToEdit.title);
        setAmount(expenseToEdit.amount.toString());
        setCategory(expenseToEdit.category);
        setPayment(expenseToEdit.payment);
        setDate(expenseToEdit.date);
        setType(expenseToEdit.type || "Expense");
        setIsPendingUpi(false);
        setPendingSessionId(null);
      } else {
        const pendingUpi = localStorage.getItem("pendingUpiPayment");
        if (pendingUpi) {
          try {
            const data = JSON.parse(pendingUpi);
            if (data.amount) setAmount(data.amount);
            if (data.title) setTitle(data.title);
            if (data.category) setCategory(data.category);
            if (data.sessionId) setPendingSessionId(data.sessionId);
            if (data.type) setType(data.type);
            setPayment("PhonePe");
            setIsPendingUpi(true);
          } catch (e) {
            console.error("Failed to parse pending UPI payment", e);
          }
        } else {
          setTitle("");
          setAmount("");
          setCategory("Food");
          setPayment("PhonePe");
          setDate(new Date().toISOString().split("T")[0]);
          setType("Expense");
          setIsPendingUpi(false);
          setPendingSessionId(null);
        }
      }
    }
  }, [isOpen, expenseToEdit]);

  const handleUpiPay = () => {
    if (!amount || parseFloat(amount) <= 0) {
      alert("Please enter a valid amount to pay via UPI");
      return;
    }
    
    localStorage.setItem("pendingUpiPayment", JSON.stringify({
      amount,
      title,
      category,
      date,
      type,
      sessionId
    }));

    const upiId = "yourupi@upi";
    const name = "YourName";
    const upiLink = `upi://pay?pa=${upiId}&pn=${name}&am=${amount}&cu=INR`;
    
    window.location.href = upiLink;
    
    setIsPendingUpi(true);
    setPayment("PhonePe");
  };

  const handleDiscardPending = () => {
    localStorage.removeItem("pendingUpiPayment");
    setIsPendingUpi(false);
    setPendingSessionId(null);
    setTitle("");
    setAmount("");
    setCategory("Food");
    setPayment("PhonePe");
    setType("Expense");
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd({
      id: expenseToEdit?.id,
      title,
      amount: parseFloat(amount),
      category,
      payment,
      date,
      type,
      session_id: pendingSessionId || sessionId || null,
    });
    localStorage.removeItem("pendingUpiPayment");
    setTitle("");
    setAmount("");
    setCategory("Food");
    setPayment("PhonePe");
    setType("Expense");
    setIsPendingUpi(false);
    setPendingSessionId(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden">
        <div className="flex justify-between items-center p-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800">{expenseToEdit ? "Edit Transaction" : "Add Transaction"}</h2>
          <button type="button" onClick={onClose} className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="flex bg-gray-100 p-1 rounded-xl mb-4">
            <button
              type="button"
              onClick={() => { setType("Expense"); setCategory("Food"); }}
              className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-colors ${type === "Expense" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
            >
              Expense
            </button>
            <button
              type="button"
              onClick={() => { setType("Income"); setCategory("Allowance"); }}
              className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-colors ${type === "Income" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
            >
              Income
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={type === "Expense" ? "e.g. Pizza, Movie ticket" : "e.g. Pocket money, Salary"}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₹)</label>
            <input
              type="number"
              required
              min="0"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-lg font-medium"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all bg-white"
              >
                {type === "Expense" ? (
                  <>
                    <option value="Food">Food</option>
                    <option value="Travel">Travel</option>
                    <option value="Recharge">Recharge</option>
                    <option value="Books">Books</option>
                    <option value="Entertainment">Entertainment</option>
                    <option value="Others">Others</option>
                  </>
                ) : (
                  <>
                    <option value="Allowance">Allowance</option>
                    <option value="Salary">Salary</option>
                    <option value="Gift">Gift</option>
                    <option value="Others">Others</option>
                  </>
                )}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Payment</label>
              <select
                value={payment}
                onChange={(e) => setPayment(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all bg-white"
              >
                <option value="Cash">Cash</option>
                <option value="PhonePe">PhonePe</option>
                <option value="Google Pay">Google Pay</option>
                <option value="Card">Card</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
            />
          </div>

          {isPendingUpi && (
            <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl text-sm font-medium animate-in fade-in duration-300">
              <div className="flex items-start gap-3">
                <AlertCircle className="text-amber-600 mt-0.5 shrink-0" size={20} />
                <div>
                  <h3 className="text-sm font-bold text-amber-800">Payment Pending</h3>
                  <p className="text-amber-700 mt-1">You initiated a UPI payment. If it was successful, please save this expense.</p>
                  <button 
                    type="button" 
                    onClick={handleDiscardPending} 
                    className="text-amber-600 font-bold mt-2 hover:text-amber-800 underline"
                  >
                    Discard pending payment
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-3 mt-6">
            {!isPendingUpi && !expenseToEdit && type === "Expense" && (
              <button
                type="button"
                onClick={handleUpiPay}
                className="flex-1 py-4 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl transition-colors shadow-lg shadow-purple-200 flex items-center justify-center gap-2"
              >
                <SmartphoneNfc size={20} />
                Pay via UPI
              </button>
            )}
            <button
              type="submit"
              className="flex-1 py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors shadow-lg shadow-blue-200"
            >
              {expenseToEdit ? "Update" : isPendingUpi ? "Confirm & Save" : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
