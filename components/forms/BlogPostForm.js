"use client";
import { useState, useRef, useEffect } from 'react';
import { Upload, X, Save, Image as ImageIcon, FileText, Tag, Calendar, Star } from 'lucide-react';
import toast from 'react-hot-toast';

// Cloudinary configuration
const CLOUDINARY_CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_UPLOAD_PRESET = 'products'; // Using same preset as products

export default function BlogPostForm({ post = null, categories = [], onSave, onCancel }) {
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    category_id: '',
    excerpt: '',
    content: '',
    featured_image_url: '',
    author_name: '',
    tags: [],
    is_published: false,
    is_featured: false,
    published_at: ''
  });

  const [tagInput, setTagInput] = useState('');
  const [imagePreview, setImagePreview] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (post) {
      setFormData({
        title: post.title || '',
        slug: post.slug || '',
        category_id: post.category_id || '',
        excerpt: post.excerpt || '',
        content: post.content || '',
        featured_image_url: post.featured_image_url || '',
        author_name: post.author_name || '',
        tags: post.tags || [],
        is_published: post.is_published || false,
        is_featured: post.is_featured || false,
        published_at: post.published_at ? post.published_at.split('T')[0] : ''
      });
      setImagePreview(post.featured_image_url || '');
    }
  }, [post]);

  // Auto-generate slug from title
  useEffect(() => {
    if (!post && formData.title && !formData.slug) {
      const slug = formData.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      setFormData(prev => ({ ...prev, slug }));
    }
  }, [formData.title, post]);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB');
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
      formDataToUpload.append('folder', 'blog');

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

      setFormData(prev => ({ ...prev, featured_image_url: publicUrl }));
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
    setFormData(prev => ({ ...prev, featured_image_url: '' }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const addTag = () => {
    const tag = tagInput.trim();
    if (tag && !formData.tags.includes(tag)) {
      setFormData(prev => ({ ...prev, tags: [...prev.tags, tag] }));
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.content.trim()) {
      toast.error('Please write some content for the post');
      return;
    }

    setIsLoading(true);

    const payload = {
      ...formData,
      published_at: formData.is_published
        ? (formData.published_at || new Date().toISOString())
        : null
    };

    const success = await onSave(payload);
    setIsLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Post Title *
        </label>
        <input
          type="text"
          required
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="e.g., How to Clean Your Eyeglasses Properly"
          className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 text-lg"
        />
      </div>

      {/* Slug */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          URL Slug
        </label>
        <input
          type="text"
          value={formData.slug}
          onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
          placeholder="auto-generated-from-title"
          className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
        />
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Leave empty to auto-generate from title
        </p>
      </div>

      {/* Category and Author */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Category
          </label>
          <select
            value={formData.category_id}
            onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Select a category</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Author Name
          </label>
          <input
            type="text"
            value={formData.author_name}
            onChange={(e) => setFormData({ ...formData, author_name: e.target.value })}
            placeholder="Your name"
            className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Featured Image */}
      <div className="space-y-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          <ImageIcon className="w-4 h-4 inline mr-1" />
          Featured Image
        </label>

        {imagePreview && (
          <div className="relative w-full h-64 bg-gray-100 dark:bg-slate-700 rounded-lg overflow-hidden">
            <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={removeImage}
              className="absolute top-2 right-2 p-2 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploadingImage}
          className="w-full flex items-center justify-center px-4 py-3 border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Upload className="w-5 h-5 mr-2" />
          <span className="text-sm font-medium">
            {uploadingImage ? 'Uploading...' : imagePreview ? 'Change Image' : 'Upload Featured Image'}
          </span>
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="hidden"
        />
      </div>

      {/* Excerpt */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Excerpt (Short Summary)
        </label>
        <textarea
          value={formData.excerpt}
          onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
          placeholder="A brief summary that appears in post listings..."
          rows="3"
          className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {/* Content */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          <FileText className="w-4 h-4 inline mr-1" />
          Content *
        </label>
        <textarea
          required
          value={formData.content}
          onChange={(e) => setFormData({ ...formData, content: e.target.value })}
          placeholder="Write your blog post content here... (Supports HTML/Markdown)"
          rows="15"
          className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 font-mono text-sm"
        />
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          You can use HTML or Markdown formatting
        </p>
      </div>

      {/* Tags */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          <Tag className="w-4 h-4 inline mr-1" />
          Tags
        </label>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addTag();
              }
            }}
            placeholder="Add a tag and press Enter"
            className="flex-1 px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
          />
          <button
            type="button"
            onClick={addTag}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
          >
            Add
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {formData.tags.map((tag, index) => (
            <span
              key={index}
              className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm flex items-center gap-2"
            >
              #{tag}
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="hover:text-red-600"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      </div>

      {/* Publish Settings */}
      <div className="space-y-4 p-4 bg-gray-50 dark:bg-slate-700 rounded-lg">
        <h3 className="font-medium text-gray-900 dark:text-white">Publish Settings</h3>

        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.is_published}
              onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })}
              className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">Publish immediately</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.is_featured}
              onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
              className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300 flex items-center gap-1">
              <Star className="w-4 h-4" />
              Mark as featured
            </span>
          </label>
        </div>

        {formData.is_published && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Calendar className="w-4 h-4 inline mr-1" />
              Publish Date
            </label>
            <input
              type="date"
              value={formData.published_at}
              onChange={(e) => setFormData({ ...formData, published_at: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          disabled={isLoading || uploadingImage}
          className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-lg font-medium transition-colors"
        >
          <Save className="w-4 h-4" />
          {isLoading ? 'Saving...' : post ? 'Update Post' : 'Create Post'}
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
