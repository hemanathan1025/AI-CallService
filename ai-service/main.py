from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI()


class ConversationRequest(BaseModel):
    message: str


@app.get("/")
def home():
    return {
        "success": True,
        "message": "AI Service is running"
    }


@app.post("/api/ai/extract-order")
def extract_order(request: ConversationRequest):

    message = request.message.lower()

    if "burger" in message:
        return {
            "success": True,
            "customer": {},
            "order": {
                "items": "burger",
                "amount": 100
            }
        }

    return {
        "success": True,
        "customer": {},
        "order": None
    }