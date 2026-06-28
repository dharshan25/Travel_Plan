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

    const expenses = await db.expense.findMany({
      where: { tripId },
      include: { member: true },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(expenses)
  } catch (error) {
    console.error('Error fetching expenses:', error)
    return NextResponse.json(
      { error: 'Failed to fetch expenses' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { tripId, paidById, description, amount, category } = body

    if (!tripId || !paidById || !description || amount === undefined) {
      return NextResponse.json(
        { error: 'tripId, paidById, description, and amount are required' },
        { status: 400 }
      )
    }

    const expense = await db.expense.create({
      data: {
        tripId,
        paidById,
        description,
        amount,
        category: category ?? 'other',
      },
      include: { member: true },
    })

    return NextResponse.json(expense, { status: 201 })
  } catch (error) {
    console.error('Error creating expense:', error)
    return NextResponse.json(
      { error: 'Failed to create expense' },
      { status: 500 }
    )
  }
}