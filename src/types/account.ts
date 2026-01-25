
export type Role = "patient" | "doctor" | "admin";

export type Account = {
  role: Role;
  email: string;
  password: string;
  name: string;
  subtitle: string;
};