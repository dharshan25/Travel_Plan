import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    const trips = await db.trip.findMany({
      orderBy: { startDate: 'desc' },
      include: {
        tripMembers: {
          include: {
            member: true,
          },
        },
        _count: {
          select: { expenses: true },
        },
      },
    })

    const tripsWithExpenseTotal = await Promise.all(
      trips.map(async (trip) => {
        const expenseAgg = await db.expense.aggregate({
          where: { tripId: trip.id },
          _sum: { amount: true },
        })
        return {
          ...trip,
          totalExpenses: expenseAgg._sum.amount ?? 0,
          expenseCount: trip._count.expenses,
        }
      })
    )

    return NextResponse.json(tripsWithExpenseTotal)
  } catch (error) {
    console.error('Error fetching trips:', error)
    return NextResponse.json(
      { error: 'Failed to fetch trips' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { title, description, destination, startDate, endDate, coverImage, type, status, totalBudget } = body

    if (!title || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'Title, startDate, and endDate are required' },
        { status: 400 }
      )
    }

    const trip = await db.trip.create({
      data: {
        title,
        description: description ?? '',
        destination: destination ?? '',
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        coverImage: coverImage ?? '',
        type: type ?? 'travel',
        status: status ?? 'planning',
        totalBudget: totalBudget ?? 0,
      },
    })

    return NextResponse.json(trip, { status: 201 })
  } catch (error) {
    console.error('Error creating trip:', error)
    return NextResponse.json(
      { error: 'Failed to create trip' },
      { status: 500 }
    )
  }
}