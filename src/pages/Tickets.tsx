import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import TicketList from "@/components/TicketList";
import TicketForm from "@/components/TicketForm";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { UserRole } from "@/types/ticket";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const Tickets = () => {
  const [showForm, setShowForm] = useState(false);
  const [userRole, setUserRole] = useState<UserRole>("customer");
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        setIsLoading(true);
        
        // First check if we have a session
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          console.log("No active session found");
          navigate("/auth");
          return;
        }

        // Then fetch the user profile
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .maybeSingle();
        
        if (profileError) {
          console.error("Error fetching profile:", profileError);
          if (profileError.code === "PGRST116") {
            // Profile not found
            toast({
              title: "Error",
              description: "User profile not found. Please sign in again.",
              variant: "destructive",
            });
            await supabase.auth.signOut();
            navigate("/auth");
            return;
          }
          throw profileError;
        }

        if (profile) {
          setUserRole(profile.role as UserRole);
        }
      } catch (error: any) {
        console.error("Error in fetchUserRole:", error);
        toast({
          title: "Error",
          description: "Failed to load user data. Please try again.",
          variant: "destructive",
        });
        navigate("/auth");
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserRole();
  }, [navigate, toast]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-zendesk-background">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="flex-1 p-6 overflow-auto">
          <div className="mb-6 flex justify-between items-center">
            <h1 className="text-2xl font-bold text-zendesk-secondary">
              {userRole === 'agent' ? 'My Assigned Tickets' : 'Support Tickets'}
            </h1>
            {userRole === 'customer' && (
              <Button onClick={() => setShowForm(!showForm)}>
                {showForm ? "View Tickets" : "Create Ticket"}
              </Button>
            )}
          </div>
          {showForm && userRole === 'customer' ? <TicketForm /> : <TicketList />}
        </main>
      </div>
    </div>
  );
};

export default Tickets;