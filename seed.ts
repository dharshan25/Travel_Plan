import { db } from './src/lib/db';

async function seed() {
  // Clear all data
  await db.itineraryItem.deleteMany();
  await db.expense.deleteMany();
  await db.tripMember.deleteMany();
  await db.trip.deleteMany();
  await db.member.deleteMany();
  console.log('Cleared all data');

  // Create members
  const memberData = [
    { name: 'Arjun', color: '#f97316', phone: '+91 98765 43210' },
    { name: 'Priya', color: '#ec4899', phone: '+91 98765 43211' },
    { name: 'Rohan', color: '#8b5cf6', phone: '+91 98765 43212' },
    { name: 'Ananya', color: '#14b8a6', phone: '+91 98765 43213' },
    { name: 'Vikram', color: '#ef4444', phone: '+91 98765 43214' },
    { name: 'Meera', color: '#f59e0b', phone: '+91 98765 43215' },
    { name: 'Rahul', color: '#06b6d4', phone: '+91 98765 43216' },
    { name: 'Sneha', color: '#84cc16', phone: '+91 98765 43217' },
  ];

  const members = [];
  for (const m of memberData) {
    const member = await db.member.create({ data: m });
    members.push(member);
    console.log(`Created member: ${m.name}`);
  }

  // Create trips
  const goaTrip = await db.trip.create({
    data: {
      title: 'Goa Beach Weekend',
      description: 'Sun, sand, and unforgettable memories! A perfect weekend getaway with the crew.',
      destination: 'Goa, India',
      startDate: new Date('2025-08-15T00:00:00.000Z'),
      endDate: new Date('2025-08-18T00:00:00.000Z'),
      coverImage: '/images/trip-beach.png',
      type: 'travel',
      status: 'planning',
      totalBudget: 25000,
    },
  });
  console.log(`Created trip: Goa Beach Weekend`);

  const manaliTrip = await db.trip.create({
    data: {
      title: 'Manali Adventure Trip',
      description: 'Mountains, adventure sports, and breathtaking views. The ultimate crew adventure!',
      destination: 'Manali, Himachal Pradesh',
      startDate: new Date('2025-09-20T00:00:00.000Z'),
      endDate: new Date('2025-09-25T00:00:00.000Z'),
      coverImage: '/images/trip-adventure.png',
      type: 'travel',
      status: 'planning',
      totalBudget: 35000,
    },
  });
  console.log(`Created trip: Manali Adventure Trip`);

  const movieTrip = await db.trip.create({
    data: {
      title: 'Weekend Movie - Interstellar',
      description: 'Re-watching the classic on the big screen with popcorn and the crew!',
      destination: 'PVR Cinemas, Phoenix Mall',
      startDate: new Date('2025-07-20T00:00:00.000Z'),
      endDate: new Date('2025-07-20T00:00:00.000Z'),
      coverImage: '/images/trip-movie.png',
      type: 'movie',
      status: 'confirmed',
      totalBudget: 2000,
    },
  });
  console.log(`Created trip: Weekend Movie - Interstellar`);

  // Trip Members for Goa
  const goaStatuses = ['going', 'going', 'going', 'going', 'going', 'maybe', 'not_going', 'going'];
  for (let i = 0; i < members.length; i++) {
    await db.tripMember.create({
      data: { tripId: goaTrip.id, memberId: members[i].id, status: goaStatuses[i] },
    });
  }

  // Trip Members for Manali
  const manaliStatuses = ['going', 'going', 'going', 'maybe', 'going', 'going', 'not_going', 'pending'];
  for (let i = 0; i < 6; i++) {
    await db.tripMember.create({
      data: { tripId: manaliTrip.id, memberId: members[i].id, status: manaliStatuses[i] },
    });
  }

  // Trip Members for Movie
  const movieStatuses = ['going', 'going', 'going', 'going', 'going'];
  for (let i = 0; i < 5; i++) {
    await db.tripMember.create({
      data: { tripId: movieTrip.id, memberId: members[i].id, status: movieStatuses[i] },
    });
  }

  // Expenses for Movie
  await db.expense.create({
    data: { tripId: movieTrip.id, paidById: members[0].id, description: 'Movie Tickets (5x)', amount: 1500, category: 'tickets' },
  });
  await db.expense.create({
    data: { tripId: movieTrip.id, paidById: members[1].id, description: 'Popcorn & Snacks', amount: 800, category: 'food' },
  });

  // Expenses for Goa
  await db.expense.create({
    data: { tripId: goaTrip.id, paidById: members[2].id, description: 'Hotel Booking Advance', amount: 5000, category: 'stay' },
  });
  await db.expense.create({
    data: { tripId: goaTrip.id, paidById: members[4].id, description: 'Flight Tickets', amount: 12000, category: 'transport' },
  });

  // Itinerary for Goa
  const goaItinerary = [
    { day: 1, time: '10:00 AM', title: 'Arrive & Check-in', location: 'Hotel, Calangute', description: 'Arrive at Goa airport, transfer to hotel, check-in and freshen up' },
    { day: 1, time: '2:00 PM', title: 'Beach Time at Baga', location: 'Baga Beach', description: 'Relax, swim, and enjoy beach vibes' },
    { day: 1, time: '8:00 PM', title: 'Dinner at Britto\'s', location: 'Britto\'s, Baga', description: 'Famous seafood dinner at the iconic beachside restaurant' },
    { day: 2, time: '9:00 AM', title: 'Water Sports at Calangute', location: 'Calangute Beach', description: 'Parasailing, jet ski, banana boat ride' },
    { day: 2, time: '3:00 PM', title: 'Visit Fort Aguada', location: 'Fort Aguada, Sinquerim', description: 'Historic Portuguese fort with stunning ocean views' },
    { day: 2, time: '7:00 PM', title: 'Night Market at Arpora', location: 'Arpora Night Market', description: 'Shopping, food stalls, live music' },
    { day: 3, time: '6:00 AM', title: 'Dudhsagar Falls Trip', location: 'Dudhsagar Falls', description: 'Early morning trip to the magnificent waterfall' },
    { day: 3, time: '2:00 PM', title: 'Spice Plantation Tour', location: 'Sahakari Spice Farm', description: 'Guided tour of the spice plantation with lunch' },
    { day: 3, time: '9:00 PM', title: 'Casino Night', location: 'Deltin Royale', description: 'Gaming, dinner, and entertainment at the floating casino' },
  ];

  for (const item of goaItinerary) {
    await db.itineraryItem.create({ data: { tripId: goaTrip.id, ...item } });
  }

  console.log('\n✅ Seed complete! Created:');
  console.log(`   - ${members.length} members`);
  console.log(`   - 3 trips (Goa, Manali, Movie)`);
  console.log(`   - 4 expenses`);
  console.log(`   - 9 itinerary items`);
  console.log('   - 19 trip member RSVPs');

  await db.$disconnect();
}

seed().catch((e) => {
  console.error('Seed error:', e);
  process.exit(1);
});