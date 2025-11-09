"use client";
import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import toast from 'react-hot-toast';
import {
  FileText,
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Star,
  Calendar,
  Tag,
  TrendingUp,
  Search
} from 'lucide-react';
import { useRouter } from 'next/navigation';

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

export default function BlogPage() {
  const router = useRouter();
  const [posts, setPosts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch posts
      const { data: postsData, error: postsError } = await supabase
        .from('blog_posts')
        .select(`
          *,
          blog_categories (
            id,
            name,
            slug
          )
        `)
        .order('created_at', { ascending: false });

      if (postsError) throw postsError;

      // Fetch categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('blog_categories')
        .select('*')
        .order('name');

      if (categoriesError) throw categoriesError;

      setPosts(postsData || []);
      setCategories(categoriesData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load blog posts');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (post) => {
    if (!confirm(`Are you sure you want to delete "${post.title}"?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('blog_posts')
        .delete()
        .eq('id', post.id);

      if (error) throw error;
      toast.success('Post deleted successfully');
      fetchData();
    } catch (error) {
      console.error('Error deleting post:', error);
      toast.error('Failed to delete post');
    }
  };

  const togglePublished = async (post) => {
    try {
      const updateData = {
        is_published: !post.is_published,
        published_at: !post.is_published ? new Date().toISOString() : null
      };

      const { error } = await supabase
        .from('blog_posts')
        .update(updateData)
        .eq('id', post.id);

      if (error) throw error;
      toast.success(`Post ${!post.is_published ? 'published' : 'unpublished'}`);
      fetchData();
    } catch (error) {
      console.error('Error toggling published:', error);
      toast.error('Failed to update post status');
    }
  };

  const toggleFeatured = async (post) => {
    try {
      const { error } = await supabase
        .from('blog_posts')
        .update({ is_featured: !post.is_featured })
        .eq('id', post.id);

      if (error) throw error;
      toast.success(`Post ${!post.is_featured ? 'marked as featured' : 'unfeatured'}`);
      fetchData();
    } catch (error) {
      console.error('Error toggling featured:', error);
      toast.error('Failed to update featured status');
    }
  };

  const filteredPosts = posts.filter(post => {
    const matchesCategory = filterCategory === 'all' || post.category_id === filterCategory;
    const matchesStatus = filterStatus === 'all' ||
      (filterStatus === 'published' && post.is_published) ||
      (filterStatus === 'draft' && !post.is_published);
    const matchesSearch = searchQuery === '' ||
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.excerpt?.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesCategory && matchesStatus && matchesSearch;
  });

  const stats = {
    total: posts.length,
    published: posts.filter(p => p.is_published).length,
    draft: posts.filter(p => !p.is_published).length,
    featured: posts.filter(p => p.is_featured).length
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Blog & News Management
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Create and manage blog posts, news, and articles
            </p>
          </div>
          <button
            onClick={() => router.push('/admin/blog/new')}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
          >
            <Plus className="w-5 h-5" />
            New Post
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-4 shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Posts</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
              </div>
              <FileText className="w-8 h-8 text-indigo-600" />
            </div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-lg p-4 shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Published</p>
                <p className="text-2xl font-bold text-green-600">{stats.published}</p>
              </div>
              <Eye className="w-8 h-8 text-green-600" />
            </div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-lg p-4 shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Drafts</p>
                <p className="text-2xl font-bold text-orange-600">{stats.draft}</p>
              </div>
              <EyeOff className="w-8 h-8 text-orange-600" />
            </div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-lg p-4 shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Featured</p>
                <p className="text-2xl font-bold text-purple-600">{stats.featured}</p>
              </div>
              <Star className="w-8 h-8 text-purple-600" />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow mb-6 p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search posts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Category Filter */}
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Categories</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Status</option>
              <option value="published">Published</option>
              <option value="draft">Drafts</option>
            </select>
          </div>
        </div>

        {/* Posts List */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-12 text-center">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No posts found
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {searchQuery || filterCategory !== 'all' || filterStatus !== 'all'
                ? 'Try adjusting your filters'
                : 'Get started by creating your first blog post'}
            </p>
            <button
              onClick={() => router.push('/admin/blog/new')}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
            >
              <Plus className="w-5 h-5" />
              New Post
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredPosts.map((post) => (
              <div
                key={post.id}
                className="bg-white dark:bg-slate-800 rounded-lg shadow overflow-hidden hover:shadow-lg transition-shadow"
              >
                {/* Featured Image */}
                {post.featured_image_url && (
                  <div className="h-48 overflow-hidden">
                    <img
                      src={post.featured_image_url}
                      alt={post.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                {/* Content */}
                <div className="p-6">
                  {/* Badges */}
                  <div className="flex flex-wrap gap-2 mb-3">
                    {post.blog_categories && (
                      <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                        {post.blog_categories.name}
                      </span>
                    )}
                    {post.is_published ? (
                      <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                        Published
                      </span>
                    ) : (
                      <span className="px-2 py-1 text-xs rounded-full bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
                        Draft
                      </span>
                    )}
                    {post.is_featured && (
                      <span className="px-2 py-1 text-xs rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 flex items-center gap-1">
                        <Star className="w-3 h-3" />
                        Featured
                      </span>
                    )}
                  </div>

                  {/* Title */}
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
                    {post.title}
                  </h3>

                  {/* Excerpt */}
                  {post.excerpt && (
                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-3 line-clamp-2">
                      {post.excerpt}
                    </p>
                  )}

                  {/* Tags */}
                  {post.tags && post.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {post.tags.slice(0, 3).map((tag, index) => (
                        <span
                          key={index}
                          className="px-2 py-0.5 text-xs bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 rounded"
                        >
                          #{tag}
                        </span>
                      ))}
                      {post.tags.length > 3 && (
                        <span className="px-2 py-0.5 text-xs text-gray-500">
                          +{post.tags.length - 3} more
                        </span>
                      )}
                    </div>
                  )}

                  {/* Meta */}
                  <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400 mb-4">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(post.created_at).toLocaleDateString()}
                    </div>
                    {post.view_count > 0 && (
                      <div className="flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" />
                        {post.view_count} views
                      </div>
                    )}
                    {post.author_name && (
                      <div>By {post.author_name}</div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => togglePublished(post)}
                      className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                        post.is_published
                          ? 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900 dark:text-green-200'
                          : 'bg-orange-100 text-orange-700 hover:bg-orange-200 dark:bg-orange-900 dark:text-orange-200'
                      }`}
                    >
                      {post.is_published ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      {post.is_published ? 'Published' : 'Draft'}
                    </button>
                    <button
                      onClick={() => toggleFeatured(post)}
                      className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                        post.is_featured
                          ? 'bg-purple-100 text-purple-700 hover:bg-purple-200 dark:bg-purple-900 dark:text-purple-200'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-slate-700 dark:text-gray-300'
                      }`}
                    >
                      <Star className="w-4 h-4" />
                      {post.is_featured ? 'Featured' : 'Feature'}
                    </button>
                    <button
                      onClick={() => router.push(`/admin/blog/edit/${post.id}`)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-200 rounded-lg text-sm transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(post)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900 dark:text-red-200 rounded-lg text-sm transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
