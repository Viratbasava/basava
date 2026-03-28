import { useEffect, useState } from "react";
import { Plus, IndianRupee, TrendingUp, TrendingDown, Calendar, CreditCard, Wallet } from "lucide-react";
import AddExpenseModal from "../components/AddExpenseModal";
import { Expense } from "../types";
import { format } from "date-fns";

export default function Home() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  const fetchExpenses = async () => {
    try {
      const res = await fetch("/api/expenses");
      const data = await res.json();
      setExpenses(data);
    } catch (error) {
      console.error("Failed to fetch expenses", error);
    }
  };

  useEffect(() => {
    fetchExpenses();
    const pendingUpi = localStorage.getItem("pendingUpiPayment");
    if (pendingUpi) {
      setIsModalOpen(true);
    }
  }, []);

  const handleAddExpense = async (expense: Partial<Expense>) => {
    try {
      if (expense.id) {
        await fetch(`/api/expenses/${expense.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(expense),
        });
      } else {
        await fetch("/api/expenses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(expense),
        });
      }
      fetchExpenses();
    } catch (error) {
      console.error("Failed to save expense", error);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await fetch(`/api/expenses/${id}`, { method: "DELETE" });
      fetchExpenses();
    } catch (error) {
      console.error("Failed to delete expense", error);
    }
  };

  const totalIncome = expenses.filter(e => e.type === "Income").reduce((sum, exp) => sum + exp.amount, 0);
  const totalExpense = expenses.filter(e => e.type === "Expense" || !e.type).reduce((sum, exp) => sum + exp.amount, 0);
  const balance = totalIncome - totalExpense;

  const recentExpenses = expenses.slice(0, 5);

  const getPaymentIcon = (payment: string) => {
    if (payment === "Cash") return <Wallet size={16} className="text-green-600" />;
    if (payment === "Card") return <CreditCard size={16} className="text-purple-600" />;
    return <IndianRupee size={16} className="text-blue-600" />;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 text-sm">Track your money</p>
        </div>
        <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">
          ST
        </div>
      </header>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex flex-col justify-center">
          <div className="flex items-center gap-1 text-gray-500 mb-1">
            <TrendingUp size={14} className="text-green-500" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Income</span>
          </div>
          <div className="text-lg font-bold text-gray-900">₹{totalIncome.toFixed(0)}</div>
        </div>
        
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex flex-col justify-center">
          <div className="flex items-center gap-1 text-gray-500 mb-1">
            <TrendingDown size={14} className="text-red-500" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Expense</span>
          </div>
          <div className="text-lg font-bold text-gray-900">₹{totalExpense.toFixed(0)}</div>
        </div>

        <div className={`rounded-2xl p-4 shadow-sm text-white flex flex-col justify-center ${balance >= 0 ? 'bg-gradient-to-br from-blue-600 to-blue-800 shadow-blue-200' : 'bg-gradient-to-br from-red-500 to-red-700 shadow-red-200'}`}>
          <div className="flex items-center gap-1 text-white/80 mb-1">
            <Wallet size={14} />
            <span className="text-[10px] font-bold uppercase tracking-wider">Balance</span>
          </div>
          <div className="text-lg font-bold">₹{balance.toFixed(0)}</div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-50 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-800">Recent Transactions</h2>
          <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full">{expenses.length} total</span>
        </div>
        
        {recentExpenses.length === 0 ? (
          <div className="p-8 text-center text-gray-500 flex flex-col items-center">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-3">
              <IndianRupee size={24} className="text-gray-400" />
            </div>
            <p>No expenses yet.</p>
            <p className="text-sm mt-1">Click the + button to add one.</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-50">
            {recentExpenses.map((exp) => (
              <li 
                key={exp.id} 
                className="p-4 hover:bg-gray-50 transition-colors flex items-center justify-between group cursor-pointer"
                onClick={() => {
                  setEditingExpense(exp);
                  setIsModalOpen(true);
                }}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center">
                    {getPaymentIcon(exp.payment)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">{exp.title}</h3>
                    <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                      <span className="bg-gray-100 px-2 py-0.5 rounded-md">{exp.category}</span>
                      <span>•</span>
                      <span>{format(new Date(exp.date), "MMM d, yyyy")}</span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <span className={`font-bold ${exp.type === 'Income' ? 'text-green-600' : 'text-gray-900'}`}>
                    {exp.type === 'Income' ? '+' : '-'}₹{exp.amount.toFixed(2)}
                  </span>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(exp.id);
                    }}
                    className="text-xs text-red-500 opacity-0 group-hover:opacity-100 transition-opacity mt-1"
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Floating Action Button */}
      <button
        onClick={() => {
          setEditingExpense(null);
          setIsModalOpen(true);
        }}
        className="fixed bottom-24 md:bottom-8 right-6 w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full flex items-center justify-center shadow-lg shadow-blue-300 transition-transform hover:scale-105 active:scale-95 z-40"
      >
        <Plus size={28} />
      </button>

      <AddExpenseModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAdd={handleAddExpense}
        expenseToEdit={editingExpense}
      />
    </div>
  );
}
