'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin, Calendar, Users, CreditCard, Plus, Plane, Film, TrendingUp,
  Clock, CheckCircle2, HelpCircle, XCircle, ChevronRight, ArrowRight,
  IndianRupee, Mountain, Utensils, Bus, Ticket, ShoppingBag, MoreHorizontal,
  Trash2, Edit3, Eye, X, Sparkles, Globe, Camera, Map, Wallet, UserPlus,
  RefreshCcw, CalendarDays, Target, ArrowUpRight, ArrowDownLeft, Compass,
  Anchor, Ship
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import {
  type Member, type Trip, type TripMemberWithMember,
  type ExpenseWithMember, type ItineraryItem,
  getMembers, getTrips, createMember, deleteMember,
  createTrip, upsertTripMember, getExpenses, createExpense,
  deleteExpense, deleteTrip, createItineraryItem, deleteItineraryItem,
  seedData, formatCurrency, formatDate, getDaysBetween, getRelativeTime,
  calculateSplit
} from '@/lib/api';

/* ──────────────────── Constants ──────────────────── */

const STATUS_CONFIG: Record<string, { label: string; icon: React.ReactNode; color: string; bg: string }> = {
  going: { label: 'Going', icon: <CheckCircle2 className="w-3.5 h-3.5" />, color: 'text-[#2D7A5B]', bg: 'bg-[#E8F5EE] border-[#B8E0CC]' },
  maybe: { label: 'Maybe', icon: <HelpCircle className="w-3.5 h-3.5" />, color: 'text-[#9A7328]', bg: 'bg-[#FDF3E1] border-[#F0D9A8]' },
  not_going: { label: 'Not Going', icon: <XCircle className="w-3.5 h-3.5" />, color: 'text-[#A04040]', bg: 'bg-[#FDECEC] border-[#F0C4C4]' },
  pending: { label: 'Pending', icon: <Clock className="w-3.5 h-3.5" />, color: 'text-gray-500', bg: 'bg-gray-50 border-gray-200' },
};

const TRIP_STATUS_CONFIG: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  planning: { label: 'Planning', variant: 'secondary' },
  confirmed: { label: 'Confirmed', variant: 'default' },
  completed: { label: 'Completed', variant: 'outline' },
  cancelled: { label: 'Cancelled', variant: 'destructive' },
};

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  transport: <Bus className="w-4 h-4" />,
  food: <Utensils className="w-4 h-4" />,
  stay: <Mountain className="w-4 h-4" />,
  tickets: <Ticket className="w-4 h-4" />,
  shopping: <ShoppingBag className="w-4 h-4" />,
  other: <Wallet className="w-4 h-4" />,
};

const MEMBER_COLORS = ['#f97316', '#ec4899', '#8b5cf6', '#14b8a6', '#ef4444', '#f59e0b', '#06b6d4', '#84cc16'];

/* ──────────────────── Helper Components ──────────────────── */

function MemberAvatar({ member, size = 'sm' }: { member: Member | undefined; size?: 'xs' | 'sm' | 'md' | 'lg' }) {
  const sizeClasses = { xs: 'w-6 h-6 text-[10px]', sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm', lg: 'w-14 h-14 text-lg' };
  if (!member) return <Avatar className={sizeClasses[size]}><AvatarFallback className="bg-muted">?</AvatarFallback></Avatar>;
  const initials = member.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  return (
    <Avatar className={sizeClasses[size]}>
      <AvatarFallback style={{ backgroundColor: member.color + '20', color: member.color }} className="font-semibold">
        {member.avatar ? <img src={member.avatar} alt={member.name} className="w-full h-full rounded-full object-cover" /> : initials}
      </AvatarFallback>
    </Avatar>
  );
}

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  return (
    <Badge variant="outline" className={`${cfg.bg} ${cfg.color} border gap-1 text-xs font-medium`}>
      {cfg.icon} {cfg.label}
    </Badge>
  );
}

function TripStatusBadge({ status }: { status: string }) {
  const cfg = TRIP_STATUS_CONFIG[status] || { label: status, variant: 'outline' as const };
  return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
}

function CategoryIcon({ category }: { category: string }) {
  return <span className="text-muted-foreground">{CATEGORY_ICONS[category] || CATEGORY_ICONS.other}</span>;
}

function EmptyState({ icon, title, description, action }: { icon: React.ReactNode; title: string; description: string; action?: React.ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4 text-muted-foreground">{icon}</div>
      <h3 className="font-semibold text-lg mb-1">{title}</h3>
      <p className="text-muted-foreground text-sm max-w-sm">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </motion.div>
  );
}

/* ──────────────────── Main Component ──────────────────── */

export default function Home() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);

  // Data
  const [members, setMembers] = useState<Member[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);

  // Dialogs
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [showCreateTrip, setShowCreateTrip] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showAddItinerary, setShowAddItinerary] = useState(false);
  const [showRSVPDialog, setShowRSVPDialog] = useState(false);
  const [rsvpingMemberId, setRsvpingMemberId] = useState('');

  // Detail data
  const [tripExpenses, setTripExpenses] = useState<ExpenseWithMember[]>([]);
  const [tripItinerary, setTripItinerary] = useState<ItineraryItem[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [m, t] = await Promise.all([getMembers(), getTrips()]);
      setMembers(m);
      setTrips(t);
    } catch (e: any) {
      toast({ title: 'Error loading data', description: e.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSeed = async () => {
    setSeeding(true);
    try {
      await seedData();
      await fetchData();
      toast({ title: 'Crew assembled! 🏴‍☠️', description: 'The Straw Hats are ready to set sail!' });
    } catch (e: any) {
      toast({ title: 'Seed failed', description: e.message, variant: 'destructive' });
    } finally {
      setSeeding(false);
    }
  };

  const openTripDetail = async (trip: Trip) => {
    setSelectedTrip(trip);
    setDetailLoading(true);
    try {
      const [exp, itin] = await Promise.all([
        getExpenses(trip.id),
        fetch(`/api/itinerary?tripId=${trip.id}`).then(r => r.json())
      ]);
      setTripExpenses(exp);
      setTripItinerary(itin);
    } catch {
      setTripExpenses([]);
      setTripItinerary([]);
    } finally {
      setDetailLoading(false);
    }
  };

  // Stats
  const upcomingTrips = trips.filter(t => t.status !== 'completed' && t.status !== 'cancelled' && new Date(t.startDate) >= new Date());
  const nextTrip = upcomingTrips.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())[0];
  const totalSpent = trips.reduce((sum, t) => sum + (t.totalExpenses || 0), 0);
  const totalMembers = members.filter(m => m.isActive).length;

  return (
    <div className="min-h-screen flex flex-col">
      {/* ═══════ HERO SECTION ═══════ */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img src="/images/hero-travel.png" alt="Travel" className="w-full h-full object-cover scale-105" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#2A1F14]/60 via-[#3D2E1F]/40 to-[#FAF7F2]" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#2A1F14]/30 to-transparent" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-24 sm:pt-14 sm:pb-32">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}>
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center text-xl border border-white/10">
                🏴‍☠️
              </div>
              <span className="text-white/60 text-xs font-semibold tracking-[0.15em] uppercase">Straw Hats Crew</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-[3.5rem] font-bold text-white mb-3 tracking-tight leading-[1.1]">
              Adventures with<br />the <span className="bg-gradient-to-r from-[#F2D6A0] to-[#D4896A] bg-clip-text text-transparent">Crew</span>
            </h1>
            <p className="text-white/50 text-base sm:text-lg max-w-lg mb-10 leading-relaxed">
              Plan voyages, track the crew, split treasure fairly — the Grand Line awaits!
            </p>

            {/* Stats Row */}
            <div className="flex flex-wrap gap-3">
              {[
                { icon: <Users className="w-4 h-4" />, label: 'Nakama', value: loading ? '—' : totalMembers },
                { icon: <Plane className="w-4 h-4" />, label: 'Upcoming', value: loading ? '—' : upcomingTrips.length },
                { icon: <IndianRupee className="w-4 h-4" />, label: 'Treasure Spent', value: loading ? '—' : formatCurrency(totalSpent) },
                { icon: <CalendarDays className="w-4 h-4" />, label: 'Next Voyage', value: loading ? '—' : nextTrip ? getRelativeTime(nextTrip.startDate) : 'None' },
              ].map((stat) => (
                <div key={stat.label} className="glass-dark rounded-2xl px-4 py-3 flex items-center gap-3 text-white border border-white/10">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#F2D6A0]/30 to-[#D4896A]/30 flex items-center justify-center">
                    <span className="text-[#F2D6A0]">{stat.icon}</span>
                  </div>
                  <div>
                    <div className="text-[11px] text-white/45 font-medium uppercase tracking-wider">{stat.label}</div>
                    <div className="text-sm font-bold">{stat.value}</div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Tab bar overlaps hero */}
        <div className="absolute bottom-0 left-0 right-0">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="glass rounded-t-[1.5rem] border-x border-t border-white/20 shadow-warm-lg" style={{ paddingBottom: 1 }}>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="bg-transparent p-0 h-14 gap-1.5 w-full justify-start overflow-x-auto scrollbar-hide">
                  {[
                    { value: 'dashboard', icon: <Globe className="w-[18px] h-[18px]" />, label: 'Dashboard' },
                    { value: 'trips', icon: <MapPin className="w-[18px] h-[18px]" />, label: 'Trips' },
                    { value: 'members', icon: <Users className="w-[18px] h-[18px]" />, label: 'Members' },
                    { value: 'expenses', icon: <CreditCard className="w-[18px] h-[18px]" />, label: 'Expenses' },
                  ].map(tab => (
                    <TabsTrigger
                      key={tab.value}
                      value={tab.value}
                      className="relative flex items-center gap-2 px-5 sm:px-7 rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-warm data-[state=active]:font-semibold transition-all duration-300 text-muted-foreground hover:text-foreground hover:bg-muted/60"
                    >
                      {tab.icon}
                      <span className="hidden sm:inline text-[13px]">{tab.label}</span>
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════ CONTENT AREA ═══════ */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {loading ? (
          <div className="space-y-6">
            <Skeleton className="h-32 w-full rounded-2xl bg-muted/60" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
            </div>
            <Skeleton className="h-64 w-full rounded-2xl" />
          </div>
        ) : members.length === 0 && trips.length === 0 ? (
          <EmptyState
            icon={<Compass className="w-8 h-8" />}
            title="Set Sail, Captain!"
            description="Your crew's log book is empty. Load sample data to see how it works, or add your first nakama to set sail!"
            action={
              <div className="flex gap-3">
                <Button onClick={handleSeed} disabled={seeding} className="gap-2">
                  <RefreshCcw className={`w-4 h-4 ${seeding ? 'animate-spin' : ''}`} />
                  {seeding ? 'Loading...' : 'Load Sample Data'}
                </Button>
                <Button variant="outline" onClick={() => setShowAddMember(true)} className="gap-2">
                  <UserPlus className="w-4 h-4" /> Add Member
                </Button>
              </div>
            }
          />
        ) : (
          <AnimatePresence mode="wait">
            <motion.div key={activeTab} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.25 }}>

              {/* ═══════ DASHBOARD TAB ═══════ */}
              {activeTab === 'dashboard' && (
                <div className="space-y-6">
                  {/* Stat Cards */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                      { title: 'Nakama', value: totalMembers, icon: <Users className="w-5 h-5" />, iconBg: 'bg-[#BF7B4A]/10 text-[#BF7B4A]' },
                      { title: 'Upcoming Voyages', value: upcomingTrips.length, icon: <Ship className="w-5 h-5" />, iconBg: 'bg-[#2A9E8F]/10 text-[#2A9E8F]' },
                      { title: 'Treasure Spent', value: formatCurrency(totalSpent), icon: <TrendingUp className="w-5 h-5" />, iconBg: 'bg-[#D4896A]/10 text-[#D4896A]' },
                      { title: 'Islands Visited', value: trips.filter(t => t.status === 'completed').length, icon: <MapPin className="w-5 h-5" />, iconBg: 'bg-[#C4A265]/10 text-[#C4A265]' },
                    ].map(card => (
                      <Card key={card.title} className="border-0 shadow-warm-sm hover:shadow-warm transition-all duration-300 bg-card">
                        <CardContent className="p-5">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="text-xs text-muted-foreground font-medium">{card.title}</p>
                              <p className="text-2xl font-bold mt-1.5 tracking-tight">{card.value}</p>
                            </div>
                            <div className={`p-2.5 rounded-2xl ${card.iconBg}`}>{card.icon}</div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {/* Next Trip Highlight */}
                  {nextTrip && (
                    <motion.div whileHover={{ scale: 1.005 }} transition={{ duration: 0.2 }}>
                      <Card className="border-0 shadow-warm overflow-hidden cursor-pointer hover:shadow-warm-lg transition-all duration-500" onClick={() => openTripDetail(nextTrip)}>
                        <div className="flex flex-col sm:flex-row">
                          <div className="sm:w-64 h-40 sm:h-auto relative flex-shrink-0">
                            <img src={nextTrip.coverImage || '/images/hero-travel.png'} alt={nextTrip.title} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent to-card/80 hidden sm:block" />
                            <div className="absolute top-3 left-3">
                              <Badge className="bg-[#BF7B4A] text-white border-0 gap-1 shadow-sm">
                                {nextTrip.type === 'movie' ? <Film className="w-3 h-3" /> : <Plane className="w-3 h-3" />}
                                Next Trip
                              </Badge>
                            </div>
                          </div>
                          <div className="p-5 flex-1">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <h3 className="font-bold text-lg">{nextTrip.title}</h3>
                                {nextTrip.destination && <p className="text-muted-foreground text-sm flex items-center gap-1 mt-0.5"><MapPin className="w-3.5 h-3.5" />{nextTrip.destination}</p>}
                              </div>
                              <TripStatusBadge status={nextTrip.status} />
                            </div>
                            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mt-3">
                              <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" />{formatDate(nextTrip.startDate)} — {formatDate(nextTrip.endDate)}</span>
                              <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" />{getDaysBetween(nextTrip.startDate, nextTrip.endDate)} days</span>
                              <span className="flex items-center gap-1.5"><IndianRupee className="w-3.5 h-3.5" />{formatCurrency(nextTrip.totalBudget)} budget</span>
                            </div>
                            {/* Member Avatars */}
                            <div className="flex items-center gap-1 mt-4">
                              <div className="flex -space-x-2">
                                {nextTrip.tripMembers.filter(tm => tm.status === 'going').slice(0, 5).map(tm => (
                                  <MemberAvatar key={tm.memberId} member={tm.member} size="sm" />
                                ))}
                              </div>
                              <span className="text-xs text-muted-foreground ml-2">
                                {nextTrip.tripMembers.filter(tm => tm.status === 'going').length} going · {nextTrip.tripMembers.filter(tm => tm.status === 'maybe').length} maybe
                              </span>
                            </div>
                            <div className="flex items-center gap-2 mt-3 text-[#BF7B4A] text-sm font-semibold">
                              View Details <ArrowRight className="w-4 h-4" />
                            </div>
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  )}

                  {/* All Trips Quick View */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="font-bold text-lg">All Voyages</h2>
                      <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setActiveTab('trips')}>
                        View All Voyages <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                    {trips.length === 0 ? (
                      <EmptyState icon={<Compass className="w-8 h-8" />} title="No voyages yet" description="Plan your first adventure, captain!" action={<Button onClick={() => setShowCreateTrip(true)} className="gap-2"><Plus className="w-4 h-4" /> Create Trip</Button>} />
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {trips.slice(0, 3).map(trip => (
                          <TripCard key={trip.id} trip={trip} members={members} onClick={() => openTripDetail(trip)} />
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Recent Crew Activity */}
                  <div>
                    <h2 className="font-bold text-lg mb-4">The Crew</h2>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {members.slice(0, 8).map(m => (
                        <Card key={m.id} className="shadow-warm-sm hover:shadow-warm transition-all duration-300 p-5 text-center group cursor-default">
                          <MemberAvatar member={m} size="lg" />
                          <p className="font-semibold text-sm mt-2.5">{m.name}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{trips.filter(t => t.tripMembers.some(tm => tm.memberId === m.id && tm.status === 'going')).length} trips</p>
                        </Card>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ═══════ TRIPS TAB ═══════ */}
              {activeTab === 'trips' && (
                <TripsView
                  trips={trips} members={members}
                  onCreateTrip={() => setShowCreateTrip(true)}
                  onTripClick={openTripDetail}
                />
              )}

              {/* ═══════ MEMBERS TAB ═══════ */}
              {activeTab === 'members' && (
                <MembersView
                  members={members} trips={trips}
                  onAddMember={() => setShowAddMember(true)}
                  onDeleteMember={async (id) => {
                    await deleteMember(id);
                    fetchData();
                    toast({ title: 'Member removed' });
                  }}
                />
              )}

              {/* ═══════ EXPENSES TAB ═══════ */}
              {activeTab === 'expenses' && (
                <ExpensesView
                  trips={trips} members={members}
                  onAddExpense={(tripId) => { setSelectedTrip(trips.find(t => t.id === tripId) || null); setShowAddExpense(true); }}
                />
              )}

            </motion.div>
          </AnimatePresence>
        )}
      </main>

      {/* ═══════ FOOTER ═══════ */}
      <footer className="mt-auto border-t border-border/50 bg-[#F5F0E9]/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-sm text-[#8A7B6C]">
          <span className="flex items-center gap-1.5">🏴‍☠️ Straw Hats Crew — To the Grand Line and beyond!</span>
          <Button variant="ghost" size="sm" onClick={handleSeed} disabled={seeding} className="text-xs">
            <RefreshCcw className={`w-3 h-3 mr-1 ${seeding ? 'animate-spin' : ''}`} />
            {seeding ? 'Resetting...' : 'Reset Sample Data'}
          </Button>
        </div>
      </footer>

      {/* ═══════ DIALOGS ═══════ */}
      <CreateTripDialog
        open={showCreateTrip} onClose={() => setShowCreateTrip(false)}
        members={members}
        onSubmit={async (data) => {
          await createTrip(data as any);
          setShowCreateTrip(false);
          fetchData();
          toast({ title: 'New voyage planned! 🏴‍☠️', description: data.title });
        }}
      />
      <AddMemberDialog
        open={showAddMember} onClose={() => setShowAddMember(false)}
        onSubmit={async (data) => {
          await createMember(data);
          setShowAddMember(false);
          fetchData();
          toast({ title: 'Nakama recruited! 🏴‍☠️', description: data.name });
        }}
      />
      <AddExpenseDialog
        open={showAddExpense} onClose={() => setShowAddExpense(false)}
        trip={selectedTrip} members={members}
        onSubmit={async (data) => {
          if (!selectedTrip) return;
          await createExpense({ ...data, tripId: selectedTrip.id });
          setShowAddExpense(false);
          if (selectedTrip) openTripDetail(selectedTrip);
          fetchData();
          toast({ title: 'Belly added to the treasure 💰' });
        }}
      />
      <AddItineraryDialog
        open={showAddItinerary} onClose={() => setShowAddItinerary(false)}
        trip={selectedTrip}
        onSubmit={async (data) => {
          if (!selectedTrip) return;
          await createItineraryItem({ ...data, tripId: selectedTrip.id });
          setShowAddItinerary(false);
          if (selectedTrip) openTripDetail(selectedTrip);
          toast({ title: 'Added to itinerary 📋' });
        }}
      />
      <RSVPDialog
        open={showRSVPDialog} onClose={() => setShowRSVPDialog(false)}
        trip={selectedTrip} members={members}
        memberId={rsvpingMemberId}
        onSubmit={async (status) => {
          if (!selectedTrip) return;
          await upsertTripMember({ tripId: selectedTrip.id, memberId: rsvpingMemberId, status });
          setShowRSVPDialog(false);
          if (selectedTrip) openTripDetail(selectedTrip);
          fetchData();
          toast({ title: 'RSVP updated ✅' });
        }}
      />
      <TripDetailDialog
        trip={selectedTrip}
        expenses={tripExpenses}
        itinerary={tripItinerary}
        members={members}
        loading={detailLoading}
        open={!!selectedTrip}
        onClose={() => { setSelectedTrip(null); setTripExpenses([]); setTripItinerary([]); }}
        onAddExpense={() => setShowAddExpense(true)}
        onAddItinerary={() => setShowAddItinerary(true)}
        onRSVP={(memberId) => { setRsvpingMemberId(memberId); setShowRSVPDialog(true); }}
        onDeleteExpense={async (id) => {
          await deleteExpense(id);
          if (selectedTrip) openTripDetail(selectedTrip);
          fetchData();
          toast({ title: 'Expense deleted' });
        }}
        onDeleteItinerary={async (id) => {
          await deleteItineraryItem(id);
          if (selectedTrip) openTripDetail(selectedTrip);
          toast({ title: 'Itinerary item removed' });
        }}
        onDeleteTrip={async (id) => {
          await deleteTrip(id);
          setSelectedTrip(null);
          fetchData();
          toast({ title: 'Trip deleted' });
        }}
      />
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   TRIP CARD COMPONENT
   ════════════════════════════════════════════════════════════ */

function TripCard({ trip, members, onClick }: { trip: Trip; members: Member[]; onClick: () => void }) {
  const goingCount = trip.tripMembers.filter(tm => tm.status === 'going').length;
  const totalSpent = trip._count?.expenses ? (trip.totalExpenses || 0) : 0;

  return (
    <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.2 }}>
      <Card className="border-0 shadow-warm-sm overflow-hidden cursor-pointer hover:shadow-warm-lg transition-all duration-500 group bg-card rounded-2xl" onClick={onClick}>
        <div className="relative h-40 overflow-hidden">
          <img
            src={trip.coverImage || '/images/hero-travel.png'}
            alt={trip.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute top-3 left-3 flex gap-2">
            <Badge className="bg-white/90 text-foreground border-0 backdrop-blur-sm gap-1">
              {trip.type === 'movie' ? <Film className="w-3 h-3" /> : <Plane className="w-3 h-3" />}
              {trip.type === 'movie' ? 'Movie' : 'Travel'}
            </Badge>
            <TripStatusBadge status={trip.status} />
          </div>
          <div className="absolute bottom-3 left-3 right-3">
            <h3 className="font-bold text-white text-lg leading-tight">{trip.title}</h3>
            {trip.destination && (
              <p className="text-white/80 text-xs mt-0.5 flex items-center gap-1">
                <MapPin className="w-3 h-3" />{trip.destination}
              </p>
            )}
          </div>
        </div>
        <CardContent className="p-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
            <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{formatDate(trip.startDate)}</span>
            <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{getDaysBetween(trip.startDate, trip.endDate)} days</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex -space-x-2">
              {trip.tripMembers.filter(tm => tm.status === 'going').slice(0, 4).map(tm => (
                <MemberAvatar key={tm.memberId} member={tm.member} size="xs" />
              ))}
              {goingCount > 4 && (
                <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-[10px] font-medium text-muted-foreground border-2 border-card">
                  +{goingCount - 4}
                </div>
              )}
            </div>
            {totalSpent > 0 && (
              <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                <IndianRupee className="w-3 h-3" />{formatCurrency(totalSpent)}
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

/* ════════════════════════════════════════════════════════════
   TRIPS VIEW
   ════════════════════════════════════════════════════════════ */

function TripsView({ trips, members, onCreateTrip, onTripClick }: { trips: Trip[]; members: Member[]; onCreateTrip: () => void; onTripClick: (t: Trip) => void }) {
  const [filter, setFilter] = useState('all');
  const filtered = filter === 'all' ? trips : trips.filter(t => t.type === filter);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="font-bold text-xl">All Voyages</h2>
          <div className="flex bg-muted rounded-lg p-0.5">
            {['all', 'travel', 'movie'].map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${filter === f ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
                {f === 'all' ? 'All' : f === 'travel' ? '✈️ Travel' : '🎬 Movie'}
              </button>
            ))}
          </div>
        </div>
        <Button onClick={onCreateTrip} className="gap-2 shadow-sm">
          <Plus className="w-4 h-4" /> New Voyage
        </Button>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={<Anchor className="w-8 h-8" />} title="No voyages found" description={filter !== 'all' ? `No ${filter} voyages yet. Plan one!` : 'Time to plan your first adventure, captain!'} action={<Button onClick={onCreateTrip} className="gap-2"><Plus className="w-4 h-4" /> Create Trip</Button>} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map(trip => <TripCard key={trip.id} trip={trip} members={members} onClick={() => onTripClick(trip)} />)}
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   MEMBERS VIEW
   ════════════════════════════════════════════════════════════ */

function MembersView({ members, trips, onAddMember, onDeleteMember }: { members: Member[]; trips: Trip[]; onAddMember: () => void; onDeleteMember: (id: string) => void }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-xl">Crew Members ({members.length})</h2>
        <Button onClick={onAddMember} className="gap-2 shadow-sm"><UserPlus className="w-4 h-4" /> Add Member</Button>
      </div>
      {members.length === 0 ? (
        <EmptyState icon={<Users className="w-8 h-8" />} title="No nakama yet" description="Recruit your crew members to set sail!" action={<Button onClick={onAddMember} className="gap-2"><UserPlus className="w-4 h-4" /> Add Member</Button>} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {members.map(m => {
            const memberTrips = trips.filter(t => t.tripMembers.some(tm => tm.memberId === m.id && tm.status === 'going'));
            const totalPaid = trips.reduce((sum, t) => {
              const tm = t.tripMembers.find(tmem => tmem.memberId === m.id);
              return sum + (tm?.paidAmount || 0);
            }, 0);
            return (
              <Card key={m.id} className="border-0 shadow-warm-sm hover:shadow-warm transition-all duration-300">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <MemberAvatar member={m} size="md" />
                      <div>
                        <h3 className="font-semibold">{m.name}</h3>
                        {m.phone && <p className="text-xs text-muted-foreground">{m.phone}</p>}
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => onDeleteMember(m.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  <Separator className="my-3" />
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="bg-muted/50 rounded-lg p-2 text-center">
                      <div className="font-bold">{memberTrips.length}</div>
                      <div className="text-xs text-muted-foreground">Trips</div>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-2 text-center">
                      <div className="font-bold">{formatCurrency(totalPaid)}</div>
                      <div className="text-xs text-muted-foreground">Paid</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   EXPENSES VIEW
   ════════════════════════════════════════════════════════════ */

function ExpensesView({ trips, members, onAddExpense }: { trips: Trip[]; members: Member[]; onAddExpense: (tripId: string) => void }) {
  const [selectedTripId, setSelectedTripId] = useState(trips[0]?.id || '');
  const [expenses, setExpenses] = useState<ExpenseWithMember[]>([]);

  const selectedTrip = trips.find(t => t.id === selectedTripId);

  useEffect(() => {
    if (!selectedTripId) return;
    let cancelled = false;
    getExpenses(selectedTripId).then(data => { if (!cancelled) setExpenses(data); }).catch(() => { if (!cancelled) setExpenses([]); });
    return () => { cancelled = true; };
  }, [selectedTripId]);

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const splits = selectedTrip ? calculateSplit(expenses, selectedTrip.tripMembers) : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <h2 className="font-bold text-xl whitespace-nowrap">Expenses</h2>
          <Select value={selectedTripId} onValueChange={setSelectedTripId}>
            <SelectTrigger className="w-full sm:w-64"><SelectValue placeholder="Select trip" /></SelectTrigger>
            <SelectContent>
              {trips.map(t => <SelectItem key={t.id} value={t.id}>{t.type === 'movie' ? '🎬' : '✈️'} {t.title}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        {selectedTripId && <Button onClick={() => onAddExpense(selectedTripId)} className="gap-2 shadow-sm"><Plus className="w-4 h-4" /> Add Expense</Button>}
      </div>

      {!selectedTripId ? (
        <EmptyState icon={<CreditCard className="w-8 h-8" />} title="Select a trip" description="Choose a trip to view and manage expenses." />
      ) : (
        <>
          {/* Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="border-0 shadow-warm-sm">
              <CardContent className="p-4 text-center">
                <p className="text-sm text-muted-foreground">Total Spent</p>
                <p className="text-2xl font-bold mt-1">{formatCurrency(totalExpenses)}</p>
                {selectedTrip && <p className="text-xs text-muted-foreground mt-1">Budget: {formatCurrency(selectedTrip.totalBudget)}</p>}
              </CardContent>
            </Card>
            <Card className="border-0 shadow-warm-sm">
              <CardContent className="p-4 text-center">
                <p className="text-sm text-muted-foreground">Expenses</p>
                <p className="text-2xl font-bold mt-1">{expenses.length}</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-warm-sm">
              <CardContent className="p-4 text-center">
                <p className="text-sm text-muted-foreground">Going Members</p>
                <p className="text-2xl font-bold mt-1">{selectedTrip?.tripMembers.filter(tm => tm.status === 'going').length || 0}</p>
              </CardContent>
            </Card>
          </div>

          {/* Split Summary */}
          {splits.length > 0 && (
            <Card className="border-0 shadow-warm-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2"><Target className="w-4 h-4 text-primary" /> Who Owes Whom</CardTitle>
                <CardDescription>Fair split calculation for {selectedTrip?.tripMembers.filter(tm => tm.status === 'going').length} members</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {splits.map((s, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl">
                    <MemberAvatar member={s.payer} size="sm" />
                    <div className="flex-1 min-w-0">
                      <span className="font-medium text-sm">{s.payer.name}</span>
                      <span className="text-muted-foreground text-sm mx-2">→</span>
                      <span className="font-medium text-sm">{s.receiver.name}</span>
                    </div>
                    <Badge variant="secondary" className="font-bold">{formatCurrency(s.amount)}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Expense List */}
          {expenses.length === 0 ? (
            <EmptyState icon={<Wallet className="w-8 h-8" />} title="No expenses yet" description="Start logging your voyage expenses." action={<Button onClick={() => onAddExpense(selectedTripId)} className="gap-2"><Plus className="w-4 h-4" /> Add Expense</Button>} />
          ) : (
            <Card className="border-0 shadow-warm-sm">
              <CardContent className="p-0">
                <div className="divide-y max-h-96 overflow-y-auto scrollbar-thin">
                  {expenses.map(exp => (
                    <div key={exp.id} className="flex items-center gap-3 p-4 hover:bg-muted/30 transition-colors">
                      <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center"><CategoryIcon category={exp.category} /></div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{exp.description}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <MemberAvatar member={exp.member} size="xs" /> {exp.member.name} · {formatDate(exp.createdAt)}
                        </p>
                      </div>
                      <span className="font-bold text-sm whitespace-nowrap">{formatCurrency(exp.amount)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   DIALOGS
   ════════════════════════════════════════════════════════════ */

function CreateTripDialog({ open, onClose, members, onSubmit }: { open: boolean; onClose: () => void; members: Member[]; onSubmit: (data: any) => void }) {
  const [form, setForm] = useState({ title: '', description: '', destination: '', startDate: '', endDate: '', type: 'travel', totalBudget: 0, coverImage: '' });
  const [step, setStep] = useState(1);

  const handleSubmit = () => {
    if (!form.title || !form.startDate || !form.endDate) return;
    onSubmit(form);
    setForm({ title: '', description: '', destination: '', startDate: '', endDate: '', type: 'travel', totalBudget: 0, coverImage: '' });
    setStep(1);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Plan New Voyage 🗺️</DialogTitle>
          <DialogDescription>The next island awaits, captain!</DialogDescription>
        </DialogHeader>

        {/* Step indicator */}
        <div className="flex gap-2 mb-2">
          {[1, 2].map(s => (
            <div key={s} className={`flex-1 h-1.5 rounded-full transition-colors ${step >= s ? 'bg-primary' : 'bg-muted'}`} />
          ))}
        </div>

        <AnimatePresence mode="wait">
          {step === 1 ? (
            <motion.div key="step1" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-4">
              <div>
                <Label>Trip Name *</Label>
                <Input placeholder="e.g., Goa Beach Weekend" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="mt-1" />
              </div>
              <div>
                <Label>Type</Label>
                <div className="flex gap-3 mt-1">
                  {['travel', 'movie'].map(t => (
                    <button key={t} onClick={() => setForm({ ...form, type: t, coverImage: t === 'travel' ? '/images/trip-adventure.png' : '/images/trip-movie.png' })}
                      className={`flex-1 p-3 rounded-xl border-2 text-center transition-all ${form.type === t ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}>
                      <span className="text-2xl">{t === 'travel' ? '✈️' : '🎬'}</span>
                      <p className="text-sm font-medium mt-1 capitalize">{t}</p>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <Label>Destination</Label>
                <Input placeholder="e.g., Goa, India" value={form.destination} onChange={e => setForm({ ...form, destination: e.target.value })} className="mt-1" />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea placeholder="What's the plan?" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="mt-1" rows={2} />
              </div>
              <div className="flex justify-end">
                <Button onClick={() => setStep(2)} disabled={!form.title}>Next →</Button>
              </div>
            </motion.div>
          ) : (
            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Start Date *</Label>
                  <Input type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} className="mt-1" />
                </div>
                <div>
                  <Label>End Date *</Label>
                  <Input type="date" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} className="mt-1" />
                </div>
              </div>
              <div>
                <Label>Budget (₹)</Label>
                <Input type="number" placeholder="25000" value={form.totalBudget || ''} onChange={e => setForm({ ...form, totalBudget: parseInt(e.target.value) || 0 })} className="mt-1" />
              </div>

              <div>
                <Label className="mb-2 block">Quick Add Members</Label>
                <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto scrollbar-thin">
                  {members.map(m => (
                    <Badge key={m.id} variant="outline" className="cursor-pointer hover:bg-primary/10 py-1.5 px-3">
                      <MemberAvatar member={m} size="xs" />
                      <span className="ml-1.5 text-xs">{m.name}</span>
                    </Badge>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-2">Members can be added after trip creation too</p>
              </div>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep(1)}>← Back</Button>
                <Button onClick={handleSubmit} disabled={!form.title || !form.startDate || !form.endDate}>Set Sail! 🏴‍☠️</Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}

function AddMemberDialog({ open, onClose, onSubmit }: { open: boolean; onClose: () => void; onSubmit: (data: any) => void }) {
  const [form, setForm] = useState({ name: '', phone: '', color: MEMBER_COLORS[Math.floor(Math.random() * MEMBER_COLORS.length)] });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Recruit Nakama 🏴‍☠️</DialogTitle>
          <DialogDescription>Add a new member to the Straw Hats crew</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Name *</Label>
            <Input placeholder="e.g., Arjun" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="mt-1" />
          </div>
          <div>
            <Label>Phone</Label>
            <Input placeholder="+91 98765 43210" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="mt-1" />
          </div>
          <div>
            <Label>Color</Label>
            <div className="flex gap-2 mt-1">
              {MEMBER_COLORS.map(c => (
                <button key={c} onClick={() => setForm({ ...form, color: c })}
                  className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${form.color === c ? 'border-foreground scale-110' : 'border-transparent'}`}
                  style={{ backgroundColor: c }} />
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={() => { if (form.name) { onSubmit(form); setForm({ name: '', phone: '', color: MEMBER_COLORS[Math.floor(Math.random() * MEMBER_COLORS.length)] }); } }} disabled={!form.name}>Add Member</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function AddExpenseDialog({ open, onClose, trip, members, onSubmit }: { open: boolean; onClose: () => void; trip: Trip | null; members: Member[]; onSubmit: (data: any) => void }) {
  const [form, setForm] = useState({ description: '', amount: 0, paidById: members[0]?.id || '', category: 'other' });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Expense 💰</DialogTitle>
          <DialogDescription>{trip?.title}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Description *</Label>
            <Input placeholder="e.g., Hotel booking" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="mt-1" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Amount (₹) *</Label>
              <Input type="number" placeholder="0" value={form.amount || ''} onChange={e => setForm({ ...form, amount: parseInt(e.target.value) || 0 })} className="mt-1" />
            </div>
            <div>
              <Label>Category</Label>
              <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(CATEGORY_ICONS).map(([key]) => (
                    <SelectItem key={key} value={key} className="capitalize">{key}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>Paid By *</Label>
            <Select value={form.paidById} onValueChange={v => setForm({ ...form, paidById: v })}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="Who paid?" /></SelectTrigger>
              <SelectContent>
                {members.map(m => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={() => { if (form.description && form.amount && form.paidById) { onSubmit(form); setForm({ description: '', amount: 0, paidById: members[0]?.id || '', category: 'other' }); } }} disabled={!form.description || !form.amount || !form.paidById}>Add Expense</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function AddItineraryDialog({ open, onClose, trip, onSubmit }: { open: boolean; onClose: () => void; trip: Trip | null; onSubmit: (data: any) => void }) {
  const [form, setForm] = useState({ title: '', day: 1, time: '', location: '', description: '' });
  const maxDay = trip ? getDaysBetween(trip.startDate, trip.endDate) : 1;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add to Itinerary 📋</DialogTitle>
          <DialogDescription>{trip?.title}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Activity *</Label>
            <Input placeholder="e.g., Visit Beach" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="mt-1" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Day</Label>
              <Select value={String(form.day)} onValueChange={v => setForm({ ...form, day: parseInt(v) })}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Array.from({ length: maxDay }, (_, i) => (
                    <SelectItem key={i + 1} value={String(i + 1)}>Day {i + 1}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Time</Label>
              <Input placeholder="e.g., 9:00 AM" value={form.time} onChange={e => setForm({ ...form, time: e.target.value })} className="mt-1" />
            </div>
          </div>
          <div>
            <Label>Location</Label>
            <Input placeholder="e.g., Baga Beach" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} className="mt-1" />
          </div>
          <div>
            <Label>Notes</Label>
            <Textarea placeholder="Any details..." value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="mt-1" rows={2} />
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={() => { if (form.title) { onSubmit(form); setForm({ title: '', day: 1, time: '', location: '', description: '' }); } }} disabled={!form.title}>Add</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function RSVPDialog({ open, onClose, trip, members, memberId, onSubmit }: { open: boolean; onClose: () => void; trip: Trip | null; members: Member[]; memberId: string; onSubmit: (status: string) => void }) {
  const member = members.find(m => m.id === memberId);
  const currentStatus = trip?.tripMembers.find(tm => tm.memberId === memberId)?.status || 'pending';

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Update RSVP</DialogTitle>
          <DialogDescription>{member?.name} for {trip?.title}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          {['going', 'maybe', 'not_going'].map(status => {
            const cfg = STATUS_CONFIG[status];
            return (
              <button key={status} onClick={() => onSubmit(status)}
                className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${currentStatus === status ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/30'}`}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${cfg.bg} ${cfg.color}`}>{cfg.icon}</div>
                <span className="font-medium">{cfg.label}</span>
                {currentStatus === status && <CheckCircle2 className="w-5 h-5 text-primary ml-auto" />}
              </button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ════════════════════════════════════════════════════════════
   TRIP DETAIL DIALOG
   ════════════════════════════════════════════════════════════ */

function TripDetailDialog({
  trip, expenses, itinerary, members, loading, open, onClose,
  onAddExpense, onAddItinerary, onRSVP, onDeleteExpense, onDeleteItinerary, onDeleteTrip
}: {
  trip: Trip | null; expenses: ExpenseWithMember[]; itinerary: ItineraryItem[];
  members: Member[]; loading: boolean; open: boolean; onClose: () => void;
  onAddExpense: () => void; onAddItinerary: () => void; onRSVP: (id: string) => void;
  onDeleteExpense: (id: string) => void; onDeleteItinerary: (id: string) => void; onDeleteTrip: (id: string) => void;
}) {
  const [detailTab, setDetailTab] = useState('info');

  if (!trip) return null;

  const goingCount = trip.tripMembers.filter(tm => tm.status === 'going').length;
  const maybeCount = trip.tripMembers.filter(tm => tm.status === 'maybe').length;
  const notGoingCount = trip.tripMembers.filter(tm => tm.status === 'not_going').length;
  const pendingCount = trip.tripMembers.filter(tm => tm.status === 'pending').length;
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const splits = calculateSplit(expenses, trip.tripMembers);
  const itineraryByDay = itinerary.reduce((acc, item) => {
    if (!acc[item.day]) acc[item.day] = [];
    acc[item.day].push(item);
    return acc;
  }, {} as Record<number, ItineraryItem[]>);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-hidden flex flex-col p-0">
        {/* Header Image */}
        <div className="relative h-48 flex-shrink-0">
          <img src={trip.coverImage || '/images/hero-travel.png'} alt={trip.title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
          <button onClick={onClose} className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/60 transition-colors">
            <X className="w-4 h-4" />
          </button>
          <div className="absolute bottom-4 left-4 right-4">
            <div className="flex items-center gap-2 mb-1">
              <Badge className="bg-white/90 text-foreground border-0 gap-1">
                {trip.type === 'movie' ? <Film className="w-3 h-3" /> : <Plane className="w-3 h-3" />}
                {trip.type === 'movie' ? 'Movie' : 'Travel'}
              </Badge>
              <TripStatusBadge status={trip.status} />
            </div>
            <h2 className="text-2xl font-bold text-white">{trip.title}</h2>
            {trip.destination && <p className="text-white/80 text-sm flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{trip.destination}</p>}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b px-4">
          {[
            { value: 'info', label: 'Overview' },
            { value: 'itinerary', label: 'Itinerary' },
            { value: 'rsvp', label: 'RSVP' },
            { value: 'expenses', label: 'Expenses' },
          ].map(tab => (
            <button key={tab.value} onClick={() => setDetailTab(tab.value)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${detailTab === tab.value ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
              {tab.label}
              {tab.value === 'rsvp' && goingCount > 0 && <Badge variant="secondary" className="ml-1.5 text-[10px] px-1.5">{goingCount}</Badge>}
            </button>
          ))}
        </div>

        {/* Content */}
        <ScrollArea className="flex-1">
          <div className="p-4">
            {loading ? (
              <div className="space-y-3"><Skeleton className="h-20 w-full rounded-xl" /><Skeleton className="h-20 w-full rounded-xl" /></div>
            ) : (
              <>
                {/* Overview Tab */}
                {detailTab === 'info' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {[
                        { icon: <Calendar className="w-4 h-4" />, label: 'Dates', value: `${formatDate(trip.startDate)} - ${formatDate(trip.endDate)}` },
                        { icon: <Clock className="w-4 h-4" />, label: 'Duration', value: `${getDaysBetween(trip.startDate, trip.endDate)} days` },
                        { icon: <Users className="w-4 h-4" />, label: 'Going', value: `${goingCount} / ${trip.tripMembers.length}` },
                        { icon: <IndianRupee className="w-4 h-4" />, label: 'Spent', value: formatCurrency(totalExpenses) },
                      ].map(item => (
                        <div key={item.label} className="bg-muted/50 rounded-xl p-3">
                          <div className="flex items-center gap-1.5 text-muted-foreground text-xs mb-1">{item.icon} {item.label}</div>
                          <div className="font-semibold text-sm">{item.value}</div>
                        </div>
                      ))}
                    </div>
                    {trip.description && (
                      <div>
                        <h4 className="font-semibold text-sm mb-1">Description</h4>
                        <p className="text-sm text-muted-foreground">{trip.description}</p>
                      </div>
                    )}
                    {trip.totalBudget > 0 && (
                      <div>
                        <div className="flex items-center justify-between text-sm mb-2">
                          <span className="font-medium">Budget Usage</span>
                          <span className="text-muted-foreground">{formatCurrency(totalExpenses)} / {formatCurrency(trip.totalBudget)}</span>
                        </div>
                        <Progress value={Math.min((totalExpenses / trip.totalBudget) * 100, 100)} className="h-2" />
                      </div>
                    )}

                    {/* Quick RSVP Status */}
                    <div>
                      <h4 className="font-semibold text-sm mb-2">Quick Status</h4>
                      <div className="flex gap-2">
                        <div className="flex-1 bg-emerald-50 rounded-xl p-3 text-center">
                          <div className="text-xl font-bold text-emerald-700">{goingCount}</div>
                          <div className="text-xs text-emerald-600">Going</div>
                        </div>
                        <div className="flex-1 bg-amber-50 rounded-xl p-3 text-center">
                          <div className="text-xl font-bold text-amber-700">{maybeCount}</div>
                          <div className="text-xs text-amber-600">Maybe</div>
                        </div>
                        <div className="flex-1 bg-red-50 rounded-xl p-3 text-center">
                          <div className="text-xl font-bold text-red-700">{notGoingCount}</div>
                          <div className="text-xs text-red-600">Not Going</div>
                        </div>
                        <div className="flex-1 bg-gray-50 rounded-xl p-3 text-center">
                          <div className="text-xl font-bold text-gray-600">{pendingCount}</div>
                          <div className="text-xs text-gray-500">Pending</div>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button variant="outline" size="sm" className="gap-1.5" onClick={() => onDeleteTrip(trip.id)}>
                        <Trash2 className="w-3.5 h-3.5" /> Delete Trip
                      </Button>
                    </div>
                  </div>
                )}

                {/* Itinerary Tab */}
                {detailTab === 'itinerary' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold">Day-by-Day Plan</h4>
                      <Button size="sm" onClick={onAddItinerary} className="gap-1.5"><Plus className="w-3.5 h-3.5" /> Add</Button>
                    </div>
                    {Object.keys(itineraryByDay).length === 0 ? (
                      <EmptyState icon={<Ship className="w-8 h-8" />} title="No itinerary yet" description="Chart the course for each day of your voyage" action={<Button size="sm" onClick={onAddItinerary} className="gap-1.5"><Plus className="w-3.5 h-3.5" /> Add Activity</Button>} />
                    ) : (
                      Object.entries(itineraryByDay).sort(([a], [b]) => Number(a) - Number(b)).map(([day, items]) => (
                        <div key={day}>
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">{day}</div>
                            <span className="font-semibold text-sm">Day {day}</span>
                            <div className="flex-1 h-px bg-border" />
                          </div>
                          <div className="space-y-2 ml-4 border-l-2 border-primary/20 pl-4">
                            {items.map(item => (
                              <div key={item.id} className="flex items-start gap-3 group">
                                <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                                <div className="flex-1">
                                  <div className="flex items-start justify-between">
                                    <div>
                                      <p className="font-medium text-sm">{item.title}</p>
                                      {item.time && <p className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3" />{item.time}</p>}
                                      {item.location && <p className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="w-3 h-3" />{item.location}</p>}
                                      {item.description && <p className="text-xs text-muted-foreground mt-1">{item.description}</p>}
                                    </div>
                                    <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                                      onClick={() => onDeleteItinerary(item.id)}>
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* RSVP Tab */}
                {detailTab === 'rsvp' && (
                  <div className="space-y-3">
                    <h4 className="font-semibold mb-3">Who&apos;s Coming?</h4>
                    {trip.tripMembers.map(tm => (
                      <div key={tm.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/30 transition-colors">
                        <MemberAvatar member={tm.member} size="md" />
                        <div className="flex-1">
                          <p className="font-medium text-sm">{tm.member.name}</p>
                          {tm.notes && <p className="text-xs text-muted-foreground">{tm.notes}</p>}
                        </div>
                        <StatusBadge status={tm.status} />
                        <Button variant="ghost" size="sm" className="text-xs" onClick={() => onRSVP(tm.memberId)}>Change</Button>
                      </div>
                    ))}
                    {members.filter(m => !trip.tripMembers.some(tm => tm.memberId === m.id)).length > 0 && (
                      <div className="pt-2">
                        <p className="text-xs text-muted-foreground mb-2">Not invited yet:</p>
                        <div className="flex flex-wrap gap-2">
                          {members.filter(m => !trip.tripMembers.some(tm => tm.memberId === m.id)).map(m => (
                            <Badge key={m.id} variant="outline" className="py-1.5">
                              <MemberAvatar member={m} size="xs" />
                              <span className="ml-1.5 text-xs">{m.name}</span>
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Expenses Tab */}
                {detailTab === 'expenses' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold">Expenses</h4>
                        <p className="text-sm text-muted-foreground">Total: {formatCurrency(totalExpenses)}</p>
                      </div>
                      <Button size="sm" onClick={onAddExpense} className="gap-1.5"><Plus className="w-3.5 h-3.5" /> Add</Button>
                    </div>

                    {splits.length > 0 && (
                      <Card className="border-0 bg-amber-50/50">
                        <CardContent className="p-3">
                          <p className="text-xs font-medium text-amber-800 mb-2">💡 Who owes whom:</p>
                          {splits.map((s, i) => (
                            <div key={i} className="flex items-center gap-2 text-xs text-amber-900">
                              <span className="font-medium">{s.payer.name}</span>
                              <ArrowUpRight className="w-3 h-3" />
                              <span className="font-medium">{s.receiver.name}</span>
                              <span className="ml-auto font-bold">{formatCurrency(s.amount)}</span>
                            </div>
                          ))}
                        </CardContent>
                      </Card>
                    )}

                    {expenses.length === 0 ? (
                      <EmptyState icon={<Wallet className="w-8 h-8" />} title="No expenses" description="Track your trip spending here" action={<Button size="sm" onClick={onAddExpense} className="gap-1.5"><Plus className="w-3.5 h-3.5" /> Add Expense</Button>} />
                    ) : (
                      <div className="space-y-2">
                        {expenses.map(exp => (
                          <div key={exp.id} className="flex items-center gap-3 p-3 bg-muted/30 rounded-xl group">
                            <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center"><CategoryIcon category={exp.category} /></div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">{exp.description}</p>
                              <p className="text-xs text-muted-foreground flex items-center gap-1">
                                {exp.member.name} · <Badge variant="outline" className="text-[10px] px-1 py-0">{exp.category}</Badge>
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm">{formatCurrency(exp.amount)}</span>
                              <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"
                                onClick={() => onDeleteExpense(exp.id)}>
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}