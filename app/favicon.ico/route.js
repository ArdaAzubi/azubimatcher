import { NextResponse } from 'next/server';

export function GET() {
  // Avoid browser 404 noise if no binary favicon is shipped.
  return new NextResponse(null, { status: 204 });
}
