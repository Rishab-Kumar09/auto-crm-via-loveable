import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Clock, MessageSquare, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Ticket, TicketComment } from "@/types/ticket";
import { ScrollArea } from "@/components/ui/scroll-area";

interface TicketDetailsProps {
  ticket: Ticket;
  onClose: () => void;
}

const TicketDetails = ({ ticket, onClose }: TicketDetailsProps) => {
  const { toast } = useToast();
  const [comments, setComments] = useState<TicketComment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchComments();
  }, [ticket.id]);

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

      const formattedComments = commentsData.map((comment: any) => ({
        id: comment.id,
        ticketId: comment.ticket_id,
        content: comment.content,
        user: {
          id: comment.user.id,
          name: comment.user.full_name,
          email: comment.user.email,
          role: comment.user.role,
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
      const { data: commentData, error } = await supabase
        .from("comments")
        .insert([
          {
            ticket_id: ticket.id,
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
          role: commentData.user.role,
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

        <div className="space-y-4">
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
        </div>

        <Separator />

        <div>
          <div className="flex items-center space-x-2 mb-4">
            <MessageSquare className="w-5 h-5 text-zendesk-muted" />
            <h3 className="font-medium text-zendesk-secondary">Comments</h3>
          </div>

          <ScrollArea className="h-[300px] pr-4">
            <div className="space-y-4">
              {comments.map((comment) => (
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
              ))}
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