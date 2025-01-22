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
import { useToast } from "./hooks/use-toast";

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
  const { toast } = useToast();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        fetchUserRole(session.user.id);
      } else {
        setLoading(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      if (session) {
        await fetchUserRole(session.user.id);
      } else {
        setUserRole(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserRole = async (userId: string) => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .maybeSingle();
      
      if (error) {
        console.error('Error fetching user role:', error);
        toast({
          title: "Error",
          description: "Could not fetch user role. Please try logging in again.",
          variant: "destructive",
        });
        return;
      }
    
      setUserRole(profile?.role || null);
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try logging in again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <React.StrictMode>
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
    </React.StrictMode>
  );
};

export default App;