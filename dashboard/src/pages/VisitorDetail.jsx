import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Clock, 
  Globe, 
  FileText,
  AlertTriangle,
  Shield,
  Eye
} from 'lucide-react';
import RiskBadge from '../components/RiskBadge';
import SignalsList from '../components/SignalsList';

export default function VisitorDetail({ storeId }) {
  const { visitorId } = useParams();
  const [visitor, setVisitor] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/visitor/${storeId}/${visitorId}`)
      .then(res => res.json())
      .then(setVisitor)
      .finally(() => setLoading(false));
  }, [storeId, visitorId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  if (!visitor) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500">Visitor not found</p>
        <Link to="/visitors" className="text-emerald-600 hover:text-emerald-700 mt-4 inline-block">
          Back to Visitors
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/visitors" className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5 text-slate-500" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-slate-900 font-mono">{visitor.visitorId}</h1>
          <p className="text-slate-500">First seen: {new Date(visitor.firstSeen).toLocaleString()}</p>
        </div>
        <RiskBadge level={visitor.riskLevel} score={visitor.highestRiskScore} size="lg" />
      </div>
      
      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="flex items-center gap-2 text-slate-500 mb-1">
            <Eye className="w-4 h-4" />
            <span className="text-sm">Total Visits</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">{visitor.visitCount}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="flex items-center gap-2 text-slate-500 mb-1">
            <FileText className="w-4 h-4" />
            <span className="text-sm">Pages Viewed</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">{visitor.pagesVisited?.length || 0}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="flex items-center gap-2 text-slate-500 mb-1">
            <Clock className="w-4 h-4" />
            <span className="text-sm">Last Seen</span>
          </div>
          <p className="text-lg font-semibold text-slate-900">
            {new Date(visitor.lastSeen).toLocaleTimeString()}
          </p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="flex items-center gap-2 text-slate-500 mb-1">
            <Shield className="w-4 h-4" />
            <span className="text-sm">Risk Score</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">{visitor.highestRiskScore}/100</p>
        </div>
      </div>
      
      {/* Two Column */}
      <div className="grid grid-cols-2 gap-6">
        {/* Risk Signals */}
        <div className="bg-white rounded-xl border border-slate-200">
          <div className="p-4 border-b border-slate-200">
            <h2 className="font-semibold text-slate-900 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              Risk Signals Detected
            </h2>
          </div>
          <div className="p-4">
            <SignalsList factors={visitor.riskFactors} />
          </div>
        </div>
        
        {/* Pages Visited */}
        <div className="bg-white rounded-xl border border-slate-200">
          <div className="p-4 border-b border-slate-200">
            <h2 className="font-semibold text-slate-900 flex items-center gap-2">
              <Globe className="w-5 h-5 text-blue-500" />
              Pages Visited
            </h2>
          </div>
          <div className="p-4 max-h-64 overflow-y-auto">
            {visitor.pagesVisited?.length > 0 ? (
              <ul className="space-y-2">
                {visitor.pagesVisited.map((page, i) => (
                  <li key={i} className="text-sm font-mono text-slate-600 truncate">
                    {page}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-slate-400 text-center py-4">No pages recorded</p>
            )}
          </div>
        </div>
      </div>
      
      {/* Visit History */}
      <div className="bg-white rounded-xl border border-slate-200">
        <div className="p-4 border-b border-slate-200">
          <h2 className="font-semibold text-slate-900">Visit History</h2>
        </div>
        <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
          {visitor.visits?.length > 0 ? (
            visitor.visits.map((visit, i) => (
              <div key={i} className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-mono text-slate-600">{visit.page?.path}</p>
                  <p className="text-xs text-slate-400">{new Date(visit.timestamp).toLocaleString()}</p>
                </div>
                <RiskBadge level={visit.riskAnalysis?.level} score={visit.riskAnalysis?.score} />
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-slate-400">
              No visit history available
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

