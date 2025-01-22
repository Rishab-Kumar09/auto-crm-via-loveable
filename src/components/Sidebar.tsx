import { Home, Inbox, Users, Settings, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";

const menuItems = [
  { icon: Home, label: "Dashboard", href: "/" },
  { icon: Inbox, label: "Tickets", href: "/tickets" },
  { icon: Users, label: "Customers", href: "/customers" },
  { icon: Settings, label: "Settings", href: "/settings" },
  { icon: HelpCircle, label: "Help Center", href: "/help" },
];

const Sidebar = () => {
  const { toast } = useToast();

  const handleNavigation = (item: typeof menuItems[0]) => {
    if (item.href !== "/") {
      toast({
        title: "Navigation",
        description: `${item.label} page is not implemented yet.`,
      });
    }
  };

  return (
    <div className="h-screen w-64 bg-white border-r border-zendesk-border flex flex-col">
      <div className="p-4 border-b border-zendesk-border">
        <h1 className="text-xl font-bold text-zendesk-secondary">Help Desk</h1>
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