import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import TicketList from "@/components/TicketList";
import TicketForm from "@/components/TicketForm";
import { useState } from "react";
import { Button } from "@/components/ui/button";

const Index = () => {
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="flex h-screen bg-zendesk-background">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="flex-1 p-6 overflow-auto">
          <div className="mb-6 flex justify-between items-center">
            <h1 className="text-2xl font-bold text-zendesk-secondary">Support Dashboard</h1>
            <Button onClick={() => setShowForm(!showForm)}>
              {showForm ? "View Tickets" : "Create Ticket"}
            </Button>
          </div>
          {showForm ? <TicketForm /> : <TicketList />}
        </main>
      </div>
    </div>
  );
};

export default Index;