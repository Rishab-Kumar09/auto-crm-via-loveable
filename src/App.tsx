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
    // Initialize session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log("Initial session check:", session);
      setSession(session);
      if (session) {
        fetchUserRole(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Set up auth state listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      console.log("Auth state change:", _event, session);
      setSession(session);
      
      if (session) {
        await fetchUserRole(session.user.id);
      } else {
        setUserRole(null);
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchUserRole = async (userId: string) => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();
      
      if (error) {
        console.error('Error fetching user role:', error);
        // If there's an error fetching the profile, sign out the user
        await supabase.auth.signOut();
        setSession(null);
        setUserRole(null);
      } else {
        setUserRole(profile?.role || null);
      }
    } catch (error) {
      console.error('Error:', error);
      await supabase.auth.signOut();
      setSession(null);
      setUserRole(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
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