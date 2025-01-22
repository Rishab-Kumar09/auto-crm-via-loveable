import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface CompanySelectProps {
  onSelect: (companyId: string | null) => void;
  selectedId: string | null;
}

const CompanySelect = ({ onSelect, selectedId }: CompanySelectProps) => {
  const { data: companies = [], isLoading } = useQuery({
    queryKey: ["companies"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("companies")
        .select("id, name")
        .order("name");
      
      if (error) throw error;
      return data || [];
    },
  });

  return (
    <Select
      value={selectedId || ""}
      onValueChange={(value) => onSelect(value)}
      disabled={isLoading}
    >
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Select company">
          {isLoading
            ? "Loading companies..."
            : companies.find((company) => company.id === selectedId)?.name || "Select company"
          }
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {companies.map((company) => (
          <SelectItem key={company.id} value={company.id}>
            <div className="flex items-center">
              <Check
                className={cn(
                  "mr-2 h-4 w-4",
                  selectedId === company.id ? "opacity-100" : "opacity-0"
                )}
              />
              {company.name}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default CompanySelect;