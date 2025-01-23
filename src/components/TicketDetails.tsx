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
  const [assignedAgent, setAssignedAgent] = useState<{ id: string; name: string } | null>(null);
  const [currentStatus, setCurrentStatus] = useState<TicketStatus>(ticket.status);
  const [currentPriority, setCurrentPriority] = useState<TicketPriority>(ticket.priority);

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
    fetchAssignedAgent();
  }, [ticket.id]);

  const fetchAssignedAgent = async () => {
    if (ticket.assignee_id) {
      const { data: agent } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('id', ticket.assignee_id)
        .single();

      if (agent) {
        setAssignedAgent({
          id: agent.id,
          name: agent.full_name || 'Unknown Agent'
        });
      }
    } else {
      setAssignedAgent(null);
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

      const { error } = await supabase
        .from("comments")
        .insert([
          {
            ticket_id: ticket.id,
            user_id: user.id,
            content: newComment,
          }
        ]);

      if (error) throw error;

      fetchComments();
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

  const handleUpdateTicket = async (newStatus: TicketStatus) => {
    try {
      const { error } = await supabase
        .from('tickets')
        .update({ status: newStatus })
        .eq('id', ticket.id);

      if (error) {
        console.error("Update error:", error);
        throw error;
      }

      setCurrentStatus(newStatus);
      toast({
        title: "Success",
        description: "Ticket status updated successfully.",
      });
    } catch (error: any) {
      console.error("Error updating ticket:", error);
      toast({
        title: "Error",
        description: "Failed to update ticket status. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleUpdatePriority = async (newPriority: TicketPriority) => {
    try {
      const { error } = await supabase
        .from('tickets')
        .update({ priority: newPriority })
        .eq('id', ticket.id);

      if (error) {
        console.error("Update error:", error);
        throw error;
      }

      setCurrentPriority(newPriority);
      toast({
        title: "Success",
        description: "Ticket priority updated successfully.",
      });
    } catch (error: any) {
      console.error("Error updating ticket:", error);
      toast({
        title: "Error",
        description: "Failed to update ticket priority. Please try again.",
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
              <label className="block text-sm font-medium mb-1">Assigned Agent</label>
              <AgentAssignmentSelect
                ticketId={ticket.id}
                currentAssignee={assignedAgent}
                onAssignmentChange={() => {
                  fetchAssignedAgent();
                }}
              />
            </div>
          )}

          {canManageTicketStatus && (
            <>
              <div>
                <label className="block text-sm font-medium mb-1">Status</label>
                <Select
                  value={currentStatus}
                  onValueChange={(value: TicketStatus) => handleUpdateTicket(value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Set status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Priority</label>
                <Select
                  value={currentPriority}
                  onValueChange={(value: TicketPriority) => handleUpdatePriority(value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Set priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}
        </div>

        <div>
          <h3 className="font-medium text-zendesk-secondary">Description</h3>
          <p className="mt-2 text-zendesk-muted">{ticket.description}</p>
        </div>

        <div className="flex space-x-4">
          <div>
            <h3 className="font-medium text-zendesk-secondary mb-2">Status</h3>
            <Badge
              variant="secondary"
              className="bg-yellow-100 text-yellow-800"
            >
              {currentStatus.replace("_", " ")}
            </Badge>
          </div>
          <div>
            <h3 className="font-medium text-zendesk-secondary mb-2">Priority</h3>
            <Badge
              variant="secondary"
              className={`${
                currentPriority === 'critical' ? 'bg-red-100 text-red-800' :
                currentPriority === 'high' ? 'bg-orange-100 text-orange-800' :
                currentPriority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                'bg-green-100 text-green-800'
              }`}
            >
              {currentPriority}
            </Badge>
          </div>
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
