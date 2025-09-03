import React, { useState, useEffect } from 'react';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  CalculatorIcon,
  CurrencyRupeeIcon
} from '@heroicons/react/24/outline';
import { slabRateService } from '../services/slabRateService';
import { SlabRate, SlabRateCalculation } from '../types';
import toast from 'react-hot-toast';

const SlabRateManagement: React.FC = () => {
  const [slabRates, setSlabRates] = useState<SlabRate[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingRate, setEditingRate] = useState<SlabRate | null>(null);
  const [loading, setLoading] = useState(true);
  const [calculationDepth, setCalculationDepth] = useState<number>(0);
  const [calculation, setCalculation] = useState<SlabRateCalculation | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    fromDepth: 0,
    toDepth: 0,
    ratePerFoot: 0,
    isActive: true
  });

  useEffect(() => {
    loadSlabRates();
  }, []);

  const loadSlabRates = () => {
    try {
      const rates = slabRateService.getAll();
      setSlabRates(rates);
    } catch (error) {
      toast.error('Failed to load slab rates');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || formData.fromDepth < 0 || formData.toDepth <= formData.fromDepth || formData.ratePerFoot <= 0) {
      toast.error('Please fill in all required fields correctly');
      return;
    }

    try {
      if (editingRate) {
        slabRateService.update(editingRate.id, formData);
        toast.success('Slab rate updated successfully');
      } else {
        slabRateService.create(formData);
        toast.success('Slab rate added successfully');
      }
      
      loadSlabRates();
      handleCloseModal();
    } catch (error) {
      toast.error('Failed to save slab rate');
    }
  };

  const handleEdit = (rate: SlabRate) => {
    setEditingRate(rate);
    setFormData({
      name: rate.name,
      description: rate.description,
      fromDepth: rate.fromDepth,
      toDepth: rate.toDepth,
      ratePerFoot: rate.ratePerFoot,
      isActive: rate.isActive
    });
    setShowModal(true);
  };

  const handleDelete = (rateId: string) => {
    if (window.confirm('Are you sure you want to delete this slab rate?')) {
      try {
        slabRateService.delete(rateId);
        toast.success('Slab rate deleted successfully');
        loadSlabRates();
      } catch (error) {
        toast.error('Failed to delete slab rate');
      }
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingRate(null);
    setFormData({
      name: '',
      description: '',
      fromDepth: 0,
      toDepth: 0,
      ratePerFoot: 0,
      isActive: true
    });
  };

  const calculateSlabRate = () => {
    if (calculationDepth > 0) {
      const result = slabRateService.calculateSlabRate(calculationDepth);
      setCalculation(result);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Slab Rate Management</h1>
                     <p className="mt-2 text-sm text-gray-700">
             Manage drilling rates based on depth slabs (up to 1500+ feet) and calculate project costs
           </p>
        </div>
                 <div className="mt-4 sm:mt-0 space-x-3">
           <button
             onClick={() => {
               if (window.confirm('This will reset all slab rates to the new extended rates (up to 1500 feet). Continue?')) {
                 slabRateService.resetToDefaults();
                 loadSlabRates();
                 toast.success('Slab rates reset to extended rates (up to 1500 feet)');
               }
             }}
             className="inline-flex items-center px-4 py-2 border border-orange-300 rounded-md shadow-sm text-sm font-medium text-orange-700 bg-orange-50 hover:bg-orange-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
           >
             <CalculatorIcon className="h-4 w-4 mr-2" />
             Reset to Extended Rates
           </button>
           <button
             onClick={() => setShowModal(true)}
             className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
           >
             <PlusIcon className="h-4 w-4 mr-2" />
             Add Slab Rate
           </button>
         </div>
      </div>

      {/* Calculator Section */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Slab Rate Calculator</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Drilling Depth (feet)
            </label>
            <input
              type="number"
              value={calculationDepth}
              onChange={(e) => setCalculationDepth(parseFloat(e.target.value) || 0)}
              className="block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter depth in feet"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={calculateSlabRate}
              disabled={calculationDepth <= 0}
              className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
            >
              <CalculatorIcon className="h-4 w-4 mr-2" />
              Calculate
            </button>
          </div>
          {calculation && (
            <div className="flex items-end">
              <div className="w-full text-right">
                <div className="text-sm text-gray-500">Total Amount</div>
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(calculation.totalAmount)}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Calculation Breakdown */}
        {calculation && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="text-sm font-medium text-gray-900 mb-3">Calculation Breakdown</h4>
            <div className="space-y-2">
                             {calculation.slabs.map((slab: any, index: number) => (
                <div key={index} className="flex justify-between text-sm">
                  <span className="text-gray-600">
                    {slab.slab.name}: {slab.applicableDepth} ft × ₹{slab.slab.ratePerFoot}/ft
                  </span>
                  <span className="font-medium text-gray-900">
                    {formatCurrency(slab.amount)}
                  </span>
                </div>
              ))}
              <div className="border-t pt-2 flex justify-between font-semibold">
                <span>Total for {calculation.depth} feet</span>
                <span className="text-green-600">{formatCurrency(calculation.totalAmount)}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Slab Rates Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Current Slab Rates</h3>
          {slabRates.length === 0 ? (
            <div className="text-center py-8">
              <CalculatorIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No slab rates</h3>
              <p className="mt-1 text-sm text-gray-500">Get started by adding a new slab rate.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Slab Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Depth Range
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rate per Foot
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {slabRates.map((rate) => (
                    <tr key={rate.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{rate.name}</div>
                          <div className="text-sm text-gray-500">{rate.description}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {rate.fromDepth} - {rate.toDepth === 9999 ? '∞' : rate.toDepth} feet
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex items-center">
                          <CurrencyRupeeIcon className="h-4 w-4 mr-1" />
                          {rate.ratePerFoot.toLocaleString('en-IN')}/ft
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          rate.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {rate.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEdit(rate)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Edit slab rate"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(rate.id)}
                            className="text-red-600 hover:text-red-900"
                            title="Delete slab rate"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={handleCloseModal}></div>
            
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <form onSubmit={handleSubmit}>
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                      <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                        {editingRate ? 'Edit Slab Rate' : 'Add New Slab Rate'}
                      </h3>
                      
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Slab Name *
                          </label>
                          <input
                            type="text"
                            required
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="e.g., 0-100 Feet"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Description
                          </label>
                          <textarea
                            rows={2}
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Brief description of this slab"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700">
                              From Depth (feet) *
                            </label>
                            <input
                              type="number"
                              required
                              min="0"
                              value={formData.fromDepth}
                              onChange={(e) => setFormData({ ...formData, fromDepth: parseFloat(e.target.value) || 0 })}
                              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">
                              To Depth (feet) *
                            </label>
                            <input
                              type="number"
                              required
                              min="1"
                              value={formData.toDepth}
                              onChange={(e) => setFormData({ ...formData, toDepth: parseFloat(e.target.value) || 0 })}
                              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Rate per Foot (₹) *
                          </label>
                          <input
                            type="number"
                            required
                            min="0"
                            step="0.01"
                            value={formData.ratePerFoot}
                            onChange={(e) => setFormData({ ...formData, ratePerFoot: parseFloat(e.target.value) || 0 })}
                            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="e.g., 150.00"
                          />
                        </div>

                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="isActive"
                            checked={formData.isActive}
                            onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
                            Active
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="submit"
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    {editingRate ? 'Update' : 'Add'} Slab Rate
                  </button>
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SlabRateManagement;
