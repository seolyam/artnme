import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function proxy(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  // Only the staff area needs the auth session. Public pages never read it,
  // so running getUser() there just added a Supabase round trip (and a long
  // hang whenever Supabase was unreachable) to every page view.
  matcher: ["/dashboard/:path*", "/login"],
};
