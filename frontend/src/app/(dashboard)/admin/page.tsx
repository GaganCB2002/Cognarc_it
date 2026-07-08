"use client";

import { useState, useEffect } from "react";
import { CheckCircle, XCircle, Clock, Shield } from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "react-hot-toast";

type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchPendingUsers();
  }, []);

  const fetchPendingUsers = async () => {
    setIsLoading(true);
    try {
      const response: any = await api.get("/users/pending");
      setUsers(response.users);
    } catch (error: any) {
      toast.error(error.message || "Failed to load pending users");
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    setIsActionLoading(id);
    try {
      await api.post(`/users/${id}/approve`);
      toast.success("User approved successfully");
      setUsers((prev) => prev.filter((user) => user.id !== id));
    } catch (error: any) {
      toast.error(error.message || "Failed to approve user");
    } finally {
      setIsActionLoading(null);
    }
  };

  const handleReject = async (id: string) => {
    setIsActionLoading(id);
    try {
      await api.post(`/users/${id}/reject`);
      toast.success("User rejected successfully");
      setUsers((prev) => prev.filter((user) => user.id !== id));
    } catch (error: any) {
      toast.error(error.message || "Failed to reject user");
    } finally {
      setIsActionLoading(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <div className="flex items-center space-x-3 mb-8">
        <Shield className="w-8 h-8 text-indigo-500" />
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="p-6 border-b border-gray-100 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
            <Clock className="w-5 h-5 mr-2 text-orange-500" />
            Pending Users ({users.length})
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            These users have created an account but cannot log in until approved.
          </p>
        </div>

        {users.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No pending users found.
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {users.map((user) => (
              <div key={user.id} className="p-6 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors">
                <div>
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white">{user.name}</h3>
                  <div className="flex items-center mt-1 space-x-4">
                    <p className="text-sm text-gray-500">{user.email}</p>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400">
                      {user.role}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-2">
                    Joined: {new Date(user.createdAt).toLocaleDateString()}
                  </p>
                </div>
                
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => handleReject(user.id)}
                    disabled={isActionLoading === user.id}
                    className="flex items-center px-3 py-1.5 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
                  >
                    <XCircle className="w-4 h-4 mr-1.5" />
                    Reject
                  </button>
                  <button
                    onClick={() => handleApprove(user.id)}
                    disabled={isActionLoading === user.id}
                    className="flex items-center px-3 py-1.5 text-sm font-medium text-green-600 bg-green-50 rounded-lg hover:bg-green-100 transition-colors disabled:opacity-50"
                  >
                    <CheckCircle className="w-4 h-4 mr-1.5" />
                    Approve
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
