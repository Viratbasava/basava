import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, IndianRupee, Users, CreditCard, Wallet } from "lucide-react";
import { Session, Expense } from "../types";
import AddExpenseModal from "../components/AddExpenseModal";
import { format } from "date-fns";

export default function SessionDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  const fetchSession = async () => {
    try {
      const res = await fetch(`/api/sessions/${id}`);
      if (!res.ok) throw new Error("Session not found");
      const data = await res.json();
      setSession(data);
    } catch (error) {
      console.error("Failed to fetch session", error);
      navigate("/sessions");
    }
  };

  useEffect(() => {
    fetchSession();
    const pendingUpi = localStorage.getItem("pendingUpiPayment");
    if (pendingUpi) {
      setIsModalOpen(true);
    }
  }, [id]);

  const handleAddExpense = async (expense: Partial<Expense>) => {
    try {
      if (expense.id) {
        await fetch(`/api/expenses/${expense.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...expense, session_id: Number(id) }),
        });
      } else {
        await fetch("/api/expenses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...expense, session_id: Number(id) }),
        });
      }
      fetchSession();
    } catch (error) {
      console.error("Failed to save expense", error);
    }
  };

  const handleDeleteExpense = async (expenseId: number) => {
    try {
      await fetch(`/api/expenses/${expenseId}`, { method: "DELETE" });
      fetchSession();
    } catch (error) {
      console.error("Failed to delete expense", error);
    }
  };

  if (!session) return <div className="p-8 text-center text-gray-500">Loading session...</div>;

  const totalExpenses = session.expenses?.reduce((sum, exp) => sum + exp.amount, 0) || 0;

  const getPaymentIcon = (payment: string) => {
    if (payment === "Cash") return <Wallet size={16} className="text-green-600" />;
    if (payment === "Card") return <CreditCard size={16} className="text-purple-600" />;
    return <IndianRupee size={16} className="text-blue-600" />;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <header className="flex items-center gap-4 mb-8">
        <button 
          onClick={() => navigate("/sessions")}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-600"
        >
          <ArrowLeft size={24} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{session.name}</h1>
          <p className="text-gray-500 text-sm">{format(new Date(session.date), "MMMM d, yyyy")}</p>
        </div>
      </header>

      {/* Session Summary */}
      <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-2xl p-6 text-white shadow-lg shadow-indigo-200 flex justify-between items-center">
        <div>
          <div className="flex items-center gap-2 text-indigo-100 mb-2">
            <Users size={18} />
            <span className="text-sm font-medium">Session Total</span>
          </div>
          <div className="text-4xl font-bold">₹{totalExpenses.toFixed(2)}</div>
        </div>
        <div className="flex flex-col gap-2">
          <button
            onClick={() => {
              setEditingExpense(null);
              setIsModalOpen(true);
            }}
            className="bg-white/20 hover:bg-white/30 p-3 rounded-full transition-colors backdrop-blur-sm flex items-center justify-center"
          >
            <Plus size={24} />
          </button>
        </div>
      </div>

      {totalExpenses > 0 && (
        <button
          onClick={() => navigate(`/split?amount=${totalExpenses}`)}
          className="w-full py-4 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 font-semibold rounded-xl transition-colors mt-4 shadow-sm flex items-center justify-center gap-2"
        >
          End Session & Split Bill
        </button>
      )}

      {/* Expenses List */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mt-6">
        <div className="p-5 border-b border-gray-50 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-800">Session Expenses</h2>
          <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full">
            {session.expenses?.length || 0} items
          </span>
        </div>
        
        {!session.expenses || session.expenses.length === 0 ? (
          <div className="p-10 text-center text-gray-500 flex flex-col items-center">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
              <IndianRupee size={24} className="text-gray-400" />
            </div>
            <p>No expenses recorded in this session yet.</p>
            <button
              onClick={() => {
                setEditingExpense(null);
                setIsModalOpen(true);
              }}
              className="mt-4 text-indigo-600 font-medium hover:underline"
            >
              Add the first expense
            </button>
          </div>
        ) : (
          <ul className="divide-y divide-gray-50">
            {session.expenses.map((exp) => (
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
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <span className="font-bold text-gray-900">₹{exp.amount.toFixed(2)}</span>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteExpense(exp.id);
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

      <AddExpenseModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAdd={handleAddExpense}
        sessionId={Number(id)}
        expenseToEdit={editingExpense}
      />
    </div>
  );
}
