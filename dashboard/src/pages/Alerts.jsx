import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Eye,
  Clock
} from 'lucide-react';
import RiskBadge from '../components/RiskBadge';

export default function Alerts({ storeId }) {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchAlerts();
  }, [storeId, filter]);

  const fetchAlerts = () => {
    const url = filter === 'all' 
      ? `/api/alerts/${storeId}`
      : `/api/alerts/${storeId}?status=${filter}`;
    
    fetch(url)
      .then(res => res.json())
      .then(setAlerts)
      .finally(() => setLoading(false));
  };

  const updateAlertStatus = async (alertId, status) => {
    await fetch(`/api/alerts/${alertId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    fetchAlerts();
  };

  const filterButtons = [
    { value: 'all', label: 'All' },
    { value: 'new', label: 'New' },
    { value: 'reviewed', label: 'Reviewed' },
    { value: 'dismissed', label: 'Dismissed' },
  ];

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
          <h1 className="text-2xl font-bold text-slate-900">Alerts</h1>
          <p className="text-slate-500">High-risk visitors requiring attention</p>
        </div>
        
        {/* Filter Buttons */}
        <div className="flex gap-2">
          {filterButtons.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setFilter(value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === value
                  ? 'bg-emerald-600 text-white'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      
      {alerts.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
          <AlertTriangle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-400">No alerts found</p>
          {filter !== 'all' && (
            <button 
              onClick={() => setFilter('all')}
              className="text-emerald-600 hover:text-emerald-700 mt-2"
            >
              View all alerts
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {alerts.map(alert => (
            <div 
              key={alert.id}
              className={`bg-white rounded-xl border shadow-sm overflow-hidden ${
                alert.status === 'new' ? 'border-red-200' : 'border-slate-200'
              }`}
            >
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className={`p-2 rounded-lg ${
                      alert.status === 'new' ? 'bg-red-100' : 'bg-slate-100'
                    }`}>
                      <AlertTriangle className={`w-6 h-6 ${
                        alert.status === 'new' ? 'text-red-500' : 'text-slate-400'
                      }`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <span className="font-mono text-slate-900">{alert.visitorId.slice(0, 20)}...</span>
                        <RiskBadge level={alert.riskScore >= 60 ? 'critical' : 'high'} score={alert.riskScore} />
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-500">
                        <Clock className="w-4 h-4" />
                        <span>{new Date(alert.timestamp).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <Link
                      to={`/visitor/${alert.visitorId}`}
                      className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                      title="View Details"
                    >
                      <Eye className="w-5 h-5" />
                    </Link>
                    {alert.status !== 'reviewed' && (
                      <button
                        onClick={() => updateAlertStatus(alert.id, 'reviewed')}
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Mark as Reviewed"
                      >
                        <CheckCircle className="w-5 h-5" />
                      </button>
                    )}
                    {alert.status !== 'dismissed' && (
                      <button
                        onClick={() => updateAlertStatus(alert.id, 'dismissed')}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Dismiss"
                      >
                        <XCircle className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </div>
                
                {/* Risk Factors */}
                {alert.riskFactors?.length > 0 && (
                  <div className="mt-4 flex gap-2 flex-wrap">
                    {alert.riskFactors.map((factor, i) => (
                      <span
                        key={i}
                        className={`px-2 py-1 text-xs rounded-full ${
                          factor.severity === 'critical' ? 'bg-red-100 text-red-700' :
                          factor.severity === 'high' ? 'bg-orange-100 text-orange-700' :
                          'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {factor.signal}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Status Bar */}
              <div className={`px-6 py-2 text-xs font-medium ${
                alert.status === 'new' ? 'bg-red-50 text-red-600' :
                alert.status === 'reviewed' ? 'bg-blue-50 text-blue-600' :
                'bg-slate-50 text-slate-500'
              }`}>
                Status: {alert.status.charAt(0).toUpperCase() + alert.status.slice(1)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

