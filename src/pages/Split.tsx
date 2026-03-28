import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Users, SplitSquareHorizontal, ArrowRight, IndianRupee, Copy, Check } from "lucide-react";

export default function Split() {
  const [searchParams] = useSearchParams();
  const initialAmount = searchParams.get("amount") || "";
  
  const [totalAmount, setTotalAmount] = useState<string>(initialAmount);
  const [peopleCount, setPeopleCount] = useState<string>("2");
  const [splitResult, setSplitResult] = useState<number | null>(null);
  const [names, setNames] = useState<string[]>(["You", "Friend 1"]);
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    if (initialAmount) {
      setTotalAmount(initialAmount);
    }
  }, [initialAmount]);

  const handleCalculate = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(totalAmount);
    const count = parseInt(peopleCount);
    
    if (amount > 0 && count > 0) {
      setSplitResult(amount / count);
    }
  };

  const updateNames = (count: number) => {
    setPeopleCount(count.toString());
    const newNames = [...names];
    if (count > newNames.length) {
      for (let i = newNames.length; i < count; i++) {
        newNames.push(`Friend ${i}`);
      }
    } else {
      newNames.length = count;
    }
    setNames(newNames);
  };

  const handleNameChange = (index: number, value: string) => {
    const newNames = [...names];
    newNames[index] = value;
    setNames(newNames);
  };

  const handleCopy = () => {
    if (splitResult === null) return;
    
    const text = `Split Bill Details:
Total Amount: ₹${parseFloat(totalAmount).toFixed(2)}
Each person pays: ₹${splitResult.toFixed(2)}

Breakdown:
${names.map(name => `- ${name}: ₹${splitResult.toFixed(2)}`).join('\n')}`;

    navigator.clipboard.writeText(text).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Split Bill</h1>
        <p className="text-gray-500 text-sm">Calculate who owes what</p>
      </header>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <form onSubmit={handleCalculate} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Total Amount (₹)</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <IndianRupee size={20} className="text-gray-400" />
              </div>
              <input
                type="number"
                required
                min="1"
                step="0.01"
                value={totalAmount}
                onChange={(e) => setTotalAmount(e.target.value)}
                placeholder="0.00"
                className="w-full pl-12 pr-4 py-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-2xl font-bold"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Number of People</label>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => updateNames(Math.max(2, parseInt(peopleCount) - 1))}
                className="w-12 h-12 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-xl font-bold transition-colors"
              >
                -
              </button>
              <input
                type="number"
                required
                min="2"
                max="20"
                value={peopleCount}
                onChange={(e) => updateNames(parseInt(e.target.value) || 2)}
                className="w-full text-center py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-xl font-bold"
              />
              <button
                type="button"
                onClick={() => updateNames(parseInt(peopleCount) + 1)}
                className="w-12 h-12 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-xl font-bold transition-colors"
              >
                +
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">Who is splitting?</label>
            {names.map((name, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-bold">
                  {name.charAt(0).toUpperCase()}
                </div>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => handleNameChange(index, e.target.value)}
                  className="flex-1 px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder={`Person ${index + 1}`}
                />
              </div>
            ))}
          </div>

          <button
            type="submit"
            className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors mt-6 shadow-lg shadow-blue-200 flex items-center justify-center gap-2"
          >
            <SplitSquareHorizontal size={20} />
            Calculate Split
          </button>
        </form>

        {splitResult !== null && (
          <div className="bg-blue-50 p-6 border-t border-blue-100 animate-in slide-in-from-bottom-4 duration-300">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-medium text-blue-800">Summary</h3>
              <button 
                onClick={handleCopy}
                className="flex items-center gap-1.5 text-sm font-medium text-blue-700 hover:text-blue-800 bg-blue-100 hover:bg-blue-200 px-3 py-1.5 rounded-lg transition-colors"
              >
                {isCopied ? <Check size={16} /> : <Copy size={16} />}
                {isCopied ? "Copied!" : "Copy"}
              </button>
            </div>
            
            <h3 className="text-center text-sm font-medium text-blue-800 mb-2">Each person pays</h3>
            <div className="text-center text-4xl font-bold text-blue-600 mb-6">
              ₹{splitResult.toFixed(2)}
            </div>
            
            <div className="space-y-3">
              {names.map((name, index) => (
                <div key={index} className="flex items-center justify-between bg-white p-3 rounded-lg shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-bold">
                      {name.charAt(0).toUpperCase()}
                    </div>
                    <span className="font-medium text-gray-800">{name}</span>
                  </div>
                  <span className="font-bold text-gray-900">₹{splitResult.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
