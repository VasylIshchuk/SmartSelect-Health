"use client";

import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/api/supabase";
import { Lock, Stethoscope } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";

const resetPasswordSchema = z
  .object({
    password: z.string().min(6, "Password must be at least 6 characters long"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export default function ResetPasswordPage() {
  const { updatePassword, isLoading } = useAuth();

  const [isSuccess, setIsSuccess] = useState(false);
  const [isValidSession, setIsValidSession] = useState<boolean | null>(null);

  const form = useForm<z.infer<typeof resetPasswordSchema>>({
    resolver: zodResolver(resetPasswordSchema),
  });

  useEffect(() => {
    const checkSession = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          setIsValidSession(false);
          await supabase.auth.signOut();
          if (
            error.message.includes("expired") ||
            error.message.includes("invalid")
          ) {
            toast.error(
              "Your reset link has expired. Please request a new password reset."
            );
          } else {
            toast.error(
              "Invalid reset link. Please request a new password reset."
            );
          }
          return;
        }

        if (session) {
          setIsValidSession(true);
        } else {
          setIsValidSession(false);
          await supabase.auth.signOut();
          toast.error(
            "Invalid or expired reset link. Please request a new password reset."
          );
        }
      } catch {
        setIsValidSession(false);
        await supabase.auth.signOut();
        toast.error(
          "An error occurred while checking your reset link. Please try again."
        );
      }
    };
    checkSession();
  }, []);

  const handleSubmit = async (data: z.infer<typeof resetPasswordSchema>) => {
    if (!isValidSession) {
      toast.error(
        "Invalid or expired reset link. Please request a new password reset."
      );
      return;
    }

    try {
      await updatePassword(data.password);
      await supabase.auth.signOut();
      setIsSuccess(true);
      toast.success("Password has been reset successfully!");
      setTimeout(() => {
        window.location.href = "/login";
      }, 2000);
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Error resetting password. Please try again or request a new reset link.";
      toast.error(errorMessage);
      setIsValidSession(false);
      await supabase.auth.signOut();
    }
  };

  if (isSuccess) {
    return (
      <div className="mx-auto w-full max-w-xl rounded-3xl bg-white/95 p-8 shadow-2xl shadow-blue-100 ring-1 ring-slate-100">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
            <Stethoscope className="h-8 w-8" />
          </div>
          <p className="text-sm uppercase tracking-widest text-emerald-500">
            Success
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-900">
            Password Reset Successful
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Your password has been reset. Redirecting to login...
          </p>
        </div>
      </div>
    );
  }

  if (isValidSession === null) {
    return (
      <div className="mx-auto w-full max-w-xl rounded-3xl bg-white/95 p-8 shadow-2xl shadow-blue-100 ring-1 ring-slate-100">
        <div className="mb-8 flex flex-col items-center text-center">
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isValidSession) {
    return (
      <div className="mx-auto w-full max-w-xl rounded-3xl bg-white/95 p-8 shadow-2xl shadow-blue-100 ring-1 ring-slate-100">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-red-600">
            <Lock className="h-8 w-8" />
          </div>
          <p className="text-sm uppercase tracking-widest text-red-500">
            Error
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-900">
            Invalid Reset Link
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            This password reset link is invalid or has expired.
          </p>
          <Link
            href={"/login"}
            className="mt-6 inline-block rounded-2xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            Back to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-xl rounded-3xl bg-white/95 p-8 shadow-2xl shadow-blue-100 ring-1 ring-slate-100">
      <div className="mb-8 flex flex-col items-center text-center">
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-blue-600">
          <Lock className="h-8 w-8" />
        </div>
        <p className="text-sm uppercase tracking-widest text-blue-500">
          Reset Password
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-900">
          Set New Password
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Enter your new password below.
        </p>
      </div>

      <form className="space-y-5" onSubmit={form.handleSubmit(handleSubmit)}>
        <div>
          <label
            className="text-sm font-medium text-slate-600"
            htmlFor="password"
          >
            New Password
          </label>
          <div className="relative mt-2">
            <Lock className="absolute left-4 top-3 h-5 w-5 text-slate-400" />
            <input
              id="password"
              type="password"
              {...form.register("password")}
              placeholder="••••••••"
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-11 py-3 text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white"
            />
          </div>
          {form.formState.errors.password && (
            <p className="mt-1 text-sm text-red-600">
              {form.formState.errors.password.message}
            </p>
          )}
        </div>

        <div>
          <label
            className="text-sm font-medium text-slate-600"
            htmlFor="confirmPassword"
          >
            Confirm Password
          </label>
          <div className="relative mt-2">
            <Lock className="absolute left-4 top-3 h-5 w-5 text-slate-400" />
            <input
              id="confirmPassword"
              type="password"
              {...form.register("confirmPassword")}
              placeholder="••••••••"
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-11 py-3 text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white"
            />
          </div>
          {form.formState.errors.confirmPassword && (
            <p className="mt-1 text-sm text-red-600">
              {form.formState.errors.confirmPassword.message}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full rounded-2xl bg-blue-600 py-3 text-base font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? "Resetting..." : "Reset Password"}
        </button>

        <div className="text-center">
          <Link
            href={"/login"}
            className="text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            Back to Login
          </Link>
        </div>
      </form>
    </div>
  );
}
