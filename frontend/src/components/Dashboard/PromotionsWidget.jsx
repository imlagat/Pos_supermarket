import { useEffect, useState } from 'react';
import api from '../../services/api';
import { Tag, Percent, Gift, Calendar } from 'lucide-react';

export default function PromotionsWidget() {
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPromotions();
  }, []);

  const fetchPromotions = async () => {
    try {
      const res = await api.get('/promotions/active');
      setPromotions(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="bg-white rounded-2xl shadow-lg p-6">Loading promotions...</div>;

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
        <Tag className="text-orange-600" /> Active Promotions
      </h2>
      {promotions.length === 0 ? (
        <p className="text-gray-500">No active promotions at the moment.</p>
      ) : (
        <div className="space-y-3">
          {promotions.map(promo => (
            <div key={promo.id} className="border-l-4 border-orange-600 pl-3 py-2 bg-gray-50 rounded-r-lg">
              <div className="font-medium text-gray-800">{promo.name}</div>
              <div className="text-sm text-gray-600">
                {promo.type === 'bogo' && `Buy ${promo.min_quantity} Get ${promo.free_quantity} Free`}
                {promo.type === 'percentage' && `${promo.value}% off`}
                {promo.type === 'fixed' && `Ksh ${promo.value} off`}
                {promo.type === 'member_tier' && `${promo.tier} tier: ${promo.discount_percentage}% off`}
                {promo.type === 'expiry_markdown' && `${promo.discount_percentage}% off (expiring in ${promo.days_left_min}-${promo.days_left_max} days)`}
              </div>
              {promo.starts_at && promo.ends_at && (
                <div className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                  <Calendar size={12} /> {new Date(promo.starts_at).toLocaleDateString()} - {new Date(promo.ends_at).toLocaleDateString()}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
