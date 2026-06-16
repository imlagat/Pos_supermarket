import React from 'react';
import { X, Clock, Play } from 'lucide-react';
import { useCartStore } from '../../stores/cartStore';

export default function HeldTransactionsModal({ onClose }) {
  const { heldTransactions, resumeTransaction, removeHeldTransaction } = useCartStore();

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-[24px] w-full max-w-2xl overflow-hidden shadow-2xl animate-fade-in relative">
        <button onClick={onClose} className="absolute top-5 right-5 text-gray-400 hover:text-gray-800 transition">
          <X size={24} />
        </button>
        
        <div className="p-8 pb-6 border-b border-gray-100">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Clock className="text-orange-500" /> Held Transactions
          </h2>
          <p className="text-gray-500 text-sm mt-1">Resume or discard previously held carts</p>
        </div>

        <div className="p-6 max-h-[60vh] overflow-y-auto bg-gray-50">
          {heldTransactions.length === 0 ? (
            <div className="text-center text-gray-400 py-12">
              <Clock size={48} className="mx-auto mb-3 opacity-30" />
              <p>No held transactions</p>
            </div>
          ) : (
            <div className="space-y-4">
              {heldTransactions.map(t => (
                <div key={t.id} className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm flex items-center justify-between">
                  <div>
                    <div className="font-bold text-gray-800">{t.note}</div>
                    <div className="text-sm text-gray-500 mt-1">
                      {t.items.length} items • Total: Ksh {t.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        removeHeldTransaction(t.id);
                      }}
                      className="px-4 py-2 text-sm font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition"
                    >
                      Discard
                    </button>
                    <button
                      onClick={() => {
                        resumeTransaction(t.id);
                        onClose();
                      }}
                      className="px-4 py-2 text-sm font-semibold text-white bg-orange-500 hover:bg-orange-600 rounded-lg flex items-center gap-2 transition shadow-sm"
                    >
                      <Play size={16} /> Resume
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
