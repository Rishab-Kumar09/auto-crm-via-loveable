import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Clock, MessageSquare, User, Flag, RefreshCw, Building } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Ticket, TicketComment, UserRole, TicketStatus, TicketPriority } from "@/types/ticket";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import AgentAssignmentSelect from "./AgentAssignmentSelect";

interface TicketDetailsProps {
  ticket: Ticket;
  onClose: () => void;
}

const TicketDetails = ({ ticket, onClose }: TicketDetailsProps) => {
  const { toast } = useToast();
  const [comments, setComments] = useState<TicketComment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<UserRole>("customer");
  const [assignedAgents, setAssignedAgents] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    const fetchUserRole = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();
        
        if (profile) {
          setUserRole(profile.role as UserRole);
        }
      }
    };

    fetchUserRole();
  }, []);

  useEffect(() => {
    fetchComments();
    fetchAssignedAgents();
  }, [ticket.id]);

  const fetchAssignedAgents = async () => {
    const { data: assignments } = await supabase
      .from('ticket_assignments')
      .select(`
        agent_id,
        agent:profiles!ticket_assignments_agent_id_fkey (
          id,
          full_name
        )
      `)
      .eq('ticket_id', ticket.id);

    if (assignments) {
      setAssignedAgents(
        assignments.map(assignment => ({
          id: assignment.agent.id,
          name: assignment.agent.full_name || 'Unknown Agent'
        }))
      );
    }
  };

  const fetchComments = async () => {
    try {
      const { data: commentsData, error } = await supabase
        .from("comments")
        .select(`
          *,
          user:profiles!comments_user_id_fkey (
            id,
            full_name,
            email,
            role
          )
        `)
        .eq("ticket_id", ticket.id)
        .order("created_at", { ascending: true });

      if (error) throw error;

      const formattedComments = commentsData
        .filter(comment => comment.user != null)
        .map((comment: any) => ({
          id: comment.id,
          ticketId: comment.ticket_id,
          content: comment.content,
          user: {
            id: comment.user.id,
            name: comment.user.full_name || 'Unknown User',
            email: comment.user.email || '',
            role: comment.user.role as UserRole,
          },
          created_at: new Date(comment.created_at).toLocaleString(),
        }));

      setComments(formattedComments);
    } catch (error) {
      console.error("Error fetching comments:", error);
      toast({
        title: "Error",
        description: "Failed to load comments. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) throw new Error("No user found");

      const { data: commentData, error } = await supabase
        .from("comments")
        .insert([
          {
            ticket_id: ticket.id,
            user_id: user.id,
            content: newComment,
          },
        ])
        .select(`
          *,
          user:profiles!comments_user_id_fkey (
            id,
            full_name,
            email,
            role
          )
        `)
        .single();

      if (error) throw error;

      const formattedComment: TicketComment = {
        id: commentData.id,
        ticketId: commentData.ticket_id,
        content: commentData.content,
        user: {
          id: commentData.user.id,
          name: commentData.user.full_name,
          email: commentData.user.email,
          role: commentData.user.role as UserRole,
        },
        created_at: new Date(commentData.created_at).toLocaleString(),
      };

      setComments([...comments, formattedComment]);
      setNewComment("");
      toast({
        title: "Success",
        description: "Comment added successfully.",
      });
    } catch (error) {
      console.error("Error adding comment:", error);
      toast({
        title: "Error",
        description: "Failed to add comment. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleUpdateTicket = async (updates: Partial<Ticket>) => {
    try {
      const { error } = await supabase
        .from('tickets')
        .update(updates)
        .eq('id', ticket.id);

      if (error) {
        console.error("Error updating ticket:", error);
        throw error;
      }

      // Update the local ticket state to reflect changes
      Object.assign(ticket, updates);

      toast({
        title: "Success",
        description: "Ticket updated successfully.",
      });
    } catch (error: any) {
      console.error("Error updating ticket:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update ticket. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleCloseTicket = async () => {
    try {
      const { error } = await supabase
        .from('tickets')
        .update({ status: 'closed' })
        .eq('id', ticket.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Ticket closed successfully.",
      });

      onClose();
    } catch (error) {
      console.error("Error closing ticket:", error);
      toast({
        title: "Error",
        description: "Failed to close ticket. Please try again.",
        variant: "destructive",
      });
    }
  };

  const canManageTicketStatus = userRole === 'admin' || userRole === 'agent';

  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-semibold text-zendesk-secondary">
              {ticket.title}
            </h2>
            <div className="mt-2 flex items-center space-x-4 text-sm text-zendesk-muted">
              <div className="flex items-center space-x-1">
                <User className="w-4 h-4" />
                <span>{ticket.customer.name}</span>
              </div>
              {ticket.company && (
                <div className="flex items-center space-x-1">
                  <Building className="w-4 h-4" />
                  <span>{ticket.company.name}</span>
                </div>
              )}
              <div className="flex items-center space-x-1">
                <Clock className="w-4 h-4" />
                <span>{ticket.created_at}</span>
              </div>
            </div>
          </div>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {userRole === 'admin' && (
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1">Assigned Agents</label>
              <AgentAssignmentSelect
                ticketId={ticket.id}
                currentAssignments={assignedAgents}
                onAssignmentChange={fetchAssignedAgents}
              />
            </div>
          )}

          {canManageTicketStatus && (
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1">Status</label>
              <Select
                value={ticket.status}
                onValueChange={(value) => handleUpdateTicket({ status: value as TicketStatus })}
              >
                <SelectTrigger>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Set status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <div>
          <h3 className="font-medium text-zendesk-secondary">Description</h3>
          <p className="mt-2 text-zendesk-muted">{ticket.description}</p>
        </div>

        <div>
          <h3 className="font-medium text-zendesk-secondary mb-2">Status</h3>
          <Badge
            variant="secondary"
            className="bg-yellow-100 text-yellow-800"
          >
            {ticket.status.replace("_", " ")}
          </Badge>
        </div>

        <Separator />

        <div>
          <div className="flex items-center space-x-2 mb-4">
            <MessageSquare className="w-5 h-5 text-zendesk-muted" />
            <h3 className="font-medium text-zendesk-secondary">Comments</h3>
          </div>

          <ScrollArea className="h-[300px] pr-4">
            <div className="space-y-4">
              {loading ? (
                <div className="text-center text-zendesk-muted">Loading comments...</div>
              ) : comments.length > 0 ? (
                comments.map((comment) => (
                  <div
                    key={comment.id}
                    className="bg-gray-50 rounded-lg p-4 space-y-2"
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">{comment.user.name}</span>
                        <Badge variant="outline" className="text-xs">
                          {comment.user.role}
                        </Badge>
                      </div>
                      <span className="text-sm text-zendesk-muted">
                        {comment.created_at}
                      </span>
                    </div>
                    <p className="text-zendesk-muted">{comment.content}</p>
                  </div>
                ))
              ) : (
                <div className="text-center text-zendesk-muted">No comments yet</div>
              )}
            </div>
          </ScrollArea>

          <div className="mt-4 space-y-2">
            <textarea
              className="w-full p-2 border rounded-md"
              rows={3}
              placeholder="Add a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
            />
            <Button onClick={handleAddComment}>Add Comment</Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TicketDetails;
