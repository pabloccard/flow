export interface Profile {
  id: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
}

export interface Workspace {
  id: string;
  name: string;
  created_by: string;
}

export interface WorkspaceMember {
  id: string;
  workspace_id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'member';
  profile?: Profile;
}

export interface WorkspaceSettings {
  id: string;
  workspace_id: string;
  daily_video_goal: number;
  timezone: string;
}

export type ProductStatus = 'pending_video' | 'ready_to_publish' | 'published';

export interface Product {
  id: string;
  workspace_id: string;
  name: string;
  cover_image_url: string | null;
  shopee_link: string | null;
  tiktok_link: string | null;
  video_links: string[];
  notes: string | null;
  status: ProductStatus;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface Prompt {
  id: string;
  workspace_id: string;
  title: string;
  content: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export const STATUS_LABELS: Record<ProductStatus, string> = {
  pending_video: 'Vídeo Pendente',
  ready_to_publish: 'Vídeo Pronto',
  published: 'Publicado'
};

export const STATUS_COLORS: Record<ProductStatus, string> = {
  pending_video: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
  ready_to_publish: 'text-[#4F46E5] bg-[#4F46E5]/10 border-[#4F46E5]/20',
  published: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20'
};
