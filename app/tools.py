from pydantic import BaseModel,conlist
import pandas as pd

class DiagnoseArgs(BaseModel):
    symptoms: conlist(str, min_length=1, max_length=3)
    top_k: int = 3

class ModelResponse(BaseModel):
    illnesses: conlist(str, min_length=1, max_length=3)

    class Config:
        extra = "forbid"


diseases = pd.read_csv("diseases.csv")
diseases.columns = diseases.columns.str.lower()


def lookup_diseases(symptoms: list[str], top_k: int = 3):
    symptoms = [s.strip().lower() for s in symptoms]
    valid = [s for s in symptoms if s in diseases.columns]

    if not valid:
        return []

    df = diseases.copy()
    df["score"] = df[valid].sum(axis=1)
    top = df.sort_values("score", ascending=False).head(top_k)
    return top["diseases"].tolist()


TOOLS = {
    "diagnose": {
        "openai_schema": {
            "name": "diagnose",
            "description": "Return probable diseases based on symptoms",
            "parameters": {
                "type": "object",
                "properties": {
                    "symptoms": {
                        "type": "array",
                        "items": {"type": "string"},
                    },
                    "top_k": {
                        "type": "integer",
                        "default": 3
                    }
                },
                "required": ["symptoms"]
            },
        },
        "args_schema": DiagnoseArgs,
        "implementation": lookup_diseases,
    }
}
