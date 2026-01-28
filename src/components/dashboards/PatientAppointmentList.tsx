import { useEffect, useState } from "react";
import { useSession } from "../hoc/AuthSessionProvider";
import { Appointment, useAppointment } from "@/hooks/useAppointments";
import { AppointmentCard } from "../shared/AppointmentCard";
import { useRouter } from "next/navigation";
import { Spinner } from "../shared/Spinner";

type Props = {
    filter: 'all' | 'upcoming';
};

export const PatientAppointmentList = ({ filter }: Props) => {
    const router = useRouter();

    const handleCardClick = (appointmentId: string) => {
        router.push(`/patient/history/report/${appointmentId}`);
    };

    const { session } = useSession();

    const [appointments, setAppointments] = useState<Appointment[] | null>(null);
    const { getAppointmentsDetails, isLoading } = useAppointment(session?.user?.id);

    useEffect(() => {
        let isMounted = true;
        const loadData = async () => {
            const data = await getAppointmentsDetails(filter, "patient");
            if (isMounted) setAppointments(data);
        };
        loadData();
        return () => { isMounted = false; };
    }, [getAppointmentsDetails, filter]);

    if (isLoading || appointments === null) {
        return (
            <div className="rounded-3xl bg-slate-50 p-8 text-center text-slate-500">
                <Spinner />
            </div>
        );
    }

    if (appointments.length === 0) {
        return (
            <div className="rounded-3xl bg-slate-50 p-8 text-center text-slate-500">
                You currently have no scheduled appointments.
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-4">
            {appointments.map((appointment) => (
                <AppointmentCard
                    key={appointment.id}
                    appointment={appointment}
                    onCardClick={() => handleCardClick(appointment.id)}
                />
            ))}
        </div>
    );
};