// components/forms/SupplierForm.js
import { useState, useEffect } from 'react'
import { Save, Building2, User, Phone, Mail, MapPin, CreditCard, Star } from 'lucide-react'
import toast from 'react-hot-toast'

export default function SupplierForm({
  supplier = null,
  onSave,
  isLoading = false
}) {
  const [formData, setFormData] = useState({
    name: '',
    company_name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    postal_code: '',
    country: 'Pakistan',
    tax_id: '',
    website: '',
    contact_person: '',
    payment_terms: 'Net 30',
    credit_limit: '',
    is_active: true,
    rating: 0,
    notes: ''
  })

  useEffect(() => {
    if (supplier) {
      setFormData({
        name: supplier.name || '',
        company_name: supplier.company_name || '',
        email: supplier.email || '',
        phone: supplier.phone || '',
        address: supplier.address || '',
        city: supplier.city || '',
        state: supplier.state || '',
        postal_code: supplier.postal_code || '',
        country: supplier.country || 'Pakistan',
        tax_id: supplier.tax_id || '',
        website: supplier.website || '',
        contact_person: supplier.contact_person || '',
        payment_terms: supplier.payment_terms || 'Net 30',
        credit_limit: supplier.credit_limit || '',
        is_active: supplier.is_active !== undefined ? supplier.is_active : true,
        rating: supplier.rating || 0,
        notes: supplier.notes || ''
      })
    } else {
      // Reset form for new supplier
      setFormData({
        name: '',
        company_name: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        state: '',
        postal_code: '',
        country: 'Pakistan',
        tax_id: '',
        website: '',
        contact_person: '',
        payment_terms: 'Net 30',
        credit_limit: '',
        is_active: true,
        rating: 0,
        notes: ''
      })
    }
  }, [supplier])

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Validate required fields
    if (!formData.name.trim()) {
      toast.error('Supplier name is required')
      return
    }

    // Validate email format if provided
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      toast.error('Please enter a valid email address')
      return
    }

    await onSave(formData)
  }

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information Section */}
      <div className="bg-gray-50 dark:bg-slate-900/50 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
          <Building2 className="w-4 h-4 mr-2" />
          Basic Information
        </h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Supplier Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="Enter supplier name"
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Company Name
            </label>
            <input
              type="text"
              value={formData.company_name}
              onChange={(e) => handleChange('company_name', e.target.value)}
              placeholder="Enter company name"
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Contact Person
            </label>
            <input
              type="text"
              value={formData.contact_person}
              onChange={(e) => handleChange('contact_person', e.target.value)}
              placeholder="Primary contact person"
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Contact Information Section */}
      <div className="bg-gray-50 dark:bg-slate-900/50 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
          <Phone className="w-4 h-4 mr-2" />
          Contact Information
        </h3>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder="email@example.com"
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Phone
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                placeholder="+92 300 1234567"
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Website
            </label>
            <input
              type="url"
              value={formData.website}
              onChange={(e) => handleChange('website', e.target.value)}
              placeholder="https://www.example.com"
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Address Section */}
      <div className="bg-gray-50 dark:bg-slate-900/50 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
          <MapPin className="w-4 h-4 mr-2" />
          Address Details
        </h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Address
            </label>
            <textarea
              value={formData.address}
              onChange={(e) => handleChange('address', e.target.value)}
              placeholder="Street address"
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                City
              </label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => handleChange('city', e.target.value)}
                placeholder="City"
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                State/Province
              </label>
              <input
                type="text"
                value={formData.state}
                onChange={(e) => handleChange('state', e.target.value)}
                placeholder="State"
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Postal Code
              </label>
              <input
                type="text"
                value={formData.postal_code}
                onChange={(e) => handleChange('postal_code', e.target.value)}
                placeholder="Postal code"
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Country
              </label>
              <input
                type="text"
                value={formData.country}
                onChange={(e) => handleChange('country', e.target.value)}
                placeholder="Country"
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Financial Information Section */}
      <div className="bg-gray-50 dark:bg-slate-900/50 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
          <CreditCard className="w-4 h-4 mr-2" />
          Financial Information
        </h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tax ID / NTN
            </label>
            <input
              type="text"
              value={formData.tax_id}
              onChange={(e) => handleChange('tax_id', e.target.value)}
              placeholder="Tax identification number"
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Payment Terms
              </label>
              <select
                value={formData.payment_terms}
                onChange={(e) => handleChange('payment_terms', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="COD">Cash on Delivery</option>
                <option value="Net 7">Net 7 Days</option>
                <option value="Net 15">Net 15 Days</option>
                <option value="Net 30">Net 30 Days</option>
                <option value="Net 60">Net 60 Days</option>
                <option value="Net 90">Net 90 Days</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Credit Limit (PKR)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.credit_limit}
                onChange={(e) => handleChange('credit_limit', e.target.value)}
                placeholder="0.00"
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Rating & Status Section */}
      <div className="bg-gray-50 dark:bg-slate-900/50 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
          <Star className="w-4 h-4 mr-2" />
          Rating & Status
        </h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Supplier Rating
            </label>
            <div className="flex items-center space-x-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => handleChange('rating', star)}
                  className="focus:outline-none"
                >
                  <Star
                    className={`w-6 h-6 ${
                      star <= formData.rating
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300 dark:text-gray-600'
                    }`}
                  />
                </button>
              ))}
              <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">
                {formData.rating > 0 ? `${formData.rating} / 5` : 'Not rated'}
              </span>
            </div>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) => handleChange('is_active', e.target.checked)}
              className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
            />
            <label htmlFor="is_active" className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              Active Supplier
            </label>
          </div>
        </div>
      </div>

      {/* Notes Section */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Notes
        </label>
        <textarea
          value={formData.notes}
          onChange={(e) => handleChange('notes', e.target.value)}
          placeholder="Additional notes about this supplier..."
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />
      </div>

      {/* Submit Button */}
      <div className="flex justify-end pt-6 border-t border-gray-200 dark:border-slate-700">
        <button
          type="submit"
          disabled={isLoading}
          className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-lg font-medium transition-colors flex items-center space-x-2"
        >
          <Save className="w-4 h-4" />
          <span>{isLoading ? 'Saving...' : supplier ? 'Update Supplier' : 'Create Supplier'}</span>
        </button>
      </div>
    </form>
  )
}
