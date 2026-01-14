"use client";

import { useAuth } from "@/hooks/useAuth";
import { ArrowLeft, Lock, Mail, Stethoscope } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";

const loginSchema = z.object({
  email: z.email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

const resetPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export default function LoginScreen() {
  const { logIn, resetPassword, isLoading } = useAuth();
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
  });

  const resetForm = useForm<z.infer<typeof resetPasswordSchema>>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onSubmitLogin = async (data: z.infer<typeof loginSchema>) => {
    await logIn(data);
  };

  const onSubmitReset = async (data: z.infer<typeof resetPasswordSchema>) => {
    try {
      await resetPassword(data.email);
      toast.success(
        "Check your email for password reset instructions. If you don't see it, check your spam folder."
      );
      setShowForgotPassword(false);
      resetForm.reset();
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Error sending reset email. Please try again.";
      toast.error(errorMessage);
    }
  };

  if (showForgotPassword) {
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
            Forgot your password?
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Enter your email address and we&apos;ll send you a link to reset
            your password.
          </p>
        </div>

        <form
          className="space-y-5"
          onSubmit={resetForm.handleSubmit(onSubmitReset)}
        >
          <div>
            <label
              className="text-sm font-medium text-slate-600"
              htmlFor="resetEmail"
            >
              Email
            </label>
            <div className="relative mt-2">
              <Mail className="absolute left-4 top-3 h-5 w-5 text-slate-400" />
              <input
                id="resetEmail"
                type="email"
                {...resetForm.register("email")}
                placeholder="your@email.com"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-11 py-3 text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white"
              />
            </div>
            {resetForm.formState.errors.email && (
              <p className="mt-1 text-sm text-red-600">
                {resetForm.formState.errors.email.message}
              </p>
            )}
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => {
                setShowForgotPassword(false);
                resetForm.reset();
              }}
              className="flex-1 rounded-2xl border border-slate-200 py-3 text-base font-semibold text-slate-600 transition hover:bg-slate-50"
            >
              <div className="flex items-center justify-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back
              </div>
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 rounded-2xl bg-blue-600 py-3 text-base font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Sending..." : "Send Reset Link"}
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-xl rounded-3xl bg-white/95 p-8 shadow-2xl shadow-blue-100 ring-1 ring-slate-100">
      <div className="mb-8 flex flex-col items-center text-center">
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-blue-600">
          <Stethoscope className="h-8 w-8" />
        </div>
        <p className="text-sm uppercase tracking-widest text-blue-500">Login</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-900">
          Welcome in medical system BestChoose
        </h1>
      </div>

      <form
        className="space-y-5"
        onSubmit={loginForm.handleSubmit(onSubmitLogin)}
      >
        <div>
          <label className="text-sm font-medium text-slate-600" htmlFor="email">
            Email
          </label>
          <div className="relative mt-2">
            <Mail className="absolute left-4 top-3 h-5 w-5 text-slate-400" />
            <input
              id="email"
              type="email"
              {...loginForm.register("email")}
              placeholder="your@email.com"
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-11 py-3 text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white"
            />
          </div>
          {loginForm.formState.errors.email && (
            <p className="mt-1 text-sm text-red-600">
              {loginForm.formState.errors.email.message}
            </p>
          )}
        </div>

        <div>
          <label
            className="text-sm font-medium text-slate-600"
            htmlFor="password"
          >
            Password
          </label>
          <div className="relative mt-2">
            <Lock className="absolute left-4 top-3 h-5 w-5 text-slate-400" />
            <input
              id="password"
              type="password"
              {...loginForm.register("password")}
              placeholder="••••••••"
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-11 py-3 text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white"
            />
          </div>
          {loginForm.formState.errors.password && (
            <p className="mt-1 text-sm text-red-600">
              {loginForm.formState.errors.password.message}
            </p>
          )}
          <div className="flex justify-between">
            <button
              type="button"
              onClick={() => setShowForgotPassword(true)}
              className="mt-2 inline-block text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              Forgot password?
            </button>
            <Link
              href={"/register"}
              className="mt-2 inline-block text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              Register
            </Link>
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full rounded-2xl bg-blue-600 py-3 text-base font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? "Logging in..." : "Log in"}
        </button>
      </form>
    </div>
  );
}
