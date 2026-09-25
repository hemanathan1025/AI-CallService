from fastapi import FastAPI
from pydantic import BaseModel
import re

app = FastAPI()


# ==========================================
# REQUEST MODEL
# ==========================================

class ConversationRequest(BaseModel):
    message: str


# ==========================================
# DEFAULT PRODUCT PRICES
# ==========================================

PRODUCT_PRICES = {
    "chicken 65": 150,
    "fried rice": 120,
    "chicken biriyani": 180,
    "mutton biriyani": 220,
    "biriyani": 150,
    "pizza": 250,
    "burger": 100,
}


# ==========================================
# HOME
# ==========================================

@app.get("/")
def home():
    return {
        "success": True,
        "message": "AI Service is running"
    }


# ==========================================
# CHECK CUSTOMER CONFIRMATION
# ==========================================

def check_confirmation(message):

    message = message.lower().strip()

    # Customer confirmed
    confirmation_words = [
        "yes",
        "yes please",
        "confirm",
        "confirmed",
        "confirm order",
        "place order",
        "place it",
        "okay",
        "ok",
        "sure",
        "go ahead",
        "do it"
    ]

    # Customer rejected
    cancel_words = [
        "no",
        "no thanks",
        "cancel",
        "cancel order",
        "don't place",
        "do not place",
        "not now"
    ]

    for word in confirmation_words:

        if message == word:

            return {
                "confirmed": True,
                "cancelled": False
            }


    for word in cancel_words:

        if message == word:

            return {
                "confirmed": False,
                "cancelled": True
            }


    return {
        "confirmed": False,
        "cancelled": False
    }


# ==========================================
# EXTRACT ORDER
# ==========================================

@app.post("/api/ai/extract-order")
def extract_order(request: ConversationRequest):

    message = request.message.lower().strip()


    # ==========================================
    # CHECK CONFIRMATION FIRST
    # ==========================================

    confirmation = check_confirmation(message)


    if confirmation["confirmed"]:

        return {
            "success": True,
            "type": "confirmation",
            "confirmed": True,
            "cancelled": False,
            "message": "Customer confirmed the order"
        }


    if confirmation["cancelled"]:

        return {
            "success": True,
            "type": "confirmation",
            "confirmed": False,
            "cancelled": True,
            "message": "Customer cancelled the order"
        }


    # ==========================================
    # FIND PRODUCTS
    # ==========================================

    items = []


    # Longer product names first
    known_items = sorted(
        PRODUCT_PRICES.keys(),
        key=len,
        reverse=True
    )


    # ==========================================
    # EXTRACT QUANTITY + PRODUCT
    # ==========================================

    for item in known_items:

        pattern = rf"(\d+)\s+{re.escape(item)}"

        matches = re.finditer(
            pattern,
            message
        )


        for match in matches:

            quantity = int(
                match.group(1)
            )

            unit_price = PRODUCT_PRICES[item]

            total_price = (
                quantity * unit_price
            )


            items.append({
                "name": item,
                "quantity": quantity,
                "unitPrice": unit_price,
                "totalPrice": total_price
            })


    # ==========================================
    # PRODUCT WITHOUT QUANTITY
    # ==========================================

    if not items:

        for item in known_items:

            if item in message:

                quantity = 1

                unit_price = PRODUCT_PRICES[item]

                total_price = unit_price


                items.append({
                    "name": item,
                    "quantity": quantity,
                    "unitPrice": unit_price,
                    "totalPrice": total_price
                })


    # ==========================================
    # NO PRODUCT FOUND
    # ==========================================

    if not items:

        return {
            "success": True,
            "type": "unknown",
            "customer": {},
            "order": None,
            "message": "No known product found"
        }


    # ==========================================
    # CALCULATE TOTAL
    # ==========================================

    amount = sum(
        item["totalPrice"]
        for item in items
    )


    # ==========================================
    # ASK FOR FINAL CONFIRMATION
    # ==========================================

    item_text = []

    for item in items:

        item_text.append(
            f'{item["quantity"]} {item["name"]}'
        )


    order_description = ", ".join(
        item_text
    )


    confirmation_message = (
        f"You ordered {order_description}. "
        f"Your total price is ₹{amount}. "
        f"Would you like to confirm the order?"
    )


    # ==========================================
    # RETURN PENDING ORDER
    # ==========================================

    return {
        "success": True,

        "type": "order_confirmation",

        "customer": {},

        "order": {
            "items": items,
            "amount": amount,
            "status": "pending_confirmation"
        },

        "confirmed": False,

        "cancelled": False,

        "message": confirmation_message
    }