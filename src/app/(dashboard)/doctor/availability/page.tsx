"use client";

import { useState } from "react";
import { Calendar as CalendarIcon, MapPin, Plus, Save, Copy, Trash2, Clock, Wand2, AlertCircle, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { AvailabilityUI } from "@/hooks/useAvailability";
import { useSession } from "@/components/hoc/AuthSessionProvider";
import { useLocation, Location } from "@/hooks/useLocation";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { useAvailabilityManager } from "@/hooks/useAvailabilityManager";
import { LocationAutocomplete } from "@/components/dashboards/LocationAutocomplete";
import { Spinner } from "@/components/shared/Spinner";
import { addDays, format } from "date-fns";


export default function ManageAvailabilityPage() {
    const router = useRouter();

    const { session } = useSession()
    const userId = session?.user?.id

    const manager = useAvailabilityManager(userId);

    const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
    const [isCopyModalOpen, setIsCopyModalOpen] = useState(false);


    return (
        <div className="mx-auto max-w-7xl p-6 font-sans text-slate-900">
            <SectionHeader
                title="Manage Availability"
                subtitle="Define your schedule and open up slots for patient bookings"
                onBack={() => router.back()}
            />

            <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">

                <div className="lg:col-span-4 space-y-6">
                    <DatePickerCard
                        selectedDate={manager.selectedDate}
                        setSelectedDate={manager.setSelectedDate}
                        setIsCopyModalOpen={setIsCopyModalOpen}
                    />
                    <SummaryCard slots={manager.slots} />
                </div>

                <div className="lg:col-span-8 space-y-6">

                    <AvailabilityToolbar
                        onAddSlot={manager.addSingleSlot}
                        onGenerateSlots={manager.generateMagicSlots}
                        onSave={manager.saveChanges}
                        isSaving={manager.isSaving}
                        hasConflicts={manager.hasConflicts}
                        hasSlots={manager.slots.length > 0}
                        hasMissingFields={manager.hasMissingFields}
                    />

                    <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-visible min-h-[400px]">
                        {manager.isLoading ? (
                            <Spinner />
                        ) : manager.slots.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-4">
                                <div className="h-16 w-16 rounded-full bg-slate-50 flex items-center justify-center">
                                    <CalendarIcon className="h-8 w-8 text-slate-300" />
                                </div>
                                <div className="text-center">
                                    <p className="text-lg font-medium text-slate-900">No slots defined</p>
                                    <p className="text-sm">Click "Add Slot" to start planning for {manager.selectedDate}.</p>
                                </div>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-100">
                                <div className="grid grid-cols-12 gap-4 bg-slate-50/50 px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400">
                                    <div className="col-span-3">Start</div>
                                    <div className="col-span-3">End</div>
                                    <div className="col-span-4">Location</div>
                                    <div className="col-span-2"></div>
                                </div>

                                {manager.slots.map((slot) => (
                                    <SlotRow
                                        key={slot.id}
                                        slot={slot}
                                        locations={manager.locations}
                                        onUpdate={manager.updateSlotField}
                                        onRemove={manager.removeSlot}
                                        onNewLocation={() => setIsLocationModalOpen(true)}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {isLocationModalOpen && (
                <ModalAddLocation
                    userId={userId}
                    onClose={() => setIsLocationModalOpen(false)}
                    onLocationAdded={(newLocation) => {
                        manager.setLocations([...manager.locations, newLocation]);
                    }}
                />
            )}

            {isCopyModalOpen && (
                <ModalCopySchedule
                    onClose={() => setIsCopyModalOpen(false)}
                    onCopy={manager.copyScheduleToDates}
                />
            )}

        </div>
    );
}




export const parseTimeForDate = (timeStr: string, dateBaseStr: string): Date => {
    if (!timeStr) return new Date();
    const [hours, minutes] = timeStr.split(':').map(Number);
    const date = new Date(dateBaseStr);
    date.setHours(hours, minutes, 0, 0);
    return date;
};



type DatePickerCardProps = {
    selectedDate: string,
    setSelectedDate: (date: string) => void
    setIsCopyModalOpen: (isOpen: boolean) => void
}

const DatePickerCard = ({ selectedDate, setSelectedDate, setIsCopyModalOpen }: DatePickerCardProps) => {
    return (
        <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm" >
            <label className="mb-3 block text-sm font-semibold text-slate-700">Select Date</label>
            <div className="relative">
                <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 pl-11 text-sm font-medium outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                />
                <CalendarIcon className="absolute left-4 top-3.5 h-5 w-5 text-slate-400" />
            </div>

            <div className="mt-6 pt-6 border-t border-slate-50">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">Quick Actions</h3>
                <button
                    onClick={() => setIsCopyModalOpen(true)}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-all"
                >
                    <Copy className="h-4 w-4" />
                    Copy Schedule to...
                </button>
            </div>
        </div >
    )
}



const SummaryCard = ({ slots }: { slots: AvailabilityUI[] }) => {
    return (
        <div className="rounded-3xl bg-blue-600 p-6 text-white shadow-md shadow-blue-200">
            <div className="flex items-center gap-2 mb-4 opacity-90">
                <Clock className="h-5 w-5" />
                <span className="font-semibold">Day Summary</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <p className="text-3xl font-bold">{slots.length}</p>
                    <p className="text-xs text-blue-100">Total Slots</p>
                </div>
                <div>
                    <p className="text-3xl font-bold">{new Set(slots.map(slot => slot.location_id)).size}</p>
                    <p className="text-xs text-blue-100">Locations</p>
                </div>
            </div>
        </div>
    )
}


type ToolbarProps = {
    onAddSlot: () => void;
    onGenerateSlots: (endTime: string) => void;
    onSave: () => void;
    isSaving: boolean;
    hasConflicts: boolean;
    hasSlots: boolean;
    hasMissingFields: boolean;
}

const AvailabilityToolbar = ({
    onAddSlot, onGenerateSlots, onSave, isSaving, hasConflicts, hasSlots, hasMissingFields
}: ToolbarProps) => {
    const [workEndTime, setWorkEndTime] = useState("");

    return (
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm sticky top-4 z-10">
            <div className="flex items-center gap-4">

                <button
                    onClick={onAddSlot}
                    className="flex items-center gap-2 rounded-xl bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-600 hover:bg-blue-100 transition-colors"
                >
                    <Plus className="h-4 w-4" />
                    Add Slot
                </button>


                <div className="h-8 w-px bg-slate-200"></div>


                <div className="flex items-center gap-2 rounded-xl bg-purple-50 p-1 pr-2 border border-purple-100">
                    <button
                        onClick={() => onGenerateSlots(workEndTime)}
                        disabled={!workEndTime}
                        title={!workEndTime ? "Set end time first" : "Auto-fill based on last slot duration + 10min break"}
                        className="flex items-center gap-2 rounded-lg bg-white px-3 py-1.5 text-sm font-semibold shadow-sm transition-all 
                                                disabled:opacity-50 disabled:cursor-not-allowed disabled:text-slate-400 
                                                disabled:shadow-none text-purple-700 hover:bg-purple-50"                                >
                        <Wand2 className="h-3.5 w-3.5" />
                        Magic Fill
                    </button>


                    <input
                        type="time"
                        value={workEndTime}
                        placeholder="Set end time"
                        onChange={(e) => setWorkEndTime(e.target.value)}
                        className="bg-transparent text-sm font-bold text-purple-900 outline-none focus:underline cursor-pointer w-26 text-center"
                    />
                </div>
            </div>


            <button
                onClick={onSave}
                disabled={isSaving || !hasSlots || hasConflicts || hasMissingFields}
                title={hasConflicts ? "Fix schedule conflicts first" : "Save changes"}
                className={`flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-slate-200 active:scale-95 transition-all
                                ${hasConflicts
                        ? "bg-red-400 cursor-not-allowed opacity-100"
                        : "bg-slate-900 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
                    }
                            `}
            >
                {isSaving ? (
                    <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Saving...
                    </>
                ) : hasConflicts ? (
                    <>
                        <AlertCircle className="h-4 w-4" />
                        Fix Conflicts
                    </>
                ) : (
                    <>
                        <Save className="h-4 w-4" />
                        Save Changes
                    </>
                )}
            </button>
        </div>
    )
}



interface SlotRowProps {
    slot: AvailabilityUI & { conflictWarning: string | null };
    locations: Location[];
    onUpdate: (id: string, field: keyof AvailabilityUI, value: string) => void;
    onRemove: (id: string) => void;
    onNewLocation: () => void;
}

const SlotRow = ({ slot, locations, onUpdate, onRemove, onNewLocation }: SlotRowProps) => {
    const isLocked = slot.is_booked;

    const locationObj = locations.find(l => l.id === slot.location_id);
    const locationDisplay = locationObj
        ? `${locationObj.name}, ${locationObj.city}, ${locationObj.address}`
        : "";

    return (
        <div className="group grid grid-cols-12 gap-4 items-center px-6 py-4 hover:bg-blue-50/30 transition-colors relative border-b border-slate-100 last:border-0">
            <div className="col-span-3 relative">
                <input
                    type="time"
                    value={slot.start_time}
                    disabled={isLocked}
                    onChange={(e) => onUpdate(slot.id, 'start_time', e.target.value)}
                    className={`w-full rounded-lg border px-3 py-2 text-sm font-medium outline-none transition-all ${slot.conflictWarning ? "border-orange-300 bg-orange-50 text-orange-700" : "border-slate-200 bg-white"
                        }`}
                />
                {slot.conflictWarning && (
                    <div className="absolute -bottom-5 left-0 flex items-center text-[10px] font-bold text-orange-500 whitespace-nowrap z-10">
                        <AlertCircle className="w-3 h-3 mr-1" /> {slot.conflictWarning}
                    </div>
                )}
            </div>

            <div className="col-span-3">
                <input
                    type="time"
                    value={slot.end_time}
                    disabled={isLocked}
                    onChange={(e) => onUpdate(slot.id, 'end_time', e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium outline-none focus:border-blue-500"
                />
            </div>

            <div className="col-span-4 relative">
                {isLocked ? (
                    <div className="relative">
                        <input
                            disabled
                            value={locationDisplay}
                            className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 pl-9 text-sm text-slate-500"
                        />
                        <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    </div>
                ) : (
                    <LocationAutocomplete
                        selectedLocationId={slot.location_id}
                        initialValue={locationDisplay}
                        onSelect={(location) => onUpdate(slot.id, 'location_id', location.id)}
                        onAddNew={onNewLocation}
                        onClear={() => onUpdate(slot.id, 'location_id', '')}
                    />
                )}
            </div>

            <div className="col-span-2 flex justify-end">
                {isLocked ? (
                    <span className="rounded-md bg-red-50 px-2 py-1 text-[10px] font-bold uppercase text-red-600 ring-1 ring-red-100">
                        Booked
                    </span>
                ) : (
                    <button
                        onClick={() => onRemove(slot.id)}
                        className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-500 transition-all"
                    >
                        <Trash2 className="h-4 w-4" />
                    </button>
                )}
            </div>
        </div>
    );
};



type ModalAddLocationProps = {
    userId: string | undefined;
    onClose: () => void;
    onLocationAdded: (location: Location) => void;
}

const ModalAddLocation = ({ userId, onClose, onLocationAdded }: ModalAddLocationProps) => {
    const [newLocation, setNewLocation] = useState<Omit<Location, 'id'>>({
        name: '',
        city: '',
        address: ''
    });
    const { insertLocation } = useLocation(userId);

    const handleAddLocation = async () => {
        if (!newLocation.name || !newLocation.city || !newLocation.address) return;

        const data = await insertLocation(newLocation);

        if (data) {
            onLocationAdded(data);
            setNewLocation({ name: '', city: '', address: '' });
            onClose();
        }
    };
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/20 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl ring-1 ring-slate-100">
                <div className="mb-6">
                    <h2 className="text-xl font-bold text-slate-900">Add New Location</h2>
                    <p className="text-sm text-slate-500">Create a new place where you accept patients.</p>
                </div>

                <div className="space-y-4">
                    <InputLocation
                        title="Location Name"
                        placeholder="e.g. Central Clinic"
                        value={newLocation?.name}
                        onChange={(e) => setNewLocation({ ...newLocation, name: e.target.value })}
                    />
                    <InputLocation
                        title="City"
                        placeholder="e.g. Warsaw"
                        value={newLocation.city}
                        onChange={(e) => setNewLocation({ ...newLocation, city: e.target.value })}
                    />
                    <InputLocation
                        title="Address"
                        placeholder="e.g. Dębinki 7"
                        value={newLocation.address}
                        onChange={(e) => setNewLocation({ ...newLocation, address: e.target.value })}
                    />
                </div>

                <div className="mt-8 flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleAddLocation}
                        className="flex-1 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
                    >
                        Create Location
                    </button>
                </div>
            </div>
        </div>
    )
}

type InputLocationProps = {
    title: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    placeholder?: string;
}

const InputLocation = ({ title, value, onChange, placeholder }: InputLocationProps) => {
    return (
        <div>
            <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                {title}
            </label>
            <input
                type="text"
                placeholder={placeholder}
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                value={value}
                onChange={onChange}
            />
        </div>
    );
};





const ModalCopySchedule = ({ onClose, onCopy }: {
    onClose: () => void,
    onCopy: (dates: string[]) => Promise<boolean | void>,
}) => {
    const [selectedDates, setSelectedDates] = useState<string[]>([]);
    const [isCopying, setIsCopying] = useState(false);

    const availableDates = Array.from({ length: 14 }, (_, i) => {
        const date = addDays(new Date(), i + 1);
        return {
            value: date.toISOString().split('T')[0],
            label: format(date, 'EEE, MMM d'),
            fullLabel: format(date, 'EEEE, MMMM d, yyyy')
        };
    });

    const toggleDate = (dateVal: string) => {
        if (selectedDates.includes(dateVal)) {
            setSelectedDates(prev => prev.filter(d => d !== dateVal));
        } else {
            setSelectedDates(prev => [...prev, dateVal]);
        }
    };

    const handleCopy = async () => {
        if (selectedDates.length === 0) return;

        setIsCopying(true);
        const success = await onCopy(selectedDates);
        setIsCopying(false);

        if (success) onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/20 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-lg rounded-3xl bg-white p-8 shadow-2xl flex flex-col max-h-[90vh]">
                <div className="flex items-center gap-3 mb-6 shrink-0">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                        <Copy className="h-5 w-5" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-slate-900">Copy Schedule</h2>
                        <p className="text-xs text-slate-500">Replicate today's plan to other days</p>
                    </div>
                </div>

                <div className="mb-2 text-xs font-semibold uppercase text-slate-500 tracking-wider">Select Target Dates</div>

                <div className="flex-1 overflow-y-auto pr-2 mb-6 border rounded-xl border-slate-100 bg-slate-50 p-2">
                    <div className="grid grid-cols-2 gap-2">
                        {availableDates.map((item) => {
                            const isSelected = selectedDates.includes(item.value);
                            return (
                                <button
                                    key={item.value}
                                    onClick={() => toggleDate(item.value)}
                                    className={`flex items-center justify-between p-3 rounded-lg text-sm transition-all text-left
                                        ${isSelected
                                            ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
                                            : 'bg-white text-slate-700 hover:bg-blue-50 border border-slate-100'
                                        }`}
                                >
                                    <span className="font-medium">{item.label}</span>
                                    {isSelected && <div className="h-2 w-2 rounded-full bg-white" />}
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="flex justify-end gap-3 shrink-0 pt-4 border-t border-slate-100">
                    <button
                        onClick={onClose}
                        className="rounded-xl px-4 py-2.5 text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors"
                        disabled={isCopying}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleCopy}
                        disabled={selectedDates.length === 0 || isCopying}
                        className="flex items-center gap-2 rounded-xl bg-slate-900 px-6 py-2.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-slate-200 active:scale-95 transition-all"
                    >
                        {isCopying ? (
                            <>
                                <Spinner />
                                Copying...
                            </>
                        ) : (
                            <>
                                Copy to {selectedDates.length > 0 ? `${selectedDates.length} days` : ''}
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};