import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAuthStore } from '../../stores/authStore';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { X, UserCog, KeyRound, Loader2, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function SwitchAccountModal({ isOpen, onClose }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [pin, setPin] = useState('');
  const [switching, setSwitching] = useState(false);
  const { switchAccount, user: currentUser } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      fetchUsers();
    } else {
      setSelectedUser(null);
      setPin('');
    }
  }, [isOpen]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/users');
      // Filter out admins (since we shouldn't switch to other admins) and current user
      const switchable = res.data.filter(u => u.role !== 'admin' && u.id !== currentUser?.id);
      setUsers(switchable);
    } catch (err) {
      toast.error('Failed to load users for switching');
    } finally {
      setLoading(false);
    }
  };

  const handleSwitch = async (e) => {
    e.preventDefault();
    if (!selectedUser || !pin) return;

    setSwitching(true);
    try {
      await switchAccount(selectedUser.id, pin);
      toast.success(`Switched to ${selectedUser.name}`);
      onClose();
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid PIN or switch failed');
    } finally {
      setSwitching(false);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] flex flex-col">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="bg-orange-100 text-orange-600 p-2 rounded-xl">
              <UserCog size={20} />
            </div>
            <h2 className="text-xl font-bold text-gray-800">Switch Account</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="animate-spin text-orange-500 w-8 h-8" />
            </div>
          ) : !selectedUser ? (
            <div className="space-y-4">
              <p className="text-sm text-gray-500 font-medium">Select a user to switch to:</p>
              <div className="grid gap-2">
                {users.length === 0 && <p className="text-gray-400 text-center py-4">No eligible users found.</p>}
                {users.map(u => (
                  <button
                    key={u.id}
                    onClick={() => setSelectedUser(u)}
                    className="flex items-center gap-4 p-4 border border-gray-100 rounded-xl hover:border-orange-200 hover:bg-orange-50 transition text-left"
                  >
                    <div className="bg-gray-100 p-2 rounded-full text-gray-500">
                      <User size={20} />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800">{u.name}</p>
                      <p className="text-xs text-gray-500 capitalize">{u.role}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <form onSubmit={handleSwitch} className="space-y-6">
              <div className="flex items-center gap-4 p-4 bg-orange-50 rounded-xl mb-6 border border-orange-100">
                 <div className="bg-white p-2 rounded-full text-orange-500 shadow-sm">
                   <User size={20} />
                 </div>
                 <div>
                   <p className="text-xs text-orange-600 font-medium uppercase tracking-wider">Switching To</p>
                   <p className="font-bold text-gray-800">{selectedUser.name}</p>
                 </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Admin PIN</label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="password"
                    maxLength={4}
                    placeholder="Enter your 4-digit PIN"
                    value={pin}
                    onChange={e => setPin(e.target.value.replace(/\D/g, ''))}
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none font-mono tracking-[0.5em] text-lg text-center"
                    required
                    autoFocus
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2 text-center">Enter your Admin PIN to authorize the switch</p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setSelectedUser(null)}
                  className="flex-1 px-4 py-3 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 transition font-medium"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={switching || pin.length < 4}
                  className="flex-1 px-4 py-3 bg-orange-600 text-white rounded-xl hover:bg-orange-700 transition font-medium disabled:opacity-50 flex items-center justify-center"
                >
                  {switching ? <Loader2 className="animate-spin w-5 h-5" /> : 'Confirm Switch'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
