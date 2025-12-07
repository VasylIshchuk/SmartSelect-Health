from pydantic import BaseModel, Field

class CalcArgs(BaseModel):
    a: float
    b: float
    op: str = Field(..., pattern="^(add|sub|mul|div)$")

TOOLS = {
    "calc": {
        "args_schema": CalcArgs,
        "implementation": lambda a,b,op: a+b if op=="add" else a-b if op=="sub" else a*b if op=="mul" else a/b
    }
}
