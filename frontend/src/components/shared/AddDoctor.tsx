import { useAdmin } from "@/hooks/useAdmin";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState, useMemo, useRef, useEffect } from "react";
import { Search, ChevronDown } from "lucide-react";

const MEDICAL_SPECIALIZATIONS = [
  "Allergy and Immunology",
  "Anesthesiology",
  "Cardiology",
  "Cardiothoracic Surgery",
  "Critical Care Medicine",
  "Dermatology",
  "Emergency Medicine",
  "Endocrinology",
  "Family Medicine",
  "Forensic Medicine",
  "Gastroenterology",
  "General Surgery",
  "Geriatrics",
  "Hematology",
  "Infectious Disease",
  "Internal Medicine",
  "Medical Genetics",
  "Nephrology",
  "Neurology",
  "Neurosurgery",
  "Nuclear Medicine",
  "Obstetrics and Gynecology",
  "Oncology",
  "Ophthalmology",
  "Orthopedic Surgery",
  "Orthopedics",
  "Otolaryngology",
  "Pathology",
  "Pediatric Cardiology",
  "Pediatric Surgery",
  "Pediatrics",
  "Physical Medicine and Rehabilitation",
  "Plastic Surgery",
  "Preventive Medicine",
  "Psychiatry",
  "Pulmonology",
  "Radiation Oncology",
  "Radiology",
  "Rheumatology",
  "Sports Medicine",
  "Surgery",
  "Thoracic Surgery",
  "Transplant Surgery",
  "Trauma Surgery",
  "Urology",
  "Vascular Surgery",
];

const addDoctorSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.email("Invalid email address"),
  specialization: z
    .string()
    .min(1, "Specialization is required")
    .refine(
      (val) => MEDICAL_SPECIALIZATIONS.includes(val),
      "Please select a specialization from the list"
    ),
  workStartDate: z.string().optional(),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export function AddDoctor({
  onBack,
  onCancel,
}: {
  onBack: () => void;
  onCancel: () => void;
}) {
  const { addDoctor, isLoading } = useAdmin();
  const [searchQuery, setSearchQuery] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const form = useForm<z.infer<typeof addDoctorSchema>>({
    resolver: zodResolver(addDoctorSchema),
  });

  const filteredSpecializations = useMemo(() => {
    if (!searchQuery.trim()) {
      return MEDICAL_SPECIALIZATIONS;
    }
    const query = searchQuery.toLowerCase();
    return MEDICAL_SPECIALIZATIONS.filter((spec) =>
      spec.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  const handleSubmit = async (data: z.infer<typeof addDoctorSchema>) => {
    await addDoctor({
      first_name: data.firstName,
      last_name: data.lastName,
      email: data.email,
      specialization: data.specialization,
      work_start_date: data.workStartDate || "",
      password: data.password,
    });

    onBack();
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <section className="w-full space-y-6">
      <div className="mx-auto max-w-2xl rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-100">
        <h2 className="mb-6 text-lg font-semibold text-slate-900">
          Fill neccesary fields for new doctor
        </h2>

        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label
                htmlFor="firstName"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                First Name <span className="text-red-500">*</span>
              </label>
              <input
                id="firstName"
                type="text"
                {...form.register("firstName")}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white"
              />
              {form.formState.errors.firstName && (
                <p className="mt-1 text-sm text-red-600">
                  {form.formState.errors.firstName.message}
                </p>
              )}
            </div>
            <div>
              <label
                htmlFor="lastName"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Last Name <span className="text-red-500">*</span>
              </label>
              <input
                id="lastName"
                type="text"
                {...form.register("lastName")}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white"
              />
              {form.formState.errors.lastName && (
                <p className="mt-1 text-sm text-red-600">
                  {form.formState.errors.lastName.message}
                </p>
              )}
            </div>
          </div>

          <div>
            <label
              htmlFor="email"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Email <span className="text-red-500">*</span>
            </label>
            <input
              id="email"
              type="email"
              {...form.register("email")}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white"
            />
            {form.formState.errors.email && (
              <p className="mt-1 text-sm text-red-600">
                {form.formState.errors.email.message}
              </p>
            )}
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="relative" ref={dropdownRef}>
              <label
                htmlFor="specialization"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Specialization <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <Search className="h-5 w-5" />
                </div>
                <Controller
                  name="specialization"
                  control={form.control}
                  render={({ field }) => (
                    <>
                      <input
                        id="specialization"
                        type="text"
                        value={searchQuery || field.value || ""}
                        onChange={(e) => {
                          setSearchQuery(e.target.value);
                          if (!isDropdownOpen) {
                            setIsDropdownOpen(true);
                          }
                          field.onChange(e.target.value);
                        }}
                        onFocus={() => setIsDropdownOpen(true)}
                        placeholder="Select specialization..."
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-10 py-3 text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white"
                      />
                      <button
                        type="button"
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                      >
                        <ChevronDown
                          className={`h-5 w-5 transition-transform ${
                            isDropdownOpen ? "rotate-180" : ""
                          }`}
                        />
                      </button>
                    </>
                  )}
                />
                {isDropdownOpen && filteredSpecializations.length > 0 && (
                  <div className="absolute z-10 mt-1 w-full max-h-60 overflow-auto rounded-xl border border-slate-200 bg-white shadow-lg">
                    {filteredSpecializations.map((spec) => (
                      <button
                        key={spec}
                        type="button"
                        onClick={() => {
                          form.setValue("specialization", spec);
                          setSearchQuery(spec);
                          setIsDropdownOpen(false);
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-blue-50 transition-colors"
                      >
                        {spec}
                      </button>
                    ))}
                  </div>
                )}
                {isDropdownOpen &&
                  searchQuery.trim() &&
                  filteredSpecializations.length === 0 && (
                    <div className="absolute z-10 mt-1 w-full rounded-xl border border-slate-200 bg-white shadow-lg p-4 text-sm text-slate-500">
                      No specializations found. Please select from the list.
                    </div>
                  )}
              </div>
              {form.formState.errors.specialization && (
                <p className="mt-1 text-sm text-red-600">
                  {form.formState.errors.specialization.message}
                </p>
              )}
            </div>
            <div>
              <label
                htmlFor="workStartDate"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Work start date
              </label>
              <input
                id="workStartDate"
                type="date"
                {...form.register("workStartDate")}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Temporary password <span className="text-red-500">*</span>
            </label>
            <input
              id="password"
              type="password"
              {...form.register("password")}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white"
            />
            {form.formState.errors.password && (
              <p className="mt-1 text-sm text-red-600">
                {form.formState.errors.password.message}
              </p>
            )}
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 rounded-2xl bg-blue-600 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Adding..." : "Add new doctor"}
            </button>
            <button
              type="button"
              onClick={onCancel}
              disabled={isLoading}
              className="rounded-2xl border border-slate-200 px-6 py-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
