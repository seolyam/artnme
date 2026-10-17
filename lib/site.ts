/**
 * Single source of truth for the shop's public contact details.
 * Coordinates come from the studio's Google Maps listing.
 */
export const SITE = {
  name: "Art 'n Me",
  legalName: "Art 'n Me Digital Printing",
  phoneDisplay: "0968 329 2779",
  phoneHref: "tel:+639683292779",
  whatsappHref: "https://wa.me/639683292779",
  email: "artinme03@gmail.com",
  facebookHref: "https://www.facebook.com/ArtnMeOfficial",
  facebookHandle: "facebook.com/ArtnMeOfficial",
  addressLine1: "Corner Matagoy St., Brgy. Rizal",
  addressLine2: "Silay City, Negros Occidental 6116",
  landmark: "Rizal St at Olaybar St, by Matagoy Bridge, beside 102 Square",
  coords: { lat: 10.8029265, lng: 122.9779105 },
  mapsHref:
    "https://www.google.com/maps/place/Art+'n+Me/@10.8029178,122.9777976,20z/data=!4m6!3m5!1s0x33af29fad3dfae35:0xaa568eecfce71942!8m2!3d10.8029265!4d122.9779105",
  directionsHref:
    "https://www.google.com/maps/dir/?api=1&destination=10.8029265,122.9779105",
  mapEmbedSrc:
    "https://maps.google.com/maps?q=10.8029265,122.9779105&z=18&output=embed",
  hoursLabel: "Mon–Sat · 9AM–6PM",
  /** Opening hours in Asia/Manila time; 0 = Sunday. */
  hours: { openDays: [1, 2, 3, 4, 5, 6], open: 9, close: 18 },
} as const;

/** Whether the studio is open right now, evaluated in Philippine time. */
export function isStudioOpen(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Manila",
    weekday: "short",
    hour: "numeric",
    hourCycle: "h23",
  }).formatToParts(now);
  const weekday = parts.find((p) => p.type === "weekday")?.value ?? "Sun";
  const hour = Number(parts.find((p) => p.type === "hour")?.value ?? 0);
  const day = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(weekday);
  const { openDays, open, close } = SITE.hours;
  return (openDays as readonly number[]).includes(day) && hour >= open && hour < close;
}
