const RPC_ERROR_CODES = [
  "APPLICATION_NOT_FOUND",
  "NOT_GIG_OWNER",
  "GIG_NOT_OPEN",
  "APPLICATION_NOT_PENDING",
];

export function getRpcErrorCode(error) {
  const text = [error?.message, error?.details, error?.hint]
    .filter(Boolean)
    .join(" ");
  return RPC_ERROR_CODES.find((code) => text.includes(code)) || null;
}
