import { 
  Bot, 
  Globe, 
  Monitor, 
  Shield, 
  Zap, 
  Eye, 
  Server,
  Code,
  AlertTriangle
} from 'lucide-react';

const signalIcons = {
  'Bot Detected': Bot,
  'VPN Detected': Globe,
  'Proxy Detected': Globe,
  'Tor Network': Shield,
  'Datacenter IP': Server,
  'Incognito Mode': Eye,
  'Virtual Machine': Monitor,
  'Browser Tampering': Code,
  'High Activity': Zap,
  'Rapid Browsing': Zap,
  'Fast Browsing': Zap,
  'Developer Tools Open': Code,
  'default': AlertTriangle
};

const severityColors = {
  critical: 'bg-red-50 border-red-200 text-red-700',
  high: 'bg-orange-50 border-orange-200 text-orange-700',
  medium: 'bg-amber-50 border-amber-200 text-amber-700',
  low: 'bg-slate-50 border-slate-200 text-slate-700'
};

export default function SignalsList({ factors }) {
  if (!factors || factors.length === 0) {
    return (
      <div className="text-center py-8 text-slate-400">
        No risk signals detected
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {factors.map((factor, i) => {
        const Icon = signalIcons[factor.signal] || signalIcons.default;
        
        return (
          <div 
            key={i}
            className={`p-3 rounded-lg border ${severityColors[factor.severity] || severityColors.low}`}
          >
            <div className="flex items-start gap-3">
              <Icon className="w-5 h-5 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{factor.signal}</span>
                  <span className="text-sm opacity-75">+{factor.points} pts</span>
                </div>
                <p className="text-sm opacity-75 mt-0.5">{factor.detail}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

