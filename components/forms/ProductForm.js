// components/forms/ProductForm.js - E-commerce Version
"use client";
import { useState, useRef, useEffect } from 'react';
import {
  Upload,
  X,
  Save,
  DollarSign,
  Package,
  Tag,
  Plus,
  Box,
  Ruler,
  Weight
} from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import toast from 'react-hot-toast';
import ImageCropModal from '@/components/ImageCropModal';

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

// Cloudinary configuration
const CLOUDINARY_CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_UPLOAD_PRESET = 'products'; // We'll use unsigned upload

export default function ProductForm({
  product = null,
  category,
  onSave,
  isLoading = false
}) {
  const [activeTab, setActiveTab] = useState('basic');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    image_url: '',
    base_price: '',
    discount_percentage: '',
    // E-commerce specific fields
    brand: '',
    weight: '',
    material: '',
    // Marketing badge (only one can be selected)
    badge: '', // Options: 'hot_item', 'new_arrival', 'best_seller', 'featured', 'on_sale', or ''
    // Eyeglasses specific (optional - tab 3)
    frame_type: '',
    lens_type: '',
    gender: '',
    color: ''
  });

  const [variants, setVariants] = useState([{ name: '', price: '' }]);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showCropModal, setShowCropModal] = useState(false);
  const [tempImageUrl, setTempImageUrl] = useState('');
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (product) {
      // Determine which badge is active
      let activeBadge = '';
      if (product.is_hot_item) activeBadge = 'hot_item';
      else if (product.is_new_arrival) activeBadge = 'new_arrival';
      else if (product.is_best_seller) activeBadge = 'best_seller';
      else if (product.is_featured) activeBadge = 'featured';
      else if (product.is_on_sale) activeBadge = 'on_sale';

      setFormData({
        name: product.name || '',
        description: product.description || '',
        image_url: product.image_url || '',
        base_price: product.base_price || '',
        discount_percentage: product.discount_percentage || '',
        brand: product.brand || '',
        weight: product.weight || '',
        material: product.material || '',
        badge: activeBadge,
        frame_type: product.frame_type || '',
        lens_type: product.lens_type || '',
        gender: product.gender || '',
        color: product.color || ''
      });

      const productVariants = product.variants?.length > 0 ? product.variants : [{ name: '', price: '' }];
      setVariants(productVariants);
      setImagePreview(product.image_url || '');
    } else {
      resetForm();
    }
  }, [product]);

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      image_url: '',
      base_price: '',
      discount_percentage: '',
      brand: '',
      weight: '',
      material: '',
      badge: '',
      frame_type: '',
      lens_type: '',
      gender: '',
      color: ''
    });
    setVariants([{ name: '', price: '' }]);
    setImagePreview('');
    setImageFile(null);
    setActiveTab('basic');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

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

    // Read file and show crop modal
    const reader = new FileReader();
    reader.onload = (e) => {
      setTempImageUrl(e.target.result);
      setShowCropModal(true);
    };
    reader.readAsDataURL(file);
  };

  const handleCropComplete = async (croppedFile) => {
    setShowCropModal(false);
    setImageFile(croppedFile);

    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target.result);
    };
    reader.readAsDataURL(croppedFile);

    // Upload to Cloudinary
    await uploadImageToCloudinary(croppedFile);
  };

  const handleCropCancel = () => {
    setShowCropModal(false);
    setTempImageUrl('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const uploadImageToCloudinary = async (file) => {
    setUploadingImage(true);
    const uploadToast = toast.loading('Uploading image...');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
      formData.append('folder', 'products');

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
        {
          method: 'POST',
          body: formData,
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
    } finally {
      setUploadingImage(false);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview('');
    setFormData(prev => ({ ...prev, image_url: '' }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    toast.success('Image removed');
  };

  const addVariant = () => {
    setVariants([...variants, { name: '', price: '' }]);
  };

  const removeVariant = (index) => {
    if (variants.length > 1) {
      setVariants(variants.filter((_, i) => i !== index));
      toast.success('Variant removed');
    }
  };

  const updateVariant = (index, field, value) => {
    const updatedVariants = variants.map((variant, i) =>
      i === index ? { ...variant, [field]: value } : variant
    );
    setVariants(updatedVariants);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validVariants = variants.filter(v => v.name && v.price && parseFloat(v.price) > 0);

    // Convert badge selection to individual boolean flags
    const badgeFlags = {
      is_hot_item: formData.badge === 'hot_item',
      is_new_arrival: formData.badge === 'new_arrival',
      is_best_seller: formData.badge === 'best_seller',
      is_featured: formData.badge === 'featured',
      is_on_sale: formData.badge === 'on_sale'
    };

    const payload = {
      ...formData,
      ...badgeFlags,
      base_price: parseFloat(formData.base_price) || 0,
      discount_percentage: parseFloat(formData.discount_percentage) || 0,
      weight: formData.weight || null,
      variants: validVariants,
      category_id: category?.id
    };

    // Remove the badge field from payload as it's not in the database
    delete payload.badge;

    console.log('🚀 Submitting payload:', payload);

    const success = await onSave(payload);

    if (success !== false) {
      resetForm();
    }
  };

  return (
    <>
      {/* Image Crop Modal */}
      {showCropModal && (
        <ImageCropModal
          image={tempImageUrl}
          onComplete={handleCropComplete}
          onCancel={handleCropCancel}
        />
      )}

    <div className="h-full flex flex-col">
      <div className="flex border-b border-gray-200 dark:border-slate-700 px-6">
        <button
          type="button"
          onClick={() => setActiveTab('basic')}
          className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
            activeTab === 'basic'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          Basic Info & Variants
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('details')}
          className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
            activeTab === 'details'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          Product Details
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('eyeglasses')}
          className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
            activeTab === 'eyeglasses'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          Eyeglasses Specs (Optional)
        </button>
      </div>

      <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'basic' && (
            <div className="space-y-6">
              <div className="space-y-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Product Image
                </label>
                
                <div className="relative w-full h-48 bg-gray-100 dark:bg-slate-700 rounded-lg border-2 border-dashed border-gray-300 dark:border-slate-600 flex items-center justify-center overflow-hidden">
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
                      <Package className="w-12 h-12 text-gray-400 mx-auto mb-2" />
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
                    {uploadingImage ? 'Uploading...' : 'Upload Image'}
                  </span>
                </button>
                <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                  You can crop, zoom, and rotate the image after selecting
                </p>

                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
                  <Package className="w-5 h-5 mr-2" />
                  Basic Information
                </h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Product Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter product name"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Enter product description"
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
                  <DollarSign className="w-5 h-5 mr-2" />
                  Pricing & Tax
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Base Price (PKR) *</label>
                    <input
                      type="number"
                      required
                      step="0.01"
                      min="0"
                      value={formData.base_price}
                      onChange={(e) => setFormData({ ...formData, base_price: e.target.value })}
                      placeholder="0.00"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Discount (PKR)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.discount_percentage}
                      onChange={(e) => setFormData({ ...formData, discount_percentage: e.target.value })}
                      placeholder="0.00"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Discount amount in Pakistani Rupees</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
                    <Tag className="w-5 h-5 mr-2" />
                    Product Variants
                  </h3>
                  <button
                    type="button"
                    onClick={addVariant}
                    className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-sm font-medium transition-colors flex items-center space-x-1"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Variant</span>
                  </button>
                </div>
                
                <div className="space-y-3">
                  {variants.map((variant, index) => (
                    <div key={index} className="flex gap-3 items-center p-3 bg-gray-50 dark:bg-slate-700 rounded-lg">
                      <div className="flex-1">
                        <input
                          type="text"
                          value={variant.name}
                          onChange={(e) => updateVariant(index, 'name', e.target.value)}
                          placeholder="Variant name (e.g., Small, Medium, Large)"
                          className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                      <div className="flex-1">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={variant.price}
                          onChange={(e) => updateVariant(index, 'price', e.target.value)}
                          placeholder="Price (PKR)"
                          className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                      {variants.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeVariant(index)}
                          className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'details' && (
            <div className="space-y-6">

              {/* Marketing Badge */}
              <div className="space-y-4 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-slate-800 dark:to-slate-700 rounded-lg">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
                  <Tag className="w-5 h-5 mr-2" />
                  Marketing Badge
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Select one badge that will appear on this product
                </p>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <label className={`flex items-center gap-2 p-3 bg-white dark:bg-slate-800 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors border-2 ${formData.badge === 'hot_item' ? 'border-red-500 ring-2 ring-red-200' : 'border-transparent'}`}>
                    <input
                      type="radio"
                      name="badge"
                      value="hot_item"
                      checked={formData.badge === 'hot_item'}
                      onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                      className="w-4 h-4 text-red-600 border-gray-300 focus:ring-red-500"
                    />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">🔥 Hot Item</span>
                  </label>

                  <label className={`flex items-center gap-2 p-3 bg-white dark:bg-slate-800 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors border-2 ${formData.badge === 'new_arrival' ? 'border-green-500 ring-2 ring-green-200' : 'border-transparent'}`}>
                    <input
                      type="radio"
                      name="badge"
                      value="new_arrival"
                      checked={formData.badge === 'new_arrival'}
                      onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                      className="w-4 h-4 text-green-600 border-gray-300 focus:ring-green-500"
                    />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">✨ New Arrival</span>
                  </label>

                  <label className={`flex items-center gap-2 p-3 bg-white dark:bg-slate-800 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors border-2 ${formData.badge === 'best_seller' ? 'border-purple-500 ring-2 ring-purple-200' : 'border-transparent'}`}>
                    <input
                      type="radio"
                      name="badge"
                      value="best_seller"
                      checked={formData.badge === 'best_seller'}
                      onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                      className="w-4 h-4 text-purple-600 border-gray-300 focus:ring-purple-500"
                    />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">⭐ Best Seller</span>
                  </label>

                  <label className={`flex items-center gap-2 p-3 bg-white dark:bg-slate-800 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors border-2 ${formData.badge === 'featured' ? 'border-yellow-500 ring-2 ring-yellow-200' : 'border-transparent'}`}>
                    <input
                      type="radio"
                      name="badge"
                      value="featured"
                      checked={formData.badge === 'featured'}
                      onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                      className="w-4 h-4 text-yellow-600 border-gray-300 focus:ring-yellow-500"
                    />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">💎 Featured</span>
                  </label>

                  <label className={`flex items-center gap-2 p-3 bg-white dark:bg-slate-800 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors border-2 ${formData.badge === 'on_sale' ? 'border-orange-500 ring-2 ring-orange-200' : 'border-transparent'}`}>
                    <input
                      type="radio"
                      name="badge"
                      value="on_sale"
                      checked={formData.badge === 'on_sale'}
                      onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                      className="w-4 h-4 text-orange-600 border-gray-300 focus:ring-orange-500"
                    />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">🏷️ On Sale</span>
                  </label>

                  <label className={`flex items-center gap-2 p-3 bg-white dark:bg-slate-800 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors border-2 ${formData.badge === '' ? 'border-gray-400 ring-2 ring-gray-200' : 'border-transparent'}`}>
                    <input
                      type="radio"
                      name="badge"
                      value=""
                      checked={formData.badge === ''}
                      onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                      className="w-4 h-4 text-gray-600 border-gray-300 focus:ring-gray-500"
                    />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">❌ No Badge</span>
                  </label>
                </div>
              </div>

              {/* Product Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
                  <Tag className="w-5 h-5 mr-2" />
                  Product Information
                </h3>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Brand</label>
                  <input
                    type="text"
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    placeholder="e.g., Ray-Ban, Oakley"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Material</label>
                  <textarea
                    value={formData.material}
                    onChange={(e) => setFormData({ ...formData, material: e.target.value })}
                    placeholder="Describe the materials used, e.g., Acetate frame with metal hinges, CR-39 lenses with anti-reflective coating"
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                  />
                </div>
              </div>

              {/* Physical Specifications */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
                  <Weight className="w-5 h-5 mr-2" />
                  Physical Specifications
                </h3>

                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Weight</label>
                    <input
                      type="text"
                      value={formData.weight}
                      onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                      placeholder="e.g., 25g"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Include unit (e.g., g, kg)</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'eyeglasses' && (
            <div className="space-y-6">
              <div className="p-4 bg-blue-50 dark:bg-slate-800 rounded-lg mb-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  <strong>Optional Section:</strong> Fill this section only if you are adding eyeglasses, sunglasses, or lens products. Leave empty for other product types.
                </p>
              </div>

              {/* Eyeglasses Specifications */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
                  <Package className="w-5 h-5 mr-2" />
                  Eyeglasses Specifications
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Frame Type</label>
                    <select
                      value={formData.frame_type}
                      onChange={(e) => setFormData({ ...formData, frame_type: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">Select frame type</option>
                      <option value="Full-Rim">Full-Rim</option>
                      <option value="Semi-Rimless">Semi-Rimless</option>
                      <option value="Rimless">Rimless</option>
                      <option value="Browline">Browline</option>
                      <option value="Aviator">Aviator</option>
                      <option value="Wayfarer">Wayfarer</option>
                      <option value="Cat-Eye">Cat-Eye</option>
                      <option value="Round">Round</option>
                      <option value="Square">Square</option>
                      <option value="Rectangle">Rectangle</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Lens Type</label>
                    <select
                      value={formData.lens_type}
                      onChange={(e) => setFormData({ ...formData, lens_type: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">Select lens type</option>
                      <option value="Single Vision">Single Vision</option>
                      <option value="Bifocal">Bifocal</option>
                      <option value="Progressive">Progressive</option>
                      <option value="Reading">Reading</option>
                      <option value="Sunglasses">Sunglasses</option>
                      <option value="Blue Light">Blue Light</option>
                      <option value="Photochromic">Photochromic</option>
                      <option value="Polarized">Polarized</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Gender</label>
                    <select
                      value={formData.gender}
                      onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">Select gender</option>
                      <option value="Men">Men</option>
                      <option value="Women">Women</option>
                      <option value="Unisex">Unisex</option>
                      <option value="Kids">Kids</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Color</label>
                    <input
                      type="text"
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      placeholder="e.g., Black, Tortoise, Gold"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex-shrink-0 px-6 py-4 border-t border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800">
          <button
            type="submit"
            disabled={isLoading || uploadingImage}
            className="w-full px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
          >
            <Save className="w-4 h-4" />
            <span>{isLoading ? 'Saving...' : product ? 'Update Product' : 'Create Product'}</span>
          </button>
        </div>
      </form>
    </div>
    </>
  );
}