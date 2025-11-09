"use client";
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import toast from 'react-hot-toast';
import BlogPostForm from '@/components/forms/BlogPostForm';

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

export default function EditBlogPostPage() {
  const router = useRouter();
  const params = useParams();
  const [post, setPost] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      fetchData();
    }
  }, [params.id]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch post
      const { data: postData, error: postError } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('id', params.id)
        .single();

      if (postError) throw postError;

      // Fetch categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('blog_categories')
        .select('*')
        .order('name');

      if (categoriesError) throw categoriesError;

      setPost(postData);
      setCategories(categoriesData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load post');
      router.push('/admin/blog');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (postData) => {
    try {
      const { error } = await supabase
        .from('blog_posts')
        .update(postData)
        .eq('id', params.id);

      if (error) throw error;

      toast.success('Blog post updated successfully!');
      router.push('/admin/blog');
      return true;
    } catch (error) {
      console.error('Error updating post:', error);
      toast.error('Failed to update post');
      return false;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Edit Post
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Update your blog post or article
          </p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
          <BlogPostForm
            post={post}
            categories={categories}
            onSave={handleSave}
            onCancel={() => router.push('/admin/blog')}
          />
        </div>
      </div>
    </div>
  );
}
