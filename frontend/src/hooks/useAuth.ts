import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export const useAuth = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const register = async ({
    email,
    password,
    first_name,
    last_name,
  }: {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
  }) => {
    try {
      setIsLoading(true);
      const { data: authUser, error: error1 } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { first_name, last_name },
        },
      });

      const { error: error3 } = await supabase.from("profiles").insert({
        id: authUser.user?.id,
        first_name: first_name,
        last_name: last_name,
        role: "patient",
      });
      if (!error1 && !error3) {
        toast.success("Registration successful! Please log in.");
        router.push("/login");
      } else {
        toast.error("User already exists");
      }
    } catch (error) {
      console.error("Registration error:", error);
      toast.error("Registration failed");
    } finally {
      setIsLoading(false);
    }
  };

  const logIn = async ({
    email,
    password,
  }: {
    email: string;
    password: string;
  }) => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      const { data: user } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", data.user?.id)
        .single();

      if (!error && user) {
        if (user.role === "admin") {
          router.push("/admin");
        } else if (user.role === "doctor") {
          router.push("/doctor");
        } else {
          router.push("/patient");
        }
      } else {
        toast.error("Invalid credentials");
      }
    } catch (error) {
      console.error("Login error:", error);
      toast.error("Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  const logOut = async () => {
    try {
      setIsLoading(true);
      await supabase.auth.signOut();
      router.push("/login");
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    try {
      setIsLoading(true);

      if (!email || !email.trim()) {
        throw new Error("Email is required");
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        throw new Error("Please enter a valid email address");
      }

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        if (error.message.includes("rate limit")) {
          throw new Error(
            "Too many requests. Please wait a few minutes before trying again."
          );
        }
        if (
          error.message.includes("not found") ||
          error.message.includes("does not exist")
        ) {
          throw new Error("No account found with this email address.");
        }
        if (error.message.includes("email")) {
          throw new Error("Invalid email address. Please check and try again.");
        }
        throw new Error(
          error.message || "Failed to send reset email. Please try again."
        );
      }
      return true;
    } catch (error) {
      console.error("Password reset error:", error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const updatePassword = async (newPassword: string) => {
    try {
      setIsLoading(true);

      if (!newPassword || newPassword.length < 6) {
        throw new Error("Password must be at least 6 characters long");
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        throw new Error(
          "Your reset link has expired. Please request a new password reset."
        );
      }

      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        if (
          error.message.includes("same") ||
          error.message.includes("identical")
        ) {
          throw new Error(
            "New password must be different from your current password."
          );
        }
        if (
          error.message.includes("weak") ||
          error.message.includes("strength")
        ) {
          throw new Error(
            "Password is too weak. Please choose a stronger password."
          );
        }
        if (
          error.message.includes("session") ||
          error.message.includes("expired")
        ) {
          throw new Error(
            "Your reset link has expired. Please request a new password reset."
          );
        }
        if (error.message.includes("token")) {
          throw new Error(
            "Invalid or expired reset token. Please request a new password reset."
          );
        }
        throw new Error(
          error.message || "Failed to update password. Please try again."
        );
      }
      return true;
    } catch (error) {
      console.error("Password update error:", error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return { register, logIn, logOut, resetPassword, updatePassword, isLoading };
};
