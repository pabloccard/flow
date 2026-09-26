"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Profile, Workspace, WorkspaceMember, WorkspaceSettings } from "@/lib/types";
import type { User } from "@supabase/supabase-js";

interface WorkspaceContextType {
  user: User | null;
  profile: Profile | null;
  workspace: Workspace | null;
  workspaceId: string | null;
  members: WorkspaceMember[];
  settings: WorkspaceSettings | null;
  loading: boolean;
  refreshWorkspace: () => Promise<void>;
}

const WorkspaceContext = createContext<WorkspaceContextType>({
  user: null,
  profile: null,
  workspace: null,
  workspaceId: null,
  members: [],
  settings: null,
  loading: true,
  refreshWorkspace: async () => {},
});

export function useWorkspace() {
  return useContext(WorkspaceContext);
}

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [settings, setSettings] = useState<WorkspaceSettings | null>(null);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  const loadWorkspaceData = async () => {
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) {
        setLoading(false);
        return;
      }
      setUser(currentUser);

      // Load profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", currentUser.id)
        .single();

      if (profileData) setProfile(profileData);

      // Get user's workspace (first one they're a member of)
      const { data: memberData } = await supabase
        .from("workspace_members")
        .select("workspace_id")
        .eq("user_id", currentUser.id)
        .limit(1)
        .single();

      if (memberData) {
        // Load workspace
        const { data: workspaceData } = await supabase
          .from("workspaces")
          .select("*")
          .eq("id", memberData.workspace_id)
          .single();

        if (workspaceData) setWorkspace(workspaceData);

        // Load members with profiles
        const { data: membersData } = await supabase
          .from("workspace_members")
          .select("*, profile:profiles(*)")
          .eq("workspace_id", memberData.workspace_id);

        if (membersData) setMembers(membersData);

        // Load settings
        const { data: settingsData } = await supabase
          .from("workspace_settings")
          .select("*")
          .eq("workspace_id", memberData.workspace_id)
          .single();

        if (settingsData) setSettings(settingsData);
      }
    } catch (error) {
      console.error("Error loading workspace data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWorkspaceData();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session?.user) {
          loadWorkspaceData();
        } else {
          setUser(null);
          setProfile(null);
          setWorkspace(null);
          setMembers([]);
          setSettings(null);
          setLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <WorkspaceContext.Provider
      value={{
        user,
        profile,
        workspace,
        workspaceId: workspace?.id ?? null,
        members,
        settings,
        loading,
        refreshWorkspace: loadWorkspaceData,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}
