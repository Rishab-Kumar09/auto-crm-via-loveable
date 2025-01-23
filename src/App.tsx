import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Tickets from "./pages/Tickets";
import Customers from "./pages/Customers";
import Agents from "./pages/Agents";
import Settings from "./pages/Settings";
import React, { useEffect, useState } from "react";
import { supabase } from "./integrations/supabase/client";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    console.log("Starting session initialization...");
    
    const initializeSession = async () => {
      try {
        const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession();
        console.log("Session check result:", { currentSession, sessionError });
        
        if (sessionError) {
          console.error("Session error:", sessionError);
          setSession(null);
          setUserRole(null);
          return;
        }

        if (currentSession) {
          setSession(currentSession);
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', currentSession.user.id)
            .maybeSingle();
          
          if (profileError) {
            console.error("Profile fetch error:", profileError);
            throw profileError;
          }
          
          console.log("Profile data:", profile);
          setUserRole(profile?.role || null);
        } else {
          console.log("No active session found");
          setSession(null);
          setUserRole(null);
        }
      } catch (error) {
        console.error("Session initialization error:", error);
        setSession(null);
        setUserRole(null);
      } finally {
        console.log("Setting loading to false");
        setLoading(false);
      }
    };

    initializeSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state change:", event, session);
      
      if (session) {
        setSession(session);
        try {
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', session.user.id)
            .maybeSingle();
          
          if (error) {
            console.error("Error fetching user role:", error);
            throw error;
          }
          
          console.log("Updated profile data:", profile);
          setUserRole(profile?.role || null);
        } catch (error) {
          console.error("Error in auth state change:", error);
          setSession(null);
          setUserRole(null);
        }
      } else {
        console.log("Auth state change: No session");
        setSession(null);
        setUserRole(null);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-zendesk-background">
        <div className="text-lg text-zendesk-secondary">Loading application...</div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route
              path="/"
              element={
                session ? (
                  <Navigate to="/dashboard" replace />
                ) : (
                  <Navigate to="/auth" replace />
                )
              }
            />
            <Route
              path="/dashboard"
              element={
                session ? (
                  <Dashboard />
                ) : (
                  <Navigate to="/auth" replace />
                )
              }
            />
            <Route
              path="/tickets"
              element={
                session ? (
                  <Tickets />
                ) : (
                  <Navigate to="/auth" replace />
                )
              }
            />
            <Route
              path="/customers"
              element={
                session ? (
                  <Customers />
                ) : (
                  <Navigate to="/auth" replace />
                )
              }
            />
            <Route
              path="/agents"
              element={
                session && userRole === 'admin' ? (
                  <Agents />
                ) : (
                  <Navigate to="/dashboard" replace />
                )
              }
            />
            <Route
              path="/settings"
              element={
                session ? (
                  <Settings />
                ) : (
                  <Navigate to="/auth" replace />
                )
              }
            />
            <Route
              path="/auth"
              element={
                !session ? (
                  <Auth />
                ) : (
                  <Navigate to="/dashboard" replace />
                )
              }
            />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;