import { Search, LogOut } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

const Header = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchValue, setSearchValue] = useState(searchParams.get("q") || "");
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSearchParams(searchValue ? { q: searchValue } : {});
    toast({
      title: "Search updated",
      description: searchValue ? `Showing results for "${searchValue}"` : "Showing all tickets",
    });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
    toast({
      title: "Logged out",
      description: "You have been successfully logged out.",
    });
  };

  return (
    <header className="h-16 bg-white border-b border-zendesk-border flex items-center justify-between px-6">
      <form onSubmit={handleSearch} className="flex-1 max-w-xl">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zendesk-muted w-4 h-4" />
          <Input
            type="search"
            placeholder="Search tickets..."
            className="pl-10 bg-zendesk-background border-zendesk-border"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
          />
        </div>
      </form>
      <div className="flex items-center space-x-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          className="flex items-center gap-2"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </Button>
        <div className="w-8 h-8 rounded-full bg-zendesk-primary text-white flex items-center justify-center">
          <span className="text-sm font-medium">JD</span>
        </div>
      </div>
    </header>
  );
};

export default Header;