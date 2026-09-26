"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useWorkspace } from "@/contexts/workspace-context";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Settings as SettingsIcon, Users, Target, Globe, Loader2, Save } from "lucide-react";
import { getInitials } from "@/lib/utils";
import { toast } from "sonner";

const TIMEZONES = [
  "America/Sao_Paulo",
  "America/Manaus",
  "America/Bahia",
  "America/Belem",
  "America/Fortaleza",
  "America/Recife",
  "America/Cuiaba",
  "America/Campo_Grande",
  "America/Porto_Velho",
  "America/Rio_Branco",
];

export default function SettingsPage() {
  const { workspace, settings, members, refreshWorkspace } = useWorkspace();
  const supabase = createClient();

  const [workspaceName, setWorkspaceName] = useState(workspace?.name || "");
  const [dailyGoal, setDailyGoal] = useState(settings?.daily_video_goal?.toString() || "10");
  const [timezone, setTimezone] = useState(settings?.timezone || "America/Sao_Paulo");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!workspace || !settings) return;
    setSaving(true);

    const [{ error: wsError }, { error: setError }] = await Promise.all([
      supabase.from("workspaces").update({ name: workspaceName }).eq("id", workspace.id),
      supabase
        .from("workspace_settings")
        .update({
          daily_video_goal: parseInt(dailyGoal) || 10,
          timezone,
        })
        .eq("id", settings.id),
    ]);

    if (wsError || setError) {
      toast.error("Erro ao salvar configurações.");
    } else {
      toast.success("Configurações salvas!");
      refreshWorkspace();
    }
    setSaving(false);
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Configurações</h1>
        <p className="text-sm text-[#737373] mt-1">
          Gerencie as configurações do workspace
        </p>
      </div>

      {/* Workspace */}
      <Card className="glass-card border-white/[0.06] p-5">
        <div className="flex items-center gap-2 mb-4">
          <SettingsIcon className="w-4 h-4 text-[#4F46E5]" />
          <h3 className="text-sm font-medium text-white">Workspace</h3>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-xs text-[#A3A3A3]">Nome do workspace</Label>
            <Input
              value={workspaceName}
              onChange={(e) => setWorkspaceName(e.target.value)}
              className="bg-[#1A1A1F] border-white/[0.06] text-white h-10"
            />
          </div>
        </div>
      </Card>

      {/* Goals */}
      <Card className="glass-card border-white/[0.06] p-5">
        <div className="flex items-center gap-2 mb-4">
          <Target className="w-4 h-4 text-[#4F46E5]" />
          <h3 className="text-sm font-medium text-white">Metas</h3>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-xs text-[#A3A3A3]">Meta diária de vídeos</Label>
            <Input
              type="number"
              min="1"
              value={dailyGoal}
              onChange={(e) => setDailyGoal(e.target.value)}
              className="bg-[#1A1A1F] border-white/[0.06] text-white h-10 w-32"
            />
            <p className="text-[11px] text-[#525252]">
              Quantidade de vídeos finalizados por dia para atingir a meta.
            </p>
          </div>
        </div>
      </Card>

      {/* Timezone */}
      <Card className="glass-card border-white/[0.06] p-5">
        <div className="flex items-center gap-2 mb-4">
          <Globe className="w-4 h-4 text-[#4F46E5]" />
          <h3 className="text-sm font-medium text-white">Fuso Horário</h3>
        </div>

        <div className="space-y-2">
          <Label className="text-xs text-[#A3A3A3]">Fuso horário</Label>
          <Select value={timezone} onValueChange={(v) => v && setTimezone(v)}>
            <SelectTrigger className="bg-[#1A1A1F] border-white/[0.06] text-white h-10 w-64">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#1A1A1F] border-white/[0.08]">
              {TIMEZONES.map((tz) => (
                <SelectItem key={tz} value={tz}>{tz}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Members */}
      <Card className="glass-card border-white/[0.06] p-5">
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-4 h-4 text-[#4F46E5]" />
          <h3 className="text-sm font-medium text-white">
            Membros ({members.length})
          </h3>
        </div>

        <div className="space-y-2">
          {members.map((member) => {
            const profile = member.profile as { full_name: string; email: string } | undefined;
            return (
              <div
                key={member.id}
                className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.02] border border-white/[0.04]"
              >
                <Avatar className="w-8 h-8 bg-[#1E1E23] border border-white/[0.06]">
                  <AvatarFallback className="bg-[#1E1E23] text-[10px] text-[#737373]">
                    {getInitials(profile?.full_name || "")}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate">{profile?.full_name || "Usuário"}</p>
                  <p className="text-xs text-[#525252] truncate">{profile?.email || ""}</p>
                </div>
                <Badge className="text-[10px] bg-white/[0.04] text-[#737373] border border-white/[0.06] capitalize">
                  {member.role}
                </Badge>
              </div>
            );
          })}
        </div>

        <p className="text-[11px] text-[#525252] mt-3">
          Para adicionar novos membros, peça para eles criarem uma conta e solicite acesso ao workspace.
        </p>
      </Card>

      {/* Save */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-[#4F46E5] hover:bg-[#6366F1] text-white cursor-pointer"
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          Salvar configurações
        </Button>
      </div>
    </div>
  );
}
