"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useWorkspace } from "@/contexts/workspace-context";
import { Product, ProductStatus } from "@/lib/types";
import { 
  Plus, 
  ExternalLink, 
  Image as ImageIcon 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ProductModal } from "@/components/ProductModal";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ColumnDef {
  id: ProductStatus;
  label: string;
  dotColor: string;
  glowColor: string;
}

const COLUMNS: ColumnDef[] = [
  { 
    id: "pending_video", 
    label: "Vídeos Pendentes",
    dotColor: "bg-amber-400",
    glowColor: "shadow-[0_0_8px_rgba(251,191,36,0.6)]",
  },
  { 
    id: "ready_to_publish", 
    label: "Vídeos Prontos",
    dotColor: "bg-indigo-400",
    glowColor: "shadow-[0_0_8px_rgba(99,102,241,0.7)]",
  },
  { 
    id: "published", 
    label: "Publicados",
    dotColor: "bg-emerald-400",
    glowColor: "shadow-[0_0_8px_rgba(52,211,153,0.7)]",
  },
];

export default function KanbanPage() {
  const { workspaceId } = useWorkspace();
  const supabase = createClient();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Publish confirmation modal state
  const [productToPublish, setProductToPublish] = useState<Product | null>(null);
  const [publishing, setPublishing] = useState(false);

  const fetchProducts = useCallback(async () => {
    if (!workspaceId) return;
    try {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("workspace_id", workspaceId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (err) {
      console.error("Error fetching products:", err);
    } finally {
      setLoading(false);
    }
  }, [workspaceId, supabase]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleConfirmPublish = async () => {
    if (!productToPublish) return;
    setPublishing(true);
    try {
      const { error } = await supabase
        .from("products")
        .update({ status: 'published' })
        .eq("id", productToPublish.id);

      if (error) throw error;
      setProductToPublish(null);
      fetchProducts();
    } catch (err) {
      console.error("Error publishing product:", err);
      alert("Erro ao publicar produto");
    } finally {
      setPublishing(false);
    }
  };

  if (loading) {
    return (
      <div className="h-full flex flex-col gap-4 animate-in fade-in duration-500">
        <div className="flex justify-end items-center">
          <Skeleton className="h-9 w-20 bg-white/5 rounded-xl" />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 flex-1 min-h-0">
          {[1, 2, 3].map((i) => (
            <div key={i} className="kanban-column-container p-3.5 h-full flex flex-col gap-3">
              <div className="flex items-center justify-between pb-2 border-b border-white/5">
                <Skeleton className="h-5 w-28 bg-white/5 rounded-md" />
                <Skeleton className="h-4 w-6 bg-white/5 rounded-full" />
              </div>
              <Skeleton className="h-28 w-full bg-white/5 rounded-xl" />
              <Skeleton className="h-28 w-full bg-white/5 rounded-xl" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col gap-6 sm:gap-8 animate-in fade-in duration-500 min-h-0">
      {/* Top Action Bar with + Novo button visible on all screens */}
      <div className="flex items-center justify-end">
        <Button 
          onClick={() => {
            setSelectedProduct(null);
            setIsModalOpen(true);
          }}
          className="h-8.5 px-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-medium text-xs shadow-[0_0_20px_rgba(99,102,241,0.35)] transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] border border-indigo-400/20 cursor-pointer flex items-center gap-1"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Novo</span>
        </Button>
      </div>

      {/* Kanban Board Grid: Horizontal swipe on mobile/tablet, 3 columns on desktop */}
      <div className="flex xl:grid xl:grid-cols-3 gap-5 sm:gap-6 xl:gap-8 flex-1 min-h-0 w-[calc(100%+3rem)] sm:w-[calc(100%+4rem)] lg:w-[calc(100%+5rem)] xl:w-full -ml-6 sm:-ml-8 lg:-ml-10 xl:ml-0 overflow-x-auto snap-x snap-mandatory px-6 sm:px-8 lg:px-10 xl:px-0 hide-scrollbar pb-2 xl:pb-6">
        {COLUMNS.map(column => {
          const columnProducts = products.filter(p => p.status === column.id);

          return (
            <div 
              key={column.id} 
              className="kanban-column-container flex flex-col h-full w-[85vw] max-w-[360px] sm:max-w-[400px] xl:max-w-none sm:w-[400px] xl:w-auto xl:min-w-0 snap-center shrink-0 rounded-3xl bg-white/[0.01] border border-white/[0.03] overflow-hidden"
            >
              {/* Column Header */}
              <div className="px-4.5 py-3.5 flex items-center justify-between border-b border-white/[0.04] bg-white/[0.01] shrink-0">
                <div className="flex items-center gap-2.5">
                  <span className={`w-3 h-3 rounded-full ${column.dotColor} ${column.glowColor}`} />
                  <h3 className="font-black text-white text-base sm:text-lg tracking-tight">
                    {column.label}
                  </h3>
                </div>

                <span className="text-xs font-semibold font-mono text-zinc-300 bg-white/[0.05] px-2.5 py-0.5 rounded-lg border border-white/[0.05]">
                  {columnProducts.length}
                </span>
              </div>

              {/* Column Cards List - Vertical scroll with hidden scrollbar */}
              <div className="flex-1 min-h-0 overflow-y-auto hide-scrollbar p-3 space-y-3">
                {columnProducts.map(product => {
                  const hasShopee = Boolean(product.shopee_link);
                  const hasTiktok = Boolean(product.tiktok_link);
                  const videoLinks = product.video_links || [];
                  const hasVideos = videoLinks.length > 0;
                  const isReadyToPublish = product.status === "ready_to_publish";

                  return (
                    <div 
                      key={product.id}
                      onClick={() => {
                        setSelectedProduct(product);
                        setIsModalOpen(true);
                      }}
                      className="group relative p-3 sm:p-3.5 rounded-2xl flex flex-col cursor-pointer border border-white/[0.04] bg-white/[0.01] hover:bg-white/[0.03] hover:border-white/15 transition-all duration-200"
                    >
                      {/* Top Row: Cover Image + Title & Pure Icons */}
                      <div className="flex gap-3 sm:gap-3.5 items-stretch">
                        {/* Left Side: Dynamic Cover Image */}
                        <div className="w-[82px] sm:w-[88px] shrink-0 self-stretch min-h-[82px] sm:min-h-[88px] rounded-xl overflow-hidden bg-[#14141C] border border-white/[0.08] relative group/img shadow-sm flex flex-col items-center justify-center">
                          {product.cover_image_url ? (
                            <img 
                              src={product.cover_image_url} 
                              alt={product.name}
                              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                            />
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center text-zinc-600 bg-[#121218]">
                              <ImageIcon className="w-5 h-5 opacity-40 mb-0.5" />
                              <span className="text-[9px] font-medium text-zinc-500">Sem Capa</span>
                            </div>
                          )}
                        </div>

                        {/* Right Side: Title & Pure Action Icons */}
                        <div className="flex-1 min-w-0 flex flex-col justify-between gap-2 py-0.5">
                          {/* Title */}
                          <div>
                            <h4 
                              className="text-xs sm:text-[13px] font-medium text-zinc-300 group-hover:text-zinc-100 line-clamp-2 leading-snug tracking-tight break-words" 
                              title={product.name}
                            >
                              {product.name}
                            </h4>
                          </div>

                          {/* Action Icon Row: Pure icons only */}
                          {(hasShopee || hasTiktok || hasVideos || isReadyToPublish) && (
                            <div className="flex items-center gap-2.5 pt-1 mt-auto">
                              {/* Shopee Icon */}
                              {hasShopee && (
                                <a 
                                  href={product.shopee_link!} 
                                  target="_blank" 
                                  rel="noreferrer"
                                  onClick={e => e.stopPropagation()} 
                                  className="hover:scale-110 active:scale-95 transition-transform duration-200 shrink-0"
                                  title="Abrir Shopee"
                                >
                                  <img 
                                    src="/shopee.png" 
                                    alt="Shopee" 
                                    className="w-7 h-7 sm:w-8 sm:h-8 object-contain"
                                  />
                                </a>
                              )}

                              {/* TikTok Icon */}
                              {hasTiktok && (
                                <a 
                                  href={product.tiktok_link!} 
                                  target="_blank" 
                                  rel="noreferrer"
                                  onClick={e => e.stopPropagation()} 
                                  className="hover:scale-110 active:scale-95 transition-transform duration-200 shrink-0"
                                  title="Abrir TikTok"
                                >
                                  <img 
                                    src="/tiktok.png" 
                                    alt="TikTok" 
                                    className="w-7 h-7 sm:w-8 sm:h-8 object-contain"
                                  />
                                </a>
                              )}

                              {/* Google Drive / Videos Icon */}
                              {hasVideos && (
                                videoLinks.length === 1 ? (
                                  <a 
                                    href={videoLinks[0]} 
                                    target="_blank" 
                                    rel="noreferrer"
                                    onClick={e => e.stopPropagation()} 
                                    className="hover:scale-110 active:scale-95 transition-transform duration-200 shrink-0"
                                    title="Abrir Vídeo no Google Drive"
                                  >
                                    <img 
                                      src="/drive.png" 
                                      alt="Google Drive" 
                                      className="w-7 h-7 sm:w-8 sm:h-8 object-contain"
                                    />
                                  </a>
                                ) : (
                                  <div onClick={e => e.stopPropagation()} className="shrink-0">
                                    <DropdownMenu>
                                      <DropdownMenuTrigger className="hover:scale-110 active:scale-95 transition-transform duration-200 outline-none cursor-pointer">
                                        <img 
                                          src="/drive.png" 
                                          alt="Google Drive" 
                                          className="w-7 h-7 sm:w-8 sm:h-8 object-contain"
                                        />
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="start" className="bg-[#14141B] border-white/10 shadow-2xl rounded-xl p-1.5 min-w-[150px]">
                                        {videoLinks.map((link, idx) => (
                                          <DropdownMenuItem key={idx} className="p-0 focus:bg-white/[0.06] rounded-lg">
                                            <a 
                                              href={link} 
                                              target="_blank" 
                                              rel="noreferrer"
                                              className="flex items-center justify-between w-full px-2.5 py-1.5 text-xs text-zinc-200 hover:text-white"
                                            >
                                              <span className="flex items-center gap-2">
                                                <img src="/drive.png" alt="Drive" className="w-3.5 h-3.5 object-contain" />
                                                Vídeo {idx + 1}
                                              </span>
                                              <ExternalLink className="w-3 h-3 opacity-50" />
                                            </a>
                                          </DropdownMenuItem>
                                        ))}
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </div>
                                )
                              )}

                              {/* Publicar button (ok.png) on ready_to_publish cards */}
                              {isReadyToPublish && (
                                <button
                                  type="button"
                                  onClick={e => {
                                    e.stopPropagation();
                                    setProductToPublish(product);
                                  }}
                                  className="hover:scale-110 active:scale-95 transition-transform duration-200 cursor-pointer shrink-0 ml-auto"
                                  title="Marcar como Publicado"
                                >
                                  <img 
                                    src="/ok.png" 
                                    alt="Marcar como Publicado" 
                                    className="w-7 h-7 sm:w-8 sm:h-8 object-contain"
                                  />
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
                
                {/* Empty State */}
                {columnProducts.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-10 px-4 rounded-xl border border-dashed border-white/[0.04] text-center">
                    <p className="text-xs text-zinc-500">
                      Nenhum item
                    </p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Confirmation Modal for Publishing */}
      <Dialog open={Boolean(productToPublish)} onOpenChange={open => !open && setProductToPublish(null)}>
        <DialogContent 
          showCloseButton={false} 
          className="bg-[#0E0E14] border-white/10 text-white w-[92vw] max-w-[380px] sm:max-w-[420px] p-6 sm:p-8 rounded-3xl shadow-[0_25px_70px_rgba(0,0,0,0.9)] backdrop-blur-2xl flex flex-col items-center text-center gap-5 sm:gap-6"
        >
          {/* Centered Icon */}
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center shrink-0 shadow-[0_0_20px_rgba(16,185,129,0.15)]">
            <img src="/ok.png" alt="Publicar" className="w-8 h-8 object-contain" />
          </div>

          {/* Titles & Message */}
          <div className="space-y-1.5 w-full">
            <DialogTitle className="text-base sm:text-lg font-bold text-white tracking-tight text-center">
              Confirmar Publicação
            </DialogTitle>
            <p className="text-xs text-indigo-300 font-medium truncate px-2" title={productToPublish?.name}>
              {productToPublish?.name}
            </p>
            <DialogDescription className="text-xs text-zinc-400 pt-1 leading-relaxed text-center">
              Você realmente publicou este produto em todas as redes sociais?
            </DialogDescription>
          </div>

          {/* 2-Column Action Buttons */}
          <div className="grid grid-cols-2 gap-2.5 w-full pt-1">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setProductToPublish(null)}
              className="h-10 rounded-xl text-xs font-medium text-zinc-400 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] cursor-pointer"
              disabled={publishing}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleConfirmPublish}
              disabled={publishing}
              className="h-10 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-medium text-xs shadow-[0_0_20px_rgba(16,185,129,0.35)] transition-all cursor-pointer border border-emerald-400/30"
            >
              {publishing ? "Publicando..." : "Sim, publiquei"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Product Modal */}
      <ProductModal 
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        product={selectedProduct}
        onSuccess={fetchProducts}
      />
    </div>
  );
}



