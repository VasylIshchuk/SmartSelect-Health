import { Visit } from "./Visit";

export type Patient = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  visits: Visit[];
} | null;
