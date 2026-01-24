export type FormDataState = {
    firstName: string;
    lastName: string;
    pesel: string;
    birthDate: string;
    reportedSymptoms: string;
    visitType: string;
    specialization: string;
    locationId: string;
    doctorId: string;
    selectedDate: string;
    selectedTimeSlot: string | null;
};

export type Location = {
    id: string;
    name: string;
    address: string;
    city: string;
};

export type Doctor = {
    id: string;
    specialization: string;
    profiles: {
        first_name: string;
        last_name: string;
    };
};

export type AvailabilitySlot = {
    doctor_id: string;
    start_time: string;
    is_booked: boolean;
};

