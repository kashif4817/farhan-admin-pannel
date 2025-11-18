"use client";
import Sidebar from "./Sidebar";
import { signOut } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { LogOut, User, Bell, Calendar, Clock, Menu } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function AdminLayout({ children, user }) {
  const router = useRouter();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [sidebarOpen, setSidebarOpen] = useState(false);



 

  const handleSignOut = async () => {
    await signOut();
    router.push("/auth/login");
  };

 

  // Format date and time
  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-slate-900">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 px-3 sm:px-6 py-3">
          <div className="flex items-center justify-between">
            {/* Left Section: Hamburger + Date/Time */}
            <div className="flex items-center space-x-3 sm:space-x-6">
              {/* Hamburger Menu Button (Mobile Only) */}
              <button
                onClick={() => setSidebarOpen(true)}
                className="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                aria-label="Open menu"
              >
                <Menu className="w-5 h-5 text-gray-700 dark:text-gray-300" />
              </button>

              {/* Date and Time Display */}
              <div className="flex items-center space-x-2 sm:space-x-6">
                <div className="hidden sm:flex items-center space-x-2 text-gray-700 dark:text-gray-300">
                  <Calendar className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  <div>
                    <p className="text-sm font-medium">{formatDate(currentTime)}</p>
                  </div>
                </div>

                <div className="hidden sm:block h-6 w-px bg-gray-200 dark:bg-slate-700"></div>

                <div className="flex items-center space-x-2 text-gray-700 dark:text-gray-300">
                  <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600 dark:text-indigo-400" />
                  <div>
                    <p className="text-xs sm:text-sm font-medium tabular-nums">{formatTime(currentTime)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Actions */}
            <div className="flex items-center space-x-2 sm:space-x-3">
              {/* Notifications Bell */}

              {/* User Profile */}
              <div className="flex items-center space-x-2 sm:space-x-3 pl-2 sm:pl-3 border-l border-gray-200 dark:border-slate-700">
                <div className="hidden lg:block text-right">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {user?.customer_name || "Admin User"}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {user?.store_name || "Restaurant Manager"}
                  </p>
                </div>
                <div className="w-7 h-7 sm:w-8 sm:h-8 bg-indigo-600 rounded-full flex items-center justify-center">
                  <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
                </div>
                <button
                  onClick={handleSignOut}
                  className="p-1 rounded hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-auto bg-gray-50 dark:bg-slate-900">
          {children}
        </main>
      </div>
    </div>
  );
}