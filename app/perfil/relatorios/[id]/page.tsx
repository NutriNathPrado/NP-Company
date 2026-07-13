import { notFound } from "next/navigation";
import ReportDashboard from "@/components/ReportDashboard";
import { getIgReport } from "@/lib/store";

export default async function ReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const report = await getIgReport(id);
  if (!report) notFound();
  return <ReportDashboard report={report} />;
}
