import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  LayoutDashboard,
  TicketIcon,
  Users,
  UserCog,
  Settings,
  BookOpen,
  MessageSquare,
} from "lucide-react";

const Sidebar = () => {
  const location = useLocation();
  const [userRole, setUserRole] = useState<string | null>(null);

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
          setUserRole(profile.role);
        }
      }
    };

    fetchUserRole();
  }, []);

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Tickets", href: "/tickets", icon: TicketIcon },
    ...(userRole === 'admin' ? [
      { name: "Customers", href: "/customers", icon: Users },
      { name: "Agents", href: "/agents", icon: UserCog }
    ] : []),
    { name: "Knowledge Base", href: "/knowledge-base", icon: BookOpen },
    { name: "Chat", href: "/chat", icon: MessageSquare },
    { name: "Settings", href: "/settings", icon: Settings },
  ];

  return (
    <div className="flex h-full w-56 flex-col bg-white border-r border-gray-200">
      <div className="flex h-14 items-center border-b border-gray-200 px-4">
        <Link to="/" className="flex items-center space-x-2">
          <img src="/favicon.ico" alt="Logo" className="h-6 w-6" />
          <span className="font-semibold text-lg">Helpdesk</span>
        </Link>
      </div>
      <nav className="flex-1 space-y-1 px-2 py-4">
        {navigation.map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.name} to={item.href}>
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-start",
                  location.pathname === item.href
                    ? "bg-gray-100 text-gray-900"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                )}
              >
                <Icon className="mr-3 h-5 w-5" />
                {item.name}
              </Button>
            </Link>
          );
        })}
      </nav>
    </div>
  );
};

export default Sidebar;