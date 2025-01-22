import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

const Customers = () => {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        // First get the admin's company_id
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        const { data: adminProfile, error: profileError } = await supabase
          .from('profiles')
          .select('company_id')
          .eq('id', user.id)
          .single();

        if (profileError) throw profileError;
        if (!adminProfile?.company_id) throw new Error('No company associated with admin');

        // Fetch customers who either belong to the company directly or have created tickets with the company
        const { data: profiles, error } = await supabase
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
          .or(`company_id.eq.${adminProfile.company_id},tickets.company_id.eq.${adminProfile.company_id}`);

        if (error) throw error;

        // Filter out duplicates and format the data
        const uniqueCustomers = profiles?.filter((profile) => {
          return profile.company_id === adminProfile.company_id || 
                 profile.tickets?.some(ticket => ticket.company_id === adminProfile.company_id);
        }) || [];

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
  }, [toast]);

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
            {loading ? (
              <Card>
                <CardContent className="p-6">
                  Loading customers...
                </CardContent>
              </Card>
            ) : customers.length === 0 ? (
              <Card>
                <CardContent className="p-6">
                  No customers found in your company.
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