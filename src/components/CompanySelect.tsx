import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface CompanySelectProps {
  onSelect: (companyId: string | null) => void;
  selectedId?: string | null;
}

const CompanySelect = ({ onSelect, selectedId }: CompanySelectProps) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

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

  const selectedCompany = companies.find(
    (company) => company.id === selectedId
  );

  const filteredCompanies = companies.filter((company) =>
    company.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={isLoading}
        >
          {isLoading ? (
            "Loading companies..."
          ) : (
            <>
              {selectedCompany ? selectedCompany.name : "Select company..."}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command shouldFilter={false}>
          <CommandInput 
            placeholder="Search company..." 
            value={search}
            onValueChange={setSearch}
          />
          <CommandEmpty>No company found.</CommandEmpty>
          <CommandGroup>
            {!isLoading && filteredCompanies.map((company) => (
              <CommandItem
                key={company.id}
                onSelect={() => {
                  onSelect(company.id);
                  setOpen(false);
                  setSearch("");
                }}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    selectedId === company.id ? "opacity-100" : "opacity-0"
                  )}
                />
                {company.name}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default CompanySelect;