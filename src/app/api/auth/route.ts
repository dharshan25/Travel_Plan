import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';

function hashPassword(password: string): string {
  return createHash('sha256').update(password + 'strawhats_salt').digest('hex');
}

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json();

    if (!password) {
      return NextResponse.json({ error: 'Password required' }, { status: 400 });
    }

    const adminHash = hashPassword(process.env.ADMIN_PASSWORD || '');
    const crewHash = hashPassword(process.env.CREW_PASSWORD || '');
    const inputHash = hashPassword(password);

    let role: string | null = null;
    if (inputHash === adminHash) {
      role = 'admin';
    } else if (inputHash === crewHash) {
      role = 'crew';
    }

    if (!role) {
      return NextResponse.json({ error: 'Wrong password, try again' }, { status: 401 });
    }

    const response = NextResponse.json({ success: true, role });
    response.cookies.set('crew_session', role, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/',
    });

    return response;
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.set('crew_session', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  });
  return response;
}