import type { NextRequest } from 'next/server';
import { updateAuthSession } from './app/lib/auth/proxy';

export async function proxy(request: NextRequest) {
  return updateAuthSession(request);
}

export const config = {
  matcher: ['/admin/:path*'],
};
