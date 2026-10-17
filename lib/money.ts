/** Numeric columns arrive from Postgres as strings. */
export function toNumber(value: string | number | null | undefined) {
  const n = typeof value === "number" ? value : parseFloat(value ?? "0");
  return Number.isFinite(n) ? n : 0;
}

/** Round to centavos so float noise never reaches the database. */
export function roundMoney(n: number) {
  return Math.round(n * 100) / 100;
}

export function peso(value: string | number | null | undefined, decimals = true) {
  const n = toNumber(value);
  return `₱${n.toLocaleString("en-PH", {
    minimumFractionDigits: decimals ? 2 : 0,
    maximumFractionDigits: 2,
  })}`;
}

export function balanceOf(order: { totalAmount: string; depositAmount: string }) {
  return roundMoney(toNumber(order.totalAmount) - toNumber(order.depositAmount));
}
