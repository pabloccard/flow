"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useWorkspace } from "@/contexts/workspace-context";
import { Product, ProductStatus } from "@/lib/types";
import { 
  Plus, 
  CheckCircle2, 
  ChevronDown, 
  ExternalLink, 
  Play, 
  Image as ImageIcon 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ProductModal } from "@/components/ProductModal";
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
  headerBorderColor: string;
  cardBorderHover: string;
}

const COLUMNS: ColumnDef[] = [
  { 
    id: "pending_video", 
    label: "Vídeos Pendentes",
    dotColor: "bg-amber-400",
    glowColor: "shadow-[0_0_8px_rgba(251,191,36,0.6)]",
    headerBorderColor: "border-amber-400/20",
    cardBorderHover: "hover:border-amber-400/30"
  },
  { 
    id: "ready_to_publish", 
    label: "Vídeos Prontos",
    dotColor: "bg-indigo-400",
    glowColor: "shadow-[0_0_8px_rgba(99,102,241,0.7)]",
    headerBorderColor: "border-indigo-400/20",
    cardBorderHover: "hover:border-indigo-400/30"
  },
  { 
    id: "published", 
    label: "Publicados",
    dotColor: "bg-emerald-400",
    glowColor: "shadow-[0_0_8px_rgba(52,211,153,0.7)]",
    headerBorderColor: "border-emerald-400/20",
    cardBorderHover: "hover:border-emerald-400/30"
  },
];

export default function KanbanPage() {
  const { workspaceId } = useWorkspace();
  const supabase = createClient();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

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

  const handleMarkPublished = async (id: string) => {
    await supabase.from("products").update({ status: 'published' }).eq("id", id);
    fetchProducts();
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <div className="flex justify-between items-center">
          <Skeleton className="h-6 w-32 bg-white/5 rounded-lg" />
          <Skeleton className="h-9 w-36 bg-white/5 rounded-xl" />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="kanban-column-container p-3.5 min-h-[300px] xl:h-[620px] flex flex-col gap-3">
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
    <div className="h-full flex flex-col gap-5 animate-in fade-in duration-500 pb-8">
      {/* Clean Minimalist Top Action Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xs text-zinc-400 font-medium">
            {products.length} {products.length === 1 ? "produto cadastrado" : "produtos cadastrados"}
          </span>
        </div>

        <Button 
          onClick={() => {
            setSelectedProduct(null);
            setIsModalOpen(true);
          }}
          className="h-9 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-medium text-xs shadow-[0_0_20px_rgba(99,102,241,0.35)] transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] border border-indigo-400/20 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5 mr-1.5" />
          Adicionar Produto
        </Button>
      </div>

      {/* Kanban Board Grid: Stacked on mobile & tablet, 3-column on desktop */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 flex-1 xl:min-h-[620px] max-w-lg xl:max-w-none mx-auto w-full">
        {COLUMNS.map(column => {
          const columnProducts = products.filter(p => p.status === column.id);

          return (
            <div 
              key={column.id} 
              className="kanban-column-container flex flex-col xl:h-full overflow-hidden"
            >
              {/* Minimalist Column Header */}
              <div className={`px-4 py-3 flex items-center justify-between border-b bg-white/[0.01] ${column.headerBorderColor}`}>
                <div className="flex items-center gap-2.5">
                  <span className={`w-2 h-2 rounded-full ${column.dotColor} ${column.glowColor}`} />
                  <h3 className="font-medium text-zinc-200 text-xs tracking-tight">
                    {column.label}
                  </h3>
                </div>

                <span className="text-[11px] font-mono text-zinc-500 bg-white/[0.04] px-2 py-0.5 rounded-md border border-white/[0.03]">
                  {columnProducts.length}
                </span>
              </div>

              {/* Column Cards List */}
              <div className="flex-1 overflow-y-auto p-3 space-y-3">
                {columnProducts.map(product => {
                  const hasShopee = Boolean(product.shopee_link);
                  const hasTiktok = Boolean(product.tiktok_link);
                  const videoLinks = product.video_links || [];
                  const hasVideos = videoLinks.length > 0;

                  return (
                    <div 
                      key={product.id}
                      onClick={() => {
                        setSelectedProduct(product);
                        setIsModalOpen(true);
                      }}
                      className={`group relative p-3.5 rounded-2xl flex flex-col cursor-pointer border border-white/[0.04] bg-white/[0.01] hover:bg-white/[0.02] transition-all duration-200 ${column.cardBorderHover}`}
                    >
                      {/* Top Row: Cover Image + Title & Badges */}
                      <div className="flex gap-3.5 items-stretch">
                        {/* Left Side: Dynamic Cover Image */}
                        <div className="w-[82px] shrink-0 self-stretch min-h-[82px] rounded-xl overflow-hidden bg-[#14141C] border border-white/[0.08] relative group/img shadow-sm flex flex-col items-center justify-center">
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

                          {hasVideos && (
                            <div className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded-md bg-black/85 backdrop-blur-md text-[9px] font-medium text-indigo-300 flex items-center gap-1 border border-indigo-500/25 shadow-md pointer-events-none">
                              <Play className="w-2 h-2 fill-indigo-400 text-indigo-400" />
                              <span>{videoLinks.length}</span>
                            </div>
                          )}
                        </div>

                        {/* Right Side: Title & Action Badges */}
                        <div className="flex-1 min-w-0 flex flex-col justify-start gap-2 py-0.5">
                          {/* Title & Checkbox Row */}
                          <div className="flex items-start justify-between gap-2">
                            <h4 
                              className="text-xs sm:text-[13px] font-medium text-zinc-100 group-hover:text-white line-clamp-2 leading-snug tracking-tight break-words" 
                              title={product.name}
                            >
                              {product.name}
                            </h4>
                          </div>

                          {/* Platform and Video Buttons */}
                          {(hasShopee || hasTiktok || hasVideos) && (
                            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                              {/* Shopee Button with /shopee.png icon */}
                              {hasShopee && (
                                <a 
                                  href={product.shopee_link!} 
                                  target="_blank" 
                                  rel="noreferrer"
                                  onClick={e => e.stopPropagation()} 
                                  className="group/btn inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[11px] font-medium bg-[#EE4D2D]/10 hover:bg-[#EE4D2D]/20 text-[#FF6E4A] border border-[#EE4D2D]/25 hover:border-[#EE4D2D]/40 transition-all"
                                  title="Abrir link na Shopee"
                                >
                                  <img 
                                    src="/shopee.png" 
                                    alt="Shopee" 
                                    className="w-3.5 h-3.5 object-contain"
                                  />
                                  <span>Shopee</span>
                                  <ExternalLink className="w-2.5 h-2.5 opacity-50 group-hover/btn:opacity-100 transition-opacity" />
                                </a>
                              )}

                              {/* TikTok Button with /tiktok.png icon */}
                              {hasTiktok && (
                                <a 
                                  href={product.tiktok_link!} 
                                  target="_blank" 
                                  rel="noreferrer"
                                  onClick={e => e.stopPropagation()} 
                                  className="group/btn inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[11px] font-medium bg-white/[0.05] hover:bg-white/[0.1] text-zinc-200 hover:text-white border border-white/[0.08] hover:border-white/20 transition-all"
                                  title="Abrir link no TikTok"
                                >
                                  <img 
                                    src="/tiktok.png" 
                                    alt="TikTok" 
                                    className="w-3.5 h-3.5 object-contain"
                                  />
                                  <span>TikTok</span>
                                  <ExternalLink className="w-2.5 h-2.5 opacity-50 group-hover/btn:opacity-100 transition-opacity" />
                                </a>
                              )}

                              {/* Video Links Button */}
                              {hasVideos && (
                                videoLinks.length === 1 ? (
                                  <a 
                                    href={videoLinks[0]} 
                                    target="_blank" 
                                    rel="noreferrer"
                                    onClick={e => e.stopPropagation()} 
                                    className="group/btn inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[11px] font-medium bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-300 hover:text-indigo-200 border border-indigo-500/30 hover:border-indigo-400/50 transition-all"
                                    title="Assistir Vídeo"
                                  >
                                    <Play className="w-2.5 h-2.5 fill-indigo-400 text-indigo-400 group-hover/btn:scale-110 transition-transform" />
                                    <span>Vídeo</span>
                                    <ExternalLink className="w-2.5 h-2.5 opacity-50 group-hover/btn:opacity-100" />
                                  </a>
                                ) : (
                                  <div onClick={e => e.stopPropagation()}>
                                    <DropdownMenu>
                                      <DropdownMenuTrigger className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[11px] font-medium bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-300 hover:text-indigo-200 border border-indigo-500/30 hover:border-indigo-400/50 transition-all outline-none cursor-pointer">
                                        <Play className="w-2.5 h-2.5 fill-indigo-400 text-indigo-400" />
                                        <span>Vídeos ({videoLinks.length})</span>
                                        <ChevronDown className="w-2.5 h-2.5 text-indigo-400/80" />
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="start" className="bg-[#14141B] border-white/10 shadow-2xl rounded-xl p-1.5 min-w-[140px]">
                                        {videoLinks.map((link, idx) => (
                                          <DropdownMenuItem key={idx} className="p-0 focus:bg-white/[0.06] rounded-lg">
                                            <a 
                                              href={link} 
                                              target="_blank" 
                                              rel="noreferrer"
                                              className="flex items-center justify-between w-full px-2.5 py-1.5 text-xs text-zinc-200 hover:text-white"
                                            >
                                              <span className="flex items-center gap-2">
                                                <Play className="w-2.5 h-2.5 fill-indigo-400 text-indigo-400" />
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



