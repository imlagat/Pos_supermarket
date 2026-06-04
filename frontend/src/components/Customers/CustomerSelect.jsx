import { useEffect, useState } from 'react';
import api from '../../services/api';

export default function CustomerSelect({ onSelect, selectedId }) {
  const [customers, setCustomers] = useState([]);
  useEffect(() => { api.get('/customers').then(res => setCustomers(res.data)).catch(() => {}); }, []);
  return (
    <select value={selectedId || ''} onChange={e => onSelect(e.target.value || null)} className="border p-1 rounded">
      <option value="">Walk-in Customer</option>
      {customers.map(c => <option key={c.id} value={c.id}>{c.name} ({c.phone})</option>)}
    </select>
  );
}
