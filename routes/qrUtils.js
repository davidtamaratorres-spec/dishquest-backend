const crypto = require("crypto");

function buildQrImageUrl(token) {
  const payload = JSON.stringify({ type: "dishquest_discount", token });
  return `https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(payload)}`;
}

function createToken() {
  if (crypto.randomUUID) return crypto.randomUUID();
  return crypto.randomBytes(24).toString("hex");
}

function addHours(date, hours) {
  return new Date(date.getTime() + hours * 60 * 60 * 1000);
}

module.exports = {
  addHours,
  buildQrImageUrl,
  createToken,
};
