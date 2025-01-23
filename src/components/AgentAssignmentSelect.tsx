import { useState, useEffect } from "react";
import { UserPlus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Agent {
  id: string;
  name: string;
}

interface AgentAssignmentSelectProps {
  ticketId: string;
  currentAssignee: { id: string; name: string } | null;
  onAssignmentChange: () => void;
}

const AgentAssignmentSelect = ({ 
  ticketId, 
  currentAssignee,
  onAssignmentChange 
}: AgentAssignmentSelectProps) => {
  const { toast } = useToast();
  const [agents, setAgents] = useState<Agent[]>([]);

  useEffect(() => {
    const fetchAgents = async () => {
      const { data: agentsData } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('role', 'agent');
      
      if (agentsData) {
        setAgents(agentsData.map(agent => ({
          id: agent.id,
          name: agent.full_name || 'Unknown Agent'
        })));
      }
    };

    fetchAgents();
  }, []);

  const handleAssignAgent = async (agentId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // First update the ticket's assignee
      const { error: ticketError } = await supabase
        .from('tickets')
        .update({ assignee_id: agentId })
        .eq('id', ticketId);

      if (ticketError) throw ticketError;

      // Then create the assignment record
      const { error: assignmentError } = await supabase
        .from('ticket_assignments')
        .upsert({
          ticket_id: ticketId,
          agent_id: agentId,
          assigned_by: user.id
        }, {
          onConflict: 'ticket_id'
        });

      if (assignmentError) throw assignmentError;

      toast({
        title: "Success",
        description: "Agent assigned successfully.",
      });

      onAssignmentChange();
    } catch (error) {
      console.error("Error assigning agent:", error);
      toast({
        title: "Error",
        description: "Failed to assign agent. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleRemoveAssignment = async () => {
    try {
      // First update the ticket's assignee
      const { error: ticketError } = await supabase
        .from('tickets')
        .update({ assignee_id: null })
        .eq('id', ticketId);

      if (ticketError) throw ticketError;

      // Then remove the assignment record
      const { error: assignmentError } = await supabase
        .from('ticket_assignments')
        .delete()
        .eq('ticket_id', ticketId);

      if (assignmentError) throw assignmentError;

      toast({
        title: "Success",
        description: "Agent assignment removed successfully.",
      });

      onAssignmentChange();
    } catch (error) {
      console.error("Error removing assignment:", error);
      toast({
        title: "Error",
        description: "Failed to remove assignment. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4">
      {currentAssignee && (
        <Badge
          variant="secondary"
          className="flex items-center gap-2"
        >
          {currentAssignee.name}
          <button
            onClick={handleRemoveAssignment}
            className="ml-1 hover:text-red-500"
          >
            ×
          </button>
        </Badge>
      )}
      
      <Select
        onValueChange={handleAssignAgent}
        value={currentAssignee?.id || ""}
      >
        <SelectTrigger>
          <UserPlus className="w-4 h-4 mr-2" />
          <SelectValue placeholder="Assign agent" />
        </SelectTrigger>
        <SelectContent>
          {agents
            .filter(agent => agent.id !== currentAssignee?.id)
            .map((agent) => (
              <SelectItem key={agent.id} value={agent.id}>
                {agent.name}
              </SelectItem>
            ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default AgentAssignmentSelect;