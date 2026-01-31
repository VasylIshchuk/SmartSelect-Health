import { useState } from "react";
import { Calendar as Copy, CalendarX } from "lucide-react";
import { useLocation, Location } from "@/hooks/useLocation";
import { Spinner } from "@/components/shared/Spinner";
import { useAvailabilityManager } from "@/hooks/useAvailabilityManager";

type ModalAddLocationProps = {
    userId: string | undefined;
    onClose: () => void;
    onLocationAdded: (location: Location) => void;
}

export const ModalAddLocation = ({ userId, onClose, onLocationAdded }: ModalAddLocationProps) => {
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



type ModalCopyScheduleProps = {
    userId: string | undefined;
    onClose: () => void;
};

export const ModalCopySchedule = ({ userId, onClose }: ModalCopyScheduleProps) => {
    const [selectedDates, setSelectedDates] = useState<string[]>([]);
    const [isCopying, setIsCopying] = useState(false);

    const manager = useAvailabilityManager(userId);

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
        const success = await manager.copyScheduleToDates(selectedDates);
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
                        {manager.availableDates.map((item) => {
                            const isSelected = selectedDates.includes(item.value);
                            const isOccupied = manager.occupiedDates.has(item.value);
                            const isDisabled = isOccupied || manager.isLoading;

                            return (
                                <button
                                    key={item.value}
                                    onClick={() => toggleDate(item.value)}
                                    className={`flex flex-col items-start p-3 rounded-lg text-sm transition-all text-left relative
                                        ${isDisabled
                                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed opacity-70'
                                            : isSelected
                                                ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
                                                : 'bg-white text-slate-700 hover:bg-blue-50 border border-slate-100'
                                        }`}
                                >
                                    <div className="flex w-full justify-between items-center">
                                        <span className="font-medium">{item.label}</span>
                                        {isSelected && !isDisabled && <div className="h-2 w-2 rounded-full bg-white" />}
                                    </div>

                                    {isOccupied && (
                                        <span className="text-[10px] text-red-400 font-medium flex items-center gap-1 mt-1">
                                            <CalendarX className="h-3 w-3" /> Has booked slots
                                        </span>
                                    )}
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