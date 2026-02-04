from typing import List, Literal, Optional
from pydantic import BaseModel, Field


class ChatMessage(BaseModel):
    role: str
    content: str


class MedicalReport(BaseModel):
    reported_summary: str = Field(
        ...,
        description="A brief summary of the patient's reported condition and history",
    )

    reported_symptoms: str = Field(
        ...,
        description="String containing symptoms extracted from the patient's description, "
        "separated by commas (e.g. 'Fever, headache, fatigue').",
    )

    sickness_duration: str = Field(
        ...,
        description="Duration of symptoms as reported by the patient (e.g., '2 days', 'since yesterday')",
    )

    ai_primary_diagnosis: str = Field(
        ..., description="The specific name of the identified condition. "
    )

    ai_diagnosis_reasoning: str = Field(
        ...,
        description="Primary preliminary diagnosis suggestion based on the analysis. "
        "EXPLANATION: Why do you think this is the case? ",
    )

    ai_suggested_management: List[str] = Field(
        ...,
        description="ACTION PLAN: List of recommended steps or treatments. (e.g., 'Rest', 'Drink water')"
        "NOT a single comma-separated string."
        "Priority: Use specific advice from RAG context. "
        "Fallback: If RAG lacks treatment info, provide standard general medical guidelines.",
    )

    ai_critical_warning: Optional[str] = Field(
        None,
        description="If the condition requires immediate ER visit (e.g. heart attack signs), "
        "state it here clearly. If no immediate danger exists, return null.",
    )

    ai_recommended_specializations: List[str] = Field(
        ...,
        description="List of recommended medical specialists (e.g.,"
        " 'Dermatologist', 'General Practitioner')",
    )

    ai_confidence_score: float = Field(
        ...,
        description="Confidence score of the assessment ranging from "
        "0.0 (uncertain) to 1.0 (highly confident)",
        ge=0.0,
        le=1.0,
    )


class ResponseArgs(BaseModel):
    action: Literal["message", "final_report"] = Field(
        ...,
        description="Choose 'message' to ask questions, or 'final_report' to give diagnosis",
    )
    message_to_patient: Optional[str] = Field(
        None, description="The text of the question (if action is message)"
    )
    report_data: Optional[MedicalReport] = Field(
        None, description="The full report object (if action is final_report)"
    )
