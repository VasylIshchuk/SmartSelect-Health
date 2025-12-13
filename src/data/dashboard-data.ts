import { Doctor } from "@/types/Doctor";

export const patientPortalData = {
  interviewCopy:
    "Describe your symptoms, and our AI assistant will conduct a medical consultation and help schedule an appointment with the appropriate specialist.",
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
  upcomingHighlight: {
    doctor: "Dr Anna Nowak",
    specialization: "Otolaryngologist",
    date: "Tuesday, November 25, 2025",
    time: "10:00",
    status: "Confirmed",
  },
};

export const patientAppointments = {
  upcoming: [
    {
      doctor: "Dr Anna Nowak",
      specialization: "Otolaryngologist",
      date: "Tuesday, November 25, 2025",
      time: "10:00",
      duration: "30 min",
      status: "Confirmed",
      location: "Office 12, ul. Zdrowa 4",
    },
    {
      doctor: "Dr Piotr Wiśniewski",
      specialization: "Internist",
      date: "Wednesday, December 3, 2025",
      time: "09:30",
      duration: "30 min",
      status: "Pending",
      location: "OrtoSport",
    },
  ],
  history: [
    {
      doctor: "Dr Maria Nowak",
      specialization: "Check-up",
      date: "September 12, 2025",
      notes: "Check-up after antibiotic therapy",
      status: "Completed",
    },
    {
      doctor: "Dr Tomasz Lis",
      specialization: "Dermatologist",
      date: "August 8, 2025",
      notes: "Skin allergy diagnosis",
      status: "Completed",
    },
  ],
};

export const patientInterviewHistory = [
  {
    id: "rap-3051",
    date: "November 25, 2025 · 14:28",
    summary: "Sore throat, difficulty swallowing",
    status: "Sent to doctor",
  },
  {
    id: "rap-2972",
    date: "November 3, 2025 · 09:10",
    summary: "Runny nose and stuffy nose feeling",
    status: "AI-Recommended Consultations",
  },
  {
    id: "rap-2830",
    date: "October 18, 2025 · 19:46",
    summary: "Headache, fatigue",
    status: "Completed",
  },
];

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

export const doctorDashboardData = {
  stats: [
    { label: "Visits Today", value: "8", accent: "bg-blue-100 text-blue-600" },
    {
      label: "With AI Report",
      value: "5",
      accent: "bg-purple-100 text-purple-600",
    },
    {
      label: "Patients",
      value: "156",
      accent: "bg-emerald-100 text-emerald-600",
    },
  ],
  scheduleDate: "Tuesday, November 25, 2025",
  schedule: [
    {
      id: "visit-1",
      patient: "Jan Kowalski",
      type: "Visit",
      time: "10:00",
      duration: "30 min",
      hasReport: true,
      symptoms: "Sore throat, slight fever",
      notes: "Prefers in-person consultation",
      aiSuggestion: "Laryngitis",
      tests: ["Swab", "Blood count"],
      confidence: 0.85,
      visitInfo: {
        patient: {
          name: "Jan Kowalski",
          age: "35 years",
          pesel: "85010112345",
        },
        report: {
          symptoms: "Sore throat, difficulty swallowing, slight fever (37.8°C)",
          duration: "3 days",
          info: "Patient reports worsening symptoms in the morning.",
          suggestion: "Laryngitis",
          confidence: 0.85,
          tests: ["Throat swab", "Blood count"],
        },
      },
    },
    {
      id: "visit-2",
      patient: "Maria Nowak",
      type: "Check-up",
      time: "11:00",
      duration: "30 min",
      hasReport: false,
      symptoms: "Check-up after antibiotic therapy",
      notes: "Check test results",
      aiSuggestion: null,
      tests: ["CRP"],
      confidence: null,
    },
    {
      id: "visit-3",
      patient: "Piotr Wiśniewski",
      type: "Visit",
      time: "14:00",
      duration: "30 min",
      hasReport: true,
      symptoms: "Cough, wheezing",
      notes: "Suspected asthma",
      aiSuggestion: "Bronchitis",
      tests: ["Chest X-ray"],
      confidence: 0.78,
      visitInfo: {
        patient: {
          name: "Piotr Wiśniewski",
          age: "42 years",
          pesel: "81040598234",
        },
        report: {
          symptoms: "Cough persisting for 2 weeks, wheezing during exertion",
          duration: "2 weeks",
          info: "Symptoms worsen at night and in the morning.",
          suggestion: "Bronchitis",
          confidence: 0.78,
          tests: ["Chest X-ray", "Spirometry"],
        },
      },
    },
  ],
};
export const DOCTORS: Doctor[] = [
  {
    id: "1",
    firstName: "Anna",
    lastName: "Nowak",
    email: "a.nowak@clinic.com",
    specialization: "Laryngolog",
    workStartDate: "2025-12-06",
    phone: "576199224",
    password: "12dsasw1",
  },
  {
    id: "2",
    firstName: "Piotr",
    lastName: "Kowalczyk",
    email: "p.kowalczyk@clinic.com",
    specialization: "Laryngolog",
    workStartDate: "2025-12-06",
    phone: "576199224",
    password: "12dsasw1",
  },
  {
    id: "3",
    firstName: "Maria",
    lastName: "Wiśniewska",
    email: "m.wisniewska@clinic.com",
    specialization: "Kardiolog",
    workStartDate: "2025-12-06",
    phone: "576199224",
    password: "12dsasw1",
  },
];
