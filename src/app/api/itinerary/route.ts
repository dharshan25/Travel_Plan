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

    const items = await db.itineraryItem.findMany({
      where: { tripId },
      orderBy: [{ day: 'asc' }, { time: 'asc' }],
    })

    return NextResponse.json(items)
  } catch (error) {
    console.error('Error fetching itinerary items:', error)
    return NextResponse.json(
      { error: 'Failed to fetch itinerary items' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { tripId, day, time, title, description, location } = body

    if (!tripId || !title) {
      return NextResponse.json(
        { error: 'tripId and title are required' },
        { status: 400 }
      )
    }

    const item = await db.itineraryItem.create({
      data: {
        tripId,
        day: day ?? 1,
        time: time ?? '',
        title,
        description: description ?? '',
        location: location ?? '',
      },
    })

    return NextResponse.json(item, { status: 201 })
  } catch (error) {
    console.error('Error creating itinerary item:', error)
    return NextResponse.json(
      { error: 'Failed to create itinerary item' },
      { status: 500 }
    )
  }
}