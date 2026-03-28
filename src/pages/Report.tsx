import { useEffect, useState } from "react";
import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { PieChart, TrendingUp, AlertCircle, CheckCircle2, Search } from "lucide-react";

ChartJS.register(ArcElement, Tooltip, Legend);

interface MonthlyAnalysis {
  month: string;
  totalIncome: number;
  totalExpense: number;
  categories: { category: string; total: number }[];
  payments: { payment: string; total: number }[];
}

export default function Report() {
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [reportData, setReportData] = useState<MonthlyAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleAnalyze = async () => {
    if (!selectedMonth) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/analysis/monthly?month=${selectedMonth}`);
      const data = await res.json();
      setReportData(data);
    } catch (error) {
      console.error("Failed to fetch monthly analysis", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    handleAnalyze();
  }, []);

  const categoryData = {
    labels: reportData?.categories.map(c => c.category) || [],
    datasets: [
      {
        data: reportData?.categories.map(c => c.total) || [],
        backgroundColor: [
          "#3b82f6", // blue-500
          "#10b981", // emerald-500
          "#f59e0b", // amber-500
          "#ef4444", // red-500
          "#8b5cf6", // violet-500
          "#64748b", // slate-500
        ],
        borderWidth: 0,
      },
    ],
  };

  const paymentData = {
    labels: reportData?.payments.map(p => p.payment) || [],
    datasets: [
      {
        data: reportData?.payments.map(p => p.total) || [],
        backgroundColor: [
          "#3b82f6", // blue-500
          "#10b981", // emerald-500
          "#f59e0b", // amber-500
          "#8b5cf6", // violet-500
          "#ef4444", // red-500
        ],
        borderWidth: 0,
      },
    ],
  };

  const getInsights = () => {
    if (!reportData) return [];
    const insights = [];
    
    if (reportData.categories.length > 0) {
      const topCategory = reportData.categories[0];
      insights.push({
        type: "warning",
        icon: <AlertCircle size={20} className="text-amber-500" />,
        text: `You spent the most on ${topCategory.category} (₹${topCategory.total.toFixed(2)}).`,
      });
    }

    if (reportData.payments.length > 0) {
      const topPayment = reportData.payments[0];
      insights.push({
        type: "info",
        icon: <CheckCircle2 size={20} className="text-blue-500" />,
        text: `Most of your payments were via ${topPayment.payment}.`,
      });
    }

    if (reportData.totalExpense > 5000) {
      insights.push({
        type: "danger",
        icon: <TrendingUp size={20} className="text-red-500" />,
        text: "You are overspending this month! Consider setting a budget.",
      });
    }

    if (reportData.totalIncome > 0 && reportData.totalExpense > reportData.totalIncome) {
      insights.push({
        type: "danger",
        icon: <AlertCircle size={20} className="text-red-500" />,
        text: "Warning: Your expenses exceed your income this month.",
      });
    }

    return insights;
  };

  const insights = getInsights();

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Monthly Analysis</h1>
        <p className="text-gray-500 text-sm">Track and analyze your spending</p>
      </header>

      {/* Filter Section */}
      <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex flex-col sm:flex-row gap-4 items-end">
        <div className="flex-1 w-full">
          <label className="block text-sm font-medium text-gray-700 mb-1">Select Month</label>
          <input 
            type="month" 
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
          />
        </div>
        <button 
          onClick={handleAnalyze}
          disabled={isLoading}
          className="w-full sm:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors shadow-lg shadow-blue-200 flex items-center justify-center gap-2 disabled:opacity-70"
        >
          <Search size={18} />
          {isLoading ? "Analyzing..." : "Where did my money go?"}
        </button>
      </div>

      {reportData && (
        <>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gradient-to-br from-green-500 to-green-700 rounded-2xl p-6 text-white shadow-lg shadow-green-200">
              <div className="flex items-center gap-2 text-green-100 mb-2">
                <TrendingUp size={18} />
                <span className="text-sm font-medium">Total Income</span>
              </div>
              <div className="text-3xl font-bold">₹{reportData.totalIncome.toFixed(2)}</div>
            </div>
            
            <div className="bg-gradient-to-br from-red-500 to-red-700 rounded-2xl p-6 text-white shadow-lg shadow-red-200">
              <div className="flex items-center gap-2 text-red-100 mb-2">
                <PieChart size={18} />
                <span className="text-sm font-medium">Total Expense</span>
              </div>
              <div className="text-3xl font-bold">₹{reportData.totalExpense.toFixed(2)}</div>
            </div>
          </div>

          {reportData.totalExpense === 0 && reportData.totalIncome === 0 ? (
            <div className="bg-white rounded-2xl p-10 text-center border border-gray-100 shadow-sm">
              <p className="text-gray-500">No transactions recorded for this month.</p>
            </div>
          ) : (
            <>
              {/* Smart Insights */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-gray-50 bg-gray-50/50">
                  <h2 className="text-lg font-semibold text-gray-800">Smart Insights</h2>
                </div>
                <div className="p-5 space-y-4">
                  {insights.map((insight, idx) => (
                    <div key={idx} className="flex items-start gap-3 p-3 rounded-xl bg-gray-50">
                      <div className="mt-0.5">{insight.icon}</div>
                      <p className="text-gray-700 text-sm font-medium leading-relaxed">{insight.text}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                {/* Category Chart */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                  <h2 className="text-lg font-semibold text-gray-800 mb-6 text-center">Category Breakdown</h2>
                  <div className="relative w-full aspect-square max-w-[250px] mx-auto">
                    <Pie 
                      data={categoryData} 
                      options={{
                        plugins: {
                          legend: { position: 'bottom', labels: { padding: 20, usePointStyle: true } }
                        },
                        cutout: '60%',
                      }} 
                    />
                  </div>
                </div>

                {/* Payment Chart */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                  <h2 className="text-lg font-semibold text-gray-800 mb-6 text-center">Payment Methods</h2>
                  <div className="relative w-full aspect-square max-w-[250px] mx-auto">
                    <Pie 
                      data={paymentData} 
                      options={{
                        plugins: {
                          legend: { position: 'bottom', labels: { padding: 20, usePointStyle: true } }
                        },
                        cutout: '60%',
                      }} 
                    />
                  </div>
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
