"use client";
import { useState, useEffect } from 'react';
import { Save, Clock, DollarSign, Package, Zap, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';

export default function TimeDealForm({ deal = null, products = [], onSave, onCancel }) {
  const [formData, setFormData] = useState({
    product_id: '',
    title: '',
    description: '',
    original_price: '',
    deal_price: '',
    start_time: '',
    end_time: '',
    total_quantity: '',
    is_active: true,
    is_featured: false,
    badge_text: 'LIMITED TIME',
    badge_color: 'red'
  });

  const [isLoading, setIsLoading] = useState(false);
  const [discountPercentage, setDiscountPercentage] = useState(0);

  useEffect(() => {
    if (deal) {
      setFormData({
        product_id: deal.product_id || '',
        title: deal.title || '',
        description: deal.description || '',
        original_price: deal.original_price || '',
        deal_price: deal.deal_price || '',
        start_time: deal.start_time ? new Date(deal.start_time).toISOString().slice(0, 16) : '',
        end_time: deal.end_time ? new Date(deal.end_time).toISOString().slice(0, 16) : '',
        total_quantity: deal.total_quantity || '',
        is_active: deal.is_active ?? true,
        is_featured: deal.is_featured || false,
        badge_text: deal.badge_text || 'LIMITED TIME',
        badge_color: deal.badge_color || 'red'
      });
    }
  }, [deal]);

  // Calculate discount percentage when prices change
  useEffect(() => {
    const original = parseFloat(formData.original_price);
    const dealPrice = parseFloat(formData.deal_price);

    if (original > 0 && dealPrice > 0 && dealPrice < original) {
      const discount = Math.round(((original - dealPrice) / original) * 100);
      setDiscountPercentage(discount);
    } else {
      setDiscountPercentage(0);
    }
  }, [formData.original_price, formData.deal_price]);

  // Auto-fill product info when product is selected
  const handleProductChange = (productId) => {
    const selectedProduct = products.find(p => p.id === productId);
    if (selectedProduct) {
      setFormData(prev => ({
        ...prev,
        product_id: productId,
        title: prev.title || `Flash Sale: ${selectedProduct.name}`,
        original_price: prev.original_price || selectedProduct.base_price || ''
      }));
    } else {
      setFormData(prev => ({ ...prev, product_id: productId }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.product_id) {
      toast.error('Please select a product');
      return;
    }

    if (!formData.title.trim()) {
      toast.error('Please enter a deal title');
      return;
    }

    const original = parseFloat(formData.original_price);
    const dealPrice = parseFloat(formData.deal_price);

    if (isNaN(original) || original <= 0) {
      toast.error('Please enter a valid original price');
      return;
    }

    if (isNaN(dealPrice) || dealPrice <= 0) {
      toast.error('Please enter a valid deal price');
      return;
    }

    if (dealPrice >= original) {
      toast.error('Deal price must be less than original price');
      return;
    }

    if (!formData.start_time || !formData.end_time) {
      toast.error('Please set start and end times');
      return;
    }

    const startTime = new Date(formData.start_time);
    const endTime = new Date(formData.end_time);

    if (endTime <= startTime) {
      toast.error('End time must be after start time');
      return;
    }

    const quantity = parseInt(formData.total_quantity);
    if (isNaN(quantity) || quantity <= 0) {
      toast.error('Please enter a valid quantity');
      return;
    }

    setIsLoading(true);

    const payload = {
      ...formData,
      original_price: original,
      deal_price: dealPrice,
      total_quantity: quantity,
      start_time: startTime.toISOString(),
      end_time: endTime.toISOString()
    };

    await onSave(payload);
    setIsLoading(false);
  };

  const badgeColors = [
    { value: 'red', label: 'Red', className: 'bg-red-500' },
    { value: 'orange', label: 'Orange', className: 'bg-orange-500' },
    { value: 'yellow', label: 'Yellow', className: 'bg-yellow-500' },
    { value: 'green', label: 'Green', className: 'bg-green-500' },
    { value: 'blue', label: 'Blue', className: 'bg-blue-500' },
    { value: 'purple', label: 'Purple', className: 'bg-purple-500' }
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Product Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          <Package className="w-4 h-4 inline mr-1" />
          Select Product *
        </label>
        <select
          required
          value={formData.product_id}
          onChange={(e) => handleProductChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">Choose a product for this deal</option>
          {products.map(product => (
            <option key={product.id} value={product.id}>
              {product.name} - ${product.base_price}
            </option>
          ))}
        </select>
      </div>

      {/* Deal Title */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Deal Title *
        </label>
        <input
          type="text"
          required
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="e.g., Flash Sale: Premium Sunglasses"
          className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Description
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Brief description of the deal..."
          rows="3"
          className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {/* Pricing */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            <DollarSign className="w-4 h-4 inline mr-1" />
            Original Price *
          </label>
          <input
            type="number"
            required
            step="0.01"
            min="0.01"
            value={formData.original_price}
            onChange={(e) => setFormData({ ...formData, original_price: e.target.value })}
            placeholder="99.99"
            className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Deal Price *
          </label>
          <input
            type="number"
            required
            step="0.01"
            min="0.01"
            value={formData.deal_price}
            onChange={(e) => setFormData({ ...formData, deal_price: e.target.value })}
            placeholder="49.99"
            className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Discount Preview */}
      {discountPercentage > 0 && (
        <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
          <p className="text-sm text-green-800 dark:text-green-200">
            <Zap className="w-4 h-4 inline mr-1" />
            <strong>{discountPercentage}% OFF</strong> - Save ${(parseFloat(formData.original_price) - parseFloat(formData.deal_price)).toFixed(2)}
          </p>
        </div>
      )}

      {/* Time Range */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            <Calendar className="w-4 h-4 inline mr-1" />
            Start Time *
          </label>
          <input
            type="datetime-local"
            required
            value={formData.start_time}
            onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            <Clock className="w-4 h-4 inline mr-1" />
            End Time *
          </label>
          <input
            type="datetime-local"
            required
            value={formData.end_time}
            onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Quantity */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Total Quantity Available *
        </label>
        <input
          type="number"
          required
          min="1"
          value={formData.total_quantity}
          onChange={(e) => setFormData({ ...formData, total_quantity: e.target.value })}
          placeholder="100"
          className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
        />
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Number of items available at this special price
        </p>
      </div>

      {/* Badge Settings */}
      <div className="space-y-4 p-4 bg-gray-50 dark:bg-slate-800 rounded-lg">
        <h3 className="font-medium text-gray-900 dark:text-white">Badge Settings</h3>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Badge Text
          </label>
          <input
            type="text"
            value={formData.badge_text}
            onChange={(e) => setFormData({ ...formData, badge_text: e.target.value })}
            placeholder="e.g., FLASH SALE, 24HR DEAL"
            maxLength="50"
            className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Badge Color
          </label>
          <div className="grid grid-cols-3 gap-2">
            {badgeColors.map(color => (
              <button
                key={color.value}
                type="button"
                onClick={() => setFormData({ ...formData, badge_color: color.value })}
                className={`px-3 py-2 rounded-lg border-2 transition-all ${
                  formData.badge_color === color.value
                    ? 'border-indigo-500 ring-2 ring-indigo-500'
                    : 'border-gray-300 dark:border-slate-600'
                }`}
              >
                <span className={`inline-block w-4 h-4 rounded ${color.className} mr-2`}></span>
                <span className="text-sm text-gray-700 dark:text-gray-300">{color.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Status Toggles */}
      <div className="flex items-center gap-6">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.is_active}
            onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
            className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
          />
          <span className="text-sm text-gray-700 dark:text-gray-300">Active</span>
        </label>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.is_featured}
            onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
            className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
          />
          <span className="text-sm text-gray-700 dark:text-gray-300">Featured Deal</span>
        </label>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          disabled={isLoading}
          className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-lg font-medium transition-colors"
        >
          <Save className="w-4 h-4" />
          {isLoading ? 'Saving...' : deal ? 'Update Deal' : 'Create Deal'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-3 bg-gray-200 hover:bg-gray-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-gray-900 dark:text-white rounded-lg font-medium transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
