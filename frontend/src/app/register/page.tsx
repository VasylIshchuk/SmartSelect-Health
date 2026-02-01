"use client";
import { useAuth } from "@/hooks/useAuth";
import { Lock, Mail, Stethoscope, User2Icon } from "lucide-react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const registerSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export default function RegisterScreen() {
  const { register: registerUser, isLoading } = useAuth();

  const form = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmitRegister = async (data: z.infer<typeof registerSchema>) => {
    await registerUser({
      email: data.email,
      password: data.password,
      first_name: data.firstName,
      last_name: data.lastName,
    });
  };
  return (
    <main>
      <div className="mx-auto w-full max-w-xl rounded-3xl bg-white/95 p-8 shadow-2xl shadow-blue-100 ring-1 ring-slate-100 ">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-blue-600">
            <Stethoscope className="h-8 w-8" />
          </div>
          <p className="text-sm uppercase tracking-widest text-blue-500">
            Register
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-900">
            Welcome in medical system SmartSelect Health
          </h1>
        </div>

        <form
          className="space-y-5"
          onSubmit={form.handleSubmit(onSubmitRegister)}
        >
          <div>
            <label
              className="text-sm font-medium text-slate-600"
              htmlFor="firstName"
            >
              First Name
            </label>
            <div className="relative mt-2">
              <User2Icon className="absolute left-4 top-3 h-5 w-5 text-slate-400" />
              <input
                id="firstName"
                type="text"
                {...form.register("firstName")}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-11 py-3 text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white"
              />
            </div>
            {form.formState.errors.firstName && (
              <p className="mt-1 text-sm text-red-600">
                {form.formState.errors.firstName.message}
              </p>
            )}
          </div>
          <div>
            <label
              className="text-sm font-medium text-slate-600"
              htmlFor="lastName"
            >
              Last Name
            </label>
            <div className="relative mt-2">
              <User2Icon className="absolute left-4 top-3 h-5 w-5 text-slate-400" />
              <input
                id="lastName"
                type="text"
                {...form.register("lastName")}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-11 py-3 text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white"
              />
            </div>
            {form.formState.errors.lastName && (
              <p className="mt-1 text-sm text-red-600">
                {form.formState.errors.lastName.message}
              </p>
            )}
          </div>
          <div>
            <label
              className="text-sm font-medium text-slate-600"
              htmlFor="email"
            >
              Email
            </label>
            <div className="relative mt-2">
              <Mail className="absolute left-4 top-3 h-5 w-5 text-slate-400" />
              <input
                id="email"
                type="email"
                {...form.register("email")}
                placeholder="twoj@email.com"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-11 py-3 text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white"
              />
            </div>
            {form.formState.errors.email && (
              <p className="mt-1 text-sm text-red-600">
                {form.formState.errors.email.message}
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

            <Link
              href={"/login"}
              className="mt-2 inline-block text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              Log in
            </Link>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-2xl bg-blue-600 py-3 text-base font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Registering..." : "Register"}
          </button>
        </form>
      </div>
    </main>
  );
}
