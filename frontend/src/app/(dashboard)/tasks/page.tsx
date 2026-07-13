"use client";

import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { api } from "@/lib/api";
import {
  CheckCircle2, Circle, Clock, Plus, LayoutGrid, List,
  Calendar, Search, X, Trash2, Edit3, Copy
} from "lucide-react";
import { ActionMenu } from "@/components/crud/ActionMenu";
import { ConfirmDialog } from "@/components/crud/ConfirmDialog";
import toast from "react-hot-toast";

type Task = {
  id: string; title: string; description: string; priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  status: "TODO" | "IN_PROGRESS" | "DONE"; dueDate: string | null; category: string | null;
  checklist?: { text: string; done: boolean }[];
};

const priorityColors: Record<string, "danger" | "warning" | "outline" | "success"> = { CRITICAL: "danger", HIGH: "warning", MEDIUM: "outline", LOW: "success" };

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"kanban" | "list">("kanban");
  const [filter, setFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  
  const [confirmDelete, setConfirmDelete] = useState<Task | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  // New task form state
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDesc, setNewTaskDesc] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState<"LOW" | "MEDIUM" | "HIGH" | "CRITICAL">("MEDIUM");

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const res = await api.get<Task[]>('/tasks');
      if (Array.isArray(res)) setTasks(res);
    } catch (err) {
      console.error("Failed to fetch tasks", err);
      toast.error("Failed to load tasks");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleCreateTask = async () => {
    if (!newTaskTitle) return;
    try {
      const res = await api.post<Task>('/tasks', {
        title: newTaskTitle,
        description: newTaskDesc,
        priority: newTaskPriority,
        status: "TODO",
      });
      setTasks(prev => [res, ...prev]);
      setIsModalOpen(false);
      setNewTaskTitle("");
      setNewTaskDesc("");
      setNewTaskPriority("MEDIUM");
      toast.success("Task created");
    } catch (err) {
      console.error("Failed to create task", err);
      toast.error("Failed to create task");
    }
  };

  const toggleTaskStatus = async (task: Task) => {
    const statusCycle: Record<string, "TODO" | "IN_PROGRESS" | "DONE"> = { "TODO": "IN_PROGRESS", "IN_PROGRESS": "DONE", "DONE": "TODO" };
    const newStatus = statusCycle[task.status] || "TODO";
    try {
      // Optimistic update
      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: newStatus } : t));
      await api.put(`/tasks/${task.id}`, { status: newStatus });
    } catch (err) {
      console.error("Failed to update status", err);
      toast.error("Failed to update task status");
      // Revert on fail
      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: task.status } : t));
    }
  };

  const handleDeleteTask = async () => {
    if (!confirmDelete) return;
    setDeleteLoading(true);
    try {
      await api.delete(`/tasks/${confirmDelete.id}`);
      setTasks(prev => prev.filter(t => t.id !== confirmDelete.id));
      toast.success("Task deleted");
    } catch {
      toast.error("Failed to delete task");
    } finally {
      setDeleteLoading(false);
      setConfirmDelete(null);
    }
  };

  const handleDuplicateTask = async (task: Task) => {
    try {
      const res = await api.post<Task>('/tasks', {
        title: `${task.title} (Copy)`,
        description: task.description,
        priority: task.priority,
        status: "TODO",
        category: task.category,
        dueDate: task.dueDate,
      });
      setTasks(prev => [res, ...prev]);
      toast.success("Task duplicated");
    } catch {
      toast.error("Failed to duplicate task");
    }
  };

  const handleEditTask = async () => {
    if (!editingTask) return;
    try {
      const res = await api.put<Task>(`/tasks/${editingTask.id}`, {
        title: newTaskTitle,
        description: newTaskDesc,
        priority: newTaskPriority,
      });
      setTasks(prev => prev.map(t => t.id === editingTask.id ? res : t));
      setIsEditModalOpen(false);
      setEditingTask(null);
      setNewTaskTitle("");
      setNewTaskDesc("");
      setNewTaskPriority("MEDIUM");
      toast.success("Task updated");
    } catch {
      toast.error("Failed to update task");
    }
  };

  const openEditModal = (task: Task) => {
    setEditingTask(task);
    setNewTaskTitle(task.title);
    setNewTaskDesc(task.description);
    setNewTaskPriority(task.priority);
    setIsEditModalOpen(true);
  };

  const filtered = tasks.filter(t => {
    if (filter !== "ALL" && t.status !== filter) return false;
    if (searchQuery && !t.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const columns = [
    { key: "TODO", label: "To Do", color: "border-blue-400" },
    { key: "IN_PROGRESS", label: "In Progress", color: "border-st-accent" },
    { key: "DONE", label: "Completed", color: "border-st-success" },
  ];

  const TaskCard = ({ task }: { task: Task }) => (
    <Card className="p-4 hover:border-st-accent/30 transition-all group">
      <div className="flex justify-between items-start mb-2">
        <div className="flex gap-2 items-start">
          <button onClick={() => toggleTaskStatus(task)} className="mt-0.5 text-st-text-muted hover:text-st-accent">
            {task.status === "DONE" ? <CheckCircle2 className="w-4 h-4 text-st-success" /> : <Circle className="w-4 h-4" />}
          </button>
          <h4 className={`font-semibold text-sm transition-colors ${task.status === "DONE" ? 'line-through text-st-text-muted' : 'text-st-text-primary group-hover:text-st-accent'}`}>{task.title}</h4>
        </div>
        <Badge variant={priorityColors[task.priority]}>{task.priority}</Badge>
      </div>
      {task.description && <p className="text-xs text-st-text-muted mb-3 line-clamp-2 ml-6">{task.description}</p>}
      
      {task.checklist && task.checklist.length > 0 && (
        <div className="mb-3 ml-6">
          <div className="flex items-center gap-2 mb-1">
            <div className="flex-1 h-1.5 bg-st-bg-elevated rounded-full overflow-hidden">
              <div className="h-full bg-st-accent rounded-full" style={{ width: `${(task.checklist.filter(c => c.done).length / task.checklist.length) * 100}%` }} />
            </div>
            <span className="text-[10px] text-st-text-muted">{task.checklist.filter(c => c.done).length}/{task.checklist.length}</span>
          </div>
        </div>
      )}
      
      <div className="flex items-center justify-between ml-6">
        <div className="flex items-center gap-2">
          {task.dueDate && <span className="text-[10px] text-st-text-muted flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(task.dueDate).toLocaleDateString()}</span>}
        </div>
        <div className="flex items-center gap-2">
          {task.category && <span className="text-[10px] px-1.5 py-0.5 rounded bg-st-bg-elevated text-st-text-muted">{task.category}</span>}
          <ActionMenu
            actions={[
              { id: "edit", label: "Edit", icon: Edit3, onClick: () => openEditModal(task) },
              { id: "duplicate", label: "Duplicate", icon: Copy, onClick: () => handleDuplicateTask(task) },
              { id: "delete", label: "Delete", icon: Trash2, variant: "danger", divider: true, onClick: () => setConfirmDelete(task) },
            ]}
          />
        </div>
      </div>
    </Card>
  );

  return (
    <div className="h-full flex flex-col gap-6 relative">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <p className="text-[10px] font-bold tracking-widest text-st-accent uppercase mb-1">Task Management</p>
          <h1 className="text-3xl font-bold text-st-text-primary">Tasks</h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-st-text-muted" />
            <input type="text" placeholder="Search tasks..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 bg-st-bg-elevated border border-st-border rounded-lg text-sm text-st-text-primary placeholder:text-st-text-muted focus:outline-none focus:border-st-accent/50 w-64" />
          </div>
          <div className="flex bg-st-bg-elevated rounded-lg border border-st-border overflow-hidden">
            <button onClick={() => setViewMode("kanban")} className={`p-2 ${viewMode === "kanban" ? "bg-st-accent/10 text-st-accent" : "text-st-text-muted hover:text-st-text-primary"}`}><LayoutGrid className="w-4 h-4" /></button>
            <button onClick={() => setViewMode("list")} className={`p-2 ${viewMode === "list" ? "bg-st-accent/10 text-st-accent" : "text-st-text-muted hover:text-st-text-primary"}`}><List className="w-4 h-4" /></button>
          </div>
          <Button onClick={() => setIsModalOpen(true)} variant="primary" size="sm"><Plus className="w-4 h-4 mr-1" />New Task</Button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        {["ALL", "TODO", "IN_PROGRESS", "DONE"].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-xs font-medium transition-colors ${filter === f ? "bg-st-accent text-black" : "bg-st-bg-elevated text-st-text-secondary hover:text-st-text-primary border border-st-border"}`}>
            {f === "ALL" ? "All" : f === "IN_PROGRESS" ? "In Progress" : f === "TODO" ? "To Do" : "Done"}
            <span className="ml-1.5 opacity-70">({f === "ALL" ? tasks.length : tasks.filter(t => t.status === f).length})</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-2 border-st-accent border-t-transparent rounded-full" />
        </div>
      ) : (
        <>
          {/* Kanban View */}
          {viewMode === "kanban" ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1 min-h-0">
              {columns.map(col => (
                <div key={col.key} className="flex flex-col gap-4">
                  <div className={`flex items-center justify-between border-b-2 ${col.color} pb-3`}>
                    <h3 className="font-semibold text-sm text-st-text-primary">{col.label}</h3>
                    <Badge variant="outline">{filtered.filter(t => t.status === col.key).length}</Badge>
                  </div>
                  <div className="space-y-3 flex-1 overflow-y-auto">
                    {filtered.filter(t => t.status === col.key).map(task => <TaskCard key={task.id} task={task} />)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* List View */
            <Card className="p-0 overflow-hidden flex-1">
              <div className="divide-y divide-st-border overflow-y-auto max-h-full">
                <div className="grid grid-cols-12 gap-4 p-4 text-xs font-semibold text-st-text-muted uppercase tracking-wider bg-st-bg-elevated sticky top-0">
                  <div className="col-span-1">Status</div><div className="col-span-4">Task</div><div className="col-span-2">Priority</div>
                  <div className="col-span-2">Category</div><div className="col-span-2">Due Date</div><div className="col-span-1" />
                </div>
                {filtered.length === 0 && <div className="p-8 text-center text-st-text-muted">No tasks found.</div>}
                {filtered.map(task => (
                  <div key={task.id} className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-st-bg-elevated transition-colors group">
                    <div className="col-span-1">
                      <button onClick={() => toggleTaskStatus(task)} className="text-st-text-muted hover:text-st-accent">
                        {task.status === "DONE" ? <CheckCircle2 className="w-5 h-5 text-st-success" /> : <Circle className="w-5 h-5" />}
                      </button>
                    </div>
                    <div className="col-span-4">
                      <h4 className={`font-medium text-sm ${task.status === "DONE" ? "line-through text-st-text-muted" : "text-st-text-primary"}`}>{task.title}</h4>
                      {task.description && <p className="text-xs text-st-text-muted mt-0.5 truncate">{task.description}</p>}
                    </div>
                    <div className="col-span-2"><Badge variant={priorityColors[task.priority]}>{task.priority}</Badge></div>
                    <div className="col-span-2"><span className="text-sm text-st-text-secondary">{task.category || '—'}</span></div>
                    <div className="col-span-2">
                      <span className="text-sm text-st-text-muted flex items-center gap-1">
                        {task.dueDate ? <><Clock className="w-3 h-3" /> {new Date(task.dueDate).toLocaleDateString()}</> : '—'}
                      </span>
                    </div>
                    <div className="col-span-1 flex items-center justify-end">
                      <ActionMenu
                        actions={[
                          { id: "edit", label: "Edit", icon: Edit3, onClick: () => openEditModal(task) },
                          { id: "duplicate", label: "Duplicate", icon: Copy, onClick: () => handleDuplicateTask(task) },
                          { id: "delete", label: "Delete", icon: Trash2, variant: "danger", divider: true, onClick: () => setConfirmDelete(task) },
                        ]}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </>
      )}

      <ConfirmDialog
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={handleDeleteTask}
        title="Delete Task"
        message="This task will be permanently removed."
        itemName={confirmDelete?.title}
        confirmLabel="Delete"
        variant="danger"
        isLoading={deleteLoading}
      />

      {/* Quick Add Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <Card className="w-[400px] p-6 space-y-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-bold text-lg text-st-text-primary">Create New Task</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-st-text-muted hover:text-st-text-primary"><X className="w-5 h-5"/></button>
            </div>
            <div>
              <label className="text-xs text-st-text-secondary mb-1 block">Title</label>
              <input value={newTaskTitle} onChange={e => setNewTaskTitle(e.target.value)} autoFocus
                className="w-full bg-st-bg-elevated border border-st-border rounded p-2 text-sm text-white focus:border-st-accent outline-none" />
            </div>
            <div>
              <label className="text-xs text-st-text-secondary mb-1 block">Description</label>
              <textarea value={newTaskDesc} onChange={e => setNewTaskDesc(e.target.value)}
                className="w-full bg-st-bg-elevated border border-st-border rounded p-2 text-sm text-white focus:border-st-accent outline-none" />
            </div>
            <div>
              <label className="text-xs text-st-text-secondary mb-1 block">Priority</label>
              <select value={newTaskPriority} onChange={e => setNewTaskPriority(e.target.value as "LOW" | "MEDIUM" | "HIGH" | "CRITICAL")}
                className="w-full bg-st-bg-elevated border border-st-border rounded p-2 text-sm text-white focus:border-st-accent outline-none">
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="CRITICAL">Critical</option>
              </select>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button onClick={() => setIsModalOpen(false)} variant="outline">Cancel</Button>
              <Button onClick={handleCreateTask} variant="primary" disabled={!newTaskTitle}>Create Task</Button>
            </div>
          </Card>
        </div>
      )}

      {/* Edit Modal */}
      {isEditModalOpen && editingTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <Card className="w-[400px] p-6 space-y-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-bold text-lg text-st-text-primary">Edit Task</h3>
              <button onClick={() => { setIsEditModalOpen(false); setEditingTask(null); setNewTaskTitle(""); setNewTaskDesc(""); setNewTaskPriority("MEDIUM"); }} className="text-st-text-muted hover:text-st-text-primary"><X className="w-5 h-5"/></button>
            </div>
            <div>
              <label className="text-xs text-st-text-secondary mb-1 block">Title</label>
              <input value={newTaskTitle} onChange={e => setNewTaskTitle(e.target.value)} autoFocus
                className="w-full bg-st-bg-elevated border border-st-border rounded p-2 text-sm text-white focus:border-st-accent outline-none" />
            </div>
            <div>
              <label className="text-xs text-st-text-secondary mb-1 block">Description</label>
              <textarea value={newTaskDesc} onChange={e => setNewTaskDesc(e.target.value)}
                className="w-full bg-st-bg-elevated border border-st-border rounded p-2 text-sm text-white focus:border-st-accent outline-none" />
            </div>
            <div>
              <label className="text-xs text-st-text-secondary mb-1 block">Priority</label>
              <select value={newTaskPriority} onChange={e => setNewTaskPriority(e.target.value as "LOW" | "MEDIUM" | "HIGH" | "CRITICAL")}
                className="w-full bg-st-bg-elevated border border-st-border rounded p-2 text-sm text-white focus:border-st-accent outline-none">
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="CRITICAL">Critical</option>
              </select>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button onClick={() => { setIsEditModalOpen(false); setEditingTask(null); setNewTaskTitle(""); setNewTaskDesc(""); setNewTaskPriority("MEDIUM"); }} variant="outline">Cancel</Button>
              <Button onClick={handleEditTask} variant="primary" disabled={!newTaskTitle}>Save Changes</Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
