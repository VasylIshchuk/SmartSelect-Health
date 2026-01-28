"use client";

import { useState, useEffect, useRef } from "react";
import { MapPin, Plus } from "lucide-react";
import { Location, useLocation } from "@/hooks/useLocation";
import { useSession } from "../hoc/AuthSessionProvider";

interface LocationAutocompleteProps {
    selectedLocationId?: string;
    initialValue?: string;
    onSelect: (location: Location) => void;
    onAddNew?: () => void;
    onClear?: () => void;
    specialization?: string
}



export const LocationAutocomplete = ({
    selectedLocationId,
    initialValue,
    onSelect,
    onAddNew,
    onClear,
    specialization,
}: LocationAutocompleteProps) => {
    const { session } = useSession()
    const { getLocationsByQueryOrSpecialization } = useLocation(session?.user?.id);

    const [query, setQuery] = useState(initialValue || "");
    const [isOpen, setIsOpen] = useState(false);
    const [locations, setLocations] = useState<Location[]>([])

    const wrapperRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        let isMounted = true;

        const loadData = async () => {
            const data = await getLocationsByQueryOrSpecialization(specialization, query);
            if (isMounted) setLocations(data);
        };

        loadData();
        return () => { isMounted = false; };
    }, [getLocationsByQueryOrSpecialization, query, specialization]);


    useEffect(() => {
        if (document.activeElement === inputRef.current) {
            return;
        }

        if (selectedLocationId && locations.length > 0) {
            const location = locations.find(loc => loc.id === selectedLocationId);

            if (location) {
                updateQuery()
            }
        } else if (!selectedLocationId) {
            if (query !== "") {
                setQuery("");
            }
        }
    }, [selectedLocationId, locations]);


    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);

                if (!selectedLocationId) {
                    setQuery("");
                }
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [selectedLocationId]);



    const updateQuery = () => {
        const location = locations.find(location => location.id === selectedLocationId);

        if (location) {
            const fullName = `${location.name}, ${location.city}, ${location.address}`;
            if (query !== fullName) {
                setQuery(fullName);
            }
        }
    }


    return (
        <div className="relative w-full" ref={wrapperRef}>
            <div className="relative">
                <input
                    ref={inputRef}
                    type="text"
                    placeholder="Start typing a city or name…"
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        setIsOpen(true);
                        if (selectedLocationId && onClear) {
                            onClear();
                        }
                    }}
                    onFocus={() => setIsOpen(true)}
                    className="w-full rounded-xl border border-slate-200 bg-white p-2.5 pl-9 text-sm text-slate-900 focus:border-blue-500 outline-none transition-all"
                />
                <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            </div>

            {isOpen && (
                <div className="absolute z-50 mt-1 w-full rounded-xl border border-slate-100 bg-white shadow-xl max-h-60 overflow-y-auto">
                    {locations.length > 0 ? (
                        locations.map((location) => (
                            <button
                                key={location.id}
                                onClick={() => {
                                    onSelect(location);
                                    setQuery(`${location.name}, ${location.city}, ${location.address}`);
                                    setIsOpen(false);
                                }}
                                className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50 transition group border-b border-slate-50 last:border-0"
                            >
                                <div className="font-medium text-slate-700 group-hover:text-blue-700">
                                    {location.name}
                                </div>
                                <div className="text-xs text-slate-400">
                                    {location.city}, {location.address}
                                </div>
                            </button>
                        ))
                    ) : (
                        <div className="p-3 text-xs text-slate-400 text-center">
                            No locations found.
                        </div>
                    )}

                    {onAddNew && (
                        <button
                            onClick={() => {
                                onAddNew();
                                setIsOpen(false);
                            }}
                            className="w-full text-left px-4 py-3 text-sm bg-blue-50 text-blue-700 hover:bg-blue-100 transition font-medium flex items-center gap-2 sticky bottom-0 border-t border-blue-100"
                        >
                            <Plus className="h-4 w-4" />
                            Add new location
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};