import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Users, Calendar, ArrowRight } from "lucide-react";
import { Session } from "../types";
import { format } from "date-fns";

export default function SessionPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);

  const fetchSessions = async () => {
    try {
      const res = await fetch("/api/sessions");
      const data = await res.json();
      setSessions(data);
    } catch (error) {
      console.error("Failed to fetch sessions", error);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, date }),
      });
      fetchSessions();
      setName("");
      setIsModalOpen(false);
    } catch (error) {
      console.error("Failed to create session", error);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await fetch(`/api/sessions/${id}`, { method: "DELETE" });
      fetchSessions();
    } catch (error) {
      console.error("Failed to delete session", error);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sessions</h1>
          <p className="text-gray-500 text-sm">Track group expenses & outings</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-medium transition-colors shadow-md shadow-blue-200"
        >
          <Plus size={20} />
          <span className="hidden sm:inline">New Session</span>
        </button>
      </header>

      {sessions.length === 0 ? (
        <div className="bg-white rounded-2xl p-10 text-center border border-gray-100 shadow-sm flex flex-col items-center justify-center">
          <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-4">
            <Users size={32} className="text-blue-500" />
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">No Active Sessions</h2>
          <p className="text-gray-500 max-w-sm mb-6">
            Create a session for your next trip, party, or group outing to track shared expenses easily.
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-600 text-white px-6 py-3 rounded-xl font-medium shadow-lg shadow-blue-200 hover:bg-blue-700 transition-colors"
          >
            Start a Session
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {sessions.map((session) => (
            <div key={session.id} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow group relative">
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                  <Users size={24} />
                </div>
                <button 
                  onClick={() => handleDelete(session.id)}
                  className="text-gray-400 hover:text-red-500 transition-colors p-2"
                >
                  Delete
                </button>
              </div>
              
              <h3 className="text-lg font-bold text-gray-900 mb-1">{session.name}</h3>
              <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
                <Calendar size={14} />
                <span>{format(new Date(session.date), "MMMM d, yyyy")}</span>
              </div>
              
              <Link
                to={`/sessions/${session.id}`}
                className="flex items-center justify-between w-full pt-4 border-t border-gray-50 text-blue-600 font-medium group-hover:text-blue-700 transition-colors"
              >
                <span>View Details</span>
                <ArrowRight size={18} className="transform group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          ))}
        </div>
      )}

      {/* Create Session Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-800">Create New Session</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors">
                <Plus size={20} className="rotate-45" />
              </button>
            </div>
            
            <form onSubmit={handleCreateSession} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Session Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Goa Trip, Birthday Party"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                />
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

              <button
                type="submit"
                className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors mt-6 shadow-lg shadow-blue-200"
              >
                Create Session
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
