import { supabase } from "@/api/supabase";
import { AvailabilitySlot, Doctor, FormDataState, Location } from "@/types/book_appointment";
import { AiReportData } from "@/types/report";
import { useCallback } from "react";


export const useAppointmentApi = (userId: string | undefined) => {
    const getUniqueSpecializations = useCallback(async (): Promise<string[]> => {
        try {
            return await fetchSpecializations()
        } catch (error) {
            return [];
        }
    }, [userId]);

    const getLocations = useCallback(async (specialization?: string, userQueryInput?: string): Promise<Location[]> => {
        try {
            return await fetchLocations(specialization, userQueryInput)
        } catch (error) {
            return [];
        }
    }, [userId]);

    const getDoctors = useCallback(async (locationId: string, specialization?: string): Promise<Doctor[]> => {
        try {
            return await fetchDoctors(locationId, specialization)
        } catch (error) {
            return [];
        }
    }, [userId]);

    const getAvailability = useCallback(async (doctorId: string, date: string): Promise<AvailabilitySlot[]> => {
        try {
            return await fetchAvailability(doctorId, date)
        } catch (error) {
            return [];
        }
    }, [userId]);

    const bookAppointment = useCallback(async (
        formData: FormDataState,
        report: AiReportData | null
    ): Promise<boolean> => {
        if (!userId) return false

        try {
            await submitAppointmentTransaction(userId, formData, report);
            return true
        } catch (error: any) {
            throw new Error(`Booking error: ${error.message}`);
        }
    }, [userId]);

    return { getUniqueSpecializations, getLocations, getDoctors, getAvailability, bookAppointment }
}




const fetchSpecializations = async (): Promise<string[]> => {
    const { data, error } = await supabase
        .from('doctors')
        .select('specialization');

    if (error) {
        throw new Error(`Error fetching specializations: ${error.message}`);
    }

    const allSpecializations = data.map((d: any) => d.specialization).filter(Boolean);
    return Array.from(new Set(allSpecializations));
};



const fetchLocations = async (
    specialization?: string,
    query?: string
): Promise<Location[]> => {
    let queryBuilder = supabase.from('locations').select(`
        id, name, address, city,
        availability!inner (
            doctors!inner (
                specialization
            )
        )
    `);

    if (specialization) {
        queryBuilder = queryBuilder.eq('availability.doctors.specialization', specialization);
    }

    if (query && query.length > 0) {
        const safeQuery = query.replace(/,/g, '');
        queryBuilder = queryBuilder.or(`city.ilike.%${safeQuery}%,name.ilike.%${safeQuery}%`);
    }

    const { data, error } = await queryBuilder;

    if (error) throw new Error(`Error fetching locations: ${error.message}`);


    const uniqueLocationsMap = new Map();
    data.forEach((item: any) => {
        if (!uniqueLocationsMap.has(item.id)) {
            const { availability, ...locationData } = item;
            uniqueLocationsMap.set(item.id, locationData);
        }
    });

    return Array.from(uniqueLocationsMap.values()) as Location[];
};



export const fetchDoctors = async (locationId: string, specialization?: string): Promise<Doctor[]> => {
    if (!locationId) return [];

    let queryBuilder = supabase
        .from('doctors')
        .select(`
            id,
            specialization,
            profiles!inner (
                first_name,
                last_name
            ),
            availability!inner (
                location_id
            )
        `)
        .eq('availability.location_id', locationId);

    if (specialization) {
        queryBuilder = queryBuilder.eq('specialization', specialization);
    }

    const { data, error } = await queryBuilder;

    if (error) throw new Error(`Error fetching doctors: ${error.message}`);


    const uniqueDoctorsMap = new Map();

    data.forEach((doctor: any) => {
        if (!uniqueDoctorsMap.has(doctor.id)) {
            uniqueDoctorsMap.set(doctor.id, {
                id: doctor.id,
                specialization: doctor.specialization,
                profiles: Array.isArray(doctor.profiles) ? doctor.profiles[0] : doctor.profiles
            });
        }
    });

    return Array.from(uniqueDoctorsMap.values());
};




const fetchAvailability = async (doctorId: string, date: string): Promise<AvailabilitySlot[]> => {
    if (!doctorId || !date) return [];

    const todayISO = new Date().toISOString();

    let queryBuilder = supabase
        .from('availability')
        .select('*')
        .eq('doctor_id', doctorId)
        .eq('is_booked', false)
        .gte('start_time', todayISO);


    const startOfDay = `${date}T00:00:00`;
    const endOfDay = `${date}T23:59:59`;
    queryBuilder = queryBuilder.gte('start_time', startOfDay).lte('start_time', endOfDay);

    const { data, error } = await queryBuilder.order('start_time', { ascending: true });

    if (error) throw new Error(`Error fetching slots: ${error.message}`);

    return data as AvailabilitySlot[];
};



export const submitAppointmentTransaction = async (
    userId: string,
    formData: FormDataState,
    report: AiReportData | null
) => {
    await updatePatientProfileIfNeeded(userId, formData);

    let savedReportId = null;

    if (report) {
        savedReportId = await insertReport(userId, report);
    }

    await insertAppointment(userId, formData, savedReportId);

    await markSlotAsBooked(formData.doctorId, formData.selectedSlotTime!);
};


const updatePatientProfileIfNeeded = async (userId: string, formData: FormDataState) => {
    if (!formData.pesel && !formData.birthDate) {
        return;
    }

    const updates: any = {};

    if (formData.pesel) updates.pesel = formData.pesel;
    if (formData.birthDate) updates.date_of_birth = formData.birthDate;

    const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId);

    if (error) throw new Error(`Failed to update patient data: ${error.message}`);
};


const insertReport = async (userId: string, report: AiReportData): Promise<string> => {
    const { data, error } = await supabase
        .from('reports')
        .insert({
            patient_id: userId,
            reported_summary: report.reported_summary,
            ai_diagnosis_suggestion: report.ai_diagnosis_suggestion,
            ai_recommended_specializations: report.ai_recommended_specializations,
            ai_confidence_score: report.ai_confidence_score,
            sickness_duration: report.sickness_duration,
            status: 'Sent to doctor'
        })
        .select('id')
        .single();

    if (error) throw new Error(`Failed to save the report: ${error.message}`);
    return data.id;
};


const insertAppointment = async (userId: string, formData: FormDataState, reportId: string | null) => {

    const { error } = await supabase
        .from('appointments')
        .insert({
            patient_id: userId,
            doctor_id: formData.doctorId,
            availability_id: formData.selectedSlotId,
            report_id: reportId,
            visit_type: formData.visitType,
            reported_symptoms: formData.reportedSymptoms,
            status: 'Pending',
        });

    if (error) throw new Error(`Failed to save the appointment data: ${error.message}`);
};


const markSlotAsBooked = async (doctorId: string, timeSlot: string) => {
    const { error } = await supabase
        .from('availability')
        .update({ is_booked: true })
        .eq('doctor_id', doctorId)
        .eq('start_time', timeSlot);

    if (error) throw new Error(`Error locking the selected appointment slot: ${error.message}`);
};

