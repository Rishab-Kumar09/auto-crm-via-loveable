import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import TicketList from "@/components/TicketList";

const Index = () => {
  return (
    <div className="flex h-screen bg-zendesk-background">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="flex-1 p-6 overflow-auto">
          <TicketList />
        </main>
      </div>
    </div>
  );
};

export default Index;