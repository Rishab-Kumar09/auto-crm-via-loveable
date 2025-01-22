import { Home, Inbox, Users, Settings, HelpCircle, PlusCircle, BarChart } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { UserRole } from "@/types/ticket";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const getMenuItems = (role: UserRole) => {
  const baseItems = [
    { icon: Home, label: "Dashboard", href: "/" },
    { icon: Inbox, label: "Tickets", href: "/tickets" },
  ];

  if (role === "customer") {
    return [
      ...baseItems,
      { icon: PlusCircle, label: "New Ticket", href: "/tickets/new" },
      { icon: HelpCircle, label: "Help Center", href: "/help" },
    ];
  }

  if (role === "agent") {
    return [
      ...baseItems,
      { icon: Users, label: "Customers", href: "/customers" },
      { icon: HelpCircle, label: "Help Center", href: "/help" },
    ];
  }

  // Admin role
  return [
    ...baseItems,
    { icon: Users, label: "Customers", href: "/customers" },
    { icon: BarChart, label: "Reports", href: "/reports" },
    { icon: Settings, label: "Settings", href: "/settings" },
  ];
};

const Sidebar = () => {
  const { toast } = useToast();
  const [userRole, setUserRole] = useState<UserRole>("customer");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserRole = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Error fetching user role:', error);
          toast({
            title: "Error",
            description: "Could not fetch user role",
            variant: "destructive",
          });
          return;
        }

        if (profile) {
          setUserRole(profile.role as UserRole);
        }
      }
      setLoading(false);
    };

    fetchUserRole();
  }, [toast]);

  const handleNavigation = (item: { label: string; href: string }) => {
    if (item.href !== "/") {
      toast({
        title: "Navigation",
        description: `${item.label} page is not implemented yet.`,
      });
    }
  };

  const menuItems = getMenuItems(userRole);

  if (loading) {
    return (
      <div className="h-screen w-64 bg-white border-r border-zendesk-border flex items-center justify-center">
        <p className="text-zendesk-muted">Loading...</p>
      </div>
    );
  }

  return (
    <div className="h-screen w-64 bg-white border-r border-zendesk-border flex flex-col">
      <div className="p-4 border-b border-zendesk-border">
        <h1 className="text-xl font-bold text-zendesk-secondary">Help Desk</h1>
        <p className="text-sm text-zendesk-muted mt-1 capitalize">{userRole} Portal</p>
      </div>
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => (
            <li key={item.label}>
              <a
                href={item.href}
                onClick={(e) => {
                  if (item.href !== "/") {
                    e.preventDefault();
                    handleNavigation(item);
                  }
                }}
                className={cn(
                  "flex items-center space-x-3 px-4 py-2 rounded-md text-zendesk-secondary",
                  "hover:bg-zendesk-background transition-colors duration-200"
                )}
              >
                <item.icon className="w-5 h-5" />
                <span>{item.label}</span>
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
};

export default Sidebar;