export interface Member {
  id: string;
  name: string;
  avatar: string;
  phone: string;
  color: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Trip {
  id: string;
  title: string;
  description: string;
  destination: string;
  startDate: string;
  endDate: string;
  coverImage: string;
  type: string;
  status: string;
  totalBudget: number;
  createdAt: string;
  updatedAt: string;
  tripMembers: TripMemberWithMember[];
  _count?: { expenses: number };
  totalExpenses?: number;
  expenses?: ExpenseWithMember[];
  itineraryItems?: ItineraryItem[];
}

export interface TripMemberWithMember {
  id: string;
  tripId: string;
  memberId: string;
  status: string;
  paidAmount: number;
  notes: string;
  createdAt: string;
  updatedAt: string;
  member: Member;
}

export interface ExpenseWithMember {
  id: string;
  tripId: string;
  paidById: string;
  description: string;
  amount: number;
  category: string;
  createdAt: string;
  updatedAt: string;
  member: Member;
}

export interface ItineraryItem {
  id: string;
  tripId: string;
  day: number;
  time: string;
  title: string;
  description: string;
  location: string;
  createdAt: string;
  updatedAt: string;
}

const API_BASE = '';

export async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${url}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

// Members
export const getMembers = () => apiFetch<Member[]>('/api/members');
export const createMember = (data: Partial<Member>) =>
  apiFetch<Member>('/api/members', { method: 'POST', body: JSON.stringify(data) });
export const updateMember = (id: string, data: Partial<Member>) =>
  apiFetch<Member>(`/api/members/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteMember = (id: string) =>
  apiFetch(`/api/members/${id}`, { method: 'DELETE' });

// Trips
export const getTrips = () => apiFetch<Trip[]>('/api/trips');
export const getTrip = (id: string) => apiFetch<Trip>(`/api/trips/${id}`);
export const createTrip = (data: Partial<Trip>) =>
  apiFetch<Trip>('/api/trips', { method: 'POST', body: JSON.stringify(data) });
export const updateTrip = (id: string, data: Partial<Trip>) =>
  apiFetch<Trip>(`/api/trips/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteTrip = (id: string) =>
  apiFetch(`/api/trips/${id}`, { method: 'DELETE' });

// Trip Members (RSVP)
export const getTripMembers = (tripId: string) =>
  apiFetch<TripMemberWithMember[]>(`/api/trip-members?tripId=${tripId}`);
export const upsertTripMember = (data: { tripId: string; memberId: string; status?: string; paidAmount?: number; notes?: string }) =>
  apiFetch<TripMemberWithMember>('/api/trip-members', { method: 'POST', body: JSON.stringify(data) });

// Expenses
export const getExpenses = (tripId: string) =>
  apiFetch<ExpenseWithMember[]>(`/api/expenses?tripId=${tripId}`);
export const createExpense = (data: { tripId: string; paidById: string; description: string; amount: number; category?: string }) =>
  apiFetch<ExpenseWithMember>('/api/expenses', { method: 'POST', body: JSON.stringify(data) });
export const deleteExpense = (id: string) =>
  apiFetch(`/api/expenses/${id}`, { method: 'DELETE' });

// Itinerary
export const getItinerary = (tripId: string) =>
  apiFetch<ItineraryItem[]>(`/api/itinerary?tripId=${tripId}`);
export const createItineraryItem = (data: Partial<ItineraryItem> & { tripId: string; title: string }) =>
  apiFetch<ItineraryItem>('/api/itinerary', { method: 'POST', body: JSON.stringify(data) });
export const updateItineraryItem = (id: string, data: Partial<ItineraryItem>) =>
  apiFetch<ItineraryItem>(`/api/itinerary/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteItineraryItem = (id: string) =>
  apiFetch(`/api/itinerary/${id}`, { method: 'DELETE' });

// Seed
export const seedData = () => apiFetch<{ success: boolean }>('/api/seed', { method: 'POST' });

// Helpers
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function getDaysBetween(start: string, end: string): number {
  const s = new Date(start);
  const e = new Date(end);
  return Math.ceil((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1;
}

export function getRelativeTime(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = date.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays === -1) return 'Yesterday';
  if (diffDays > 0 && diffDays <= 30) return `In ${diffDays} days`;
  if (diffDays < 0 && diffDays >= -30) return `${Math.abs(diffDays)} days ago`;
  return formatDate(dateStr);
}

export function calculateSplit(expenses: ExpenseWithMember[], tripMembers: TripMemberWithMember[]): { payer: Member; receiver: Member; amount: number }[] {
  const goingMembers = tripMembers.filter(tm => tm.status === 'going');
  if (goingMembers.length === 0) return [];
  
  const balances: Record<string, number> = {};
  goingMembers.forEach(tm => {
    balances[tm.memberId] = -(tm.paidAmount || 0);
  });
  
  expenses.forEach(exp => {
    if (balances[exp.paidById] !== undefined) {
      const split = Math.round(exp.amount / goingMembers.length);
      balances[exp.paidById] = (balances[exp.paidById] || 0) + exp.amount;
      goingMembers.forEach(tm => {
        if (tm.memberId !== exp.paidById) {
          balances[tm.memberId] = (balances[tm.memberId] || 0) - split;
        }
      });
    }
  });
  
  const transactions: { payer: Member; receiver: Member; amount: number }[] = [];
  const creditors = Object.entries(balances)
    .filter(([, bal]) => bal > 0)
    .sort(([, a], [, b]) => b - a);
  const debtors = Object.entries(balances)
    .filter(([, bal]) => bal < 0)
    .sort(([, a], [, b]) => a - b);
  
  let i = 0, j = 0;
  while (i < debtors.length && j < creditors.length) {
    const debtorId = debtors[i][0];
    const creditorId = creditors[j][0];
    const debtorBal = -debtors[i][1];
    const creditorBal = creditors[j][1];
    const amount = Math.min(debtorBal, creditorBal);
    
    if (amount > 0) {
      const payerMember = goingMembers.find(tm => tm.memberId === debtorId)?.member;
      const receiverMember = goingMembers.find(tm => tm.memberId === creditorId)?.member;
      if (payerMember && receiverMember) {
        transactions.push({ payer: payerMember, receiver: receiverMember, amount });
      }
    }
    
    debtors[i] = [debtorId, debtors[i][1] + amount];
    creditors[j] = [creditorId, creditors[j][1] - amount];
    if (Math.abs(debtors[i][1]) < 1) i++;
    if (Math.abs(creditors[j][1]) < 1) j++;
  }
  
  return transactions;
}