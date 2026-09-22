const AppError = require("../utils/AppError");
const validateResult = (result) => {
  if (!result || typeof result !== "object") throw new AppError("AI service returned an invalid response", 502);
  if (result.order && (!result.order.items || !Number.isFinite(Number(result.order.amount)) || Number(result.order.amount) <= 0)) throw new AppError("AI service returned an invalid order", 502);
  return result;
};
async function processConversation(payload) {
  if (process.env.AI_MOCK_MODE === "true") return validateResult({ customer: {}, order: null, mock: true });
  if (!process.env.AI_SERVICE_URL) throw new AppError("AI service is not configured. Set AI_SERVICE_URL or AI_MOCK_MODE=true", 503);
  let response;
  try { response = await fetch(process.env.AI_SERVICE_URL, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload), signal: AbortSignal.timeout(Number(process.env.AI_SERVICE_TIMEOUT_MS || 10000)) }); }
  catch (error) { throw new AppError("AI service is unavailable", 503); }
  if (!response.ok) throw new AppError("AI service returned an error", 502);
  return validateResult(await response.json());
}
module.exports = { processConversation };
