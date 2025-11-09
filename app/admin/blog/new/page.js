"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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

export default function NewBlogPostPage() {
  const router = useRouter();
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('blog_categories')
        .select('*')
        .order('name');

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast.error('Failed to load categories');
    }
  };

  const handleSave = async (postData) => {
    try {
      const { error } = await supabase
        .from('blog_posts')
        .insert([postData]);

      if (error) throw error;

      toast.success('Blog post created successfully!');
      router.push('/admin/blog');
      return true;
    } catch (error) {
      console.error('Error creating post:', error);
      toast.error('Failed to create post');
      return false;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Create New Post
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Write and publish a new blog post or article
          </p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
          <BlogPostForm
            categories={categories}
            onSave={handleSave}
            onCancel={() => router.push('/admin/blog')}
          />
        </div>
      </div>
    </div>
  );
}
