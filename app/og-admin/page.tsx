import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { goToSettings, logout } from './actions';
import { isUserAdmin } from '@/lib/auth';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RevenueChart, CategoryChart, SeatStatusChart, BookingStatusChart } from './components/charts';
import { CategoryVisibility } from './components/category-visibility';
import { Toaster } from '@/components/ui/sonner';

// Colors for charts
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];
import { CalendarDays, Users, DollarSign, Ticket, AlertCircle, TrendingUp, Clock, CheckCircle } from 'lucide-react';

// Function to fetch dashboard statistics
async function getDashboardStats() {
  try {
    const supabase = await createClient();
    
    // Get counts for different booking statuses
    const { data: pendingData, error: pendingError } = await supabase
      .from('bookings')
      .select('id')
      .eq('status', 'pending')
      .not('image', 'is', null);
      
    const { data: approvedData, error: approvedError } = await supabase
      .from('bookings')
      .select('id, amount')
      .eq('status', 'approved');
      
    const { data: rejectedData, error: rejectedError } = await supabase
      .from('bookings')
      .select('id')
      .eq('status', 'rejected');
      
    const { data: totalBookingsData, error: totalBookingsError } = await supabase
      .from('bookings')
      .select('id');
      
    const { data: seatsData, error: seatsError } = await supabase
      .from('seats')
      .select('status');
      
    const { data: recentBookingsData, error: recentBookingsError } = await supabase
      .from('bookings')
      .select('id, name, email, amount, status, created_at')
      .order('created_at', { ascending: false })
      .limit(5);
      
    // Get category distribution for bookings
    const { data: categoryData, error: categoryError } = await supabase
      .from('bookings')
      .select(`
        status,
        seats (
          category
        )
      `)
      .in('status', ['pending', 'approved']);
      
    // Get revenue by month
    const { data: revenueData, error: revenueError } = await supabase
      .from('bookings')
      .select('amount, created_at')
      .eq('status', 'approved');
      
    // Calculate statistics
    const pendingCount = pendingData?.length || 0;
    const approvedCount = approvedData?.length || 0;
    const rejectedCount = rejectedData?.length || 0;
    const totalBookings = totalBookingsData?.length || 0;
    
    // Calculate revenue
    const totalRevenue = approvedData?.reduce((sum, booking) => sum + booking.amount, 0) || 0;
    
    // Calculate seat statistics
    const totalSeats = seatsData?.length || 0;
    const availableSeats = seatsData?.filter(seat => seat.status === 'available')?.length || 0;
    const bookedSeats = seatsData?.filter(seat => seat.status === 'booked')?.length || 0;
    const reservedSeats = seatsData?.filter(seat => seat.status === 'reserved')?.length || 0;
    
    // Process category distribution
    const categoryDistribution: { [key: string]: number } = {};
    categoryData?.forEach(booking => {
      booking.seats?.forEach(seat => {
        if (seat.category) {
          categoryDistribution[seat.category] = (categoryDistribution[seat.category] || 0) + 1;
        }
      });
    });
    
    const categoryChartData = Object.entries(categoryDistribution).map(([name, value]) => ({
      name,
      value
    }));
    
    // Process revenue by month
    const revenueByMonth: { [key: string]: number } = {};
    revenueData?.forEach(booking => {
      const date = new Date(booking.created_at);
      const monthYear = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      revenueByMonth[monthYear] = (revenueByMonth[monthYear] || 0) + booking.amount;
    });
    
    const revenueChartData = Object.entries(revenueByMonth).map(([month, revenue]) => ({
      month,
      revenue
    }));
    
    return {
      pendingCount,
      approvedCount,
      rejectedCount,
      totalBookings,
      totalRevenue,
      totalSeats,
      availableSeats,
      bookedSeats,
      reservedSeats,
      recentBookings: recentBookingsData || [],
      categoryChartData,
      revenueChartData,
      errors: {
        pending: pendingError?.message,
        approved: approvedError?.message,
        rejected: rejectedError?.message,
        totalBookings: totalBookingsError?.message,
        seats: seatsError?.message,
        recentBookings: recentBookingsError?.message,
        category: categoryError?.message,
        revenue: revenueError?.message
      }
    };
  } catch (err: any) {
    console.error('Error fetching dashboard stats:', err);
    return {
      pendingCount: 0,
      approvedCount: 0,
      rejectedCount: 0,
      totalBookings: 0,
      totalRevenue: 0,
      totalSeats: 0,
      availableSeats: 0,
      bookedSeats: 0,
      reservedSeats: 0,
      recentBookings: [],
      categoryChartData: [],
      revenueChartData: [],
      errors: { general: err.message }
    };
  }
}

async function AdminDashboard() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // If no user, redirect to login
  if (!user) {
    redirect('/auth/login');
  }

  // Check if the user is an authorized admin
  if (!isUserAdmin(user)) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Card className="w-[350px]">
          <CardHeader>
            <CardTitle className="text-2xl text-center">Access Denied</CardTitle>
            <CardDescription className="text-center">
              You are not authorized to access this page.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <form action={() => redirect('/')}>
              <Button type="submit" variant="outline">
                Go to Home
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // Fetch dashboard statistics
  const stats = await getDashboardStats();

  // Colors for charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];
  
  // Render admin dashboard
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-gray-600 mt-1">Monitor your event bookings and manage operations</p>
        </div>
        <div className="mt-4 md:mt-0 flex space-x-2">
          <form action={goToSettings}>
            <Button variant="outline" type="submit" className="mr-2">
              Settings
            </Button>
          </form>
          <form action={logout}>
            <Button variant="outline" type="submit">
              Logout
            </Button>
          </form>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalBookings}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">{stats.approvedCount} approved</span> • 
              <span className="text-yellow-600"> {stats.pendingCount} pending</span> • 
              <span className="text-red-600"> {stats.rejectedCount} rejected</span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              From {stats.approvedCount} approved bookings
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Seat Occupancy</CardTitle>
            <Ticket className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalSeats > 0 ? Math.round((stats.bookedSeats / stats.totalSeats) * 100) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.bookedSeats} of {stats.totalSeats} seats booked
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingCount}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting your review
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Tables */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="bookings">Bookings</TabsTrigger>
          <TabsTrigger value="seats">Seats</TabsTrigger>
          <TabsTrigger value="category-visibility">Category Visibility</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Revenue Trend
                </CardTitle>
                <CardDescription>Monthly revenue from approved bookings</CardDescription>
              </CardHeader>
              <CardContent className="pl-2">
                <RevenueChart data={stats.revenueChartData} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Ticket className="h-5 w-5" />
                  Category Distribution
                </CardTitle>
                <CardDescription>Bookings by ticket category</CardDescription>
              </CardHeader>
              <CardContent className="pl-2">
                <CategoryChart data={stats.categoryChartData} />
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Recent Bookings
              </CardTitle>
              <CardDescription>Latest bookings across all statuses</CardDescription>
            </CardHeader>
            <CardContent>
              {stats.recentBookings.length > 0 ? (
                <div className="space-y-4">
                  {stats.recentBookings.map((booking) => (
                    <div key={booking.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                          <Users className="h-5 w-5 text-gray-600" />
                        </div>
                        <div>
                          <p className="font-medium">{booking.name}</p>
                          <p className="text-sm text-gray-500">{booking.email}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">${booking.amount.toFixed(2)}</p>
                        <div className="flex items-center justify-end mt-1">
                          <Badge variant={
                            booking.status === 'approved' ? 'default' : 
                            booking.status === 'pending' ? 'secondary' : 
                            'destructive'
                          }>
                            {booking.status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">No recent bookings</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Bookings Tab */}
        <TabsContent value="bookings" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border-yellow-200 bg-yellow-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-yellow-600" />
                  Pending Bookings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-yellow-700">{stats.pendingCount}</div>
                <p className="text-sm text-yellow-600 mt-1">Awaiting approval</p>
                <Separator className="my-4 bg-yellow-200" />
                <form action="/og-admin/pending-bookings">
                  <Button type="submit" className="w-full bg-yellow-600 hover:bg-yellow-700">
                    Review Pending
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card className="border-green-200 bg-green-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  Approved Bookings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-700">{stats.approvedCount}</div>
                <p className="text-sm text-green-600 mt-1">Confirmed bookings</p>
                <Separator className="my-4 bg-green-200" />
                <form action="/og-admin/booked-orders">
                  <Button type="submit" className="w-full bg-green-600 hover:bg-green-700">
                    View Approved
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card className="border-red-200 bg-red-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                  Rejected Bookings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-red-700">{stats.rejectedCount}</div>
                <p className="text-sm text-red-600 mt-1">Declined requests</p>
                <Separator className="my-4 bg-red-200" />
                <Button variant="outline" className="w-full border-red-200 text-red-700 hover:bg-red-100" disabled>
                  View Rejected
                </Button>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Booking Status Distribution</CardTitle>
              <CardDescription>Visual representation of all booking statuses</CardDescription>
            </CardHeader>
            <CardContent className="pl-2">
              <BookingStatusChart data={[
                { name: 'Pending', value: stats.pendingCount },
                { name: 'Approved', value: stats.approvedCount },
                { name: 'Rejected', value: stats.rejectedCount }
              ]} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Seats Tab */}
        <TabsContent value="seats" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Total Seats</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.totalSeats}</div>
                <p className="text-sm text-gray-600 mt-1">All seats in venue</p>
              </CardContent>
            </Card>

            <Card className="border-green-200 bg-green-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg text-green-700">Available</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-700">{stats.availableSeats}</div>
                <p className="text-sm text-green-600 mt-1">
                  {stats.totalSeats > 0 ? Math.round((stats.availableSeats / stats.totalSeats) * 100) : 0}% of total
                </p>
              </CardContent>
            </Card>

            <Card className="border-blue-200 bg-blue-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg text-blue-700">Booked</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-700">{stats.bookedSeats}</div>
                <p className="text-sm text-blue-600 mt-1">
                  {stats.totalSeats > 0 ? Math.round((stats.bookedSeats / stats.totalSeats) * 100) : 0}% of total
                </p>
              </CardContent>
            </Card>

            <Card className="border-orange-200 bg-orange-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg text-orange-700">Reserved</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-orange-700">{stats.reservedSeats}</div>
                <p className="text-sm text-orange-600 mt-1">
                  {stats.totalSeats > 0 ? Math.round((stats.reservedSeats / stats.totalSeats) * 100) : 0}% of total
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Seat Status Distribution</CardTitle>
              <CardDescription>Visual representation of seat availability</CardDescription>
            </CardHeader>
            <CardContent className="pl-2">
              <SeatStatusChart data={[
                { name: 'Available', value: stats.availableSeats, fill: '#00C49F' },
                { name: 'Booked', value: stats.bookedSeats, fill: '#0088FE' },
                { name: 'Reserved', value: stats.reservedSeats, fill: '#FFBB28' }
              ]} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Category Visibility Tab */}
        <TabsContent value="category-visibility" className="space-y-6">
          <CategoryVisibility categories={[]} />
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Revenue by Month</CardTitle>
                <CardDescription>Monthly revenue from approved bookings</CardDescription>
              </CardHeader>
              <CardContent className="pl-2">
                <RevenueChart data={stats.revenueChartData} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Category Distribution</CardTitle>
                <CardDescription>Bookings by ticket category</CardDescription>
              </CardHeader>
              <CardContent className="pl-2">
                <CategoryChart data={stats.categoryChartData} />
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Key Performance Indicators</CardTitle>
              <CardDescription>Important metrics for your event</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <p className="text-sm text-gray-500">Average Booking Value</p>
                  <p className="text-2xl font-bold mt-1">
                    ${stats.approvedCount > 0 ? (stats.totalRevenue / stats.approvedCount).toFixed(2) : '0.00'}
                  </p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <p className="text-sm text-gray-500">Approval Rate</p>
                  <p className="text-2xl font-bold mt-1">
                    {stats.pendingCount + stats.approvedCount + stats.rejectedCount > 0 
                      ? Math.round((stats.approvedCount / (stats.pendingCount + stats.approvedCount + stats.rejectedCount)) * 100) 
                      : 0}%
                  </p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <p className="text-sm text-gray-500">Seat Occupancy</p>
                  <p className="text-2xl font-bold mt-1">
                    {stats.totalSeats > 0 ? Math.round((stats.bookedSeats / stats.totalSeats) * 100) : 0}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Quick Actions */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Ticket Designer</CardTitle>
            <CardDescription>Create custom tickets</CardDescription>
          </CardHeader>
          <CardContent>
            <form action="/og-admin/tickets">
              <Button type="submit" className="w-full">Design Tickets</Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">User Management</CardTitle>
            <CardDescription>Manage user accounts</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" disabled>Manage Users</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Event Management</CardTitle>
            <CardDescription>Create and manage events</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" disabled>Manage Events</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Reports</CardTitle>
            <CardDescription>Download detailed reports</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" disabled>View Reports</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default async function AdminPage() {
  return (
    <>
      <Toaster position="top-right" richColors />
      <Suspense
        fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}
      >
        <AdminDashboard />
      </Suspense>
    </>
  );
}
