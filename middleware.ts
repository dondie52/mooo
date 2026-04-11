// Middleware is disabled for static export (GitHub Pages).
// Auth protection is handled client-side in each page component.
// To re-enable for server deployment (e.g. Vercel), uncomment below:

// import { type NextRequest } from "next/server";
// import { updateSession } from "@/lib/supabase/middleware";
//
// export async function middleware(request: NextRequest) {
//   return await updateSession(request);
// }
//
// export const config = {
//   matcher: [
//     "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
//   ],
// };
