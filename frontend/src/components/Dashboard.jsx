import { useState, useEffect } from 'react';
import { 
  Users, 
  UserCheck, 
  UserX, 
  Shield,
  TrendingUp,
  Calendar,
  Activity,
  CheckCircle,
  Download,
  AlertCircle
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    inactiveUsers: 0,
    adminUsers: 0,
    newUsersToday: 0,
    verifiedSignatures: 0
  });

  const [userGrowthData, setUserGrowthData] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [protobufUsers, setProtobufUsers] = useState([]);
  const [showProtobufModal, setShowProtobufModal] = useState(false);

  const API_BASE_URL = 'http://localhost:5000/api_v1/user';

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch all users
      const response = await fetch(`${API_BASE_URL}/getUsers`);
      if (!response.ok) throw new Error('Failed to fetch users');
      
      const data = await response.json();
      const users = data.users || data || [];
      
      // Calculate stats from users
      const totalUsers = users.length;
      const activeUsers = users.filter(u => u.status === 'active').length;
      const inactiveUsers = users.filter(u => u.status === 'inactive').length;
      const adminUsers = users.filter(u => u.role === 'admin').length;
      
      // Calculate users created today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const newUsersToday = users.filter(u => {
        const createdDate = new Date(u.createdAt);
        createdDate.setHours(0, 0, 0, 0);
        return createdDate.getTime() === today.getTime();
      }).length;

      // Count verified signatures (assuming all users have verified signatures if they exist)
      const verifiedSignatures = users.filter(u => u.signature).length;

      setStats({
        totalUsers,
        activeUsers,
        inactiveUsers,
        adminUsers,
        newUsersToday,
        verifiedSignatures
      });

      // Generate user growth data for last 7 days
      const growthData = generateUserGrowthData(users);
      setUserGrowthData(growthData);

      // Generate recent activity from users
      const activity = generateRecentActivity(users);
      setRecentActivity(activity);

    } catch (err) {
      setError(err.message);
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const generateUserGrowthData = (users) => {
    const last7Days = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
      const fullDate = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      
      // Count users created on this day
      const usersCount = users.filter(u => {
        const createdDate = new Date(u.createdAt);
        createdDate.setHours(0, 0, 0, 0);
        return createdDate.getTime() === date.getTime();
      }).length;
      
      last7Days.push({
        day: dayName,
        fullDate: fullDate,
        users: usersCount,
        date: date.toISOString().split('T')[0]
      });
    }
    
    return last7Days;
  };

  const generateRecentActivity = (users) => {
    // Sort users by creation date (newest first) and take last 5
    const sortedUsers = [...users]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5);
    
    return sortedUsers.map((user, index) => {
      const createdDate = new Date(user.createdAt);
      const now = new Date();
      const diffMs = now - createdDate;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);
      
      let timeAgo;
      if (diffMins < 1) timeAgo = 'Just now';
      else if (diffMins < 60) timeAgo = `${diffMins} min ago`;
      else if (diffHours < 24) timeAgo = `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
      else timeAgo = `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
      
      return {
        id: user.id,
        action: 'User Created',
        user: user.email,
        time: timeAgo,
        status: user.status === 'active' ? 'success' : 'warning',
        signature: user.signature ? 'Verified' : 'Pending'
      };
    });
  };

  const fetchProtobufUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/exportUsersProto/export`, {
        method: 'GET',
        headers: {
          'Accept': 'application/x-protobuf'
        }
      });

      if (!response.ok) throw new Error('Failed to fetch protobuf data');

      // Get the protobuf binary data
      const arrayBuffer = await response.arrayBuffer();
      
      // TODO: Decode protobuf data using your generated protobuf.js file
      // For now, we'll show a message that protobuf export is working
      console.log('Protobuf data received:', arrayBuffer.byteLength, 'bytes');
      
      // You'll need to implement protobuf decoding here
      // Example: const decoded = UserList.decode(new Uint8Array(arrayBuffer));
      
      setProtobufUsers([{
        note: 'Protobuf export endpoint is working!',
        bytes: arrayBuffer.byteLength,
        message: 'Implement protobuf decoding with your .proto schema to see decoded users here'
      }]);
      
      setShowProtobufModal(true);
    } catch (err) {
      setError('Protobuf export failed: ' + err.message);
      console.error('Error fetching protobuf:', err);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Total Users',
      value: stats.totalUsers,
      icon: Users,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600',
      change: stats.totalUsers > 0 ? '+' + Math.round((stats.newUsersToday / stats.totalUsers) * 100) + '%' : '0%',
      changeType: 'increase'
    },
    {
      title: 'Active Users',
      value: stats.activeUsers,
      icon: UserCheck,
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50',
      textColor: 'text-green-600',
      change: stats.totalUsers > 0 ? Math.round((stats.activeUsers / stats.totalUsers) * 100) + '%' : '0%',
      changeType: 'increase'
    },
    {
      title: 'Inactive Users',
      value: stats.inactiveUsers,
      icon: UserX,
      color: 'from-red-500 to-red-600',
      bgColor: 'bg-red-50',
      textColor: 'text-red-600',
      change: stats.totalUsers > 0 ? Math.round((stats.inactiveUsers / stats.totalUsers) * 100) + '%' : '0%',
      changeType: stats.inactiveUsers > 0 ? 'warning' : 'neutral'
    },
    {
      title: 'Admin Users',
      value: stats.adminUsers,
      icon: Shield,
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-600',
      change: '+' + stats.adminUsers,
      changeType: 'neutral'
    }
  ];

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
          <p className="text-sm font-semibold text-gray-800">{payload[0].payload.fullDate}</p>
          <p className="text-sm text-purple-600 font-medium">{payload[0].value} users created</p>
        </div>
      );
    }
    return null;
  };

  if (loading && stats.totalUsers === 0) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Dashboard Overview</h1>
          <p className="text-gray-600">Welcome to QT Global Software Admin Panel</p>
        </div>
        <button
          onClick={fetchProtobufUsers}
          className="flex items-center space-x-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-6 py-3 rounded-lg shadow-lg transition-all duration-200"
        >
          <Download className="w-5 h-5" />
          <span className="font-medium">Export Protobuf</span>
        </button>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-center space-x-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={index}
              className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300 p-6 border border-gray-100"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`${stat.bgColor} p-3 rounded-lg`}>
                  <Icon className={`w-6 h-6 ${stat.textColor}`} />
                </div>
                <span className={`text-sm font-semibold ${
                  stat.changeType === 'increase' ? 'text-green-600' : 
                  stat.changeType === 'warning' ? 'text-red-600' : 
                  'text-gray-600'
                }`}>
                  {stat.change}
                </span>
              </div>
              <h3 className="text-gray-600 text-sm font-medium mb-1">{stat.title}</h3>
              <p className="text-3xl font-bold text-gray-800">{stat.value}</p>
            </div>
          );
        })}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        
        {/* User Growth Chart - 7 Days */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-800 mb-1">User Growth Analytics</h2>
              <p className="text-sm text-gray-600">Users created per day - Last 7 days</p>
            </div>
            <div className="flex items-center space-x-2 bg-purple-50 px-4 py-2 rounded-lg">
              <Calendar className="w-4 h-4 text-purple-600" />
              <span className="text-sm font-medium text-purple-600">Last 7 Days</span>
            </div>
          </div>
          
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={userGrowthData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="day" 
                stroke="#9ca3af"
                style={{ fontSize: '12px' }}
              />
              <YAxis 
                stroke="#9ca3af"
                style={{ fontSize: '12px' }}
                allowDecimals={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar 
                dataKey="users" 
                fill="url(#colorGradient)" 
                radius={[8, 8, 0, 0]}
              />
              <defs>
                <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8b5cf6" stopOpacity={1} />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity={0.8} />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>

          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-4 h-4 text-green-600" />
                <span className="text-gray-600">Total this week:</span>
                <span className="font-bold text-gray-800">
                  {userGrowthData.reduce((sum, day) => sum + day.users, 0)} users
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-gray-600">Avg per day:</span>
                <span className="font-bold text-gray-800">
                  {userGrowthData.length > 0 
                    ? Math.round(userGrowthData.reduce((sum, day) => sum + day.users, 0) / 7) 
                    : 0} users
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-xl font-bold text-gray-800 mb-6">Quick Stats</h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg">
              <div>
                <p className="text-sm text-gray-600 mb-1">New Today</p>
                <p className="text-2xl font-bold text-gray-800">{stats.newUsersToday}</p>
              </div>
              <Activity className="w-8 h-8 text-purple-600" />
            </div>

            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg">
              <div>
                <p className="text-sm text-gray-600 mb-1">Verified Signatures</p>
                <p className="text-2xl font-bold text-gray-800">{stats.verifiedSignatures}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>

            <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">Active Rate</span>
                <span className="text-sm font-bold text-blue-600">
                  {stats.totalUsers > 0 
                    ? Math.round((stats.activeUsers / stats.totalUsers) * 100) 
                    : 0}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-500"
                  style={{ 
                    width: `${stats.totalUsers > 0 
                      ? (stats.activeUsers / stats.totalUsers) * 100 
                      : 0}%` 
                  }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <h2 className="text-xl font-bold text-gray-800 mb-6">Recent Activity</h2>
        
        {recentActivity.length === 0 ? (
          <p className="text-center text-gray-500 py-8">No recent activity</p>
        ) : (
          <div className="space-y-3">
            {recentActivity.map((activity) => (
              <div
                key={activity.id}
                className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-lg transition-colors border border-gray-100"
              >
                <div className="flex items-center space-x-4">
                  <div className={`w-2 h-2 rounded-full ${
                    activity.status === 'success' ? 'bg-green-500' :
                    activity.status === 'warning' ? 'bg-yellow-500' :
                    'bg-blue-500'
                  }`}></div>
                  <div>
                    <p className="font-medium text-gray-800">{activity.action}</p>
                    <p className="text-sm text-gray-600">{activity.user}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-sm text-gray-500 block">{activity.time}</span>
                  <span className="text-xs text-green-600">{activity.signature}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Protobuf Modal */}
      {showProtobufModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-800">Protobuf Export</h2>
              <button
                onClick={() => setShowProtobufModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-green-800 font-medium">✓ Protobuf data received successfully!</p>
                <p className="text-sm text-green-700 mt-1">
                  {protobufUsers[0]?.bytes} bytes of protobuf data received
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>Next Step:</strong> Implement protobuf decoding using your .proto schema to display the actual user data here.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;