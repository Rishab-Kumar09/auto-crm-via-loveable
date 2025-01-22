import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import CompanySelect from "@/components/CompanySelect";

const Customers = () => {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        const { data: userProfile, error: profileError } = await supabase
          .from('profiles')
          .select('role, company_id')
          .eq('id', user.id)
          .single();

        if (profileError) throw profileError;

        // For admin, use selected company. For others, use their company_id
        const companyId = userProfile?.role === 'admin' 
          ? selectedCompanyId 
          : userProfile?.company_id;

        if (!companyId) {
          if (userProfile?.role === 'admin') {
            setCustomers([]);
            setLoading(false);
            return;
          }
          throw new Error('No company associated with user');
        }

        // Get customers directly associated with company
        const { data: companyCustomers, error: companyError } = await supabase
          .from('profiles')
          .select(`
            *,
            companies (
              name
            )
          `)
          .eq('role', 'customer')
          .eq('company_id', companyId);

        if (companyError) throw companyError;

        // Get customers who have tickets with the company
        const { data: ticketCustomers, error: ticketError } = await supabase
          .from('profiles')
          .select(`
            *,
            companies (
              name
            ),
            tickets!customer_id (
              id,
              company_id
            )
          `)
          .eq('role', 'customer')
          .eq('tickets.company_id', companyId);

        if (ticketError) throw ticketError;

        // Combine and deduplicate results
        const allCustomers = [...(companyCustomers || []), ...(ticketCustomers || [])];
        const uniqueCustomers = Array.from(new Map(allCustomers.map(item => [item.id, item])).values());

        console.log('Fetched customers:', uniqueCustomers);
        setCustomers(uniqueCustomers);
      } catch (error) {
        console.error('Error fetching customers:', error);
        toast({
          title: "Error",
          description: "Could not fetch customers",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchCustomers();
  }, [toast, selectedCompanyId]);

  return (
    <div className="flex h-screen bg-zendesk-background">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="flex-1 p-6 overflow-auto">
          <h1 className="text-2xl font-bold text-zendesk-secondary mb-6">
            Company Customers
          </h1>
          <div className="grid gap-4">
            <CompanySelect 
              onSelect={setSelectedCompanyId}
              selectedId={selectedCompanyId}
            />
            {loading ? (
              <Card>
                <CardContent className="p-6">
                  Loading customers...
                </CardContent>
              </Card>
            ) : customers.length === 0 ? (
              <Card>
                <CardContent className="p-6">
                  {selectedCompanyId ? "No customers found in selected company." : "Please select a company to view customers."}
                </CardContent>
              </Card>
            ) : (
              customers.map((customer) => (
                <Card key={customer.id}>
                  <CardHeader>
                    <CardTitle>{customer.full_name || 'Unnamed Customer'}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <p><strong>Email:</strong> {customer.email}</p>
                      <p><strong>Company:</strong> {customer.companies?.name || 'No company'}</p>
                      <p><strong>Joined:</strong> {new Date(customer.created_at).toLocaleDateString()}</p>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Customers;