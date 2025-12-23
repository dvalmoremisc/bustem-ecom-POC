import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { 
  Activity as ActivityIcon, 
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import RiskBadge from '../components/RiskBadge';

export default function Activity({ storeId }) {
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const intervalRef = useRef(null);

  const fetchActivity = () => {
    fetch(`/api/activity/${storeId}?limit=50`)
      .then(res => res.json())
      .then(data => {
        setActivity(data);
        setLastUpdate(new Date());
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchActivity();
    
    if (autoRefresh) {
      intervalRef.current = setInterval(fetchActivity, 5000);
    }
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [storeId, autoRefresh]);

  const toggleAutoRefresh = () => {
    setAutoRefresh(!autoRefresh);
    if (!autoRefresh) {
      fetchActivity();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Live Activity</h1>
          <p className="text-slate-500">
            Real-time visitor activity feed
            <span className="ml-2 text-xs">
              Last updated: {lastUpdate.toLocaleTimeString()}
            </span>
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <button
            onClick={fetchActivity}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            title="Refresh now"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
          <button
            onClick={toggleAutoRefresh}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              autoRefresh
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-slate-100 text-slate-600'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${autoRefresh ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
            {autoRefresh ? 'Auto-refresh ON' : 'Auto-refresh OFF'}
          </button>
        </div>
      </div>
      
      {activity.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
          <ActivityIcon className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-400">No activity yet</p>
          <p className="text-slate-400 mt-2">Visits will appear here in real-time</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="divide-y divide-slate-100">
            {activity.map((visit, i) => (
              <div 
                key={visit.id || i}
                className={`p-4 flex items-center justify-between hover:bg-slate-50 transition-colors ${
                  i === 0 ? 'bg-emerald-50/50' : ''
                }`}
              >
                <div className="flex items-center gap-4">
                  {/* Time */}
                  <div className="w-20 text-sm text-slate-500">
                    {new Date(visit.timestamp).toLocaleTimeString()}
                  </div>
                  
                  {/* Visitor */}
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm text-slate-900">
                      {visit.visitorId?.slice(0, 12)}...
                    </span>
                    <Link
                      to={`/visitor/${visit.visitorId}`}
                      className="text-slate-400 hover:text-emerald-600"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>
                  
                  {/* Page */}
                  <div className="text-sm text-slate-500 font-mono truncate max-w-xs">
                    {visit.path || visit.page?.path || '/'}
                  </div>
                </div>
                
                {/* Risk Badge */}
                <RiskBadge level={visit.riskAnalysis?.level} />
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Legend */}
      <div className="flex items-center justify-center gap-6 text-sm text-slate-500">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
          Low Risk
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-amber-500"></span>
          Medium Risk
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-orange-500"></span>
          High Risk
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-red-500"></span>
          Critical Risk
        </div>
      </div>
    </div>
  );
}

