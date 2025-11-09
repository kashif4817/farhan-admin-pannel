"use client";
import { useState, useRef, useEffect } from 'react';
import { Upload, X, Save, Image as ImageIcon, Link, Calendar, Layers } from 'lucide-react';
import toast from 'react-hot-toast';

// Cloudinary configuration
const CLOUDINARY_CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_UPLOAD_PRESET = 'products'; // Using same preset as products

export default function BannerForm({ banner = null, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    image_url: '',
    link_url: '',
    link_text: '',
    banner_type: 'slider',
    position: 0,
    is_active: true,
    start_date: '',
    end_date: ''
  });

  const [imagePreview, setImagePreview] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (banner) {
      setFormData({
        title: banner.title || '',
        subtitle: banner.subtitle || '',
        image_url: banner.image_url || '',
        link_url: banner.link_url || '',
        link_text: banner.link_text || '',
        banner_type: banner.banner_type || 'slider',
        position: banner.position || 0,
        is_active: banner.is_active !== undefined ? banner.is_active : true,
        start_date: banner.start_date ? banner.start_date.split('T')[0] : '',
        end_date: banner.end_date ? banner.end_date.split('T')[0] : ''
      });
      setImagePreview(banner.image_url || '');
    }
  }, [banner]);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image size should be less than 10MB');
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target.result);
    };
    reader.readAsDataURL(file);

    // Upload to Cloudinary
    await uploadImageToCloudinary(file);
  };

  const uploadImageToCloudinary = async (file) => {
    setUploadingImage(true);
    const uploadToast = toast.loading('Uploading image...');

    try {
      const formDataToUpload = new FormData();
      formDataToUpload.append('file', file);
      formDataToUpload.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
      formDataToUpload.append('folder', 'banners');

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
        {
          method: 'POST',
          body: formDataToUpload,
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Upload failed');
      }

      const data = await response.json();
      const publicUrl = data.secure_url;

      setFormData(prev => ({ ...prev, image_url: publicUrl }));
      toast.success('Image uploaded successfully!', { id: uploadToast });
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Error uploading image: ' + error.message, { id: uploadToast });
      setImagePreview('');
    } finally {
      setUploadingImage(false);
    }
  };

  const removeImage = () => {
    setImagePreview('');
    setFormData(prev => ({ ...prev, image_url: '' }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.image_url) {
      toast.error('Please upload a banner image');
      return;
    }

    setIsLoading(true);

    const payload = {
      ...formData,
      position: parseInt(formData.position) || 0,
      start_date: formData.start_date || null,
      end_date: formData.end_date || null
    };

    const success = await onSave(payload);
    setIsLoading(false);

    if (success !== false) {
      // Form will be closed by parent
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Banner Image */}
      <div className="space-y-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Banner Image *
        </label>

        <div className="relative w-full h-64 bg-gray-100 dark:bg-slate-700 rounded-lg border-2 border-dashed border-gray-300 dark:border-slate-600 flex items-center justify-center overflow-hidden">
          {imagePreview ? (
            <>
              <img src={imagePreview} alt="Preview" className="w-full h-full object-cover rounded-lg" />
              <button
                type="button"
                onClick={removeImage}
                className="absolute top-2 right-2 p-2 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </>
          ) : (
            <div className="text-center">
              <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500 dark:text-gray-400">No image selected</p>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploadingImage}
          className="w-full flex items-center justify-center px-4 py-3 border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Upload className="w-5 h-5 mr-2" />
          <span className="text-sm font-medium">
            {uploadingImage ? 'Uploading...' : 'Upload Banner Image'}
          </span>
        </button>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Recommended size: 1920x600px for sliders, 1200x400px for promotional banners
        </p>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="hidden"
        />
      </div>

      {/* Banner Type */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          <Layers className="w-4 h-4 inline mr-1" />
          Banner Type *
        </label>
        <select
          required
          value={formData.banner_type}
          onChange={(e) => setFormData({ ...formData, banner_type: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
        >
          <option value="slider">Slider - Homepage carousel banner</option>
          <option value="promotional">Promotional - Special offers/deals</option>
          <option value="hero">Hero - Large featured banner</option>
          <option value="sidebar">Sidebar - Side promotional banner</option>
        </select>
      </div>

      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Title *
        </label>
        <input
          type="text"
          required
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="e.g., Summer Sale - 30% Off"
          className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {/* Subtitle */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Subtitle
        </label>
        <textarea
          value={formData.subtitle}
          onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
          placeholder="Additional description or tagline"
          rows="2"
          className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {/* Link URL */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          <Link className="w-4 h-4 inline mr-1" />
          Link URL (Optional)
        </label>
        <input
          type="url"
          value={formData.link_url}
          onChange={(e) => setFormData({ ...formData, link_url: e.target.value })}
          placeholder="https://example.com/sale"
          className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {/* Link Text */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Link Button Text
        </label>
        <input
          type="text"
          value={formData.link_text}
          onChange={(e) => setFormData({ ...formData, link_text: e.target.value })}
          placeholder="e.g., Shop Now, Learn More"
          className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {/* Position */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Display Position (Order)
        </label>
        <input
          type="number"
          min="0"
          value={formData.position}
          onChange={(e) => setFormData({ ...formData, position: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
        />
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Lower numbers appear first
        </p>
      </div>

      {/* Date Range */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            <Calendar className="w-4 h-4 inline mr-1" />
            Start Date (Optional)
          </label>
          <input
            type="date"
            value={formData.start_date}
            onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            <Calendar className="w-4 h-4 inline mr-1" />
            End Date (Optional)
          </label>
          <input
            type="date"
            value={formData.end_date}
            onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Active Status */}
      <div className="flex items-center">
        <input
          type="checkbox"
          id="is_active"
          checked={formData.is_active}
          onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
          className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
        />
        <label htmlFor="is_active" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
          Active (Show on website)
        </label>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          disabled={isLoading || uploadingImage}
          className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-lg font-medium transition-colors"
        >
          <Save className="w-4 h-4" />
          {isLoading ? 'Saving...' : banner ? 'Update Banner' : 'Create Banner'}
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
