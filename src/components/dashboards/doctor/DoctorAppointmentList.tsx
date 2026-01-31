import { useEffect, useState } from "react";
import { Check, X } from "lucide-react";
import { Appointment, useAppointment } from "@/hooks/useAppointments";
import { useRouter } from "next/navigation";
import { useSession } from "@/components/hoc/AuthSessionProvider";
import { Spinner } from "@/components/shared/Spinner";
import { AppointmentCard } from "@/components/shared/AppointmentCard";


type Props = {
    filter: 'all' | 'today';
};

export const DoctorAppointmentList = ({ filter }: Props) => {
    const { session } = useSession();
    const userId = session?.user?.id

    const router = useRouter();
    const handleCardClick = (appointmentId: string) => {
        if (filter === 'today') router.push(`/doctor/consultation/${appointmentId}`);
        else router.push(`/doctor/consultations/report/${appointmentId}`);
    };

    const [appointments, setAppointments] = useState<Appointment[] | null>(null);
    const { getAppointmentsDetails, confirmAppointment, cancelAppointment, isLoading } = useAppointment(userId);

    const refreshData = async () => {
        const data = await getAppointmentsDetails(filter, "doctor");
        setAppointments(data);
    };

    useEffect(() => {
        let isMounted = true;
        const loadData = async () => {
            const data = await getAppointmentsDetails(filter, "doctor");
            if (isMounted) setAppointments(data);
        };
        loadData();
        return () => { isMounted = false; };
    }, [getAppointmentsDetails]);

    const handleConfirm = async (id: string) => {
        await confirmAppointment(id);
        refreshData();
    };

    const handleCancel = async (appointmetId: string, availabilityId: string) => {
        await cancelAppointment(appointmetId, availabilityId);
        refreshData();
    };

   
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
            {appointments.map((appointment) => {
                const canConfirm = appointment.status === 'Pending';
                const canCancel = !['Cancelled', 'Finished'].includes(appointment.status);

                return (
                    <AppointmentCard
                        key={appointment.id}
                        appointment={appointment}
                        onCardClick={() => handleCardClick(appointment.id)}
                        actionSlot={
                            <div className="flex gap-2">
                                {canConfirm && (
                                    <button
                                        type="button"
                                        onClick={() => { handleConfirm(appointment.id) }}
                                        className="flex items-center gap-1 rounded-lg bg-emerald-100 px-3 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-200 transition cursor-pointer"
                                    >
                                        <Check className="h-3 w-3" /> Confirm
                                    </button>
                                )}

                                {canCancel && (
                                    <button
                                        type="button"
                                        onClick={() => { handleCancel(appointment.id, appointment.availabilityId) }}
                                        className="flex items-center gap-1 rounded-lg bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-100 transition cursor-pointer"
                                    >
                                        <X className="h-3 w-3" /> Cancel
                                    </button>
                                )}
                            </div>
                        }
                    />
                );
            })}
        </div>
    );
};