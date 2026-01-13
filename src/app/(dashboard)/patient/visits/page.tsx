import PatientVisits from "@/components/dashboards/patient/PatientVisits";

export default async function VisitsPage() {
  return (
    <div className="flex-1 w-full">
      <PatientVisits />
    </div>
  );
}