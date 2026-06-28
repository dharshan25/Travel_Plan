import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json()
    const { day, time, title, description, location } = body

    const item = await db.itineraryItem.update({
      where: { id },
      data: {
        ...(day !== undefined && { day }),
        ...(time !== undefined && { time }),
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(location !== undefined && { location }),
      },
    })

    return NextResponse.json(item)
  } catch (error) {
    console.error('Error updating itinerary item:', error)
    return NextResponse.json(
      { error: 'Failed to update itinerary item' },
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
    await db.itineraryItem.delete({
      where: { id },
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting itinerary item:', error)
    return NextResponse.json(
      { error: 'Failed to delete itinerary item' },
      { status: 500 }
    )
  }
}