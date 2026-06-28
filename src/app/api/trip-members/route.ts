import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    const tripId = req.nextUrl.searchParams.get('tripId')

    if (!tripId) {
      return NextResponse.json(
        { error: 'tripId query parameter is required' },
        { status: 400 }
      )
    }

    const tripMembers = await db.tripMember.findMany({
      where: { tripId },
      include: { member: true },
      orderBy: { createdAt: 'asc' },
    })

    return NextResponse.json(tripMembers)
  } catch (error) {
    console.error('Error fetching trip members:', error)
    return NextResponse.json(
      { error: 'Failed to fetch trip members' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { tripId, memberId, status, paidAmount, notes } = body

    if (!tripId || !memberId) {
      return NextResponse.json(
        { error: 'tripId and memberId are required' },
        { status: 400 }
      )
    }

    const tripMember = await db.tripMember.upsert({
      where: {
        tripId_memberId: { tripId, memberId },
      },
      update: {
        ...(status !== undefined && { status }),
        ...(paidAmount !== undefined && { paidAmount }),
        ...(notes !== undefined && { notes }),
      },
      create: {
        tripId,
        memberId,
        status: status ?? 'pending',
        paidAmount: paidAmount ?? 0,
        notes: notes ?? '',
      },
      include: { member: true },
    })

    return NextResponse.json(tripMember, { status: 201 })
  } catch (error) {
    console.error('Error creating/updating trip member:', error)
    return NextResponse.json(
      { error: 'Failed to create/update trip member' },
      { status: 500 }
    )
  }
}