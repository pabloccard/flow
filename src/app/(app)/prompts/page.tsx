"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useWorkspace } from "@/contexts/workspace-context";
import { Prompt } from "@/lib/types";
import {
  Plus,
  Copy,
  Check,
  MoreVertical,
  Pencil,
  Trash2,
  MessageSquareText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

export default function PromptsPage() {
  const { workspaceId, user } = useWorkspace();
  const supabase = createClient();
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);

  // Delete confirmation
  const [promptToDelete, setPromptToDelete] = useState<Prompt | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Copy feedback
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchPrompts = useCallback(async () => {
    if (!workspaceId) return;
    try {
      const { data, error } = await supabase
        .from("prompts")
        .select("*")
        .eq("workspace_id", workspaceId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPrompts(data || []);
    } catch (err) {
      console.error("Error fetching prompts:", err);
    } finally {
      setLoading(false);
    }
  }, [workspaceId, supabase]);

  useEffect(() => {
    fetchPrompts();
  }, [fetchPrompts]);

  const openCreateModal = () => {
    setEditingPrompt(null);
    setTitle("");
    setContent("");
    setIsModalOpen(true);
  };

  const openEditModal = (prompt: Prompt) => {
    setEditingPrompt(prompt);
    setTitle(prompt.title);
    setContent(prompt.content);
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!title.trim() || !content.trim() || !workspaceId || !user) return;
    setSaving(true);

    try {
      if (editingPrompt) {
        const { error } = await supabase
          .from("prompts")
          .update({ title: title.trim(), content: content.trim(), updated_at: new Date().toISOString() })
          .eq("id", editingPrompt.id);
        if (error) throw error;
        toast.success("Prompt atualizado!");
      } else {
        const { error } = await supabase
          .from("prompts")
          .insert({
            title: title.trim(),
            content: content.trim(),
            workspace_id: workspaceId,
            created_by: user.id,
          });
        if (error) throw error;
        toast.success("Prompt criado!");
      }

      setIsModalOpen(false);
      setTitle("");
      setContent("");
      setEditingPrompt(null);
      fetchPrompts();
    } catch (err) {
      console.error("Error saving prompt:", err);
      toast.error("Erro ao salvar prompt.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!promptToDelete) return;
    setDeleting(true);

    try {
      const { error } = await supabase
        .from("prompts")
        .delete()
        .eq("id", promptToDelete.id);

      if (error) throw error;
      setPromptToDelete(null);
      toast.success("Prompt excluído!");
      fetchPrompts();
    } catch (err) {
      console.error("Error deleting prompt:", err);
      toast.error("Erro ao excluir prompt.");
    } finally {
      setDeleting(false);
    }
  };

  const handleCopy = async (prompt: Prompt) => {
    try {
      await navigator.clipboard.writeText(prompt.content);
      setCopiedId(prompt.id);
      toast.success("Prompt copiado!");
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      toast.error("Erro ao copiar.");
    }
  };

  if (loading) {
    return (
      <div className="h-full flex flex-col gap-6 animate-in fade-in duration-500">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-40 bg-white/5 rounded-xl" />
          <Skeleton className="h-9 w-20 bg-white/5 rounded-xl" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-40 bg-white/5 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col gap-6 sm:gap-8 animate-in fade-in duration-500 overflow-y-auto hide-scrollbar">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="font-black text-white text-xl sm:text-2xl tracking-tight">
            Prompts
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 mt-1">
            Salve e organize seus prompts para usar quando precisar
          </p>
        </div>

        <Button
          onClick={openCreateModal}
          className="h-8.5 px-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-medium text-xs shadow-[0_0_20px_rgba(99,102,241,0.35)] transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] border border-indigo-400/20 cursor-pointer flex items-center gap-1"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Novo</span>
        </Button>
      </div>

      {/* Prompts Grid */}
      {prompts.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center py-20">
          <div className="w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mb-4">
            <MessageSquareText className="w-7 h-7 text-zinc-600" />
          </div>
          <p className="text-sm text-zinc-500 mb-1">Nenhum prompt salvo</p>
          <p className="text-xs text-zinc-600">
            Clique em <span className="text-indigo-400">+ Novo</span> para criar seu primeiro prompt
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5 pb-6">
          {prompts.map((prompt) => (
            <div
              key={prompt.id}
              className="group relative p-5 sm:p-6 rounded-2xl border border-white/[0.04] bg-white/[0.01] hover:bg-white/[0.03] hover:border-white/15 transition-all duration-200 flex flex-col gap-4 min-h-[140px] sm:min-h-[160px]"
            >
              {/* Top: Title + Actions */}
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-sm sm:text-base font-semibold text-zinc-200 leading-snug tracking-tight line-clamp-2 flex-1">
                  {prompt.title}
                </h3>

                <div className="flex items-center gap-1.5 shrink-0">
                  {/* Copy button */}
                  <button
                    type="button"
                    onClick={() => handleCopy(prompt)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/[0.04] hover:bg-indigo-500/20 border border-white/[0.06] hover:border-indigo-500/30 transition-all duration-200 cursor-pointer group/copy"
                    title="Copiar prompt"
                  >
                    {copiedId === prompt.id ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5 text-zinc-400 group-hover/copy:text-indigo-400 transition-colors" />
                    )}
                  </button>

                  {/* 3 dots menu */}
                  <DropdownMenu>
                    <DropdownMenuTrigger className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] transition-all duration-200 cursor-pointer outline-none">
                      <MoreVertical className="w-3.5 h-3.5 text-zinc-400" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-[#14141B] border-white/10 shadow-2xl rounded-xl p-1.5 min-w-[140px]">
                      <DropdownMenuItem
                        onClick={() => openEditModal(prompt)}
                        className="text-xs text-zinc-300 focus:text-white focus:bg-white/[0.06] rounded-lg cursor-pointer py-2"
                      >
                        <Pencil className="w-3.5 h-3.5 mr-2 text-indigo-400" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setPromptToDelete(prompt)}
                        className="text-xs text-red-400 focus:text-red-300 focus:bg-red-500/10 rounded-lg cursor-pointer py-2"
                      >
                        <Trash2 className="w-3.5 h-3.5 mr-2" />
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {/* Subtle timestamp */}
              <p className="text-[10px] text-zinc-600 mt-auto">
                {new Date(prompt.created_at).toLocaleDateString("pt-BR", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent
          showCloseButton={false}
          className="bg-[#0E0E14] border-white/10 text-white w-[94vw] max-w-[560px] max-h-[90dvh] p-6 sm:p-8 rounded-3xl shadow-[0_25px_70px_rgba(0,0,0,0.9)] backdrop-blur-2xl flex flex-col gap-5 overflow-hidden"
        >
          <DialogHeader className="shrink-0">
            <DialogTitle className="text-base sm:text-lg font-bold text-white tracking-tight">
              {editingPrompt ? "Editar Prompt" : "Novo Prompt"}
            </DialogTitle>
            <DialogDescription className="text-xs text-zinc-500">
              {editingPrompt
                ? "Atualize o título e conteúdo do prompt"
                : "Adicione um título e o conteúdo do prompt para salvar"}
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 min-h-0 overflow-y-auto hide-scrollbar space-y-4">
            {/* Title */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-zinc-400">Título</label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Descrição de produto para TikTok"
                className="bg-white/[0.04] border-white/[0.08] text-white placeholder:text-zinc-600 h-10 rounded-xl text-sm focus-visible:ring-indigo-500/40"
              />
            </div>

            {/* Content */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-zinc-400">Prompt</label>
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Cole ou escreva o prompt aqui..."
                rows={10}
                className="bg-white/[0.04] border-white/[0.08] text-white placeholder:text-zinc-600 rounded-xl text-sm leading-relaxed resize-none focus-visible:ring-indigo-500/40 min-h-[200px] max-h-[40dvh]"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="grid grid-cols-2 gap-2.5 pt-1 shrink-0">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsModalOpen(false)}
              className="h-10 rounded-xl text-xs font-medium text-zinc-400 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] cursor-pointer"
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              disabled={saving || !title.trim() || !content.trim()}
              className="h-10 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-medium text-xs shadow-[0_0_20px_rgba(99,102,241,0.35)] transition-all cursor-pointer border border-indigo-400/20 disabled:opacity-40"
            >
              {saving ? "Salvando..." : editingPrompt ? "Salvar" : "Criar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={Boolean(promptToDelete)} onOpenChange={(open) => !open && setPromptToDelete(null)}>
        <DialogContent
          showCloseButton={false}
          className="bg-[#0E0E14] border-white/10 text-white w-[92vw] max-w-[380px] sm:max-w-[420px] p-6 sm:p-8 rounded-3xl shadow-[0_25px_70px_rgba(0,0,0,0.9)] backdrop-blur-2xl flex flex-col items-center text-center gap-5 sm:gap-6"
        >
          <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/25 flex items-center justify-center shrink-0 shadow-[0_0_20px_rgba(239,68,68,0.15)]">
            <Trash2 className="w-6 h-6 text-red-400" />
          </div>

          <div className="space-y-1.5 w-full">
            <DialogTitle className="text-base sm:text-lg font-bold text-white tracking-tight text-center">
              Excluir Prompt
            </DialogTitle>
            <p className="text-xs text-indigo-300 font-medium truncate px-2" title={promptToDelete?.title}>
              {promptToDelete?.title}
            </p>
            <DialogDescription className="text-xs text-zinc-400 pt-1 leading-relaxed text-center">
              Tem certeza que deseja excluir este prompt? Essa ação não pode ser desfeita.
            </DialogDescription>
          </div>

          <div className="grid grid-cols-2 gap-2.5 w-full pt-1">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setPromptToDelete(null)}
              className="h-10 rounded-xl text-xs font-medium text-zinc-400 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] cursor-pointer"
              disabled={deleting}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="h-10 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-medium text-xs shadow-[0_0_20px_rgba(239,68,68,0.35)] transition-all cursor-pointer border border-red-400/30"
            >
              {deleting ? "Excluindo..." : "Sim, excluir"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
