"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { api } from "@/lib/api";
import { toast } from "react-hot-toast";
import {
  Shield, Users, UserCheck, UserX, Clock, Trash2, CheckCircle,
  XCircle, Search, BarChart3, FileText, ListTodo, Activity,
  ChevronDown, Eye, RefreshCw
} from "lucide-react";

type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  isApproved: boolean;
  createdAt: string;
  updatedAt: string;
  provider: string;
  avatar?: string;
};

type AdminStats = {
  totalUsers: number;
  pendingUsers: number;
  approvedUsers: number;
  totalTasks: number;
  totalNotes: number;
  totalSessions: number;
  roleBreakdown: { role: string; count: number }[];
};

type Tab = "overview" | "all-users" | "pending";

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [pendingUsers, setPendingUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      const res = await api.get("/users/admin/stats") as any;
      setStats(res.stats);
    } catch (err) {
      console.error("Failed to fetch admin stats", err);
    }
  };

  const fetchAllUsers = async () => {
    try {
      const res = await api.get("/users?limit=100") as any;
      setAllUsers(res.users || []);
    } catch (err) {
      console.error("Failed to fetch users", err);
    }
  };

  const fetchPendingUsers = async () => {
    try {
      const res = await api.get("/users/pending?limit=100") as any;
      setPendingUsers(res.users || []);
    } catch (err) {
      console.error("Failed to fetch pending users", err);
    }
  };

  const loadAll = async () => {
    setLoading(true);
    await Promise.all([fetchStats(), fetchAllUsers(), fetchPendingUsers()]);
    setLoading(false);
  };

  useEffect(() => {
    loadAll();
  }, []);

  const handleApprove = async (id: string) => {
    setActionLoading(id);
    try {
      await api.post(`/users/${id}/approve`);
      toast.success("User approved!");
      setPendingUsers(prev => prev.filter(u => u.id !== id));
      setAllUsers(prev => prev.map(u => u.id === id ? { ...u, isApproved: true } : u));
      if (stats) setStats({ ...stats, pendingUsers: stats.pendingUsers - 1, approvedUsers: stats.approvedUsers + 1 });
    } catch (err: any) {
      toast.error(err.message || "Failed to approve user");
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id: string) => {
    setActionLoading(id);
    try {
      await api.post(`/users/${id}/reject`);
      toast.success("User rejected & account deleted");
      setPendingUsers(prev => prev.filter(u => u.id !== id));
      setAllUsers(prev => prev.filter(u => u.id !== id));
      if (stats) setStats({ ...stats, pendingUsers: stats.pendingUsers - 1, totalUsers: stats.totalUsers - 1 });
    } catch (err: any) {
      toast.error(err.message || "Failed to reject user");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (id: string) => {
    setActionLoading(id);
    try {
      await api.delete(`/users/${id}`);
      toast.success("User deleted permanently");
      setAllUsers(prev => prev.filter(u => u.id !== id));
      setPendingUsers(prev => prev.filter(u => u.id !== id));
      if (stats) setStats({ ...stats, totalUsers: stats.totalUsers - 1 });
      setConfirmDelete(null);
    } catch (err: any) {
      toast.error(err.message || "Failed to delete user");
    } finally {
      setActionLoading(null);
    }
  };

  const filteredUsers = allUsers.filter(u =>
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "SUPER_ADMIN": return "danger";
      case "ADMIN": return "warning";
      case "MENTOR": return "outline";
      case "PREMIUM_USER": return "success";
      case "STUDENT": return "outline";
      default: return "outline";
    }
  };

  const getTimeRemaining = (createdAt: string) => {
    const created = new Date(createdAt).getTime();
    const deadline = created + 24 * 60 * 60 * 1000;
    const remaining = deadline - Date.now();
    if (remaining <= 0) return "Auto-approved";
    const hours = Math.floor(remaining / (1000 * 60 * 60));
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m left`;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <div className="animate-spin w-8 h-8 border-2 border-st-accent border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <p className="text-[10px] font-bold tracking-widest text-st-accent uppercase mb-1">Administration</p>
          <h1 className="text-3xl font-bold text-st-text-primary flex items-center gap-3">
            <Shield className="w-8 h-8 text-st-accent" />
            Admin Dashboard
          </h1>
          <p className="text-st-text-secondary mt-1">Manage users, approvals, and platform overview</p>
        </div>
        <Button onClick={loadAll} variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-1" /> Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card className="p-5 hover:border-st-accent/30 transition-all">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-400" />
              </div>
            </div>
            <p className="text-xs font-medium text-st-text-secondary">Total Users</p>
            <h3 className="text-2xl font-bold text-st-text-primary">{stats.totalUsers}</h3>
          </Card>
          <Card className="p-5 hover:border-st-accent/30 transition-all">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-lg bg-orange-500/10 flex items-center justify-center">
                <Clock className="w-5 h-5 text-orange-400" />
              </div>
            </div>
            <p className="text-xs font-medium text-st-text-secondary">Pending Approval</p>
            <h3 className="text-2xl font-bold text-orange-400">{stats.pendingUsers}</h3>
          </Card>
          <Card className="p-5 hover:border-st-accent/30 transition-all">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <UserCheck className="w-5 h-5 text-emerald-400" />
              </div>
            </div>
            <p className="text-xs font-medium text-st-text-secondary">Approved</p>
            <h3 className="text-2xl font-bold text-emerald-400">{stats.approvedUsers}</h3>
          </Card>
          <Card className="p-5 hover:border-st-accent/30 transition-all">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <ListTodo className="w-5 h-5 text-purple-400" />
              </div>
            </div>
            <p className="text-xs font-medium text-st-text-secondary">Total Tasks</p>
            <h3 className="text-2xl font-bold text-st-text-primary">{stats.totalTasks}</h3>
          </Card>
          <Card className="p-5 hover:border-st-accent/30 transition-all">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-lg bg-pink-500/10 flex items-center justify-center">
                <FileText className="w-5 h-5 text-pink-400" />
              </div>
            </div>
            <p className="text-xs font-medium text-st-text-secondary">Total Notes</p>
            <h3 className="text-2xl font-bold text-st-text-primary">{stats.totalNotes}</h3>
          </Card>
          <Card className="p-5 hover:border-st-accent/30 transition-all">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-lg bg-st-accent/10 flex items-center justify-center">
                <Activity className="w-5 h-5 text-st-accent" />
              </div>
            </div>
            <p className="text-xs font-medium text-st-text-secondary">Sessions</p>
            <h3 className="text-2xl font-bold text-st-text-primary">{stats.totalSessions}</h3>
          </Card>
        </div>
      )}

      {/* Role Breakdown */}
      {stats && stats.roleBreakdown.length > 0 && (
        <Card className="p-6">
          <h3 className="text-sm font-semibold text-st-text-primary mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-st-accent" /> User Role Breakdown
          </h3>
          <div className="flex flex-wrap gap-3">
            {stats.roleBreakdown.map(r => (
              <div key={r.role} className="flex items-center gap-2 px-4 py-2 bg-st-bg-elevated rounded-lg border border-st-border">
                <Badge variant={getRoleBadgeColor(r.role) as any}>{r.role}</Badge>
                <span className="text-lg font-bold text-st-text-primary">{r.count}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-st-border pb-0">
        {([
          { key: "overview" as Tab, label: "Overview", icon: BarChart3 },
          { key: "pending" as Tab, label: `Pending (${pendingUsers.length})`, icon: Clock },
          { key: "all-users" as Tab, label: `All Users (${allUsers.length})`, icon: Users },
        ]).map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors -mb-[1px] ${activeTab === tab.key ? "border-st-accent text-st-accent" : "border-transparent text-st-text-secondary hover:text-st-text-primary"}`}>
            <tab.icon className="w-4 h-4" />{tab.label}
          </button>
        ))}
      </div>

      {/* ─── OVERVIEW TAB ─── */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Users */}
          <Card className="p-6">
            <h3 className="text-sm font-semibold text-st-text-primary mb-4">Recent Users</h3>
            <div className="space-y-3">
              {allUsers.slice(0, 5).map(user => (
                <div key={user.id} className="flex items-center justify-between p-3 bg-st-bg-elevated rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-st-accent/20 flex items-center justify-center text-sm font-bold text-st-accent">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-st-text-primary">{user.name}</p>
                      <p className="text-xs text-st-text-muted">{user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={getRoleBadgeColor(user.role) as any}>{user.role}</Badge>
                    {user.isApproved ? (
                      <span className="w-2 h-2 rounded-full bg-emerald-400" title="Approved" />
                    ) : (
                      <span className="w-2 h-2 rounded-full bg-orange-400 animate-pulse" title="Pending" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Pending Approvals Quick View */}
          <Card className="p-6">
            <h3 className="text-sm font-semibold text-st-text-primary mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4 text-orange-400" /> Pending Approvals
              {pendingUsers.length > 0 && <span className="px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 text-xs font-bold">{pendingUsers.length}</span>}
            </h3>
            {pendingUsers.length === 0 ? (
              <div className="text-center py-8 text-st-text-muted">
                <UserCheck className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">All clear! No pending approvals.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingUsers.slice(0, 5).map(user => (
                  <div key={user.id} className="flex items-center justify-between p-3 bg-st-bg-elevated rounded-lg border border-st-border">
                    <div>
                      <p className="text-sm font-medium text-st-text-primary">{user.name}</p>
                      <p className="text-xs text-st-text-muted">{user.email}</p>
                      <p className="text-[10px] text-orange-400 mt-1 flex items-center gap-1"><Clock className="w-3 h-3" />{getTimeRemaining(user.createdAt)}</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleReject(user.id)} disabled={actionLoading === user.id}
                        className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors disabled:opacity-50">
                        <XCircle className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleApprove(user.id)} disabled={actionLoading === user.id}
                        className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors disabled:opacity-50">
                        <CheckCircle className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
                {pendingUsers.length > 5 && (
                  <button onClick={() => setActiveTab("pending")} className="text-xs text-st-accent hover:underline w-full text-center">
                    View all {pendingUsers.length} pending →
                  </button>
                )}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* ─── PENDING TAB ─── */}
      {activeTab === "pending" && (
        <Card className="p-0 overflow-hidden">
          <div className="p-5 border-b border-st-border bg-st-bg-elevated">
            <h3 className="font-semibold text-st-text-primary flex items-center gap-2">
              <Clock className="w-5 h-5 text-orange-400" /> Pending User Approvals
            </h3>
            <p className="text-xs text-st-text-muted mt-1">Approve or reject users. Unapproved accounts are auto-approved after 24 hours. Rejected accounts are permanently deleted.</p>
          </div>
          {pendingUsers.length === 0 ? (
            <div className="p-12 text-center text-st-text-muted">
              <UserCheck className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No pending users</p>
              <p className="text-xs mt-1">All user registrations have been processed.</p>
            </div>
          ) : (
            <div className="divide-y divide-st-border">
              {pendingUsers.map(user => (
                <div key={user.id} className="p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:bg-st-bg-elevated/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-11 h-11 rounded-full bg-orange-500/15 flex items-center justify-center text-base font-bold text-orange-400">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-semibold text-st-text-primary">{user.name}</h4>
                      <p className="text-sm text-st-text-muted">{user.email}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <Badge variant="outline">{user.role}</Badge>
                        <span className="text-[10px] text-st-text-muted">Joined {new Date(user.createdAt).toLocaleDateString()}</span>
                        <span className="text-[10px] text-orange-400 font-medium flex items-center gap-1"><Clock className="w-3 h-3" />{getTimeRemaining(user.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <Button onClick={() => handleReject(user.id)} disabled={actionLoading === user.id} variant="outline" size="sm"
                      className="border-red-500/30 text-red-400 hover:bg-red-500/10">
                      <XCircle className="w-4 h-4 mr-1" /> Reject
                    </Button>
                    <Button onClick={() => handleApprove(user.id)} disabled={actionLoading === user.id} variant="primary" size="sm"
                      className="bg-emerald-500 hover:bg-emerald-600 text-white border-0">
                      <CheckCircle className="w-4 h-4 mr-1" /> Approve
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* ─── ALL USERS TAB ─── */}
      {activeTab === "all-users" && (
        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-st-text-muted" />
            <input type="text" placeholder="Search users by name, email, or role..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-st-bg-elevated border border-st-border rounded-lg text-sm text-st-text-primary placeholder:text-st-text-muted focus:outline-none focus:border-st-accent/50" />
          </div>

          <Card className="p-0 overflow-hidden">
            {/* Table Header */}
            <div className="grid grid-cols-12 gap-4 p-4 text-xs font-semibold text-st-text-muted uppercase tracking-wider bg-st-bg-elevated border-b border-st-border">
              <div className="col-span-4">User</div>
              <div className="col-span-2">Role</div>
              <div className="col-span-2">Status</div>
              <div className="col-span-2">Joined</div>
              <div className="col-span-2 text-right">Actions</div>
            </div>

            {filteredUsers.length === 0 ? (
              <div className="p-8 text-center text-st-text-muted">No users found.</div>
            ) : (
              <div className="divide-y divide-st-border">
                {filteredUsers.map(user => (
                  <div key={user.id}>
                    <div className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-st-bg-elevated/50 transition-colors">
                      {/* User Info */}
                      <div className="col-span-4 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-st-accent/20 flex items-center justify-center text-sm font-bold text-st-accent shrink-0">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-st-text-primary truncate">{user.name}</p>
                          <p className="text-xs text-st-text-muted truncate">{user.email}</p>
                        </div>
                      </div>
                      {/* Role */}
                      <div className="col-span-2">
                        <Badge variant={getRoleBadgeColor(user.role) as any}>{user.role}</Badge>
                      </div>
                      {/* Status */}
                      <div className="col-span-2">
                        {user.isApproved ? (
                          <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
                            <span className="w-2 h-2 rounded-full bg-emerald-400" />Approved
                          </span>
                        ) : (
                          <span className="flex items-center gap-1.5 text-xs text-orange-400 font-medium">
                            <span className="w-2 h-2 rounded-full bg-orange-400 animate-pulse" />Pending
                          </span>
                        )}
                      </div>
                      {/* Joined */}
                      <div className="col-span-2">
                        <span className="text-sm text-st-text-muted">{new Date(user.createdAt).toLocaleDateString()}</span>
                      </div>
                      {/* Actions */}
                      <div className="col-span-2 flex items-center justify-end gap-2">
                        <button onClick={() => setExpandedUser(expandedUser === user.id ? null : user.id)}
                          className="p-2 rounded-lg text-st-text-muted hover:text-st-accent hover:bg-st-accent/10 transition-colors" title="View Details">
                          <Eye className="w-4 h-4" />
                        </button>
                        {!user.isApproved && (
                          <button onClick={() => handleApprove(user.id)} disabled={actionLoading === user.id}
                            className="p-2 rounded-lg text-emerald-400 hover:bg-emerald-500/10 transition-colors disabled:opacity-50" title="Approve">
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}
                        {confirmDelete === user.id ? (
                          <div className="flex items-center gap-1">
                            <button onClick={() => handleDelete(user.id)} disabled={actionLoading === user.id}
                              className="px-2 py-1 rounded bg-red-500 text-white text-xs font-medium hover:bg-red-600 disabled:opacity-50">
                              Confirm
                            </button>
                            <button onClick={() => setConfirmDelete(null)}
                              className="px-2 py-1 rounded bg-st-bg-elevated text-st-text-muted text-xs hover:text-st-text-primary">
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button onClick={() => setConfirmDelete(user.id)}
                            className="p-2 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors" title="Delete User">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Expanded Details */}
                    {expandedUser === user.id && (
                      <div className="px-4 pb-4">
                        <div className="p-4 bg-st-bg-elevated rounded-lg border border-st-border grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <p className="text-[10px] text-st-text-muted uppercase tracking-wider mb-1">Provider</p>
                            <p className="text-sm text-st-text-primary font-medium">{user.provider || "LOCAL"}</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-st-text-muted uppercase tracking-wider mb-1">Last Updated</p>
                            <p className="text-sm text-st-text-primary font-medium">{new Date(user.updatedAt).toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-st-text-muted uppercase tracking-wider mb-1">Approval Status</p>
                            <p className="text-sm font-medium">{user.isApproved ?
                              <span className="text-emerald-400">✓ Approved</span> :
                              <span className="text-orange-400">⏳ Pending — {getTimeRemaining(user.createdAt)}</span>
                            }</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-st-text-muted uppercase tracking-wider mb-1">User ID</p>
                            <p className="text-xs text-st-text-muted font-mono truncate">{user.id}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
