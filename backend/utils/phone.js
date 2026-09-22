function normalizePhone(phone) {
  if (phone === undefined || phone === null) {
    return "";
  }

  const digits = String(phone).replace(/\D/g, "");

  if (digits.length === 12 && digits.startsWith("91")) {
    return digits.slice(2);
  }

  return digits;
}

module.exports = { normalizePhone };
