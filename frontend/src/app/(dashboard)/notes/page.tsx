"use client";

import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import api from "@/lib/api";
import {
  FileText, Plus, Search, Pin, Tag, Folder, Save, Bold, Italic,
  Code, List, Link2, Image, Table, Clock, Trash2, Copy, Edit3,
  FolderPlus, Pencil, X, Check
} from "lucide-react";
import { ActionMenu } from "@/components/crud/ActionMenu";
import { ConfirmDialog } from "@/components/crud/ConfirmDialog";
import { NotesListSkeleton } from "@/components/ui/ListSkeleton";
import toast from "react-hot-toast";

type Note = {
  id: string; title: string; content: string; tags: string[]; folderId: string | null;
  isPinned: boolean; updatedAt: string; wordCount: number;
};

const DEFAULT_FOLDERS = ["All Notes", "General"];

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFolder, setSelectedFolder] = useState("All Notes");
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [noteContent, setNoteContent] = useState("");
  const [noteTitle, setNoteTitle] = useState("");
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<Note | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Folder management
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [editingFolder, setEditingFolder] = useState<string | null>(null);
  const [editingFolderValue, setEditingFolderValue] = useState("");
  const [confirmDeleteFolder, setConfirmDeleteFolder] = useState<string | null>(null);
  const [folders, setFolders] = useState<string[]>(DEFAULT_FOLDERS);

  // sync folders from notes + localStorage
  useEffect(() => {
    const stored = localStorage.getItem("notes-folders");
    const saved: string[] = stored ? JSON.parse(stored) : [];
    const all = new Set([...DEFAULT_FOLDERS, ...saved]);
    notes.forEach(n => { if (n.folderId) all.add(n.folderId); });
    setFolders(Array.from(all));
  }, [notes]);

  const persistFolders = (updated: string[]) => {
    const custom = updated.filter(f => !DEFAULT_FOLDERS.includes(f));
    localStorage.setItem("notes-folders", JSON.stringify(custom));
    setFolders(updated);
  };

  useEffect(() => {
    const fetchNotes = async () => {
      try {
        setLoading(true);
        const res = await api.get<{ notes: Note[] }>('/notes');
        if (res && Array.isArray(res.notes)) {
          const mapped = res.notes.map((n: Note) => ({ ...n, folderId: n.folderId || null }));
          setNotes(mapped);
        }
      } catch (err) {
        console.error("Failed to fetch notes", err);
        toast.error("Failed to load notes");
      } finally {
        setLoading(false);
      }
    };
    fetchNotes();
  }, []);

  useEffect(() => {
    if (notes.length > 0 && !selectedNote) {
      setSelectedNote(notes[0]);
      setNoteContent(notes[0].content);
      setNoteTitle(notes[0].title);
    }
  }, [notes, selectedNote]);

  const handleSelectNote = (note: Note) => {
    setSelectedNote(note);
    setNoteContent(note.content);
    setNoteTitle(note.title);
  };

  const handleCreateNote = async () => {
    try {
      const folderPayload = selectedFolder === "All Notes" ? "General" : selectedFolder;
      const res = await api.post<Note>('/notes', {
        title: "Untitled Note",
        content: "",
        tags: [],
        folderId: folderPayload,
      });
      const created = { ...res, folderId: res.folderId || null };
      setNotes(prev => [created, ...prev]);
      handleSelectNote(created);
      toast.success("Note created");
    } catch {
      toast.error("Failed to create note");
    }
  };

  const handleSaveNote = async () => {
    if (!selectedNote) return;
    try {
      setSaving(true);
      const res = await api.put<Note>(`/notes/${selectedNote.id}`, {
        title: noteTitle,
        content: noteContent,
      });
      const updated = { ...res, folderId: res.folderId || null };
      setNotes(prev => prev.map(n => n.id === selectedNote.id ? updated : n));
      setSelectedNote(updated);
      toast.success("Note saved");
    } catch {
      toast.error("Failed to save note");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteNote = async () => {
    if (!confirmDelete) return;
    setDeleteLoading(true);
    try {
      await api.delete(`/notes/${confirmDelete.id}`);
      setNotes(prev => prev.filter(n => n.id !== confirmDelete.id));
      if (selectedNote?.id === confirmDelete.id) {
        setSelectedNote(null);
        setNoteContent("");
        setNoteTitle("");
      }
      toast.success("Note deleted");
    } catch {
      toast.error("Failed to delete note");
    } finally {
      setDeleteLoading(false);
      setConfirmDelete(null);
    }
  };

  const handleDuplicateNote = async (note: Note) => {
    try {
      const res = await api.post<Note>('/notes', {
        title: `${note.title} (Copy)`,
        content: note.content,
        tags: note.tags,
        folderId: note.folderId,
      });
      const created = { ...res, folderId: res.folderId || null };
      setNotes(prev => [created, ...prev]);
      toast.success("Note duplicated");
    } catch {
      toast.error("Failed to duplicate note");
    }
  };

  const handleCreateFolder = () => {
    const name = newFolderName.trim();
    if (!name) return;
    if (folders.includes(name)) {
      toast.error("Folder already exists");
      return;
    }
    persistFolders([...folders, name]);
    setNewFolderName("");
    setShowNewFolder(false);
    setSelectedFolder(name);
    toast.success(`Folder "${name}" created`);
  };

  const handleRenameFolder = () => {
    if (!editingFolder || !editingFolderValue.trim()) return;
    const oldName = editingFolder;
    const newName = editingFolderValue.trim();
    if (oldName === newName) { setEditingFolder(null); return; }
    if (DEFAULT_FOLDERS.includes(oldName)) { toast.error("Cannot rename default folders"); return; }
    if (folders.includes(newName)) { toast.error("Folder name already exists"); return; }
    const updated = folders.map(f => f === oldName ? newName : f);
    persistFolders(updated);
    // Update notes in this folder
    setNotes(prev => prev.map(n => ({
      ...n,
      folderId: n.folderId === oldName ? newName : n.folderId,
    })));
    if (selectedFolder === oldName) setSelectedFolder(newName);
    setEditingFolder(null);
    toast.success(`Renamed to "${newName}"`);
  };

  const handleDeleteFolder = () => {
    if (!confirmDeleteFolder) return;
    const folderName = confirmDeleteFolder;
    if (DEFAULT_FOLDERS.includes(folderName)) { toast.error("Cannot delete default folders"); setConfirmDeleteFolder(null); return; }
    const updated = folders.filter(f => f !== folderName);
    persistFolders(updated);
    // Move notes to General
    setNotes(prev => prev.map(n => ({
      ...n,
      folderId: n.folderId === folderName ? "General" : n.folderId,
    })));
    if (selectedFolder === folderName) setSelectedFolder("All Notes");
    setConfirmDeleteFolder(null);
    toast.success(`Folder "${folderName}" deleted`);
  };

  const handleMoveToFolder = async (note: Note, targetFolder: string) => {
    try {
      const res = await api.put<Note>(`/notes/${note.id}`, { folderId: targetFolder });
      const updated = { ...res, folderId: res.folderId || null };
      setNotes(prev => prev.map(n => n.id === note.id ? updated : n));
      if (selectedNote?.id === note.id) setSelectedNote(updated);
      toast.success(`Moved to "${targetFolder}"`);
    } catch {
      toast.error("Failed to move note");
    }
  };

  const filtered = notes.filter(n => {
    if (selectedFolder !== "All Notes" && (n.folderId || "General") !== selectedFolder) return false;
    if (searchQuery && !n.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="h-full flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <div>
          <p className="text-[10px] font-bold tracking-widest text-st-accent uppercase mb-1">Knowledge Base</p>
          <h1 className="text-3xl font-bold text-st-text-primary">Notes</h1>
        </div>
        <Button onClick={handleCreateNote} variant="primary" size="sm"><Plus className="w-4 h-4 mr-1" />New Note</Button>
      </div>

      <div className="flex-1 grid grid-cols-12 gap-6 min-h-0 overflow-hidden">
        {/* Folders Sidebar */}
        <div className="col-span-2 flex flex-col gap-1">
          {folders.map(f => (
            <div key={f} className="group flex items-center gap-1">
              {editingFolder === f ? (
                <div className="flex items-center gap-1 w-full">
                  <input
                    value={editingFolderValue}
                    onChange={e => setEditingFolderValue(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") handleRenameFolder(); if (e.key === "Escape") setEditingFolder(null); }}
                    className="flex-1 px-2 py-1.5 text-sm bg-st-bg-elevated border border-st-accent/50 rounded-lg focus:outline-none text-st-text-primary"
                    autoFocus
                  />
                  <button onClick={handleRenameFolder} className="p-1 text-st-success hover:text-st-success/80"><Check className="w-3.5 h-3.5" /></button>
                  <button onClick={() => setEditingFolder(null)} className="p-1 text-st-text-muted hover:text-st-text-primary"><X className="w-3.5 h-3.5" /></button>
                </div>
              ) : (
                <>
                  <button
                    onClick={() => setSelectedFolder(f)}
                    className={`flex-1 text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                      selectedFolder === f ? "bg-st-accent/10 text-st-accent" : "text-st-text-secondary hover:text-st-text-primary hover:bg-st-bg-elevated"
                    }`}
                  >
                    <Folder className="w-4 h-4 shrink-0" />
                    <span className="truncate">{f}</span>
                    <span className="ml-auto text-[10px] opacity-50">
                      {f === "All Notes" ? notes.length : notes.filter(n => (n.folderId || "General") === f).length}
                    </span>
                  </button>
                  {!DEFAULT_FOLDERS.includes(f) && (
                    <ActionMenu
                      actions={[
                        { id: "rename", label: "Rename", icon: Pencil, onClick: () => { setEditingFolder(f); setEditingFolderValue(f); } },
                        { id: "delete", label: "Delete", icon: Trash2, variant: "danger", onClick: () => setConfirmDeleteFolder(f) },
                      ]}
                    />
                  )}
                </>
              )}
            </div>
          ))}
          {showNewFolder ? (
            <div className="flex items-center gap-1 px-1">
              <input
                value={newFolderName}
                onChange={e => setNewFolderName(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") handleCreateFolder(); if (e.key === "Escape") { setShowNewFolder(false); setNewFolderName(""); } }}
                placeholder="Folder name..."
                className="flex-1 px-2 py-1.5 text-sm bg-st-bg-elevated border border-st-accent/50 rounded-lg focus:outline-none text-st-text-primary"
                autoFocus
              />
              <button onClick={handleCreateFolder} className="p-1 text-st-success hover:text-st-success/80"><Check className="w-3.5 h-3.5" /></button>
              <button onClick={() => { setShowNewFolder(false); setNewFolderName(""); }} className="p-1 text-st-text-muted hover:text-st-text-primary"><X className="w-3.5 h-3.5" /></button>
            </div>
          ) : (
            <button onClick={() => setShowNewFolder(true)}
              className="flex items-center gap-2 px-3 py-2 text-xs text-st-text-muted hover:text-st-accent hover:bg-st-bg-elevated rounded-lg transition-colors">
              <FolderPlus className="w-3.5 h-3.5" /> New Folder
            </button>
          )}
        </div>

        {/* Notes List */}
        <div className="col-span-3 flex flex-col gap-3 overflow-y-auto">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-st-text-muted" />
            <input type="text" placeholder="Search notes..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-st-bg-elevated border border-st-border rounded-lg text-sm text-st-text-primary placeholder:text-st-text-muted focus:outline-none focus:border-st-accent/50" />
          </div>
          {loading ? (
            <NotesListSkeleton />
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-st-text-muted">No notes found.</div>
          ) : (
            filtered.map(note => (
              <Card key={note.id} onClick={() => handleSelectNote(note)}
                className={`p-4 cursor-pointer transition-all ${selectedNote?.id === note.id ? "border-st-accent/50 bg-st-bg-elevated" : "hover:border-st-accent/20"}`}>
                <div className="flex items-start justify-between mb-1">
                  <h4 className="font-semibold text-sm text-st-text-primary truncate flex-1">{note.title}</h4>
                  <div className="flex items-center gap-1 shrink-0">
                    {note.isPinned && <Pin className="w-3 h-3 text-st-accent" />}
                    <ActionMenu
                      actions={[
                        { id: "edit", label: "Edit", icon: Edit3, onClick: () => handleSelectNote(note) },
                        { id: "duplicate", label: "Duplicate", icon: Copy, onClick: () => handleDuplicateNote(note) },
                        ...folders.filter(f => f !== "All Notes" && f !== (note.folderId || "General")).map(f => ({
                          id: `move-${f}`, label: `Move to "${f}"`, icon: Folder as React.ElementType, onClick: () => handleMoveToFolder(note, f),
                        })),
                        { id: "delete", label: "Delete", icon: Trash2, variant: "danger" as const, divider: true, onClick: () => setConfirmDelete(note) },
                      ]}
                    />
                  </div>
                </div>
                <p className="text-xs text-st-text-muted line-clamp-2 mb-2">{note.content}</p>
                <div className="flex items-center justify-between">
                  <div className="flex gap-1">
                    {(note.tags || []).slice(0, 2).map(t => <span key={t} className="text-[10px] px-1.5 py-0.5 rounded bg-st-bg-primary text-st-text-muted">{t}</span>)}
                    {note.folderId && <Badge variant="outline" className="text-[10px]">{note.folderId}</Badge>}
                  </div>
                  <span className="text-[10px] text-st-text-muted">{new Date(note.updatedAt).toLocaleDateString()}</span>
                </div>
              </Card>
            ))
          )}
        </div>

        {/* Editor */}
        <div className="col-span-7 flex flex-col gap-4 overflow-hidden">
          {selectedNote ? (
            <>
              <div className="flex items-center justify-between">
                <input type="text" value={noteTitle} onChange={(e) => setNoteTitle(e.target.value)}
                  className="text-2xl font-bold bg-transparent text-st-text-primary focus:outline-none flex-1" />
                <div className="flex items-center gap-2">
                  <span className="text-xs text-st-text-muted flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(selectedNote.updatedAt).toLocaleString()}</span>
                  <span className="text-xs text-st-text-muted">{noteContent.split(/\s+/).filter(w => w.length > 0).length} words</span>
                  <Button onClick={handleSaveNote} variant="primary" size="sm" disabled={saving}>
                    <Save className="w-3 h-3 mr-1" />{saving ? 'Saving...' : 'Save'}
                  </Button>
                </div>
              </div>

              {/* Toolbar */}
              <div className="flex items-center gap-1 p-2 bg-st-bg-elevated rounded-lg border border-st-border">
                {[Bold, Italic, Code, List, Link2, Image, Table].map((Icon, i) => (
                  <button key={i} className="p-2 rounded hover:bg-st-bg-primary text-st-text-muted hover:text-st-text-primary transition-colors">
                    <Icon className="w-4 h-4" />
                  </button>
                ))}
              </div>

              {/* Content Area */}
              <textarea value={noteContent} onChange={(e) => setNoteContent(e.target.value)}
                className="flex-1 bg-st-bg-card border border-st-border rounded-lg p-6 text-sm text-st-text-primary leading-relaxed resize-none focus:outline-none focus:border-st-accent/30 font-mono"
                placeholder="Start writing..." />

              {/* Tags */}
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-st-text-muted" />
                {(selectedNote.tags || []).map(t => <Badge key={t} variant="outline">{t}</Badge>)}
                {selectedNote.folderId && <Badge variant="outline" className="bg-st-accent/10 text-st-accent border-st-accent/30">{selectedNote.folderId}</Badge>}
                <button className="text-xs text-st-text-muted hover:text-st-accent">+ Add tag</button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-st-text-muted">
              <div className="text-center">
                <FileText className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p>Select a note to start editing</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={handleDeleteNote}
        title="Delete Note"
        message="This note will be permanently removed."
        itemName={confirmDelete?.title}
        confirmLabel="Delete"
        variant="danger"
        isLoading={deleteLoading}
      />

      <ConfirmDialog
        isOpen={!!confirmDeleteFolder}
        onClose={() => setConfirmDeleteFolder(null)}
        onConfirm={handleDeleteFolder}
        title="Delete Folder"
        message={`Notes in "${confirmDeleteFolder}" will be moved to "General".`}
        itemName={confirmDeleteFolder || undefined}
        confirmLabel="Delete Folder"
        variant="warning"
      />
    </div>
  );
}
