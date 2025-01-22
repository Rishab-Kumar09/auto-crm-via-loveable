import { Search, Bell } from "lucide-react";
import { Input } from "@/components/ui/input";

const Header = () => {
  return (
    <header className="h-16 bg-white border-b border-zendesk-border flex items-center justify-between px-6">
      <div className="flex-1 max-w-xl">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zendesk-muted w-4 h-4" />
          <Input
            type="search"
            placeholder="Search tickets..."
            className="pl-10 bg-zendesk-background border-zendesk-border"
          />
        </div>
      </div>
      <div className="flex items-center space-x-4">
        <button className="p-2 hover:bg-zendesk-background rounded-full transition-colors">
          <Bell className="w-5 h-5 text-zendesk-secondary" />
        </button>
        <div className="w-8 h-8 rounded-full bg-zendesk-primary text-white flex items-center justify-center">
          <span className="text-sm font-medium">JD</span>
        </div>
      </div>
    </header>
  );
};

export default Header;