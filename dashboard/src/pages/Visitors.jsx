import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import RiskBadge from '../components/RiskBadge';

export default function Visitors({ storeId }) {
  const [visitors, setVisitors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/visitors/${storeId}?limit=100`)
      .then(res => res.json())
      .then(setVisitors)
      .finally(() => setLoading(false));
  }, [storeId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">All Visitors</h1>
        <p className="text-slate-500">Sorted by risk score (highest first)</p>
      </div>
      
      {visitors.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
          <p className="text-slate-400">No visitors tracked yet.</p>
          <p className="text-slate-400 mt-2">Add the tracking script to your store to start collecting data.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Visitor ID</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Risk</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Visits</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Pages</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Last Seen</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Signals</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {visitors.map(visitor => (
                <tr key={visitor.visitorId} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <span className="font-mono text-sm">{visitor.visitorId.slice(0, 16)}...</span>
                  </td>
                  <td className="px-6 py-4">
                    <RiskBadge level={visitor.riskLevel} score={visitor.highestRiskScore} />
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">{visitor.visitCount}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{visitor.pagesVisited?.length || 0}</td>
                  <td className="px-6 py-4 text-sm text-slate-500">
                    {new Date(visitor.lastSeen).toLocaleString()}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2 flex-wrap">
                      {visitor.riskFactors?.slice(0, 3).map((factor, i) => (
                        <span
                          key={i}
                          className="inline-flex items-center px-2 py-1 text-xs rounded bg-slate-100 text-slate-600"
                          title={factor.detail}
                        >
                          {factor.signal}
                        </span>
                      ))}
                      {visitor.riskFactors?.length > 3 && (
                        <span className="text-xs text-slate-400">
                          +{visitor.riskFactors.length - 3} more
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Link
                      to={`/visitor/${visitor.visitorId}`}
                      className="text-emerald-600 hover:text-emerald-700"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

