export interface QuickActionItem {
  label: string;
  description: string;
  targetView: string;
}

export interface PortalData {
  quickActions: QuickActionItem[];
  aiCard?: { 
    label: string;
    title: string;
    description: string;
    buttonText: string;
  };
}

export const patientPortalData: PortalData = {
  aiCard: {
    label: "AI Medical Assistant",
    title: "Begin a New Consultation",
    description: "Describe your symptoms, and our AI assistant will conduct a medical consultation and help schedule an appointment with the appropriate specialist.",
    buttonText: "Begin a New Consultation"
  },
  quickActions: [
    {
      label: "My Appointments",
      description: "Browse all appointments",
      targetView: "appointments",
    },
    {
      label: "Consultation History",
      description: "Return to previous AI conversations raports",
      targetView: "history",
    },
  ],
};

export const doctorPortalData: PortalData = {
  quickActions: [
    {
      label: "Consultations",
      description: "Browse all patient visits",
      targetView: "consultations",
    },
    {
      label: "Manage Availability",
      description: "Define your schedule and open up slots for patient bookings",
      targetView: "availability",
    }
  ],
}

export const patientInterview = {
  title: "AI Medical Assistant",
  subtitle: "Medical Interview",
  inputPlaceholder: "Describe your symptoms...",
};