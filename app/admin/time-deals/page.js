"use client";
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { getUser } from '@/lib/auth';
import { Plus, Clock, DollarSign, Package, Zap, Edit2, Trash2, Eye, Calendar, TrendingUp, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import TimeDealForm from '@/components/forms/TimeDealForm';

export default function TimeDealsPage() {
  const [deals, setDeals] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingDeal, setEditingDeal] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all'); // all, active, expired, upcoming

  useEffect(() => {
    loadDeals();
    loadProducts();
  }, []);

  const loadDeals = async () => {
    try {
      const { data, error } = await supabase
        .from('time_deals')
        .select(`
          *,
          products (
            id,
            name,
            image_url,
            base_price
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDeals(data || []);
    } catch (error) {
      console.error('Error loading deals:', error);
      toast.error('Failed to load deals');
    } finally {
      setLoading(false);
    }
  };

  const loadProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, base_price, image_url')
        .order('name');

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error loading products:', error);
    }
  };

  const handleSaveDeal = async (dealData) => {
    const saveToast = toast.loading(editingDeal ? 'Updating deal...' : 'Creating deal...');

    try {
      const user = await getUser();
      if (!user) {
        toast.error('Please log in to save deals', { id: saveToast });
        return;
      }

      if (editingDeal) {
        const { error } = await supabase
          .from('time_deals')
          .update({
            ...dealData,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingDeal.id);

        if (error) throw error;
        toast.success('Deal updated successfully!', { id: saveToast });
      } else {
        const { error } = await supabase
          .from('time_deals')
          .insert({
            ...dealData,
            user_id: user.id,
            sold_quantity: 0
          });

        if (error) throw error;
        toast.success('Deal created successfully!', { id: saveToast });
      }

      setShowForm(false);
      setEditingDeal(null);
      loadDeals();
    } catch (error) {
      console.error('Error saving deal:', error);
      toast.error('Failed to save deal: ' + error.message, { id: saveToast });
    }
  };

  const handleDeleteDeal = async (deal) => {
    if (!confirm(`Are you sure you want to delete "${deal.title}"?`)) return;

    const deleteToast = toast.loading('Deleting deal...');

    try {
      const { error } = await supabase
        .from('time_deals')
        .delete()
        .eq('id', deal.id);

      if (error) throw error;
      toast.success('Deal deleted successfully!', { id: deleteToast });
      loadDeals();
    } catch (error) {
      console.error('Error deleting deal:', error);
      toast.error('Failed to delete deal', { id: deleteToast });
    }
  };

  const toggleDealStatus = async (deal) => {
    try {
      const { error } = await supabase
        .from('time_deals')
        .update({ is_active: !deal.is_active })
        .eq('id', deal.id);

      if (error) throw error;
      toast.success(`Deal ${!deal.is_active ? 'activated' : 'deactivated'}`);
      loadDeals();
    } catch (error) {
      console.error('Error toggling deal status:', error);
      toast.error('Failed to update status');
    }
  };

  const getDealStatus = (deal) => {
    const now = new Date();
    const startTime = new Date(deal.start_time);
    const endTime = new Date(deal.end_time);

    if (!deal.is_active) return { status: 'inactive', label: 'Inactive', color: 'gray' };
    if (now < startTime) return { status: 'upcoming', label: 'Upcoming', color: 'blue' };
    if (now > endTime) return { status: 'expired', label: 'Expired', color: 'red' };
    if (deal.remaining_quantity <= 0) return { status: 'sold_out', label: 'Sold Out', color: 'orange' };
    return { status: 'active', label: 'Active', color: 'green' };
  };

  const getTimeRemaining = (endTime) => {
    const now = new Date();
    const end = new Date(endTime);
    const diff = end - now;

    if (diff <= 0) return 'Expired';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const filteredDeals = deals.filter(deal => {
    const { status } = getDealStatus(deal);
    if (filterStatus === 'all') return true;
    if (filterStatus === 'active') return status === 'active';
    if (filterStatus === 'expired') return status === 'expired';
    if (filterStatus === 'upcoming') return status === 'upcoming';
    return true;
  });

  // Calculate statistics
  const stats = {
    total: deals.length,
    active: deals.filter(d => getDealStatus(d).status === 'active').length,
    upcoming: deals.filter(d => getDealStatus(d).status === 'upcoming').length,
    expired: deals.filter(d => getDealStatus(d).status === 'expired').length
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Zap className="w-7 h-7 text-orange-500" />
            Time Deals (Flash Sales)
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Create limited-time offers with countdown timers
          </p>
        </div>
        <button
          onClick={() => {
            setEditingDeal(null);
            setShowForm(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create Deal
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-gray-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Deals</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-gray-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Active Now</p>
              <p className="text-2xl font-bold text-green-600">{stats.active}</p>
            </div>
            <Zap className="w-8 h-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-gray-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Upcoming</p>
              <p className="text-2xl font-bold text-blue-600">{stats.upcoming}</p>
            </div>
            <Calendar className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-gray-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Expired</p>
              <p className="text-2xl font-bold text-gray-600">{stats.expired}</p>
            </div>
            <Clock className="w-8 h-8 text-gray-500" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {['all', 'active', 'upcoming', 'expired'].map(status => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filterStatus === status
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-slate-600'
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      {/* Deals List */}
      <div className="space-y-4">
        {filteredDeals.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-lg p-12 text-center border border-gray-200 dark:border-slate-700">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">
              {filterStatus === 'all' ? 'No deals yet. Create your first time deal!' : `No ${filterStatus} deals`}
            </p>
          </div>
        ) : (
          filteredDeals.map(deal => {
            const dealStatus = getDealStatus(deal);
            const statusColors = {
              green: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
              blue: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
              red: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
              orange: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
              gray: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
            };

            return (
              <div
                key={deal.id}
                className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-gray-200 dark:border-slate-700 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start gap-4">
                  {/* Product Image */}
                  {deal.products?.image_url && (
                    <img
                      src={deal.products.image_url}
                      alt={deal.products.name}
                      className="w-20 h-20 object-cover rounded-lg"
                    />
                  )}

                  {/* Deal Info */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {deal.title}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {deal.products?.name}
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColors[dealStatus.color]}`}>
                        {dealStatus.label}
                      </span>
                    </div>

                    {deal.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                        {deal.description}
                      </p>
                    )}

                    {/* Price & Discount */}
                    <div className="flex items-center gap-4 mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold text-green-600">
                          ${deal.deal_price}
                        </span>
                        <span className="text-sm text-gray-500 line-through">
                          ${deal.original_price}
                        </span>
                        <span className="px-2 py-1 bg-red-500 text-white text-xs font-bold rounded">
                          {deal.discount_percentage}% OFF
                        </span>
                      </div>
                    </div>

                    {/* Time & Quantity Info */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500 dark:text-gray-400">Time Remaining</p>
                        <p className="font-semibold text-gray-900 dark:text-white flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {getTimeRemaining(deal.end_time)}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500 dark:text-gray-400">Sold</p>
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {deal.sold_quantity} / {deal.total_quantity}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500 dark:text-gray-400">Start Date</p>
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {new Date(deal.start_time).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500 dark:text-gray-400">End Date</p>
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {new Date(deal.end_time).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-3">
                      <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                        <span>Stock Progress</span>
                        <span>{deal.remaining_quantity} remaining</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2">
                        <div
                          className="bg-indigo-600 h-2 rounded-full transition-all"
                          style={{
                            width: `${((deal.total_quantity - deal.remaining_quantity) / deal.total_quantity) * 100}%`
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => toggleDealStatus(deal)}
                      className={`p-2 rounded-lg transition-colors ${
                        deal.is_active
                          ? 'bg-green-100 dark:bg-green-900/20 text-green-600 hover:bg-green-200'
                          : 'bg-gray-100 dark:bg-slate-700 text-gray-600 hover:bg-gray-200'
                      }`}
                      title={deal.is_active ? 'Deactivate' : 'Activate'}
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        setEditingDeal(deal);
                        setShowForm(true);
                      }}
                      className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                      title="Edit"
                    >
                      <Edit2 className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                    </button>
                    <button
                      onClick={() => handleDeleteDeal(deal)}
                      className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Deal Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                {editingDeal ? 'Edit Time Deal' : 'Create New Time Deal'}
              </h2>
              <TimeDealForm
                deal={editingDeal}
                products={products}
                onSave={handleSaveDeal}
                onCancel={() => {
                  setShowForm(false);
                  setEditingDeal(null);
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
