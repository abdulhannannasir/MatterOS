import React, { useState } from "react";
import {
  CheckSquare,
  Plus,
  Search,
  Sparkles,
  ShieldCheck,
  Clock,
  Calendar,
  User,
  FileText,
  AlertCircle,
  Tag,
  Check,
  X,
  Edit2,
  Trash2,
  Filter,
  CheckCircle2,
  Layers,
  ArrowRight,
} from "lucide-react";
import { Task, TaskStatus, TaskPriority, Issue, Deadline, DocumentItem } from "../../../types/matteros.ts";

interface TasksTabProps {
  tasks: Task[];
  matterId: string;
  issues?: Issue[];
  deadlines?: Deadline[];
  documents?: DocumentItem[];
  currentUserEmail?: string;
  onAddTask: (task: Omit<Task, "id">) => Promise<void>;
  onUpdateTask: (taskId: string, updates: Partial<Task>) => Promise<void>;
  onDeleteTask: (taskId: string) => Promise<void>;
  onConfirmAiTask: (taskId: string) => Promise<void>;
  onPreviewDoc?: (docName: string) => void;
}

export const TasksTab: React.FC<TasksTabProps> = ({
  tasks,
  matterId,
  issues = [],
  deadlines = [],
  documents = [],
  currentUserEmail = "counsel@matteros.law",
  onAddTask,
  onUpdateTask,
  onDeleteTask,
  onConfirmAiTask,
  onPreviewDoc,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [priorityFilter, setPriorityFilter] = useState<string>("All");
  const [showAiOnly, setShowAiOnly] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);

  // Form State
  const [formTitle, setFormTitle] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formAssignedTo, setFormAssignedTo] = useState("");
  const [formPriority, setFormPriority] = useState<TaskPriority>("high");
  const [formStatus, setFormStatus] = useState<TaskStatus>("to_do");
  const [formDueDate, setFormDueDate] = useState("");
  const [formRelatedIssue, setFormRelatedIssue] = useState("");
  const [formRelatedDoc, setFormRelatedDoc] = useState("");
  const [formRelatedDeadline, setFormRelatedDeadline] = useState("");

  const resetForm = () => {
    setFormTitle("");
    setFormDesc("");
    setFormAssignedTo("");
    setFormPriority("high");
    setFormStatus("to_do");
    setFormDueDate("");
    setFormRelatedIssue("");
    setFormRelatedDoc("");
    setFormRelatedDeadline("");
    setEditingTaskId(null);
  };

  const openCreateModal = () => {
    resetForm();
    setShowAddModal(true);
  };

  const openEditModal = (task: Task) => {
    setEditingTaskId(task.id);
    setFormTitle(task.title);
    setFormDesc(task.description || "");
    setFormAssignedTo(task.assignedTo || "");
    setFormPriority(task.priority);
    setFormStatus(task.status);
    setFormDueDate(task.dueDate || "");
    setFormRelatedIssue(task.relatedIssue || "");
    setFormRelatedDoc(task.relatedDocument || "");
    setFormRelatedDeadline(task.relatedDeadline || "");
    setShowAddModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;

    if (editingTaskId) {
      await onUpdateTask(editingTaskId, {
        title: formTitle.trim(),
        description: formDesc.trim() || undefined,
        assignedTo: formAssignedTo.trim() || undefined,
        priority: formPriority,
        status: formStatus,
        dueDate: formDueDate.trim() || undefined,
        relatedIssue: formRelatedIssue.trim() || undefined,
        relatedDocument: formRelatedDoc.trim() || undefined,
        relatedDeadline: formRelatedDeadline.trim() || undefined,
      });
    } else {
      await onAddTask({
        matterId,
        ownerId: "current-user",
        title: formTitle.trim(),
        description: formDesc.trim() || undefined,
        assignedTo: formAssignedTo.trim() || undefined,
        createdBy: currentUserEmail,
        priority: formPriority,
        status: formStatus,
        dueDate: formDueDate.trim() || undefined,
        relatedIssue: formRelatedIssue.trim() || undefined,
        relatedDocument: formRelatedDoc.trim() || undefined,
        relatedDeadline: formRelatedDeadline.trim() || undefined,
        isAiSuggested: false,
        confirmedByLawyer: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    setShowAddModal(false);
    resetForm();
  };

  const handleStatusChange = async (task: Task, newStatus: TaskStatus) => {
    await onUpdateTask(task.id, { status: newStatus });
  };

  const filteredTasks = tasks.filter((t) => {
    const matchesSearch =
      t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.description && t.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (t.assignedTo && t.assignedTo.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus =
      statusFilter === "All" ||
      t.status.toLowerCase() === statusFilter.toLowerCase();

    const matchesPriority =
      priorityFilter === "All" ||
      t.priority.toLowerCase() === priorityFilter.toLowerCase();

    const matchesAi = !showAiOnly || (t.isAiSuggested && !t.confirmedByLawyer);

    return matchesSearch && matchesStatus && matchesPriority && matchesAi;
  });

  const getPriorityBadge = (priority: TaskPriority) => {
    switch (priority.toLowerCase()) {
      case "urgent":
        return "bg-rose-950/70 text-rose-300 border-rose-800/80 font-bold animate-pulse";
      case "high":
        return "bg-amber-950/60 text-amber-300 border-amber-800/60";
      case "normal":
        return "bg-blue-950/60 text-blue-300 border-blue-800/60";
      case "low":
        return "bg-slate-800 text-slate-300 border-slate-700";
      default:
        return "bg-slate-800 text-slate-300 border-slate-700";
    }
  };

  const getStatusBadge = (status: TaskStatus) => {
    switch (status.toLowerCase()) {
      case "completed":
        return "bg-emerald-950/60 text-emerald-300 border-emerald-800/60";
      case "in_progress":
        return "bg-cyan-950/60 text-cyan-300 border-cyan-800/60";
      case "waiting":
        return "bg-amber-950/60 text-amber-300 border-amber-800/60";
      case "cancelled":
        return "bg-slate-800/70 text-slate-400 border-slate-700 line-through";
      default:
        return "bg-slate-900 text-slate-300 border-slate-700";
    }
  };

  const getDaysRemaining = (dueDateStr?: string) => {
    if (!dueDateStr) return null;
    try {
      const target = new Date(dueDateStr).getTime();
      const now = new Date().getTime();
      return Math.ceil((target - now) / (1000 * 60 * 60 * 24));
    } catch {
      return null;
    }
  };

  const pendingAiCount = tasks.filter((t) => t.isAiSuggested && !t.confirmedByLawyer).length;
  const inProgressCount = tasks.filter((t) => t.status === "in_progress" || t.status === "In Progress").length;
  const completedCount = tasks.filter((t) => t.status === "completed" || t.status === "Completed").length;

  return (
    <div className="space-y-6">
      {/* Top Header & Stats */}
      <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <CheckSquare className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="text-sm font-semibold text-slate-100 font-sans flex items-center gap-2">
                <span>Matter Tasks & Action Items</span>
                <span className="text-xs text-slate-400 font-mono font-normal">
                  ({filteredTasks.length} tasks)
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Actionable workflow management with lawyer authorization and source linking.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {pendingAiCount > 0 && (
              <button
                onClick={() => setShowAiOnly(!showAiOnly)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                  showAiOnly
                    ? "bg-amber-500/20 text-amber-300 border-amber-500/50 ring-1 ring-amber-500/40"
                    : "bg-amber-950/40 text-amber-300 border-amber-800/60 hover:bg-amber-900/40"
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>AI Suggestions ({pendingAiCount})</span>
              </button>
            )}

            <button
              onClick={openCreateModal}
              className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs transition-all shadow-sm cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Add Task</span>
            </button>
          </div>
        </div>

        {/* Quick Stats Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-800/80">
          <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-mono">Total Tasks</span>
            <div className="text-base font-bold text-slate-200">{tasks.length}</div>
          </div>
          <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800">
            <span className="text-[10px] text-cyan-400 uppercase tracking-wider font-mono">In Progress</span>
            <div className="text-base font-bold text-cyan-300">{inProgressCount}</div>
          </div>
          <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800">
            <span className="text-[10px] text-amber-400 uppercase tracking-wider font-mono">Awaiting Review</span>
            <div className="text-base font-bold text-amber-300">{pendingAiCount}</div>
          </div>
          <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800">
            <span className="text-[10px] text-emerald-400 uppercase tracking-wider font-mono">Completed</span>
            <div className="text-base font-bold text-emerald-300">{completedCount}</div>
          </div>
        </div>

        {/* Search & Filter Controls */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800/60">
          <div className="relative flex-1 min-w-[180px]">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search tasks, descriptions, assignees..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500/50"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-none"
          >
            <option value="All">All Statuses</option>
            <option value="to_do">To Do</option>
            <option value="in_progress">In Progress</option>
            <option value="waiting">Waiting</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-none"
          >
            <option value="All">All Priorities</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="normal">Normal</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>

      {/* Task List */}
      {filteredTasks.length === 0 ? (
        <div className="py-16 text-center text-slate-500 text-xs border border-dashed border-slate-800 rounded-xl bg-slate-900/40">
          <CheckSquare className="w-10 h-10 text-slate-600 mx-auto mb-2" />
          <p className="font-semibold text-slate-400">No tasks found</p>
          <p className="mt-1">Create an action item or analyze documents to extract suggested procedural tasks.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTasks.map((task) => {
            const daysLeft = getDaysRemaining(task.dueDate);
            const isCompleted = task.status === "completed" || task.status === "Completed";
            const isPendingAi = task.isAiSuggested && !task.confirmedByLawyer;

            return (
              <div
                key={task.id}
                className={`p-4 rounded-xl border transition-all ${
                  isPendingAi
                    ? "bg-amber-950/10 border-amber-500/40 hover:border-amber-500/60 shadow-sm"
                    : isCompleted
                    ? "bg-slate-950/40 border-slate-800/60 opacity-80"
                    : "bg-slate-900/80 hover:bg-slate-900 border-slate-800 hover:border-slate-700 shadow-sm"
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="min-w-0 flex-1 space-y-2">
                    {/* Badges Bar */}
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Priority Badge */}
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded border uppercase ${getPriorityBadge(task.priority)}`}>
                        {task.priority}
                      </span>

                      {/* Status Dropdown/Badge */}
                      <select
                        value={task.status}
                        onChange={(e) => handleStatusChange(task, e.target.value as TaskStatus)}
                        className={`text-[10px] font-mono px-2 py-0.5 rounded border cursor-pointer focus:outline-none ${getStatusBadge(task.status)}`}
                      >
                        <option value="to_do" className="bg-slate-900 text-slate-200">To Do</option>
                        <option value="in_progress" className="bg-slate-900 text-slate-200">In Progress</option>
                        <option value="waiting" className="bg-slate-900 text-slate-200">Waiting</option>
                        <option value="completed" className="bg-slate-900 text-slate-200">Completed</option>
                        <option value="cancelled" className="bg-slate-900 text-slate-200">Cancelled</option>
                      </select>

                      {/* Due Date Indicator */}
                      {task.dueDate && (
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded border flex items-center space-x-1 ${
                            isCompleted
                              ? "bg-slate-950 text-slate-400 border-slate-800"
                              : daysLeft !== null && daysLeft < 0
                              ? "bg-rose-950/70 text-rose-300 border-rose-800 font-bold"
                              : daysLeft !== null && daysLeft <= 7
                              ? "bg-amber-950/60 text-amber-300 border-amber-800 font-semibold"
                              : "bg-slate-950 text-slate-300 border-slate-800"
                          }`}
                        >
                          <Calendar className="w-3 h-3 text-slate-400" />
                          <span>Due: {task.dueDate}</span>
                          {daysLeft !== null && !isCompleted && (
                            <span>
                              ({daysLeft < 0 ? `${Math.abs(daysLeft)}d overdue` : `${daysLeft}d left`})
                            </span>
                          )}
                        </span>
                      )}

                      {/* AI Suggested vs Lawyer Confirmed Badge */}
                      {isPendingAi ? (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950/50 text-amber-300 border border-amber-700/60 flex items-center space-x-1">
                          <Sparkles className="w-3 h-3 text-amber-400" />
                          <span>AI Suggested (Awaiting Lawyer Approval)</span>
                        </span>
                      ) : task.confirmedByLawyer ? (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/40 text-emerald-300 border border-emerald-800/40 flex items-center space-x-1">
                          <ShieldCheck className="w-3 h-3 text-emerald-400" />
                          <span>Counsel Approved</span>
                        </span>
                      ) : null}

                      {/* Assignee */}
                      {task.assignedTo && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-950 text-slate-300 border border-slate-800 flex items-center space-x-1">
                          <User className="w-3 h-3 text-slate-400" />
                          <span>{task.assignedTo}</span>
                        </span>
                      )}
                    </div>

                    {/* Title & Description */}
                    <div>
                      <h4
                        className={`text-sm font-semibold font-serif ${
                          isCompleted ? "text-slate-400 line-through" : "text-slate-100"
                        }`}
                      >
                        {task.title}
                      </h4>
                      {task.description && (
                        <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                          {task.description}
                        </p>
                      )}
                    </div>

                    {/* AI Suggestion Source Box */}
                    {isPendingAi && task.aiSuggestionSource && (
                      <div className="p-2.5 rounded-lg bg-amber-950/20 border border-amber-800/30 text-xs space-y-1">
                        <div className="flex items-center space-x-1 text-amber-300 font-semibold text-[11px]">
                          <Sparkles className="w-3 h-3" />
                          <span>Source Grounding: {task.aiSuggestionSource.documentName}</span>
                          {task.aiSuggestionSource.page && (
                            <span className="text-amber-400">({task.aiSuggestionSource.page})</span>
                          )}
                          <span className="ml-auto text-[10px] font-mono text-amber-400/80">
                            Confidence: {task.aiSuggestionSource.confidence != null ? Math.round(task.aiSuggestionSource.confidence * 100) : 85}%
                          </span>
                        </div>
                        {task.aiSuggestionSource.quote && (
                          <p className="text-[11px] text-slate-300 italic border-l-2 border-amber-500/50 pl-2">
                            "{task.aiSuggestionSource.quote}"
                          </p>
                        )}
                      </div>
                    )}

                    {/* Linked Items Bar */}
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      {task.relatedDocument && (
                        <button
                          onClick={() => onPreviewDoc && onPreviewDoc(task.relatedDocument!)}
                          className="inline-flex items-center space-x-1 text-[11px] text-blue-400 hover:text-blue-300 bg-blue-950/30 border border-blue-900/40 px-2 py-0.5 rounded cursor-pointer transition-colors"
                        >
                          <FileText className="w-3 h-3" />
                          <span>{task.relatedDocument}</span>
                        </button>
                      )}

                      {task.relatedIssue && (
                        <span className="inline-flex items-center space-x-1 text-[11px] text-purple-400 bg-purple-950/30 border border-purple-900/40 px-2 py-0.5 rounded">
                          <AlertCircle className="w-3 h-3" />
                          <span>Issue: {issues.find((i) => i.id === task.relatedIssue)?.title || task.relatedIssue}</span>
                        </span>
                      )}

                      {task.relatedDeadline && (
                        <span className="inline-flex items-center space-x-1 text-[11px] text-amber-400 bg-amber-950/30 border border-amber-900/40 px-2 py-0.5 rounded">
                          <Calendar className="w-3 h-3" />
                          <span>Deadline: {deadlines.find((d) => d.id === task.relatedDeadline)?.title || task.relatedDeadline}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions Right Column */}
                  <div className="flex items-center space-x-1.5 self-start shrink-0">
                    {isPendingAi && (
                      <button
                        onClick={() => onConfirmAiTask(task.id)}
                        className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-semibold text-xs flex items-center space-x-1 shadow-sm transition-all cursor-pointer"
                        title="Approve AI Suggested Task"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Approve Task</span>
                      </button>
                    )}

                    <button
                      onClick={() => openEditModal(task)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
                      title="Edit Task"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => onDeleteTask(task.id)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 transition-colors cursor-pointer"
                      title="Delete Task"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Task Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <CheckSquare className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-semibold text-slate-100 font-sans">
                  {editingTaskId ? "Edit Task" : "Create New Matter Task"}
                </h3>
              </div>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  resetForm();
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-4 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Task Title <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Prepare Deposition Binder for Crestview VP"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500/50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Description / Action Instructions
                </label>
                <textarea
                  rows={3}
                  placeholder="Provide procedural instructions, required documents, or counsel expectations..."
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500/50"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Assignee
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Partner Elena Vance"
                    value={formAssignedTo}
                    onChange={(e) => setFormAssignedTo(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500/50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={formDueDate}
                    onChange={(e) => setFormDueDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-100 focus:outline-none focus:border-amber-500/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Priority
                  </label>
                  <select
                    value={formPriority}
                    onChange={(e) => setFormPriority(e.target.value as TaskPriority)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-100 focus:outline-none"
                  >
                    <option value="urgent">Urgent (Immediate)</option>
                    <option value="high">High</option>
                    <option value="normal">Normal</option>
                    <option value="low">Low</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Status
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as TaskStatus)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-100 focus:outline-none"
                  >
                    <option value="to_do">To Do</option>
                    <option value="in_progress">In Progress</option>
                    <option value="waiting">Waiting</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              {/* Related Linkages */}
              <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800/80 space-y-2.5">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block font-mono">
                  Matter Context Connections (Optional)
                </span>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Related Issue</label>
                  <select
                    value={formRelatedIssue}
                    onChange={(e) => setFormRelatedIssue(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded bg-slate-900 border border-slate-800 text-xs text-slate-200"
                  >
                    <option value="">None</option>
                    {issues.map((iss) => (
                      <option key={iss.id} value={iss.id}>
                        {iss.title} ({iss.status})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Related Document</label>
                  <select
                    value={formRelatedDoc}
                    onChange={(e) => setFormRelatedDoc(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded bg-slate-900 border border-slate-800 text-xs text-slate-200"
                  >
                    <option value="">None</option>
                    {documents.map((d) => (
                      <option key={d.id} value={d.filename}>
                        {d.filename}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Related Deadline</label>
                  <select
                    value={formRelatedDeadline}
                    onChange={(e) => setFormRelatedDeadline(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded bg-slate-900 border border-slate-800 text-xs text-slate-200"
                  >
                    <option value="">None</option>
                    {deadlines.map((dl) => (
                      <option key={dl.id} value={dl.id}>
                        {dl.date} — {dl.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    resetForm();
                  }}
                  className="px-3.5 py-1.5 rounded-lg text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs transition-all shadow-sm cursor-pointer"
                >
                  {editingTaskId ? "Save Changes" : "Create Task"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
