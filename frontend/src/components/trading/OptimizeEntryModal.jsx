import { useState, useEffect } from 'react';
import { X, TrendingDown, Activity, DollarSign } from 'lucide-react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001/api';

export default function OptimizeEntryModal({ isOpen, onClose, analysis, riskData }) {
  const [optimizationData, setOptimizationData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isOpen && analysis && riskData) {
      fetchOptimization();
    }
  }, [isOpen, analysis]);

  const fetchOptimization = async () => {
    setIsLoading(true);
    try {
      const response = await axios.post(`${API_URL}/optimize-entry`, {
        symbol: analysis.symbol,
        current_price: analysis.current_price,
        ema_20: analysis.indicators.price.ema_20,
        ema_50: analysis.indicators.price.ema_50,
        support: riskData.support,
        resistance: riskData.resistance,
        atr: riskData.atr_value,
        current_rr: riskData.risk_reward_ratio
      });

      if (response.data.success) {
        setOptimizationData(response.data.optimization);
      }
    } catch (error) {
      console.error('Optimization error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  // Calculate R/R for each entry point
  const calculateRR = (entryPrice) => {
    const sl = entryPrice * 0.97; // 3% SL
    const tp = riskData.resistance;
    const risk = entryPrice - sl;
    const reward = tp - entryPrice;
    return (reward / risk).toFixed(2);
  };

  const priceZones = [
    {
      name: 'Current Price',
      icon: <Activity className="h-5 w-5 text-blue-400" />,
      price: analysis?.current_price,
      rr: riskData?.risk_reward_ratio,
      description: 'Intrare imediată la prețul curent',
      color: 'from-blue-500/20 to-cyan-500/20',
      borderColor: 'border-blue-500/50'
    },
    {
      name: 'Support Level',
      icon: <TrendingDown className="h-5 w-5 text-green-400" />,
      price: riskData?.support,
      rr: calculateRR(riskData?.support),
      description: 'Așteptați retragere la suport major',
      color: 'from-green-500/20 to-emerald-500/20',
      borderColor: 'border-green-500/50'
    },
    {
      name: 'EMA 20',
      icon: <DollarSign className="h-5 w-5 text-purple-400" />,
      price: analysis?.indicators?.price?.ema_20,
      rr: calculateRR(analysis?.indicators?.price?.ema_20),
      description: 'Intrare la media mobilă de 20 perioade',
      color: 'from-purple-500/20 to-pink-500/20',
      borderColor: 'border-purple-500/50'
    }
  ];

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="glass-card max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 glass-card border-b border-white/10 p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <span className="text-xl">🎯</span>
            </div>
            <div>
              <h2 className="font-heading text-xl font-bold">Optimize Entry</h2>
              <p className="text-sm text-muted-foreground">{analysis?.symbol} - Găsește cel mai bun preț de intrare</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="h-12 w-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-muted-foreground">Se calculează optimizarea...</p>
            </div>
          ) : (
            <>
              {/* Current R/R Warning */}
              {riskData?.risk_reward_ratio < 1.5 && (
                <div className="glass-card-red p-4 border border-red-500/30 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl">⚠️</span>
                    <h3 className="font-bold text-red-400">Raport R/R Nefavorabil</h3>
                  </div>
                  <p className="text-sm text-red-300">
                    Intrarea la prețul curent oferă un R/R de doar {riskData?.risk_reward_ratio}:1. 
                    Așteptați un pullback pentru un setup mai profitabil.
                  </p>
                </div>
              )}

              {/* Price Zones */}
              <div className="space-y-4">
                <h3 className="indicator-label">Zone de Preț Recomandate</h3>
                {priceZones.map((zone, index) => (
                  <div
                    key={index}
                    className={`glass-card p-5 border ${zone.borderColor} bg-gradient-to-br ${zone.color} rounded-lg hover:scale-[1.02] transition-transform cursor-pointer`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        {zone.icon}
                        <div>
                          <h4 className="font-bold text-sm uppercase tracking-wider">{zone.name}</h4>
                          <p className="text-xs text-muted-foreground mt-1">{zone.description}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono text-2xl font-bold">${zone.price?.toFixed(2)}</div>
                        <div className={`text-xs font-bold mt-1 ${parseFloat(zone.rr) >= 2.0 ? 'text-green-400' : parseFloat(zone.rr) >= 1.5 ? 'text-yellow-400' : 'text-red-400'}`}>
                          R/R: 1:{zone.rr}
                        </div>
                      </div>
                    </div>

                    {/* R/R Bar */}
                    <div className="w-full bg-black/30 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${parseFloat(zone.rr) >= 2.0 ? 'bg-green-500' : parseFloat(zone.rr) >= 1.5 ? 'bg-yellow-500' : 'bg-red-500'}`}
                        style={{ width: `${Math.min(parseFloat(zone.rr) * 25, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Optimization Message */}
              {optimizationData && (
                <div className="glass-card p-4 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/30 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl">💡</span>
                    <h3 className="font-bold text-indigo-400">Recomandare AI</h3>
                  </div>
                  <p className="text-sm">{optimizationData.message}</p>
                  <p className="text-xs text-muted-foreground mt-2">{optimizationData.action}</p>
                </div>
              )}

              {/* Best Entry Recommendation */}
              <div className="glass-card p-4 bg-black/30 border border-green-500/30 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">✅</span>
                  <h3 className="font-bold text-green-400">Cea Mai Bună Intrare</h3>
                </div>
                <p className="text-sm">
                  Pentru un R/R optimal (≥ 2:1), plasați un <span className="font-bold text-green-400">Limit Order</span> la 
                  <span className="font-mono font-bold text-xl text-green-400"> ${riskData?.support?.toFixed(2)}</span> (Support Level).
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Acest preț oferă un raport Risc/Recompensă de {calculateRR(riskData?.support)}:1, 
                  semnificativ mai bun decât intrarea imediată.
                </p>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-white/10 p-6">
          <button
            onClick={onClose}
            className="w-full console-btn py-3 font-bold"
          >
            Închide
          </button>
        </div>
      </div>
    </div>
  );
}
