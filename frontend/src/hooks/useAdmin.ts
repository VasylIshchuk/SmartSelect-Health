"use client";

import { useCallback, useState } from "react";
import {
  createDoctorAction,
  deleteDoctorAction,
  getDoctorsAction,
  updateDoctorAction,
  getVisitsAction,
  getReportsAction,
} from "@/actions/admin";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { logError } from "@/lib/logger";
import { DoctorInsertData } from "@/types/admin";



export const useAdmin = () => {
  const [isLoading, setIsLoading] = useState(false);

  const addDoctor = useCallback(async (newDoctor: DoctorInsertData) => {
    setIsLoading(true);
    try {
      const result = await createDoctorAction(newDoctor);
      if (!result.success) throw new Error(result.error);
      toast.success("Doctor successfully added!");
    } catch (error: any) {
      toast.error(`Error creating doctor: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const deleteDoctor = useCallback(async (doctorId: string) => {
    setIsLoading(true);
    try {
      const result = await deleteDoctorAction(doctorId);
      if (!result.success) throw new Error(result.error);
      toast.success("Doctor deleted successfully");
    } catch (error: any) {
      toast.error(`Error deleting doctor: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getDoctors = useCallback(async (searchQuery: string = "") => {
    setIsLoading(true);
    try {
      const result = await getDoctorsAction(searchQuery);
      return result.data;
    } catch (error) {
      logError("Failed to fetch doctors:", error);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateDoctor = useCallback(async (doctorId: string, updates: any) => {
    setIsLoading(true);
    try {
      const result = await updateDoctorAction(doctorId, updates);
      if (!result.success) throw new Error(result.error);
      return true;
    } catch (error) {
      logError("Update failed", error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getDoctorById = useCallback(async (doctorId: string) => {
    try {
      setIsLoading(true);
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", doctorId)
        .single();

      if (!profile) return null;

      const { data: doctor } = await supabase
        .from("doctors")
        .select("*")
        .eq("id", doctorId)
        .single();

      return { ...doctor, profile };
    } catch (error) {
      logError("Failed to fetch doctor:", error);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getVisits = useCallback(async (startDate?: Date, endDate?: Date) => {
    try {
      setIsLoading(true);
      const startStr = startDate?.toISOString();
      const endStr = endDate?.toISOString();

      const result = await getVisitsAction(startStr, endStr);

      if (!result.success) {
        console.error(result.error);
        return [];
      }
      return result.data;
    } catch (error) {
      logError("Failed to fetch appointments:", error);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getReports = useCallback(async (startDate?: Date, endDate?: Date) => {
    try {
      setIsLoading(true);
      const startStr = startDate?.toISOString();
      const endStr = endDate?.toISOString();

      const result = await getReportsAction(startStr, endStr);

      if (!result.success) {
        console.error(result.error);
        return [];
      }
      return result.data;
    } catch (error) {
      logError("Failed to fetch reports:", error);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    addDoctor,
    deleteDoctor,
    getDoctors,
    getDoctorById,
    updateDoctor,
    getVisits,
    getReports,
    isLoading,
  };
};