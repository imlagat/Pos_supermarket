import { useState, useEffect } from 'react';
import api from '../../services/api';
import { Plus } from 'lucide-react';

export default function ProductCard({ product, onAdd }) {
  const [units, setUnits] = useState([]);
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [price, setPrice] = useState(product.base_price);
  const [unitType, setUnitType] = useState('piece');
  const [unitId, setUnitId] = useState(null);



  useEffect(() => {
    const fetchUnits = async () => {
      try {
        const res = await api.get(`/products/${product.id}/units`);
        setUnits(res.data);
        if (res.data.length > 0) {
          setSelectedUnit(res.data[0]);
          setPrice(res.data[0].price);
          setUnitType('crate');
          setUnitId(res.data[0].id);
        }
      } catch (err) { }
    };
    fetchUnits();
  }, [product.id]);

  const handlePieceClick = () => {
    setUnitType('piece');
    setPrice(product.base_price);
    setUnitId(null);
  };

  const handleCrateClick = (unit) => {
    setUnitType('crate');
    setSelectedUnit(unit);
    setPrice(unit.price);
    setUnitId(unit.id);
  };

  const handleAdd = () => {
    onAdd(product, 1, price, unitId);
  };

  return (
    <div className="border border-gray-200 rounded-xl p-4 hover:shadow-lg transition-all cursor-pointer bg-white">
      <div className="font-semibold text-gray-800 truncate">{product.name}</div>
      <div className="text-lg font-bold text-amber-600 mt-1">Ksh {price}</div>
      <div className="flex gap-2 mt-2">
        <button
          onClick={handlePieceClick}
          className={`text-xs px-2 py-1 rounded ${unitType === 'piece' ? 'bg-amber-500 text-white' : 'bg-gray-200 text-gray-700'}`}
        >
          Piece (Ksh {product.base_price})
        </button>
        {units.map(unit => (
          <button
            key={unit.id}
            onClick={() => handleCrateClick(unit)}
            className={`text-xs px-2 py-1 rounded ${unitType === 'crate' && selectedUnit?.id === unit.id ? 'bg-amber-500 text-white' : 'bg-gray-200 text-gray-700'}`}
          >
            {unit.unit_name} (Ksh {unit.price})
          </button>
        ))}
      </div>
      <button
        onClick={handleAdd}
        className="mt-3 w-full bg-amber-50 text-amber-600 py-1.5 rounded-lg text-sm font-medium hover:bg-amber-100 transition flex items-center justify-center gap-1"
      >
        <Plus size={14} /> Add
      </button>
    </div>
  );
}
