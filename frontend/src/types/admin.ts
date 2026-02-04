export interface Doctor {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  specialization: string;
  work_start_date: string;
  password?: string;
}

export interface DoctorInsertData {
  first_name: string;
  last_name: string;
  email: string;
  specialization: string;
  work_start_date: string;
  password: string;
}