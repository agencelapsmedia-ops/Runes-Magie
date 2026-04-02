'use client';

import { useEffect, useState } from 'react';
import { formatPrice } from '@/lib/utils';

const STATUSES: Record<string, { label: string; color: string }> = {
  new: { label: 'Nouvelle', color: 'bg-blue-100 text-blue-800' },
  contacted: { label: 'Contactee', color: 'bg-yellow-100 text-yellow-800' },
  confirmed: { label: 'Confirmee', color: 'bg-indigo-100 text-indigo-800' },
  paid: { label: 'Payee', color: 'bg-emerald-100 text-emerald-800' },
  shipped: { label: 'Expediee', color: 'bg-purple-100 text-purple-800' },
  completed: { label: 'Terminee', color: 'bg-green-100 text-green-800' },
  cancelled: { label: 'Annulee', color: 'bg-red-100 text-red-800' },
};

interface OrderItem {
  id: string;
  productName: string;
  price: number;
  quantity: number;
  image: string | null;
}

interface Order {
  id: string;
  orderNumber: string;
  type: string;
  status: string;
  deliveryMethod: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string | null;
  customerMessage: string | null;
  shippingAddress: string | null;
  subtotal: number;
  shippingCost: number | null;
  total: number;
  stripeSessionId: string | null;
  stripePaymentId: string | null;
  paidAt: string | null;
  notes: string | null;
  items: OrderItem[];
  createdAt: string;
  updatedAt: string;
}

interface Stats {
  today: { orders: number; revenue: number };
  week: { orders: number; revenue: number };
  month: { orders: number; revenue: number };
  pending: number;
  totalOrders: number;
  conversionRate: number;
}

export default function CommandesPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [notesInput, setNotesInput] = useState('');
  const [shippingCostInput, setShippingCostInput] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchOrders();
    fetchStats();
  }, []);

  function fetchOrders() {
    setLoading(true);
    fetch('/api/admin/orders')
      .then((r) => r.json())
      .then((data) => setOrders(Array.isArray(data) ? data : []))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }

  function fetchStats() {
    fetch('/api/admin/orders/stats')
      .then((r) => r.json())
      .then(setStats)
      .catch(() => {});
  }

  async function updateStatus(orderId: string, status: string) {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        const updated = await res.json();
        setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, ...updated } : o)));
        if (selectedOrder?.id === orderId) setSelectedOrder({ ...selectedOrder, ...updated });
        fetchStats();
      }
    } catch {} finally { setSaving(false); }
  }

  async function saveNotes(orderId: string) {
    setSaving(true);
    try {
      await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: notesInput, shippingCost: shippingCostInput || null }),
      });
      fetchOrders();
    } catch {} finally { setSaving(false); }
  }

  function openOrder(order: Order) {
    setSelectedOrder(order);
    setNotesInput(order.notes || '');
    setShippingCostInput(order.shippingCost?.toString() || '');
  }

  const filtered = orders
    .filter((o) => statusFilter === 'all' || o.status === statusFilter)
    .filter((o) => typeFilter === 'all' || o.type === typeFilter)
    .filter((o) => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return o.customerName.toLowerCase().includes(q) ||
        o.customerEmail.toLowerCase().includes(q) ||
        o.orderNumber.toLowerCase().includes(q);
    });

  const formatDate = (d: string) => {
    const date = new Date(d);
    return date.toLocaleDateString('fr-CA', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600" />
      </div>
    );
  }

  return (
    <div>
      {/* Stats bar */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wider">Aujourd&apos;hui</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{stats.today.orders}</p>
            <p className="text-sm text-emerald-600 font-medium">{formatPrice(stats.today.revenue)}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wider">Cette semaine</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{stats.week.orders}</p>
            <p className="text-sm text-emerald-600 font-medium">{formatPrice(stats.week.revenue)}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wider">Ce mois</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{stats.month.orders}</p>
            <p className="text-sm text-emerald-600 font-medium">{formatPrice(stats.month.revenue)}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wider">En attente</p>
            <p className="text-2xl font-bold text-orange-600 mt-1">{stats.pending}</p>
            <p className="text-sm text-gray-500">sur {stats.totalOrders} total</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Commandes <span className="text-sm font-normal text-gray-500">({orders.length})</span>
        </h1>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <input type="text" placeholder="Rechercher..." value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-violet-500 w-64" />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-900">
          <option value="all">Tous les statuts</option>
          {Object.entries(STATUSES).map(([key, { label }]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-900">
          <option value="all">Tous les types</option>
          <option value="stripe">Stripe</option>
          <option value="email">Courriel</option>
        </select>
        <span className="text-sm text-gray-500">{filtered.length} commande{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Orders table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100 text-left">
              <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase">Date</th>
              <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase"># Commande</th>
              <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase">Client</th>
              <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase">Type</th>
              <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase">Livraison</th>
              <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase text-right">Total</th>
              <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase text-center">Statut</th>
              <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.map((order) => (
              <tr key={order.id} className="hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => openOrder(order)}>
                <td className="px-4 py-3 text-sm text-gray-600">{formatDate(order.createdAt)}</td>
                <td className="px-4 py-3 text-sm font-mono font-medium text-gray-900">{order.orderNumber}</td>
                <td className="px-4 py-3">
                  <p className="text-sm font-medium text-gray-900">{order.customerName}</p>
                  <p className="text-xs text-gray-500">{order.customerEmail}</p>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-block text-xs font-medium px-2 py-1 rounded-full ${
                    order.type === 'stripe' ? 'bg-blue-50 text-blue-700' : 'bg-amber-50 text-amber-700'
                  }`}>
                    {order.type === 'stripe' ? 'Stripe' : 'Courriel'}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {order.deliveryMethod === 'pickup' ? 'Ramassage' : 'Livraison'}
                </td>
                <td className="px-4 py-3 text-sm font-medium text-gray-900 text-right">{formatPrice(order.total)}</td>
                <td className="px-4 py-3 text-center">
                  <span className={`inline-block text-xs font-medium px-2.5 py-1 rounded-full ${STATUSES[order.status]?.color || 'bg-gray-100 text-gray-600'}`}>
                    {STATUSES[order.status]?.label || order.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <button onClick={(e) => { e.stopPropagation(); openOrder(order); }}
                    className="text-xs text-violet-600 hover:text-violet-800 font-medium">Voir</button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-gray-400 text-sm">Aucune commande trouvee.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Order detail modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setSelectedOrder(null)}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Commande #{selectedOrder.orderNumber}</h2>
                <p className="text-sm text-gray-500">{formatDate(selectedOrder.createdAt)}</p>
              </div>
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUSES[selectedOrder.status]?.color || 'bg-gray-100'}`}>
                {STATUSES[selectedOrder.status]?.label || selectedOrder.status}
              </span>
            </div>

            <div className="px-6 py-4 space-y-6">
              {/* Client info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Client</p>
                  <p className="text-sm font-medium text-gray-900">{selectedOrder.customerName}</p>
                  <p className="text-sm text-gray-600">{selectedOrder.customerEmail}</p>
                  {selectedOrder.customerPhone && <p className="text-sm text-gray-600">{selectedOrder.customerPhone}</p>}
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Livraison</p>
                  <p className="text-sm font-medium text-gray-900">
                    {selectedOrder.deliveryMethod === 'pickup' ? 'Ramassage en boutique' : 'Livraison'}
                  </p>
                  {selectedOrder.shippingAddress && <p className="text-sm text-gray-600">{selectedOrder.shippingAddress}</p>}
                  <p className="text-sm text-gray-500 mt-1">
                    Type: {selectedOrder.type === 'stripe' ? 'Paiement Stripe' : 'Demande courriel'}
                  </p>
                </div>
              </div>

              {/* Customer message */}
              {selectedOrder.customerMessage && (
                <div className="bg-amber-50 border-l-4 border-amber-400 p-3 rounded">
                  <p className="text-xs text-amber-600 uppercase tracking-wider mb-1">Message du client</p>
                  <p className="text-sm text-gray-700 italic">&ldquo;{selectedOrder.customerMessage}&rdquo;</p>
                </div>
              )}

              {/* Stripe info */}
              {selectedOrder.stripePaymentId && (
                <div className="bg-blue-50 p-3 rounded">
                  <p className="text-xs text-blue-600 uppercase tracking-wider mb-1">Paiement Stripe</p>
                  <p className="text-sm text-gray-700 font-mono">{selectedOrder.stripePaymentId}</p>
                  {selectedOrder.paidAt && <p className="text-sm text-gray-500">Paye le {formatDate(selectedOrder.paidAt)}</p>}
                </div>
              )}

              {/* Items */}
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Produits commandes</p>
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="px-3 py-2 text-xs text-gray-500 text-left">Produit</th>
                        <th className="px-3 py-2 text-xs text-gray-500 text-center">Qte</th>
                        <th className="px-3 py-2 text-xs text-gray-500 text-right">Prix</th>
                        <th className="px-3 py-2 text-xs text-gray-500 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {selectedOrder.items.map((item) => (
                        <tr key={item.id}>
                          <td className="px-3 py-2 text-sm text-gray-900">{item.productName}</td>
                          <td className="px-3 py-2 text-sm text-gray-600 text-center">{item.quantity}</td>
                          <td className="px-3 py-2 text-sm text-gray-600 text-right">{formatPrice(item.price)}</td>
                          <td className="px-3 py-2 text-sm font-medium text-gray-900 text-right">{formatPrice(item.price * item.quantity)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="mt-2 text-right space-y-1">
                  <p className="text-sm text-gray-600">Sous-total: {formatPrice(selectedOrder.subtotal)}</p>
                  {selectedOrder.deliveryMethod === 'shipping' && (
                    <div className="flex items-center justify-end gap-2">
                      <span className="text-sm text-gray-600">Livraison:</span>
                      <input type="number" step="0.01" min="0" value={shippingCostInput}
                        onChange={(e) => setShippingCostInput(e.target.value)}
                        placeholder="A definir"
                        className="w-24 px-2 py-1 text-sm border border-gray-300 rounded text-right text-gray-900" />
                      <span className="text-sm text-gray-500">$</span>
                    </div>
                  )}
                  <p className="text-lg font-bold text-gray-900">Total: {formatPrice(selectedOrder.total)}</p>
                </div>
              </div>

              {/* Status update */}
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Changer le statut</p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(STATUSES).map(([key, { label, color }]) => (
                    <button key={key} onClick={() => updateStatus(selectedOrder.id, key)}
                      disabled={saving || selectedOrder.status === key}
                      className={`text-xs font-medium px-3 py-1.5 rounded-full transition-all ${
                        selectedOrder.status === key
                          ? `${color} ring-2 ring-offset-1 ring-gray-400`
                          : 'bg-gray-100 text-gray-500 hover:bg-gray-200 cursor-pointer'
                      } ${saving ? 'opacity-50' : ''}`}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Notes internes</p>
                <textarea rows={3} value={notesInput} onChange={(e) => setNotesInput(e.target.value)}
                  placeholder="Ajouter des notes sur cette commande..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none" />
              </div>
            </div>

            {/* Actions */}
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
              <button onClick={() => setSelectedOrder(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
                Fermer
              </button>
              <button onClick={() => saveNotes(selectedOrder.id)} disabled={saving}
                className="px-4 py-2 text-sm font-medium text-white bg-violet-600 rounded-lg hover:bg-violet-700 disabled:opacity-50">
                {saving ? 'Enregistrement...' : 'Enregistrer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
