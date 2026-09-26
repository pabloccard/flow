"use client";

import { useEffect, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { createClient } from "@/lib/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Product } from "@/lib/types";
import { useWorkspace } from "@/contexts/workspace-context";
import { Plus, Trash2, Edit2, Play, Image as ImageIcon, Sparkles, CheckCircle2 } from "lucide-react";

const schema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  cover_image_url: z.string().url("Link de imagem inválido").or(z.literal("")),
  shopee_link: z.string().url("Link inválido").or(z.literal("")),
  tiktok_link: z.string().url("Link inválido").or(z.literal("")),
  video_links: z.array(z.object({
    url: z.string().url("Link inválido").or(z.literal(""))
  })),
  notes: z.string().max(1000).or(z.literal("")),
});

type FormData = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: Product | null;
  onSuccess: () => void;
}

interface ProtectedInputProps {
  register: any;
  name: string;
  error?: any;
  placeholder?: string;
  initialValue?: string | null;
  resetKey: any;
  icon?: React.ReactNode;
  className?: string;
}

const ProtectedInput = ({ 
  register, 
  name, 
  error, 
  placeholder, 
  initialValue, 
  resetKey, 
  icon,
  className = "" 
}: ProtectedInputProps) => {
  const [unlocked, setUnlocked] = useState(!initialValue);

  useEffect(() => {
    setUnlocked(!initialValue);
  }, [resetKey, initialValue]);

  if (!unlocked) {
    return (
      <div className={`w-full min-w-0 flex-1 flex items-center justify-between p-2 px-3 bg-[#14141B] border border-white/[0.08] rounded-xl h-10 transition-all hover:border-white/15 ${className}`}>
        <div className="flex items-center gap-2 min-w-0 flex-1 pr-2 overflow-hidden">
          {icon && <div className="shrink-0">{icon}</div>}
          <span className="text-xs text-zinc-300 truncate block w-full">{initialValue}</span>
        </div>
        <button 
          type="button" 
          className="text-xs flex items-center gap-1 px-2 py-1 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/25 font-medium shrink-0 transition-all cursor-pointer" 
          onClick={() => setUnlocked(true)}
        >
          <Edit2 className="w-3 h-3" /> Editar
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-1 w-full min-w-0 flex-1">
      <div className="relative flex items-center w-full min-w-0">
        {icon && (
          <div className="absolute left-3 pointer-events-none z-10 shrink-0">
            {icon}
          </div>
        )}
        <Input 
          {...register(name)} 
          className={`h-10 bg-[#14141B] border-white/[0.08] focus-visible:border-indigo-500 focus-visible:ring-1 focus-visible:ring-indigo-500/50 rounded-xl text-xs placeholder:text-zinc-600 text-white w-full min-w-0 ${icon ? "pl-9" : "px-3"} ${className}`}
          placeholder={placeholder}
        />
      </div>
      {error && <span className="text-red-400 text-[11px] pl-1">{error.message}</span>}
    </div>
  );
};

export function ProductModal({ open, onOpenChange, product, onSuccess }: Props) {
  const { workspaceId, profile } = useWorkspace();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, reset, control, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      cover_image_url: "",
      shopee_link: "",
      tiktok_link: "",
      video_links: [],
      notes: "",
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "video_links"
  });

  useEffect(() => {
    if (open) {
      reset({
        name: product?.name || "",
        cover_image_url: product?.cover_image_url || "",
        shopee_link: product?.shopee_link || "",
        tiktok_link: product?.tiktok_link || "",
        video_links: product?.video_links?.map(link => ({ url: link })) || [],
        notes: product?.notes || "",
      });
    }
  }, [open, product, reset]);

  const onSubmit = async (data: FormData) => {
    if (!workspaceId || !profile) return;
    setLoading(true);

    try {
      const cleanVideoLinks = data.video_links.map(v => v.url).filter(v => v.trim() !== "");
      let newStatus = product?.status || 'pending_video';
      
      if (cleanVideoLinks.length === 0) {
        newStatus = 'pending_video';
      } else {
        const currentLinks = product?.video_links || [];
        const hasChanges = JSON.stringify(cleanVideoLinks) !== JSON.stringify(currentLinks);
        
        if (hasChanges) {
          newStatus = 'ready_to_publish';
        }
      }

      if (product) {
        const { error } = await supabase
          .from("products")
          .update({
            name: data.name,
            cover_image_url: data.cover_image_url || null,
            shopee_link: data.shopee_link || null,
            tiktok_link: data.tiktok_link || null,
            video_links: cleanVideoLinks,
            notes: data.notes || null,
            status: newStatus
          })
          .eq("id", product.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("products")
          .insert({
            workspace_id: workspaceId,
            created_by: profile.id,
            name: data.name,
            cover_image_url: data.cover_image_url || null,
            shopee_link: data.shopee_link || null,
            tiktok_link: data.tiktok_link || null,
            video_links: cleanVideoLinks,
            notes: data.notes || null,
            status: newStatus
          });
        if (error) throw error;
      }
      onSuccess();
      onOpenChange(false);
    } catch (err) {
      console.error(err);
      alert("Erro ao salvar produto");
    } finally {
      setLoading(false);
    }
  };

  const [deleting, setDeleting] = useState(false);

  const handleDeleteProduct = async () => {
    if (!product) return;
    if (!confirm("Tem certeza que deseja excluir este produto?")) return;
    setDeleting(true);
    try {
      const { error } = await supabase.from("products").delete().eq("id", product.id);
      if (error) throw error;
      onSuccess();
      onOpenChange(false);
    } catch (err) {
      console.error("Error deleting product:", err);
      alert("Erro ao excluir produto");
    } finally {
      setDeleting(false);
    }
  };

  const handlePublish = async () => {
    if (!product) return;
    setLoading(true);
    try {
      const { error } = await supabase.from("products").update({ status: 'published' }).eq("id", product.id);
      if (error) throw error;
      onSuccess();
      onOpenChange(false);
    } catch (err) {
      console.error("Error publishing product:", err);
      alert("Erro ao publicar produto");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#0D0D12] border-white/10 text-white sm:max-w-[460px] max-w-[95vw] p-5 rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.8)] backdrop-blur-2xl overflow-hidden">
        <DialogHeader className="space-y-1 pb-1">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              </div>
              <DialogTitle className="text-base font-bold text-white tracking-tight">
                {product ? "Editar Produto" : "Novo Produto"}
              </DialogTitle>
            </div>
            {product?.status === 'ready_to_publish' && (
              <Button 
                type="button" 
                disabled={loading || deleting} 
                onClick={handlePublish}
                className="h-7 px-2.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 font-medium text-[11px] border border-emerald-500/20 hover:border-emerald-500/40 transition-all cursor-pointer mr-6"
              >
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Publicar
              </Button>
            )}
          </div>
          <DialogDescription className="text-xs text-zinc-400">
            Cadastre os links de afiliados e adicione os vídeos prontos.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5 max-h-[70vh] overflow-y-auto overflow-x-hidden px-0.5 pr-1">
          {/* Nome do Produto */}
          <div className="space-y-1">
            <ProtectedInput 
              register={register}
              name="name"
              error={errors.name}
              placeholder="Nome do Produto (Ex: Fone Bluetooth TWS)"
              initialValue={product?.name}
              resetKey={open}
            />
          </div>

          {/* Imagem de Capa 1:1 */}
          <div className="space-y-1">
            <ProtectedInput 
              register={register}
              name="cover_image_url"
              error={errors.cover_image_url}
              placeholder="URL da Imagem de Capa (Opcional)"
              initialValue={product?.cover_image_url}
              resetKey={open}
              icon={<ImageIcon className="w-4 h-4 text-zinc-500" />}
            />
          </div>
          
          {/* Link Shopee com ícone */}
          <div className="space-y-1">
            <ProtectedInput 
              register={register}
              name="shopee_link"
              error={errors.shopee_link}
              placeholder="Link Afiliado Shopee"
              initialValue={product?.shopee_link}
              resetKey={open}
              icon={<img src="/shopee.png" alt="Shopee" className="w-3.5 h-3.5 object-contain" />}
            />
          </div>

          {/* Link TikTok com ícone */}
          <div className="space-y-1">
            <ProtectedInput 
              register={register}
              name="tiktok_link"
              error={errors.tiktok_link}
              placeholder="Link Afiliado TikTok Shop"
              initialValue={product?.tiktok_link}
              resetKey={open}
              icon={<img src="/tiktok.png" alt="TikTok" className="w-3.5 h-3.5 object-contain" />}
            />
          </div>

          {/* Anotações */}
          <div className="space-y-1">
            <Textarea 
              {...register("notes")} 
              className="bg-[#14141B] border-white/[0.08] focus-visible:border-indigo-500 focus-visible:ring-1 focus-visible:ring-indigo-500/50 rounded-xl resize-none h-18 text-xs placeholder:text-zinc-600 text-white" 
              placeholder="Anotações / Roteiro (Ideias, cupom, detalhes...)"
            />
          </div>

          {/* Seção de Vídeos Dinâmicos */}
          <div className="space-y-2.5 pt-2.5 border-t border-white/[0.08]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Play className="w-3.5 h-3.5 fill-indigo-400 text-indigo-400" />
                <span className="text-xs font-semibold text-indigo-300">
                  Vídeos ({fields.length})
                </span>
              </div>
              <Button 
                type="button" 
                variant="ghost" 
                size="sm" 
                className="h-7 text-xs text-indigo-300 hover:text-white bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 rounded-lg cursor-pointer" 
                onClick={() => append({ url: "" })}
              >
                <Plus className="w-3 h-3 mr-1" /> Adicionar Vídeo
              </Button>
            </div>
            
            {fields.length === 0 && (
              <div className="p-2.5 rounded-xl bg-black/20 border border-dashed border-white/[0.05] text-center">
                <p className="text-[11px] text-zinc-500 italic">Nenhum vídeo anexado.</p>
              </div>
            )}

            <div className="space-y-2">
              {fields.map((field, index) => (
                <div key={field.id} className="flex gap-2 items-center w-full min-w-0">
                  <ProtectedInput 
                    register={register}
                    name={`video_links.${index}.url`}
                    error={errors.video_links?.[index]?.url}
                    placeholder={`Link do Vídeo #${index + 1}`}
                    initialValue={product?.video_links?.[index]}
                    resetKey={open}
                    icon={<Play className="w-3 h-3 fill-indigo-400 text-indigo-400" />}
                    className="border-indigo-500/20 focus-visible:border-indigo-500"
                  />
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="icon" 
                    className="shrink-0 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 h-10 w-10 rounded-xl cursor-pointer" 
                    onClick={() => remove(index)}
                    title="Remover vídeo"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="pt-3 flex items-center justify-between sticky bottom-0 bg-[#0D0D12]/95 backdrop-blur-md border-t border-white/[0.06]">
            <div>
              {product && (
                <Button 
                  type="button" 
                  variant="ghost" 
                  disabled={loading || deleting} 
                  onClick={handleDeleteProduct} 
                  className="text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl h-9 px-3 flex items-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  {deleting ? "Excluindo..." : "Excluir"}
                </Button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                type="button" 
                onClick={() => onOpenChange(false)}
                className="text-xs text-zinc-400 hover:text-white rounded-xl h-9 px-3.5 cursor-pointer"
              >
                Cancelar
              </Button>

              <Button 
                type="submit" 
                disabled={loading || deleting} 
                className="h-9 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-medium text-xs shadow-[0_0_18px_rgba(99,102,241,0.35)] transition-all cursor-pointer"
              >
                {loading ? "Salvando..." : product ? "Salvar Alterações" : "Criar Produto"}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}



