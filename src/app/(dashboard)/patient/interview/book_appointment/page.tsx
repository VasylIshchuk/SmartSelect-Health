"use client"

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
    Calendar, MapPin, User, Stethoscope,
    FileText, CheckCircle, AlertCircle,
    LucideIcon
} from 'lucide-react';
import { useSession } from '@/components/hoc/AuthSessionProvider';
import { AiReportData } from '@/types/report';
import { FormDataState } from '@/types/book_appointment';
import { SectionHeader } from "@/components/shared/SectionHeader";
import { useChatLogic } from '@/hooks/useChatLogic';
import { useAppointmentForm } from '@/hooks/bookAppointment/useAppointmentForm';
import { useAppointmentData } from '@/hooks/bookAppointment/useAppointmentData';
import { useUser } from '@/hooks/useUser';
import { AvailabilityDB } from '@/hooks/useAvailability';
import { Doctor } from '@/hooks/useDoctor';
import { LocationAutocomplete } from '@/components/dashboards/LocationAutocomplete';


const VISIT_TYPES = ["Sick visit", "Follow-up", "Consultation", "Appointment", "Referral"];


export default function BookAppointmentPage() {
    const router = useRouter();

    const { session } = useSession();
    const userId = session?.user?.id
    const { user } = useUser(userId);

    const {
        formData, setFormData,
        updateField, isFormComplete, aiReport,
    } = useAppointmentForm(user);

    const {
        specializations, doctors, slots, bookAppointment
    } = useAppointmentData(formData, userId);

    const { clearHistory } = useChatLogic();

    const handleSubmit = async () => {
        if (!isFormComplete) {
            return;
        }

        const result = await bookAppointment(formData, aiReport);

        if (result) {
            clearHistory()
            localStorage.removeItem('medicalReport');
            router.push('/patient');
        }

    };

    return (
        <section className="w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="mx-auto max-w-4xl space-y-6">
                <SectionHeader
                    title="Schedule an appointment"
                    subtitle="Fill in the details to book an appointment with a specialist"
                    onBack={() => router.back()}
                />

                <AiReportBanner aiReport={aiReport} />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-2 space-y-6">
                        <PatientDetailsSection
                            formData={formData}
                            updateField={updateField}
                        />

                        <MedicalInfoSection
                            formData={formData}
                            updateField={updateField}
                            specializations={specializations}
                            aiReport={aiReport}
                        />

                        <LocationAndDoctorSection
                            formData={formData}
                            setFormData={setFormData}
                            doctors={doctors}
                        />
                    </div>
                    <div className="space-y-6">
                        <TimeSlotSection
                            formData={formData}
                            setFormData={setFormData}
                            slots={slots}
                        />

                        <BookingSummary
                            formData={formData}
                            isFormComplete={isFormComplete}
                            onSubmit={handleSubmit}
                        />
                    </div>
                </div>
            </div>
        </section>
    );
}



const AiReportBanner = ({ aiReport }: { aiReport: AiReportData | null }) => {
    if (!aiReport) return null;
    return (
        <div className="rounded-2xl bg-blue-50 border border-blue-100 p-4 flex items-start gap-3 animate-in fade-in slide-in-from-top-4">
            <FileText className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
                <h3 className="font-semibold text-blue-800 text-sm">Data retrieved from the AI report</h3>
                <p className="text-xs text-blue-600 mt-1">
                    The “Problem Description” and “Suggested Specialization” fields were automatically filled in based on your interview, and the AI-generated report will also be sent to the doctor after the appointment is confirmed.                </p>
            </div>
        </div>
    );
}



const PatientDetailsSection = ({ formData, updateField }: {
    formData: FormDataState,
    updateField: (name: string, value: string) => void
}) => {
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        updateField(name, value);
    };

    return (
        <section className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
            <FormGroupHeader icon={User} title="Patient details" />
            <div className="grid grid-cols-2 gap-4">
                {PATIENT_FIELDS.map((field) => (
                    <InputField
                        key={field.name}
                        name={field.name}
                        label={field.label}
                        value={formData[field.name as keyof FormDataState] as string}
                        onChange={handleInputChange}
                        type={field.type}
                    />
                ))}
            </div>
        </section>
    )
};


type FormGroupHeaderProps = {
    icon: LucideIcon;
    title: string;
};

const FormGroupHeader = ({ icon: Icon, title }: FormGroupHeaderProps) => (
    <div className="flex items-center gap-2 mb-4 text-slate-800">
        <Icon className="h-5 w-5 text-blue-500" />
        <h2 className="font-semibold text-lg">{title}</h2>
    </div>
);


const PATIENT_FIELDS = [
    { label: "First name", name: "firstName", type: "text" },
    { label: "Last name", name: "lastName", type: "text" },
    { label: "PESEL", name: "pesel", type: "text" },
    { label: "Date of birth", name: "birthDate", type: "date" },
] as const;

const InputField = ({ label, name, value, onChange, type = "text" }: any) => (
    <div>
        <label className="block text-xs font-medium text-slate-500 mb-1">{label}</label>
        <input
            type={type}
            name={name}
            value={value}
            onChange={onChange}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition"
        />
    </div>
);


interface MedicalInfoProps {
    formData: FormDataState;
    updateField: (name: string, value: string) => void;
    specializations: string[];
    aiReport: AiReportData | null;
}

const MedicalInfoSection = ({ formData, updateField, specializations, aiReport }: MedicalInfoProps) => {

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        updateField(name, value);
    };

    const { recommendedSpecializations, othersSpecializations } = useMemo(() => {
        const recommendedSpecializations: string[] = [];
        const othersSpecializations: string[] = [];

        specializations.forEach((spec: string) => {
            if (aiReport?.ai_recommended_specializations.includes(spec)) recommendedSpecializations.push(spec);
            else othersSpecializations.push(spec);
        });

        return { recommendedSpecializations, othersSpecializations };
    }, [specializations, aiReport]);


    return (
        <section className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
            <FormGroupHeader
                icon={Stethoscope}
                title="Appointment details"
            />

            <div className="space-y-4">
                <div>
                    <div className="flex justify-between items-center mb-1">
                        <label className="block text-xs font-medium text-slate-500">Symptoms / Problem description</label>
                        {aiReport?.reported_summary && <span className="text-[10px] text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">AI Auto-filled</span>}
                    </div>
                    <textarea
                        name="reportedSymptoms"
                        rows={3}
                        value={formData.reportedSymptoms}
                        onChange={handleInputChange}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-slate-900 focus:border-blue-500 outline-none resize-none"
                        placeholder="Describe what’s bothering you…"
                    />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <SelectField
                        name="visitType"
                        label="Appointment type"
                        value={formData.visitType}
                        handleInputChange={handleInputChange}
                        options={VISIT_TYPES}
                    />

                    <div>
                        <div className="flex justify-between items-center mb-1">
                            <label className="block text-xs font-medium text-slate-500">Specialization</label>
                        </div>

                        <select
                            name="specialization"
                            value={formData.specialization}
                            onChange={handleInputChange}
                            className={`w-full rounded-xl border p-2.5 text-sm text-slate-900 outline-none cursor-pointer transition ${aiReport?.ai_recommended_specializations.includes(formData.specialization)
                                ? 'border-green-500 ring-1 ring-green-200 bg-green-50/10'
                                : formData.specialization
                                    ? 'border-blue-500 ring-1 ring-blue-100 bg-blue-50/20'
                                    : 'border-slate-200 bg-white'
                                }`
                            }
                        >
                            <option value="">-- Select a specialization --</option>

                            {recommendedSpecializations.length > 0 && (
                                <optgroup label="⭐ AI Recommended" className="text-green-700 font-semibold bg-green-50">
                                    {recommendedSpecializations.map(specialization => (
                                        <option key={specialization} value={specialization} className="text-slate-900 bg-white">
                                            {specialization} ⭐
                                        </option>
                                    ))}
                                </optgroup>
                            )}

                            <optgroup label="Other specializations">
                                {othersSpecializations.map(specialization => (
                                    <option key={specialization} value={specialization}>
                                        {specialization}
                                    </option>
                                ))}
                            </optgroup>

                        </select>
                    </div>
                </div>
            </div>
        </section>
    );

};

const SelectField = ({ name, label, value, handleInputChange, options }: any) => (
    <div>
        <label className="block text-xs font-medium text-slate-500 mb-1">{label}</label>
        <select
            name={name}
            value={value}
            onChange={handleInputChange}
            className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-sm text-slate-900 focus:border-blue-500 outline-none cursor-pointer"
        >
            {options.map((opt: string) => <option key={opt} value={opt}>{opt}</option>)}
        </select>
    </div>
);


interface LocationSectionProps {
    formData: FormDataState;
    setFormData: any;
    doctors: Doctor[];
}

const LocationAndDoctorSection = ({
    formData, setFormData, doctors,
}: LocationSectionProps) => {
    return (
        <section className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 relative">
            <FormGroupHeader
                icon={MapPin}
                title="Where and who?"
            />

            <div className="space-y-4">
                <div className="relative">
                    <label className="block text-xs font-medium text-slate-500 mb-1">Location</label>
                    <LocationAutocomplete
                        selectedLocationId={formData.locationId}
                        onSelect={(location) => {
                            setFormData((prev: FormDataState) => ({
                                ...prev,
                                locationId: location.id,
                                doctorId: '',
                                selectedSlotId: null,
                                selectedSlotTime: null
                            }));
                        }}
                        onClear={() => {
                            setFormData((prev: FormDataState) => ({
                                ...prev,
                                locationId: '',
                            }));
                        }}
                    />
                </div>


                <div className={`transition-opacity duration-300 ${formData.locationId ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
                    <label className="block text-xs font-medium text-slate-500 mb-2">Available doctors</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {doctors.length > 0 ? doctors.map((doctor: Doctor) => (
                            <div
                                key={doctor.id}
                                onClick={() => setFormData((prev: FormDataState) => ({
                                    ...prev,
                                    doctorId: doctor.id,
                                    selectedSlotId: null,
                                    selectedSlotTime: null
                                }))}
                                className={`cursor-pointer rounded-xl border p-3 flex items-center gap-3 transition ${formData.doctorId === doctor.id
                                    ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-200'
                                    : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50'
                                    }`}
                            >
                                <div className="h-10 w-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-500">
                                    <User className="h-5 w-5" />
                                </div>
                                <div>
                                    <div className="text-sm font-semibold text-slate-900">Dr {doctor.profiles.first_name} {doctor.profiles.last_name}</div>
                                    <div className="text-xs text-slate-500">{doctor.specialization}</div>
                                </div>
                            </div>
                        )) : (
                            <div className="col-span-2 text-center text-sm text-slate-400 py-4 border border-dashed rounded-xl">
                                No doctors match the selected criteria.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
};



interface TimeSlotProps {
    formData: FormDataState;
    setFormData: React.Dispatch<React.SetStateAction<FormDataState>>;
    slots: AvailabilityDB[];
}

const TimeSlotSection = ({ formData, setFormData, slots }: TimeSlotProps) => {
    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const date = e.target.value;
        setFormData(prev => ({
            ...prev,
            selectedDate: date,
            selectedSlotId: null,
            selectedSlotTime: null
        }));
    };

    return (
        <section className={`bg-white rounded-3xl p-6 shadow-sm border border-slate-100 transition-all ${formData.doctorId ? 'opacity-100' : 'opacity-50 pointer-events-none grayscale'}`}>
            <div className="flex items-center gap-2 mb-4 text-slate-800">
                <Calendar className="h-5 w-5 text-blue-500" />
                <h2 className="font-semibold text-lg">Date</h2>
            </div>

            <label className="block text-xs font-medium text-slate-500 mb-2">Select a day</label>
            <input
                type="date"
                name="selectedDate"
                onChange={handleDateChange}
                value={formData.selectedDate}
                className="w-full rounded-xl border border-slate-200 p-2.5 text-sm text-slate-900 mb-4"
                min={new Date().toISOString().split('T')[0]}
            />

            <label className="block text-xs font-medium text-slate-500 mb-2">Available times</label>
            <div className="grid grid-cols-2 gap-2">
                {slots.length > 0 ? slots.map((slot: AvailabilityDB, i: number) => {
                    const time = new Date(slot.start_time).toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" })
                    const isSelected = formData.selectedSlotId === slot.id;

                    return (
                        <button
                            key={i}
                            onClick={() => setFormData(p => ({
                                ...p,
                                selectedSlotId: slot.id,
                                selectedSlotTime: slot.start_time
                            }))}
                            className={`py-2 px-3 rounded-lg text-xs font-medium transition ${isSelected
                                ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
                                : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-100'
                                }`}
                        >
                            {time}
                        </button>
                    )
                }) : (
                    <div className="col-span-2 text-xs text-slate-400 text-center py-2">Select a doctor to see available times</div>
                )}
            </div>
        </section>
    )
};



const BookingSummary = ({ formData, isFormComplete, onSubmit }: any) => (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 sticky top-4">
        <h3 className="font-semibold text-slate-900 mb-4">Summary</h3>

        <div className="space-y-3 text-sm text-slate-600 mb-6">
            <SummaryRow label="Patient" value={`${formData.firstName} ${formData.lastName}`} />
            <SummaryRow label="Doctor" value={formData.doctorId ? 'Selected' : '-'} />
            <SummaryRow
                label="Date"
                value={formData.selectedSlotTime ? new Date(formData.selectedSlotTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
            />
        </div>

        <button
            onClick={onSubmit}
            disabled={!isFormComplete}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 py-3.5 text-white font-medium shadow-lg shadow-blue-600/20 hover:bg-blue-700 hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
        >
            <CheckCircle className="h-5 w-5" />
            Confirm & Book
        </button>

        <div className="mt-3 flex items-center justify-center gap-1.5 text-[10px] text-slate-400">
            <AlertCircle className="h-3 w-3" />
            <span>Your data will be securely saved</span>
        </div>
    </div>
);

const SummaryRow = ({ label, value }: { label: string, value: string }) => (
    <div className="flex justify-between">
        <span>{label}:</span>
        <span className="font-medium text-slate-900">{value}</span>
    </div>
);
