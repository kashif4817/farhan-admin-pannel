// components/tables/SupplierTable.js
import { Edit2, Trash2, Phone, Mail, MapPin, Star, ExternalLink } from 'lucide-react'

export default function SupplierTable({
  suppliers = [],
  onEdit,
  onDelete,
  loading = false
}) {

  const renderStars = (rating) => {
    if (!rating) return <span className="text-xs text-gray-400">Not rated</span>

    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-3 h-3 ${
              star <= rating
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-gray-300 dark:text-gray-600'
            }`}
          />
        ))}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-20 bg-gray-200 dark:bg-slate-700 rounded-lg"></div>
        ))}
      </div>
    )
  }

  if (suppliers.length === 0) {
    return (
      <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700">
        <p className="text-gray-500 dark:text-gray-400">No suppliers found</p>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 overflow-hidden">
      {/* Desktop View - Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Supplier
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Contact
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Location
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Payment Terms
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Rating
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
            {suppliers.map((supplier) => (
              <tr
                key={supplier.id}
                className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors"
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {supplier.name}
                    </div>
                    {supplier.company_name && (
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {supplier.company_name}
                      </div>
                    )}
                    {supplier.contact_person && (
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Contact: {supplier.contact_person}
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="space-y-1">
                    {supplier.phone && (
                      <div className="flex items-center text-xs text-gray-600 dark:text-gray-300">
                        <Phone className="w-3 h-3 mr-1" />
                        {supplier.phone}
                      </div>
                    )}
                    {supplier.email && (
                      <div className="flex items-center text-xs text-gray-600 dark:text-gray-300">
                        <Mail className="w-3 h-3 mr-1" />
                        {supplier.email}
                      </div>
                    )}
                    {supplier.website && (
                      <a
                        href={supplier.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
                      >
                        <ExternalLink className="w-3 h-3 mr-1" />
                        Website
                      </a>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-xs text-gray-600 dark:text-gray-300">
                    {supplier.city && supplier.state ? (
                      <>
                        <div className="flex items-start">
                          <MapPin className="w-3 h-3 mr-1 mt-0.5 flex-shrink-0" />
                          <div>
                            <div>{supplier.city}, {supplier.state}</div>
                            {supplier.country && (
                              <div className="text-gray-500 dark:text-gray-400">{supplier.country}</div>
                            )}
                          </div>
                        </div>
                      </>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900 dark:text-white">
                    {supplier.payment_terms || '—'}
                  </div>
                  {supplier.credit_limit && (
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Credit: PKR {parseFloat(supplier.credit_limit).toLocaleString()}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {renderStars(supplier.rating)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      supplier.is_active
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400'
                        : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400'
                    }`}
                  >
                    {supplier.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center justify-end space-x-2">
                    <button
                      onClick={() => onEdit(supplier)}
                      className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-600 transition-colors"
                      title="Edit Supplier"
                    >
                      <Edit2 className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                    </button>
                    <button
                      onClick={() => onDelete(supplier)}
                      className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      title="Delete Supplier"
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile View - Cards */}
      <div className="md:hidden divide-y divide-gray-200 dark:divide-slate-700">
        {suppliers.map((supplier) => (
          <div key={supplier.id} className="p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                  {supplier.name}
                </h3>
                {supplier.company_name && (
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {supplier.company_name}
                  </p>
                )}
              </div>
              <span
                className={`px-2 py-1 text-xs font-semibold rounded-full ${
                  supplier.is_active
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400'
                    : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400'
                }`}
              >
                {supplier.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>

            {supplier.contact_person && (
              <p className="text-xs text-gray-600 dark:text-gray-300 mb-2">
                Contact: {supplier.contact_person}
              </p>
            )}

            <div className="space-y-1 mb-3">
              {supplier.phone && (
                <div className="flex items-center text-xs text-gray-600 dark:text-gray-300">
                  <Phone className="w-3 h-3 mr-2" />
                  {supplier.phone}
                </div>
              )}
              {supplier.email && (
                <div className="flex items-center text-xs text-gray-600 dark:text-gray-300">
                  <Mail className="w-3 h-3 mr-2" />
                  {supplier.email}
                </div>
              )}
              {(supplier.city || supplier.state) && (
                <div className="flex items-center text-xs text-gray-600 dark:text-gray-300">
                  <MapPin className="w-3 h-3 mr-2" />
                  {supplier.city}{supplier.city && supplier.state ? ', ' : ''}{supplier.state}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-slate-700">
              <div className="flex items-center space-x-3">
                <div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Rating</div>
                  {renderStars(supplier.rating)}
                </div>
                {supplier.payment_terms && (
                  <div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Terms</div>
                    <div className="text-xs text-gray-900 dark:text-white">{supplier.payment_terms}</div>
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => onEdit(supplier)}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-600 transition-colors"
                >
                  <Edit2 className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                </button>
                <button
                  onClick={() => onDelete(supplier)}
                  className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  <Trash2 className="w-4 h-4 text-red-500" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
