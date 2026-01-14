import { useCallback, useEffect } from "react";
import { useAdmin } from "@/hooks/useAdmin";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";

type DoctorWithProfile = {
  id: string;
  specialization: string | null;
  work_start_date: string | null;
  profile?: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    role: string | null;
  };
};

const updateDoctorSchema = z.object({
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  specialization: z.string().min(1, "Specialization is required"),
  work_start_date: z.string().optional(),
});

export function UpdateDoctor({
  doctor,
  isLoading: isLoadingDoctor,
}: {
  doctor: DoctorWithProfile | null;
  isLoading: boolean;
}) {
  const router = useRouter();
  const onClick = useCallback(() => {
    router.refresh();
    router.push("/admin");
  }, [router]);
  const { updateDoctor, isLoading: isUpdating } = useAdmin();

  const isLoading = isLoadingDoctor || isUpdating;

  const form = useForm<z.infer<typeof updateDoctorSchema>>({
    resolver: zodResolver(updateDoctorSchema),
    defaultValues: {
      first_name: doctor?.profile?.first_name ?? "",
      last_name: doctor?.profile?.last_name ?? "",
      specialization: doctor?.specialization ?? "",
      work_start_date: doctor?.work_start_date ?? "",
    },
  });

  useEffect(() => {
    if (doctor && !isLoadingDoctor) {
      const formData = {
        first_name: doctor.profile?.first_name ?? "",
        last_name: doctor.profile?.last_name ?? "",
        specialization: doctor.specialization ?? "",
        work_start_date: doctor.work_start_date ?? "",
      };
      form.reset(formData);
    }
  }, [doctor, isLoadingDoctor, form]);

  const handleSubmit = async (data: z.infer<typeof updateDoctorSchema>) => {
    if (!doctor) return;

    const success = await updateDoctor(doctor.id, {
      first_name: data.first_name,
      last_name: data.last_name,
      specialization: data.specialization,
      work_start_date: data.work_start_date || "",
    });

    if (success) {
      toast.success("Doctor information has been updated!");
      onClick();
    } else {
      toast.error("Failed to update doctor information");
    }
  };

  return (
    <section className="w-full space-y-6">
      <div className="mx-auto max-w-2xl rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-100">
        <h2 className="mb-6 text-lg font-semibold text-slate-900">
          Edit Doctor Information
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
              <Controller
                name="first_name"
                control={form.control}
                render={({ field }) => (
                  <input
                    id="firstName"
                    type="text"
                    {...field}
                    disabled={isLoadingDoctor}
                    placeholder={
                      isLoadingDoctor ? "Loading doctor data..." : ""
                    }
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                )}
              />
              {form.formState.errors.first_name && (
                <p className="mt-1 text-sm text-red-600">
                  {form.formState.errors.first_name.message}
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
              <Controller
                name="last_name"
                control={form.control}
                render={({ field }) => (
                  <input
                    id="lastName"
                    type="text"
                    {...field}
                    disabled={isLoadingDoctor}
                    placeholder={
                      isLoadingDoctor ? "Loading doctor data..." : ""
                    }
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                )}
              />
              {form.formState.errors.last_name && (
                <p className="mt-1 text-sm text-red-600">
                  {form.formState.errors.last_name.message}
                </p>
              )}
            </div>
          </div>

          <div>
            <label
              htmlFor="specialization"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Specialization <span className="text-red-500">*</span>
            </label>
            <Controller
              name="specialization"
              control={form.control}
              render={({ field }) => (
                <input
                  id="specialization"
                  type="text"
                  {...field}
                  disabled={isLoadingDoctor}
                  placeholder={isLoadingDoctor ? "Loading doctor data..." : ""}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                />
              )}
            />
            {form.formState.errors.specialization && (
              <p className="mt-1 text-sm text-red-600">
                {form.formState.errors.specialization.message}
              </p>
            )}
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label
                htmlFor="workStartDate"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Work Start Date
              </label>
              <Controller
                name="work_start_date"
                control={form.control}
                render={({ field }) => (
                  <input
                    id="workStartDate"
                    type="date"
                    {...field}
                    disabled={isLoadingDoctor}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                )}
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 rounded-2xl bg-blue-600 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Saving..." : "Save Doctor"}
            </button>
            <button
              type="button"
              onClick={onClick}
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
