import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function POST() {
  try {
    // 1. Clear all existing data in dependency order
    await db.itineraryItem.deleteMany()
    await db.expense.deleteMany()
    await db.tripMember.deleteMany()
    await db.trip.deleteMany()
    await db.member.deleteMany()

    // 2. Create 8 members
    const arjun = await db.member.create({
      data: { name: 'Arjun', color: '#f97316' },
    })
    const priya = await db.member.create({
      data: { name: 'Priya', color: '#ec4899' },
    })
    const rohan = await db.member.create({
      data: { name: 'Rohan', color: '#8b5cf6' },
    })
    const ananya = await db.member.create({
      data: { name: 'Ananya', color: '#14b8a6' },
    })
    const vikram = await db.member.create({
      data: { name: 'Vikram', color: '#ef4444' },
    })
    const meera = await db.member.create({
      data: { name: 'Meera', color: '#f59e0b' },
    })
    const rahul = await db.member.create({
      data: { name: 'Rahul', color: '#06b6d4' },
    })
    const sneha = await db.member.create({
      data: { name: 'Sneha', color: '#84cc16' },
    })

    const allMembers = [arjun, priya, rohan, ananya, vikram, meera, rahul, sneha]

    // 3. Create 3 trips
    const goaTrip = await db.trip.create({
      data: {
        title: 'Goa Beach Weekend',
        description: 'A fun-filled beach weekend getaway with friends',
        destination: 'Goa, India',
        startDate: new Date('2025-08-15T00:00:00.000Z'),
        endDate: new Date('2025-08-18T00:00:00.000Z'),
        coverImage: '/images/trip-beach.png',
        type: 'travel',
        status: 'planning',
        totalBudget: 25000,
      },
    })

    const manaliTrip = await db.trip.create({
      data: {
        title: 'Manali Adventure Trip',
        description: 'Adventure and sightseeing in the mountains of Himachal Pradesh',
        destination: 'Manali, Himachal Pradesh',
        startDate: new Date('2025-09-20T00:00:00.000Z'),
        endDate: new Date('2025-09-25T00:00:00.000Z'),
        coverImage: '/images/trip-adventure.png',
        type: 'travel',
        status: 'planning',
        totalBudget: 35000,
      },
    })

    const movieTrip = await db.trip.create({
      data: {
        title: 'Weekend Movie - Interstellar',
        description: 'Group movie night to watch Interstellar in IMAX',
        destination: 'PVR Cinemas, Phoenix Mall',
        startDate: new Date('2025-07-20T00:00:00.000Z'),
        endDate: new Date('2025-07-20T00:00:00.000Z'),
        coverImage: '/images/trip-movie.png',
        type: 'movie',
        status: 'confirmed',
        totalBudget: 2000,
      },
    })

    // 4. Create TripMembers
    // Goa: all 8 members with various statuses
    const goaStatuses: Array<{ memberId: string; status: string }> = [
      { memberId: arjun.id, status: 'going' },
      { memberId: priya.id, status: 'going' },
      { memberId: rohan.id, status: 'going' },
      { memberId: ananya.id, status: 'going' },
      { memberId: vikram.id, status: 'maybe' },
      { memberId: meera.id, status: 'going' },
      { memberId: rahul.id, status: 'not_going' },
      { memberId: sneha.id, status: 'pending' },
    ]
    for (const tm of goaStatuses) {
      await db.tripMember.create({
        data: { tripId: goaTrip.id, memberId: tm.memberId, status: tm.status },
      })
    }

    // Manali: 6 members
    const manaliStatuses: Array<{ memberId: string; status: string }> = [
      { memberId: arjun.id, status: 'going' },
      { memberId: priya.id, status: 'going' },
      { memberId: rohan.id, status: 'maybe' },
      { memberId: ananya.id, status: 'going' },
      { memberId: vikram.id, status: 'going' },
      { memberId: meera.id, status: 'pending' },
    ]
    for (const tm of manaliStatuses) {
      await db.tripMember.create({
        data: { tripId: manaliTrip.id, memberId: tm.memberId, status: tm.status },
      })
    }

    // Movie: 5 members
    const movieStatuses: Array<{ memberId: string; status: string }> = [
      { memberId: arjun.id, status: 'going' },
      { memberId: priya.id, status: 'going' },
      { memberId: rohan.id, status: 'going' },
      { memberId: ananya.id, status: 'going' },
      { memberId: meera.id, status: 'going' },
    ]
    for (const tm of movieStatuses) {
      await db.tripMember.create({
        data: { tripId: movieTrip.id, memberId: tm.memberId, status: tm.status },
      })
    }

    // 5. Expenses for movie trip
    await db.expense.create({
      data: {
        tripId: movieTrip.id,
        paidById: arjun.id,
        description: 'Tickets (5 members × ₹300)',
        amount: 1500,
        category: 'tickets',
      },
    })
    await db.expense.create({
      data: {
        tripId: movieTrip.id,
        paidById: priya.id,
        description: 'Popcorn & Snacks',
        amount: 800,
        category: 'food',
      },
    })

    // 6. Expenses for Goa trip
    await db.expense.create({
      data: {
        tripId: goaTrip.id,
        paidById: rohan.id,
        description: 'Hotel Booking Advance',
        amount: 5000,
        category: 'stay',
      },
    })
    await db.expense.create({
      data: {
        tripId: goaTrip.id,
        paidById: vikram.id,
        description: 'Flight Tickets',
        amount: 12000,
        category: 'transport',
      },
    })

    // 7. Itinerary items for Goa trip
    // Day 1
    await db.itineraryItem.createMany({
      data: [
        {
          tripId: goaTrip.id,
          day: 1,
          time: '10:00 AM',
          title: 'Arrive & Check-in',
          description: 'Arrive at Goa airport and check into the hotel',
          location: 'Hotel, Baga Beach',
        },
        {
          tripId: goaTrip.id,
          day: 1,
          time: '2:00 PM',
          title: 'Beach Time at Baga',
          description: 'Relax and enjoy the beach, try some water activities',
          location: 'Baga Beach',
        },
        {
          tripId: goaTrip.id,
          day: 1,
          time: '8:00 PM',
          title: "Dinner at Britto's",
          description: "Seafood dinner at the famous Britto's restaurant",
          location: "Britto's, Baga Beach",
        },
      ],
    })

    // Day 2
    await db.itineraryItem.createMany({
      data: [
        {
          tripId: goaTrip.id,
          day: 2,
          time: '9:00 AM',
          title: 'Water Sports at Calangute',
          description: 'Parasailing, jet ski, and banana boat rides',
          location: 'Calangute Beach',
        },
        {
          tripId: goaTrip.id,
          day: 2,
          time: '3:00 PM',
          title: 'Visit Fort Aguada',
          description: 'Explore the historic Portuguese fort and lighthouse',
          location: 'Fort Aguada, Sinquerim',
        },
        {
          tripId: goaTrip.id,
          day: 2,
          time: '7:00 PM',
          title: 'Night Market at Arpora',
          description: 'Shop for souvenirs and enjoy street food at the Saturday night market',
          location: 'Arpora Night Market',
        },
      ],
    })

    // Day 3
    await db.itineraryItem.createMany({
      data: [
        {
          tripId: goaTrip.id,
          day: 3,
          time: '6:00 AM',
          title: 'Dudhsagar Falls Trip',
          description: 'Early morning trip to the majestic Dudhsagar waterfalls',
          location: 'Dudhsagar Falls, Mollem',
        },
        {
          tripId: goaTrip.id,
          day: 3,
          time: '2:00 PM',
          title: 'Spice Plantation Tour',
          description: 'Tour a local spice plantation and learn about Goan spices',
          location: 'Sahakari Spice Farm, Ponda',
        },
        {
          tripId: goaTrip.id,
          day: 3,
          time: '9:00 PM',
          title: 'Casino Night',
          description: 'Try your luck at the floating casino on the Mandovi river',
          location: 'Deltin Royale, Mandovi River',
        },
      ],
    })

    return NextResponse.json({
      success: true,
      message: 'Database seeded successfully',
      stats: {
        members: 8,
        trips: 3,
        tripMembers: goaStatuses.length + manaliStatuses.length + movieStatuses.length,
        expenses: 4,
        itineraryItems: 9,
      },
    })
  } catch (error) {
    console.error('Error seeding database:', error)
    return NextResponse.json(
      { error: 'Failed to seed database' },
      { status: 500 }
    )
  }
}