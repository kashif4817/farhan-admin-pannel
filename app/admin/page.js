// app/admin/dashboard/page.js - PROFESSIONAL REAL-TIME DASHBOARD
"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { getUser } from "@/lib/auth";
import {
  Package,
  TrendingUp,
  ShoppingBag,
  DollarSign,
  Users,
  AlertTriangle,
  TrendingDown,
  Clock,
  CheckCircle,
  XCircle,
  Boxes,
  Receipt,
  CalendarDays,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  RefreshCw,
} from "lucide-react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  LineElement,
  PointElement,
} from "chart.js";
import { Bar, Doughnut, Line } from "react-chartjs-2";
import toast from "react-hot-toast";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  LineElement,
  PointElement
);

export default function AdminDashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalExpenses: 0,
    lowStockItems: 0,
    activeProducts: 0,
    hotItems: 0,
    newArrivals: 0,
  });
  const [categoryData, setCategoryData] = useState(null);
  const [expensesData, setExpensesData] = useState(null);
  const [topProducts, setTopProducts] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    initializeDashboard();
  }, []);

  const initializeDashboard = async () => {
    try {
      const userData = await getUser();
      if (!userData) {
        window.location.href = "/";
        return;
      }
      setUser(userData);
      await fetchAllDashboardData(userData);
    } catch (error) {
      console.error("Error initializing dashboard:", error);
      toast.error("Error loading dashboard");
    } finally {
      setLoading(false);
    }
  };

  const fetchAllDashboardData = async (userData) => {
    await Promise.all([
      fetchStats(userData),
      fetchCategoryData(userData),
      fetchExpensesData(userData),
      fetchTopProducts(userData),
    ]);
  };

  const handleRefresh = async () => {
    if (!user) return;
    setRefreshing(true);
    try {
      await fetchAllDashboardData(user);
      toast.success("Dashboard refreshed!");
    } catch (error) {
      console.error("Error refreshing:", error);
      toast.error("Failed to refresh dashboard");
    } finally {
      setRefreshing(false);
    }
  };

 

  const fetchStats = async (userData) => {
    try {
      // Total Products
      const { count: productsCount } = await supabase
        .from("products")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userData.id);

      // Active Products
      const { count: activeCount } = await supabase
        .from("products")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userData.id)
        .eq("is_active", true);

      // Hot Items
      const { count: hotCount } = await supabase
        .from("products")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userData.id)
        .eq("is_hot_item", true);

      // New Arrivals
      const { count: newCount } = await supabase
        .from("products")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userData.id)
        .eq("is_new_arrival", true);

      // Total Expenses (This Month)
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { data: expensesData } = await supabase
        .from("expenses")
        .select("total_amount")
        .eq("user_id", userData.id)
        .gte("expense_date", startOfMonth.toISOString().split("T")[0]);

      const totalExpenses = expensesData?.reduce(
        (sum, expense) => sum + parseFloat(expense.total_amount),
        0
      ) || 0;

      // Low Stock Items
      const { data: products } = await supabase
        .from("products")
        .select("stock_quantity, low_stock_threshold")
        .eq("user_id", userData.id);

      const lowStockItems = products?.filter(
        (item) => item.stock_quantity <= (item.low_stock_threshold || 10)
      ).length || 0;

      setStats({
        totalProducts: productsCount || 0,
        totalExpenses,
        lowStockItems,
        activeProducts: activeCount || 0,
        hotItems: hotCount || 0,
        newArrivals: newCount || 0,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };


  const fetchCategoryData = async (userData) => {
    try {
      const { data: categories } = await supabase
        .from("categories")
        .select(
          `
          id,
          name,
          products (id)
        `
        )
        .eq("user_id", userData.id);

      if (!categories || categories.length === 0) {
        setCategoryData(null);
        return;
      }

      const categoryNames = categories.map((cat) => cat.name);
      const productCounts = categories.map((cat) => cat.products?.length || 0);

      const colors = [
        "rgba(99, 102, 241, 0.8)",
        "rgba(16, 185, 129, 0.8)",
        "rgba(245, 158, 11, 0.8)",
        "rgba(239, 68, 68, 0.8)",
        "rgba(139, 92, 246, 0.8)",
        "rgba(236, 72, 153, 0.8)",
      ];

      setCategoryData({
        labels: categoryNames,
        datasets: [
          {
            data: productCounts,
            backgroundColor: colors.slice(0, categoryNames.length),
            borderWidth: 0,
          },
        ],
      });
    } catch (error) {
      console.error("Error fetching category data:", error);
    }
  };


  const fetchExpensesData = async (userData) => {
    try {
      const last6Months = [];
      const monthNames = [];
      const expensesByMonth = [];

      for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const month = date.toLocaleString("default", { month: "short" });
        monthNames.push(month);

        const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
        const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);

        const { data } = await supabase
          .from("expenses")
          .select("total_amount")
          .eq("user_id", userData.id)
          .gte("expense_date", startOfMonth.toISOString().split("T")[0])
          .lte("expense_date", endOfMonth.toISOString().split("T")[0]);

        const monthTotal =
          data?.reduce(
            (sum, expense) => sum + parseFloat(expense.total_amount),
            0
          ) || 0;
        expensesByMonth.push(monthTotal);
      }

      setExpensesData({
        labels: monthNames,
        datasets: [
          {
            label: "Expenses (PKR)",
            data: expensesByMonth,
            backgroundColor: "rgba(239, 68, 68, 0.8)",
            borderColor: "rgba(239, 68, 68, 1)",
            borderWidth: 1,
          },
        ],
      });
    } catch (error) {
      console.error("Error fetching expenses data:", error);
    }
  };

  const fetchTopProducts = async (userData) => {
    try {
      // Fetch featured and best selling products
      const { data } = await supabase
        .from("products")
        .select("id, name, image_url, base_price, stock_quantity, is_best_seller, is_featured, is_hot_item")
        .eq("user_id", userData.id)
        .eq("is_active", true)
        .or("is_best_seller.eq.true,is_featured.eq.true,is_hot_item.eq.true")
        .limit(5);

      const topProductsArray = data?.map((product) => ({
        name: product.name,
        image_url: product.image_url,
        base_price: product.base_price,
        stock_quantity: product.stock_quantity,
        badges: [
          product.is_best_seller && "Best Seller",
          product.is_featured && "Featured",
          product.is_hot_item && "Hot Item"
        ].filter(Boolean)
      })) || [];

      setTopProducts(topProductsArray);
    } catch (error) {
      console.error("Error fetching top products:", error);
    }
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
      },
      y: {
        grid: {
          color: "rgba(0, 0, 0, 0.05)",
        },
        ticks: {
          callback: function (value) {
            return "₨" + value.toLocaleString();
          },
        },
      },
    },
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          padding: 15,
          usePointStyle: true,
          font: {
            size: 11,
          },
        },
      },
    },
  };

 
  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50 dark:bg-slate-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-gray-50 dark:bg-slate-900 overflow-auto">
      <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-1 sm:mb-2">
              Dashboard Overview
            </h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
              Welcome back, {user?.name || "Admin"}! Here's what's happening with
              your business today.
            </p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center justify-center space-x-2 px-3 sm:px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-lg transition-colors text-sm sm:text-base whitespace-nowrap"
          >
            <RefreshCw
              className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`}
            />
            <span>{refreshing ? "Refreshing..." : "Refresh"}</span>
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-4 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/50 rounded-lg flex items-center justify-center">
                <Package className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
              Total Products
            </p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {stats.totalProducts}
            </p>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-4 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 bg-green-100 dark:bg-green-900/50 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
              Active Products
            </p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {stats.activeProducts}
            </p>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-4 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/50 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
              Hot Items
            </p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {stats.hotItems}
            </p>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-4 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg flex items-center justify-center">
                <ShoppingBag className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              </div>
            </div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
              New Arrivals
            </p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {stats.newArrivals}
            </p>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-4 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 bg-red-100 dark:bg-red-900/50 rounded-lg flex items-center justify-center">
                <Receipt className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
            </div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
              Monthly Expenses
            </p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              PKR {stats.totalExpenses.toLocaleString()}
            </p>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-4 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/50 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
              Low Stock Items
            </p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {stats.lowStockItems}
            </p>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Products by Category */}
          <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-4 sm:p-6">
            <div className="mb-3 sm:mb-4">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                <Boxes className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-purple-600" />
                Products by Category
              </h3>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                Product distribution across categories
              </p>
            </div>
            <div className="h-48 sm:h-64">
              {categoryData ? (
                <Doughnut data={categoryData} options={doughnutOptions} />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                  No categories available
                </div>
              )}
            </div>
          </div>

          {/* Monthly Expenses */}
          <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-4 sm:p-6">
            <div className="mb-3 sm:mb-4">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                <Receipt className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-red-600" />
                Monthly Expenses (Last 6 Months)
              </h3>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                Total expenses per month
              </p>
            </div>
            <div className="h-48 sm:h-64">
              {expensesData ? (
                <Bar data={expensesData} options={chartOptions} />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                  No expenses data available
                </div>
              )}
            </div>
          </div>

          {/* Featured Products */}
          <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-4 sm:p-6">
            <div className="mb-3 sm:mb-4">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-orange-600" />
                Featured Products
              </h3>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                Hot items, best sellers & featured products
              </p>
            </div>
            <div className="space-y-3">
              {topProducts.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  No featured products available
                </div>
              ) : (
                topProducts.map((product, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-700 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-600 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center">
                        <span className="text-white font-bold text-sm">
                          {index + 1}
                        </span>
                      </div>
                      {product.image_url ? (
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="w-10 h-10 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-gray-200 dark:bg-slate-600 rounded-lg flex items-center justify-center">
                          <Package className="w-5 h-5 text-gray-400" />
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {product.name}
                        </p>
                        <div className="flex gap-1 flex-wrap">
                          {product.badges?.map((badge, i) => (
                            <span key={i} className="text-xs px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded">
                              {badge}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900 dark:text-white">
                        PKR {product.base_price?.toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Stock: {product.stock_quantity}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}