import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Eye,
  ShieldAlert,
  Activity
} from 'lucide-react';
import RiskBadge from '../components/RiskBadge';

export default function Dashboard({ storeId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/dashboard/${storeId}`)
      .then(res => res.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, [storeId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  const stats = [
    {
      label: 'Total Visitors',
      value: data?.totalVisitors || 0,
      icon: Users,
      color: 'bg-blue-500'
    },
    {
      label: 'Visits Today',
      value: data?.visitsToday || 0,
      icon: Eye,
      color: 'bg-emerald-500'
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-500">Monitor your store for potential copycats</p>
      </div>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-6">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">{label}</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">{value}</p>
              </div>
              <div className={`w-12 h-12 ${color} rounded-lg flex items-center justify-center`}>
                <Icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Two Column Layout */}
      <div className="grid grid-cols-2 gap-6">
        {/* Top Threats */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200">
          <div className="p-6 border-b border-slate-200">
            <h2 className="font-semibold text-slate-900 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-red-500" />
              Top Threats
            </h2>
          </div>
          <div className="divide-y divide-slate-100">
            {data?.topThreats?.length > 0 ? (
              data.topThreats.map(visitor => (
                <Link
                  key={visitor.visitorId}
                  to={`/visitor/${visitor.visitorId}`}
                  className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
                >
                  <div>
                    <p className="font-mono text-sm text-slate-900">
                      {visitor.visitorId.slice(0, 12)}...
                    </p>
                    <p className="text-xs text-slate-500">
                      {visitor.visitCount} visits · {visitor.pagesVisited?.length || 0} pages
                    </p>
                  </div>
                  <RiskBadge level={visitor.riskLevel} />
                </Link>
              ))
            ) : (
              <div className="p-8 text-center text-slate-400">
                No threats detected yet
              </div>
            )}
          </div>
        </div>
        
        {/* Recent Visitors */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200">
          <div className="p-6 border-b border-slate-200">
            <h2 className="font-semibold text-slate-900 flex items-center gap-2">
              <Activity className="w-5 h-5 text-emerald-500" />
              Recent Visitors
            </h2>
          </div>
          <div className="divide-y divide-slate-100">
            {data?.recentVisitors?.length > 0 ? (
              data.recentVisitors.map(visitor => (
                <Link
                  key={visitor.visitorId}
                  to={`/visitor/${visitor.visitorId}`}
                  className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
                >
                  <div>
                    <p className="font-mono text-sm text-slate-900">
                      {visitor.visitorId.slice(0, 12)}...
                    </p>
                    <p className="text-xs text-slate-500">
                      {new Date(visitor.lastSeen).toLocaleTimeString()}
                    </p>
                  </div>
                  <RiskBadge level={visitor.riskLevel} />
                </Link>
              ))
            ) : (
              <div className="p-8 text-center text-slate-400">
                No visitors yet. Add the tracking script to your store.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

