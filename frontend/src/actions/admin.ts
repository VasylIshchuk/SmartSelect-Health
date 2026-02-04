"use server";

import { logError } from "@/lib/logger";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { DoctorInsertData } from "@/types/admin";



export async function createDoctorAction(data: DoctorInsertData) {
    try {
        const { data: user, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email: data.email,
            password: data.password,
            email_confirm: true,
            user_metadata: {
                first_name: data.first_name,
                last_name: data.last_name,
            },
        });

        if (authError) throw authError;
        if (!user.user) throw new Error("Failed to create user");

        const { error: profileError } = await supabaseAdmin.from("profiles").insert({
            id: user.user.id,
            first_name: data.first_name,
            last_name: data.last_name,
            role: "doctor",
        });
        if (profileError) throw profileError;

        const { error: doctorError } = await supabaseAdmin.from("doctors").insert({
            id: user.user.id,
            specialization: data.specialization,
            work_start_date: data.work_start_date,
        });
        if (doctorError) throw doctorError;

        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function deleteDoctorAction(doctorId: string) {
    try {
        await supabaseAdmin.from("doctors").delete().eq("id", doctorId);
        await supabaseAdmin.from("profiles").delete().eq("id", doctorId);
        const { error } = await supabaseAdmin.auth.admin.deleteUser(doctorId);

        if (error) throw error;
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function getDoctorsAction(searchQuery: string = "") {
    try {
        const [profilesRes, doctorsRes, authRes] = await Promise.all([
            supabaseAdmin.from("profiles").select("*").eq("role", "doctor"),
            supabaseAdmin.from("doctors").select("*"),
            supabaseAdmin.auth.admin.listUsers()
        ]);

        const profiles = profilesRes.data || [];
        const doctors = doctorsRes.data || [];
        const authUsers = authRes.data?.users || [];

        const merged = profiles.map((profile) => {
            const doctorInfo = doctors.find((d) => d.id === profile.id);
            const user = authUsers.find((u) => u.id === profile.id);

            return {
                id: profile.id,
                first_name: profile.first_name || "",
                last_name: profile.last_name || "",
                email: user?.email || "",
                specialization: doctorInfo?.specialization || null,
                work_start_date: doctorInfo?.work_start_date?.toString() || "",
            };
        });

        let filtered = merged;
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase().trim();
            filtered = merged.filter(
                (d) =>
                    d.first_name?.toLowerCase().includes(query) ||
                    d.last_name?.toLowerCase().includes(query) ||
                    d.specialization?.toLowerCase().includes(query)
            );
            filtered.sort((a, b) => {
                const aName = `${a.first_name} ${a.last_name}`.toLowerCase();
                const bName = `${b.first_name} ${b.last_name}`.toLowerCase();
                return aName.localeCompare(bName);
            });
        } else {
            filtered.sort((a, b) => {
                const aDate = a.work_start_date || "";
                const bDate = b.work_start_date || "";
                return bDate.localeCompare(aDate);
            });
        }

        return { success: true, data: filtered };
    } catch (error: any) {
        logError("Server Action Error:", error);
        return { success: false, data: [] };
    }
}

export async function updateDoctorAction(doctorId: string, updates: any) {
    try {
        if (updates.first_name || updates.last_name) {
            await supabaseAdmin.auth.admin.updateUserById(doctorId, {
                user_metadata: {
                    first_name: updates.first_name,
                    last_name: updates.last_name,
                },
            });

            await supabaseAdmin
                .from("profiles")
                .update({
                    first_name: updates.first_name,
                    last_name: updates.last_name
                })
                .eq("id", doctorId);
        }

        if (updates.specialization || updates.work_start_date) {
            const docUpdates: any = {};
            if (updates.specialization) docUpdates.specialization = updates.specialization;
            if (updates.work_start_date) docUpdates.work_start_date = updates.work_start_date;

            await supabaseAdmin.from("doctors").update(docUpdates).eq("id", doctorId);
        }

        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function getVisitsAction(startDate?: string, endDate?: string) {
    try {
        let query = supabaseAdmin.from("appointments").select(`
            *,
            availability!inner (
                start_time,
                end_time,
                duration,
                location_id
            )
        `);

        if (startDate && endDate) {
            query = query
                .gte("availability.start_time", startDate)
                .lte("availability.start_time", endDate);
        }

        const { data, error } = await query.order("start_time", {
            foreignTable: "availability",
            ascending: true,
        });

        if (error) throw error;
        return { success: true, data: data || [] };
    } catch (error: any) {
        logError("Error fetching appointments:", error);
        return { success: false, error: error.message, data: [] };
    }
}

export async function getReportsAction(startDate?: string, endDate?: string) {
    try {
        let query = supabaseAdmin.from("reports").select("*");

        if (startDate && endDate) {
            query = query
                .gte("created_at", startDate)
                .lte("created_at", endDate);
        }

        const { data, error } = await query.order("created_at", {
            ascending: true,
        });

        if (error) throw error;
        return { success: true, data: data || [] };
    } catch (error: any) {
        logError("Error fetching reports:", error);
        return { success: false, error: error.message, data: [] };
    }
}