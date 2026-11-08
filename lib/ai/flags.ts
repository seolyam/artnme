import "server-only";

// Kill switches. Unset (or anything but "1") hides every AI affordance.
// Read on the server only; pages pass the booleans down as props.

export function aiStaffEnabled(): boolean {
  return process.env.AI_STAFF_ENABLED === "1";
}

export function aiPublicEnabled(): boolean {
  return process.env.AI_PUBLIC_ENABLED === "1";
}
