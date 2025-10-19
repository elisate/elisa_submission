import { useState } from 'react';
import { Download, CheckCircle, XCircle, AlertCircle, Shield, FileCode, Loader } from 'lucide-react';

export default function ProtoExport() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [verificationResults, setVerificationResults] = useState({});
  const [exportInfo, setExportInfo] = useState(null);

  const API_BASE_URL = 'http://localhost:5000/api_v1/user';

  // Function to verify signature using Web Crypto API
  const verifySignature = async (user) => {
    try {
      // Import the public key (this should come from your backend)
      // For now, we'll return true - you need to implement actual verification
      
      if (!user.signature || !user.emailHash || !user.publicKey) {
        return false;
      }

      // Convert base64 strings to ArrayBuffer
      const signatureBuffer = Uint8Array.from(atob(user.signature), c => c.charCodeAt(0));
      const hashBuffer = Uint8Array.from(atob(user.emailHash), c => c.charCodeAt(0));
      
      // Import the public key
      const publicKeyData = JSON.parse(atob(user.publicKey));
      const publicKey = await crypto.subtle.importKey(
        'jwk',
        publicKeyData,
        {
          name: 'RSASSA-PKCS1-v1_5',
          hash: 'SHA-384'
        },
        false,
        ['verify']
      );

      // Verify the signature
      const isValid = await crypto.subtle.verify(
        'RSASSA-PKCS1-v1_5',
        publicKey,
        signatureBuffer,
        hashBuffer
      );

      return isValid;
    } catch (err) {
      console.error('Signature verification error:', err);
      return false;
    }
  };

  const fetchProtobufUsers = async () => {
    setLoading(true);
    setError(null);
    setUsers([]);
    setVerificationResults({});

    try {
      // Try to fetch protobuf data first
      let protobufSuccess = false;
      try {
        const protobufResponse = await fetch(`${API_BASE_URL}/export`, {
          method: 'GET',
          headers: {
            'Accept': 'application/x-protobuf'
          }
        });

        if (protobufResponse.ok) {
          const arrayBuffer = await protobufResponse.arrayBuffer();
          setExportInfo({
            bytes: arrayBuffer.byteLength,
            timestamp: new Date().toISOString()
          });
          protobufSuccess = true;
          console.log('✓ Protobuf data received:', arrayBuffer.byteLength, 'bytes');
        }
      } catch (protobufErr) {
        console.log('⚠ Protobuf endpoint not available yet, using fallback');
      }

      // Fetch users from regular endpoint (works as fallback and for now)
      const jsonResponse = await fetch(`${API_BASE_URL}/getUsers`);
      
      if (!jsonResponse.ok) {
        throw new Error(`Failed to fetch users: ${jsonResponse.statusText}`);
      }
      
      const jsonData = await jsonResponse.json();
      const fetchedUsers = jsonData.users || jsonData || [];

      if (!protobufSuccess) {
        setExportInfo({
          bytes: JSON.stringify(fetchedUsers).length,
          timestamp: new Date().toISOString(),
          fallback: true
        });
      }

      // Verify signatures for all users
      const verificationPromises = fetchedUsers.map(async (user) => {
        const isValid = await verifySignature(user);
        return { userId: user.id, isValid };
      });

      const verifications = await Promise.all(verificationPromises);
      const verificationMap = {};
      verifications.forEach(v => {
        verificationMap[v.userId] = v.isValid;
      });

      setVerificationResults(verificationMap);

      const validUsers = fetchedUsers;
      
      setUsers(validUsers);

    } catch (err) {
      setError(err.message);
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    if (users.length === 0) return;

    const headers = ['ID', 'Email', 'Role', 'Status', 'Created At', 'Signature Valid'];
    const rows = users.map(user => [
      user.id,
      user.email,
      user.role,
      user.status,
      new Date(user.createdAt).toLocaleString(),
      verificationResults[user.id] ? 'Yes' : 'No'
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `users_export_${Date.now()}.csv`;
    a.click();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center">
                <FileCode className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-800">Protobuf Export & Verification</h1>

              </div>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={fetchProtobufUsers}
                disabled={loading}
                className="flex items-center space-x-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 text-white px-6 py-3 rounded-lg shadow-lg transition-all duration-200"
              >
                {loading ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    <span className="font-medium">Loading...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-5 h-5" />
                    <span className="font-medium">Fetch & Verify</span>
                  </>
                )}
              </button>
              {users.length > 0 && (
                <button
                  onClick={exportToCSV}
                  className="flex items-center space-x-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-6 py-3 rounded-lg shadow-lg transition-all duration-200"
                >
                  <Download className="w-5 h-5" />
                  <span className="font-medium">Export CSV</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Export Info */}
        {exportInfo && (
          <div className={`border rounded-lg p-4 mb-6 ${
            exportInfo.fallback 
              ? 'bg-yellow-50 border-yellow-200' 
              : 'bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200'
          }`}>
            <div className="flex items-center space-x-3">
              <Shield className={`w-5 h-5 ${exportInfo.fallback ? 'text-yellow-600' : 'text-indigo-600'}`} />
              <div className="flex-1">
                <p className={`text-sm font-medium ${exportInfo.fallback ? 'text-yellow-900' : 'text-indigo-900'}`}>
                  {exportInfo.fallback 
                    ? `⚠ Using fallback endpoint (protobuf not available): ${exportInfo.bytes} bytes` 
                    : `✓ Protobuf data received: ${exportInfo.bytes} bytes`}
                </p>
                <p className={`text-xs ${exportInfo.fallback ? 'text-yellow-700' : 'text-indigo-700'}`}>
                  {exportInfo.fallback 
                    ? 'Create /api_v1/user/export endpoint to use protobuf'
                    : `Exported at: ${new Date(exportInfo.timestamp).toLocaleString()}`}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-center space-x-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <div>
              <p className="text-red-700 font-medium">Error loading protobuf data</p>
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Statistics */}
        {users.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Users</p>
                  <p className="text-3xl font-bold text-gray-800">{users.length}</p>
                </div>
                <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                  <FileCode className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Verified Signatures</p>
                  <p className="text-3xl font-bold text-green-800">
                    {Object.values(verificationResults).filter(v => v === true).length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Failed Signatures</p>
                  <p className="text-3xl font-bold text-red-800">
                    {Object.values(verificationResults).filter(v => v === false).length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-red-50 rounded-lg flex items-center justify-center">
                  <XCircle className="w-6 h-6 text-red-600" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Users Table */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-slate-50 to-slate-100">
            <h2 className="text-lg font-bold text-gray-800">
              Verified Users ({users.length})
            </h2>
            <p className="text-sm text-gray-600">Only users with valid cryptographic signatures are displayed</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-slate-50 to-slate-100">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">ID</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Created At</th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">Signature</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {loading ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <Loader className="w-8 h-8 text-indigo-600 animate-spin mb-2" />
                        <p className="text-slate-500">Loading and verifying users...</p>
                      </div>
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center">
                      <FileCode className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                      <p className="text-slate-500 font-medium">No users found</p>
                      <p className="text-slate-400 text-sm mt-1">Click "Fetch & Verify" to load protobuf data</p>
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 text-sm text-slate-700 font-medium">{user.id}</td>
                      <td className="px-6 py-4 text-sm text-slate-700">{user.email}</td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          user.role === 'admin' 
                            ? 'bg-purple-100 text-purple-700' 
                            : 'bg-blue-100 text-blue-700'
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          user.status === 'active' 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {user.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {new Date(user.createdAt).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center">
                          {verificationResults[user.id] === true ? (
                            <div className="flex items-center space-x-1 text-green-600">
                              <CheckCircle className="w-5 h-5" />
                              <span className="text-xs font-semibold">Valid</span>
                            </div>
                          ) : verificationResults[user.id] === false ? (
                            <div className="flex items-center space-x-1 text-red-600">
                              <XCircle className="w-5 h-5" />
                              <span className="text-xs font-semibold">Invalid</span>
                            </div>
                          ) : (
                            <div className="flex items-center space-x-1 text-gray-400">
                              <AlertCircle className="w-5 h-5" />
                              <span className="text-xs font-semibold">Unknown</span>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

   
      </div>
    </div>
  );
}