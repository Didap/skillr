import { DashboardSidebar } from "@/components/layout/DashboardSidebar";

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-screen bg-[#FDFDFC] flex selection:bg-emerald-100 selection:text-emerald-900 overflow-hidden">
      <DashboardSidebar />
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {children}
      </div>
    </div>
  );
}
