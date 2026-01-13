
export const patientPortalData = {
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
      targetView: "visits",
    },
    {
      label: "Consultation History",
      description: "Return to previous AI conversations raports",
      targetView: "history",
    },
  ],
};

export const patientInterview = {
  title: "AI Medical Assistant",
  subtitle: "Medical Interview",
  initialMessages: [
    {
      id: "msg-1",
      author: "ai" as const,
      text: "Hello! I am an AI medical assistant. Please tell me what concerns you? What are your symptoms?",
      time: "14:28",
    },
  ],
  inputPlaceholder: "Describe your symptoms...",
};
