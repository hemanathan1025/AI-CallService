const AppError = require("../utils/AppError");


// ==========================================
// VALIDATE AI RESULT
// ==========================================

const validateResult = (result) => {

  if (
    !result ||
    typeof result !== "object"
  ) {
    throw new AppError(
      "AI service returned an invalid response",
      502
    );
  }


  if (
    result.order &&
    (
      !result.order.items ||
      !Number.isFinite(
        Number(result.order.amount)
      ) ||
      Number(result.order.amount) <= 0
    )
  ) {
    throw new AppError(
      "AI service returned an invalid order",
      502
    );
  }


  return result;
};


// ==========================================
// PROCESS CONVERSATION
// Existing AI function
// ==========================================

async function processConversation(payload) {

  // Mock mode

  if (
    process.env.AI_MOCK_MODE === "true"
  ) {

    return validateResult({
      customer: {},
      order: null,
      mock: true,
    });
  }


  // Check AI service URL

  if (
    !process.env.AI_SERVICE_URL
  ) {

    throw new AppError(
      "AI service is not configured. Set AI_SERVICE_URL or AI_MOCK_MODE=true",
      503
    );
  }


  let response;


  try {

    response = await fetch(
      process.env.AI_SERVICE_URL,
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json",
        },

        body: JSON.stringify(
          payload
        ),

        signal:
          AbortSignal.timeout(
            Number(
              process.env.AI_SERVICE_TIMEOUT_MS ||
              10000
            )
          ),
      }
    );

  } catch (error) {

    console.error(
      "AI service connection error:",
      error.message
    );

    throw new AppError(
      "AI service is unavailable",
      503
    );
  }


  // AI service returned HTTP error

  if (!response.ok) {

    throw new AppError(
      "AI service returned an error",
      502
    );
  }


  try {

    const result =
      await response.json();

    return validateResult(
      result
    );

  } catch (error) {

    if (
      error instanceof AppError
    ) {
      throw error;
    }

    throw new AppError(
      "AI service returned invalid JSON",
      502
    );
  }
}


// ==========================================
// EXTRACT ORDER FROM AI
// Node.js -> Python
// ==========================================

async function extractOrderFromAI(
  message
) {

  if (
    !message ||
    typeof message !== "string"
  ) {

    throw new AppError(
      "AI message must be a non-empty string",
      400
    );
  }


  // Send exactly what Python expects:
  //
  // {
  //   "message": "I need 2 biriyani..."
  // }

  const result =
    await processConversation({
      message,
    });


  return result;
}


// ==========================================
// EXPORT
// ==========================================

module.exports = {

  processConversation,

  extractOrderFromAI,

};