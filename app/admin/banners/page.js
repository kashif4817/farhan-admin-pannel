"use client";
import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import toast from 'react-hot-toast';
import {
  Image,
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  MoveUp,
  MoveDown,
  Calendar,
  Link as LinkIcon,
  Layers
} from 'lucide-react';
import BannerForm from '@/components/forms/BannerForm';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    }
  }
);

export default function BannersPage() {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingBanner, setEditingBanner] = useState(null);
  const [filterType, setFilterType] = useState('all');

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('banners')
        .select('*')
        .order('position', { ascending: true });

      if (error) throw error;
      setBanners(data || []);
    } catch (error) {
      console.error('Error fetching banners:', error);
      toast.error('Failed to load banners');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (bannerData) => {
    try {
      if (editingBanner) {
        // Update existing banner
        const { error } = await supabase
          .from('banners')
          .update(bannerData)
          .eq('id', editingBanner.id);

        if (error) throw error;
        toast.success('Banner updated successfully');
      } else {
        // Create new banner
        const { error } = await supabase
          .from('banners')
          .insert([bannerData]);

        if (error) throw error;
        toast.success('Banner created successfully');
      }

      setShowForm(false);
      setEditingBanner(null);
      fetchBanners();
    } catch (error) {
      console.error('Error saving banner:', error);
      toast.error('Failed to save banner');
      return false;
    }
  };

  const handleEdit = (banner) => {
    setEditingBanner(banner);
    setShowForm(true);
  };

  const handleDelete = async (banner) => {
    if (!confirm(`Are you sure you want to delete "${banner.title}"?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('banners')
        .delete()
        .eq('id', banner.id);

      if (error) throw error;
      toast.success('Banner deleted successfully');
      fetchBanners();
    } catch (error) {
      console.error('Error deleting banner:', error);
      toast.error('Failed to delete banner');
    }
  };

  const toggleActive = async (banner) => {
    try {
      const { error } = await supabase
        .from('banners')
        .update({ is_active: !banner.is_active })
        .eq('id', banner.id);

      if (error) throw error;
      toast.success(`Banner ${!banner.is_active ? 'activated' : 'deactivated'}`);
      fetchBanners();
    } catch (error) {
      console.error('Error toggling banner:', error);
      toast.error('Failed to update banner status');
    }
  };

  const movePosition = async (banner, direction) => {
    const currentIndex = banners.findIndex(b => b.id === banner.id);
    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

    if (newIndex < 0 || newIndex >= banners.length) return;

    const otherBanner = banners[newIndex];

    try {
      // Swap positions
      await supabase
        .from('banners')
        .update({ position: otherBanner.position })
        .eq('id', banner.id);

      await supabase
        .from('banners')
        .update({ position: banner.position })
        .eq('id', otherBanner.id);

      toast.success('Position updated');
      fetchBanners();
    } catch (error) {
      console.error('Error updating position:', error);
      toast.error('Failed to update position');
    }
  };

  const filteredBanners = filterType === 'all'
    ? banners
    : banners.filter(b => b.banner_type === filterType);

  const getBannerTypeColor = (type) => {
    const colors = {
      slider: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      promotional: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      hero: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      sidebar: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Banner Management
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Manage homepage sliders and promotional banners
            </p>
          </div>
          <button
            onClick={() => {
              setEditingBanner(null);
              setShowForm(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add Banner
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-4 shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Banners</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{banners.length}</p>
              </div>
              <Image className="w-8 h-8 text-indigo-600" />
            </div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-lg p-4 shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Active</p>
                <p className="text-2xl font-bold text-green-600">
                  {banners.filter(b => b.is_active).length}
                </p>
              </div>
              <Eye className="w-8 h-8 text-green-600" />
            </div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-lg p-4 shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Sliders</p>
                <p className="text-2xl font-bold text-blue-600">
                  {banners.filter(b => b.banner_type === 'slider').length}
                </p>
              </div>
              <Layers className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-lg p-4 shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Promotional</p>
                <p className="text-2xl font-bold text-purple-600">
                  {banners.filter(b => b.banner_type === 'promotional').length}
                </p>
              </div>
              <Calendar className="w-8 h-8 text-purple-600" />
            </div>
          </div>
        </div>

        {/* Filter */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow mb-6 p-4">
          <div className="flex gap-2 flex-wrap">
            {['all', 'slider', 'promotional', 'hero', 'sidebar'].map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filterType === type
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600'
                }`}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Banners List */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        ) : filteredBanners.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-12 text-center">
            <Image className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No banners found
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Get started by creating your first banner
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
            >
              <Plus className="w-5 h-5" />
              Add Banner
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredBanners.map((banner, index) => (
              <div
                key={banner.id}
                className="bg-white dark:bg-slate-800 rounded-lg shadow overflow-hidden"
              >
                <div className="flex flex-col md:flex-row">
                  {/* Banner Image */}
                  <div className="md:w-1/3 h-48 md:h-auto">
                    <img
                      src={banner.image_url}
                      alt={banner.title}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Banner Info */}
                  <div className="flex-1 p-6">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                            {banner.title}
                          </h3>
                          <span className={`px-2 py-1 text-xs rounded-full ${getBannerTypeColor(banner.banner_type)}`}>
                            {banner.banner_type}
                          </span>
                          {!banner.is_active && (
                            <span className="px-2 py-1 text-xs rounded-full bg-gray-200 text-gray-700 dark:bg-slate-600 dark:text-gray-300">
                              Inactive
                            </span>
                          )}
                        </div>
                        {banner.subtitle && (
                          <p className="text-gray-600 dark:text-gray-400 mb-3">
                            {banner.subtitle}
                          </p>
                        )}
                        {banner.link_url && (
                          <div className="flex items-center gap-2 text-sm text-indigo-600 dark:text-indigo-400">
                            <LinkIcon className="w-4 h-4" />
                            <span>{banner.link_text || 'View Link'}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Banner Meta */}
                    <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400 mb-4">
                      <div>Position: {banner.position}</div>
                      {banner.start_date && (
                        <div>Start: {new Date(banner.start_date).toLocaleDateString()}</div>
                      )}
                      {banner.end_date && (
                        <div>End: {new Date(banner.end_date).toLocaleDateString()}</div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => toggleActive(banner)}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                          banner.is_active
                            ? 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900 dark:text-green-200'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-slate-700 dark:text-gray-300'
                        }`}
                      >
                        {banner.is_active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                        {banner.is_active ? 'Active' : 'Inactive'}
                      </button>
                      <button
                        onClick={() => handleEdit(banner)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-200 rounded-lg text-sm transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(banner)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900 dark:text-red-200 rounded-lg text-sm transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </button>
                      {index > 0 && (
                        <button
                          onClick={() => movePosition(banner, 'up')}
                          className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-slate-700 dark:text-gray-300 rounded-lg text-sm transition-colors"
                        >
                          <MoveUp className="w-4 h-4" />
                        </button>
                      )}
                      {index < filteredBanners.length - 1 && (
                        <button
                          onClick={() => movePosition(banner, 'down')}
                          className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-slate-700 dark:text-gray-300 rounded-lg text-sm transition-colors"
                        >
                          <MoveDown className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Banner Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {editingBanner ? 'Edit Banner' : 'Add New Banner'}
                </h2>
                <button
                  onClick={() => {
                    setShowForm(false);
                    setEditingBanner(null);
                  }}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  ✕
                </button>
              </div>
              <BannerForm
                banner={editingBanner}
                onSave={handleSave}
                onCancel={() => {
                  setShowForm(false);
                  setEditingBanner(null);
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
