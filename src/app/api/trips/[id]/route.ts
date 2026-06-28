import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const trip = await db.trip.findUnique({
      where: { id },
      include: {
        tripMembers: {
          include: {
            member: true,
          },
        },
        expenses: {
          include: {
            member: true,
          },
          orderBy: { createdAt: 'desc' },
        },
        itineraryItems: {
          orderBy: [{ day: 'asc' }, { time: 'asc' }],
        },
      },
    })

    if (!trip) {
      return NextResponse.json(
        { error: 'Trip not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(trip)
  } catch (error) {
    console.error('Error fetching trip:', error)
    return NextResponse.json(
      { error: 'Failed to fetch trip' },
      { status: 500 }
    )
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json()
    const { title, description, destination, startDate, endDate, coverImage, type, status, totalBudget } = body

    const trip = await db.trip.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(destination !== undefined && { destination }),
        ...(startDate !== undefined && { startDate: new Date(startDate) }),
        ...(endDate !== undefined && { endDate: new Date(endDate) }),
        ...(coverImage !== undefined && { coverImage }),
        ...(type !== undefined && { type }),
        ...(status !== undefined && { status }),
        ...(totalBudget !== undefined && { totalBudget }),
      },
    })

    return NextResponse.json(trip)
  } catch (error) {
    console.error('Error updating trip:', error)
    return NextResponse.json(
      { error: 'Failed to update trip' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await db.trip.delete({
      where: { id },
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting trip:', error)
    return NextResponse.json(
      { error: 'Failed to delete trip' },
      { status: 500 }
    )
  }
}