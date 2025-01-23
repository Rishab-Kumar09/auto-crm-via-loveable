import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import CompanySelect from "./CompanySelect";

const TicketForm = () => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) throw new Error("Not authenticated");

      // Get user's profile to ensure they're a customer
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

      if (profileError) throw profileError;
      if (!profile) throw new Error("Profile not found");
      if (profile.role !== "customer") throw new Error("Only customers can create tickets");

      // Create the ticket
      const { error: ticketError } = await supabase
        .from("tickets")
        .insert({
          title,
          description,
          customer_id: user.id,
          company_id: companyId,
          status: "open",
          priority: "medium"
        });

      if (ticketError) {
        console.error("Ticket creation error:", ticketError);
        throw new Error("Failed to create ticket. Please try again.");
      }

      toast({
        title: "Success",
        description: "Ticket created successfully",
      });

      // Reset form
      setTitle("");
      setDescription("");
      setCompanyId(null);
    } catch (error: any) {
      console.error("Error creating ticket:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create ticket",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Ticket Title"
          required
        />
      </div>
      <div>
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe your issue..."
          required
        />
      </div>
      <div>
        <CompanySelect
          onSelect={setCompanyId}
          selectedId={companyId}
        />
      </div>
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Creating..." : "Create Ticket"}
      </Button>
    </form>
  );
};

export default TicketForm;