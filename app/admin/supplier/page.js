"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { getUser } from "@/lib/auth";
import RightSidebar from "@/components/ui/RightSidebar";
import SupplierForm from "@/components/forms/SupplierForm";
import SupplierTable from "@/components/tables/SupplierTable";
import {
  Plus,
  Search,
  Filter,
  Download,
  Users,
  TrendingUp,
  Star,
  CheckCircle,
} from "lucide-react";
import toast from "react-hot-toast";

export default function SupplierPage() {
  const [suppliers, setSuppliers] = useState([]);
  const [filteredSuppliers, setFilteredSuppliers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all"); // all, active, inactive
  const [loading, setLoading] = useState(true);
  const [showSidebar, setShowSidebar] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    avgRating: 0,
  });

  useEffect(() => {
    loadSuppliers();
  }, []);

  useEffect(() => {
    filterSuppliers();
  }, [suppliers, searchTerm, filterStatus]);

  useEffect(() => {
    calculateStats();
  }, [suppliers]);

  const loadSuppliers = async () => {
    try {
      setLoading(true);
      const user = await getUser();
      if (!user) {
        toast.error("Please log in to view suppliers");
        return;
      }

      const { data, error } = await supabase
        .from("suppliers")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setSuppliers(data || []);
    } catch (error) {
      console.error("Error loading suppliers:", error);
      toast.error("Error loading suppliers");
    } finally {
      setLoading(false);
    }
  };

  const filterSuppliers = () => {
    let filtered = [...suppliers];

    // Apply status filter
    if (filterStatus === "active") {
      filtered = filtered.filter((s) => s.is_active);
    } else if (filterStatus === "inactive") {
      filtered = filtered.filter((s) => !s.is_active);
    }

    // Apply search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (supplier) =>
          supplier.name.toLowerCase().includes(search) ||
          (supplier.company_name &&
            supplier.company_name.toLowerCase().includes(search)) ||
          (supplier.email && supplier.email.toLowerCase().includes(search)) ||
          (supplier.phone && supplier.phone.toLowerCase().includes(search)) ||
          (supplier.city && supplier.city.toLowerCase().includes(search))
      );
    }

    setFilteredSuppliers(filtered);
  };

  const calculateStats = () => {
    const total = suppliers.length;
    const active = suppliers.filter((s) => s.is_active).length;
    const inactive = total - active;
    const ratingsSum = suppliers.reduce((sum, s) => sum + (s.rating || 0), 0);
    const ratedCount = suppliers.filter((s) => s.rating > 0).length;
    const avgRating = ratedCount > 0 ? (ratingsSum / ratedCount).toFixed(1) : 0;

    setStats({ total, active, inactive, avgRating });
  };

  const handleSubmit = async (supplierData) => {
    try {
      const user = await getUser();
      if (!user) {
        toast.error("Please log in");
        return;
      }

      if (editingSupplier) {
        // Update existing supplier
        const { error } = await supabase
          .from("suppliers")
          .update({
            ...supplierData,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editingSupplier.id);

        if (error) throw error;
        toast.success("Supplier updated successfully");
      } else {
        // Create new supplier
        const { error } = await supabase.from("suppliers").insert({
          ...supplierData,
          user_id: user.id,
        });

        if (error) throw error;
        toast.success("Supplier created successfully");
      }

      setShowSidebar(false);
      setEditingSupplier(null);
      loadSuppliers();
    } catch (error) {
      console.error("Error saving supplier:", error);
      toast.error("Error saving supplier: " + error.message);
    }
  };

  const handleEdit = (supplier) => {
    setEditingSupplier(supplier);
    setShowSidebar(true);
  };

  const handleDelete = async (supplier) => {
    if (
      !confirm(
        `Are you sure you want to delete ${supplier.name}? This action cannot be undone.`
      )
    ) {
      return;
    }

    try {
      const { error } = await supabase
        .from("suppliers")
        .delete()
        .eq("id", supplier.id);

      if (error) throw error;

      toast.success("Supplier deleted successfully");
      loadSuppliers();
    } catch (error) {
      console.error("Error deleting supplier:", error);
      toast.error("Error deleting supplier: " + error.message);
    }
  };

  const handleExport = () => {
    try {
      // Prepare CSV data
      const headers = [
        "Name",
        "Company",
        "Email",
        "Phone",
        "City",
        "State",
        "Country",
        "Payment Terms",
        "Credit Limit",
        "Rating",
        "Status",
      ];

      const rows = filteredSuppliers.map((s) => [
        s.name,
        s.company_name || "",
        s.email || "",
        s.phone || "",
        s.city || "",
        s.state || "",
        s.country || "",
        s.payment_terms || "",
        s.credit_limit || "",
        s.rating || "",
        s.is_active ? "Active" : "Inactive",
      ]);

      // Create CSV content
      const csvContent = [
        headers.join(","),
        ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
      ].join("\n");

      // Create and download file
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `suppliers_${new Date().toISOString().split("T")[0]}.csv`
      );
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success("Suppliers exported successfully");
    } catch (error) {
      console.error("Error exporting suppliers:", error);
      toast.error("Error exporting suppliers");
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Supplier Management
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Manage your suppliers and vendor relationships
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={handleExport}
              disabled={filteredSuppliers.length === 0}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-4 h-4" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={() => {
                setEditingSupplier(null);
                setShowSidebar(true);
              }}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Add Supplier</span>
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wide">
                  Total Suppliers
                </p>
                <p className="text-2xl font-bold text-blue-900 dark:text-blue-100 mt-1">
                  {stats.total}
                </p>
              </div>
              <div className="p-3 bg-blue-500 dark:bg-blue-600 rounded-lg">
                <Users className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-green-600 dark:text-green-400 uppercase tracking-wide">
                  Active Suppliers
                </p>
                <p className="text-2xl font-bold text-green-900 dark:text-green-100 mt-1">
                  {stats.active}
                </p>
              </div>
              <div className="p-3 bg-green-500 dark:bg-green-600 rounded-lg">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 rounded-lg p-4 border border-red-200 dark:border-red-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-red-600 dark:text-red-400 uppercase tracking-wide">
                  Inactive Suppliers
                </p>
                <p className="text-2xl font-bold text-red-900 dark:text-red-100 mt-1">
                  {stats.inactive}
                </p>
              </div>
              <div className="p-3 bg-red-500 dark:bg-red-600 rounded-lg">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 rounded-lg p-4 border border-yellow-200 dark:border-yellow-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-yellow-600 dark:text-yellow-400 uppercase tracking-wide">
                  Avg Rating
                </p>
                <p className="text-2xl font-bold text-yellow-900 dark:text-yellow-100 mt-1">
                  {stats.avgRating}
                  <span className="text-sm text-yellow-600 dark:text-yellow-400">
                    {" "}
                    / 5
                  </span>
                </p>
              </div>
              <div className="p-3 bg-yellow-500 dark:bg-yellow-600 rounded-lg">
                <Star className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center space-x-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search by name, company, email, phone, or city..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center space-x-2 bg-gray-50 dark:bg-slate-700 rounded-lg p-1 border border-gray-200 dark:border-slate-600">
            <Filter className="w-4 h-4 text-gray-500 dark:text-gray-400 ml-2" />
            <button
              onClick={() => setFilterStatus("all")}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                filterStatus === "all"
                  ? "bg-white dark:bg-slate-600 text-gray-900 dark:text-white shadow-sm"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilterStatus("active")}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                filterStatus === "active"
                  ? "bg-white dark:bg-slate-600 text-gray-900 dark:text-white shadow-sm"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              Active
            </button>
            <button
              onClick={() => setFilterStatus("inactive")}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                filterStatus === "inactive"
                  ? "bg-white dark:bg-slate-600 text-gray-900 dark:text-white shadow-sm"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              Inactive
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-6">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        ) : suppliers.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gray-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">
              No suppliers yet
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-sm mx-auto">
              Start by adding your first supplier to manage your vendor
              relationships
            </p>
            <button
              onClick={() => {
                setEditingSupplier(null);
                setShowSidebar(true);
              }}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors inline-flex items-center space-x-2"
            >
              <Plus className="w-5 h-5" />
              <span>Add First Supplier</span>
            </button>
          </div>
        ) : (
          <>
            {filteredSuppliers.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 dark:text-gray-400">
                  No suppliers match your search criteria
                </p>
              </div>
            ) : (
              <SupplierTable
                suppliers={filteredSuppliers}
                onEdit={handleEdit}
                onDelete={handleDelete}
                loading={loading}
              />
            )}
          </>
        )}
      </div>

      {/* Right Sidebar for Form */}
      <RightSidebar
        isOpen={showSidebar}
        onClose={() => {
          setShowSidebar(false);
          setEditingSupplier(null);
        }}
        title={editingSupplier ? "Edit Supplier" : "Add New Supplier"}
        width="w-[600px]"
      >
        <SupplierForm supplier={editingSupplier} onSave={handleSubmit} />
      </RightSidebar>
    </div>
  );
}
