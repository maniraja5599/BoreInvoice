import React, { useState, useEffect } from 'react';
import { ArrowLeftIcon, Cog6ToothIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

interface SlabRange {
  start: number;
  end: number;
  label: string;
  key: string;
}

interface CustomSlab {
  id: string;
  name: string;
  ranges: SlabRange[];
  rates: { [key: string]: number };
  calcValues: { [key: string]: string };
  startRate: number;
  incrementPattern: number[];
}

interface SlabRateConfig {
  type1: {
    rate1_300: number;
    rate301_400: number;
    rate401_500: number;
    rate501_600: number;
    rate601_700: number;
    rate701_800: number;
    rate801_900: number;
    rate901_1000: number;
    rate1001_1100: number;
    rate1101_1200: number;
    rate1201_1300: number;
    rate1301_1400: number;
    rate1401_1500: number;
    rate1501_1600: number;
    rate1600_plus: number;
  };
  type2: {
    rate1_100: number;
    rate101_200: number;
    rate201_300: number;
    rate301_400: number;
    rate401_500: number;
    rate501_600: number;
    rate601_700: number;
    rate701_800: number;
    rate801_900: number;
    rate901_1000: number;
    rate1001_1100: number;
    rate1101_1200: number;
    rate1201_1300: number;
    rate1301_1400: number;
    rate1401_1500: number;
    rate1501_1600: number;
    rate1600_plus: number;
  };
  type3: {
    rate1_300: number;
    rate301_400: number;
    rate401_500: number;
    rate501_600: number;
    rate601_700: number;
    rate701_800: number;
    rate801_900: number;
    rate901_1000: number;
    rate1001_1100: number;
    rate1101_1200: number;
    rate1201_1300: number;
    rate1301_1400: number;
    rate1401_1500: number;
    rate1501_1600: number;
    rate1600_plus: number;
    rate1_500: number;
  };
}

const SlabRateConfigurationDynamic: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'type1' | 'type2' | 'type3'>('type1');
  const [isExpanded, setIsExpanded] = useState<{[key: string]: boolean}>({});
  
  // Slab names state
  const [slabNames, setSlabNames] = useState({
    type1: 'Traditional Rates',
    type2: 'Progressive Rates', 
    type3: 'Custom Rates'
  });

  // Custom slabs state
  const [customSlabs, setCustomSlabs] = useState<CustomSlab[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Generate default rates
  const generateDefaultRates = (startRate: number = 75, type: 'type1' | 'type2' | 'type3' = 'type1') => {
    const rates: { [key: string]: number } = {};
    
    if (type === 'type2') {
      const type2Ranges = [
        'rate1_100', 'rate101_200', 'rate201_300', 'rate301_400', 'rate401_500',
        'rate501_600', 'rate601_700', 'rate701_800', 'rate801_900', 'rate901_1000',
        'rate1001_1100', 'rate1101_1200', 'rate1201_1300', 'rate1301_1400',
        'rate1401_1500', 'rate1501_1600', 'rate1600_plus'
      ];
      
      const type2Increments = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80];
      
      type2Ranges.forEach((key, index) => {
        rates[key] = startRate + type2Increments[index];
      });
    } else {
      const increments = [0, 5, 10, 20, 30, 40, 50, 60];
      
      const rateKeys = [
        'rate1_300', 'rate301_400', 'rate401_500', 'rate501_600',
        'rate601_700', 'rate701_800', 'rate801_900', 'rate901_1000'
      ];
      
      rateKeys.forEach((key, index) => {
        rates[key] = startRate + increments[index];
      });
      
      const baseFor1001Plus = startRate + 60;
      const additionalRanges = [
        'rate1001_1100', 'rate1101_1200', 'rate1201_1300', 'rate1301_1400',
        'rate1401_1500', 'rate1501_1600', 'rate1600_plus'
      ];
      
      additionalRanges.forEach((key, index) => {
        rates[key] = baseFor1001Plus + ((index + 1) * 100);
      });
      
      if (type === 'type3') {
        rates['rate1_500'] = startRate;
      }
    }
    
    return rates;
  };

  const [slabRateConfig, setSlabRateConfig] = useState<SlabRateConfig>({
    type1: {
      ...generateDefaultRates(75, 'type1')
    } as any,
    type2: {
      ...generateDefaultRates(75, 'type2')
    } as any,
    type3: {
      ...generateDefaultRates(75, 'type3')
    } as any
  });

  const [calcValues, setCalcValues] = useState<{[key: string]: {[key: string]: string}}>({
    type1: {},
    type2: {},
    type3: {}
  });

  useEffect(() => {
    const savedConfig = localStorage.getItem('anjaneya_slab_rate_config');
    if (savedConfig) {
      try {
        const parsed = JSON.parse(savedConfig);
        setSlabRateConfig(parsed);
      } catch (error) {
        console.error('Error loading slab rate config:', error);
      }
    }

    const savedNames = localStorage.getItem('anjaneya_slab_names');
    if (savedNames) {
      try {
        const parsed = JSON.parse(savedNames);
        setSlabNames(parsed);
      } catch (error) {
        console.error('Error loading slab names:', error);
      }
    }
  }, []);

  const saveConfiguration = () => {
    try {
      localStorage.setItem('anjaneya_slab_rate_config', JSON.stringify(slabRateConfig));
      localStorage.setItem('anjaneya_slab_names', JSON.stringify(slabNames));
      localStorage.setItem('anjaneya_custom_slabs', JSON.stringify(customSlabs));
      toast.success('Configuration saved successfully! 🎉');
    } catch (error) {
      toast.error('Failed to save configuration');
    }
  };

  const resetSlabToDefaults = (slabType: 'type1' | 'type2' | 'type3') => {
    const defaultRates = generateDefaultRates(75, slabType) as any;

    setSlabRateConfig({
      ...slabRateConfig,
      [slabType]: defaultRates
    });

    toast.success(`${slabNames[slabType]} reset to default values`);
  };

  const toggleExpand = (key: string) => {
    setIsExpanded(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // Helper function to render rate input fields
  const renderRateInputs = (type: 'type1' | 'type2' | 'type3') => {
    let rateFields: { key: string; label: string; startRate: number; calc: string }[] = [];
    
    if (type === 'type2') {
      rateFields = [
        { key: 'rate1_100', label: '1-100 ft', startRate: 75, calc: '+0' },
        { key: 'rate101_200', label: '101-200 ft', startRate: 80, calc: '+5' },
        { key: 'rate201_300', label: '201-300 ft', startRate: 85, calc: '+10' },
        { key: 'rate301_400', label: '301-400 ft', startRate: 90, calc: '+15' },
        { key: 'rate401_500', label: '401-500 ft', startRate: 95, calc: '+20' },
        { key: 'rate501_600', label: '501-600 ft', startRate: 100, calc: '+25' },
        { key: 'rate601_700', label: '601-700 ft', startRate: 105, calc: '+30' },
        { key: 'rate701_800', label: '701-800 ft', startRate: 110, calc: '+35' },
        { key: 'rate801_900', label: '801-900 ft', startRate: 115, calc: '+40' },
        { key: 'rate901_1000', label: '901-1000 ft', startRate: 120, calc: '+45' },
        { key: 'rate1001_1100', label: '1001-1100 ft', startRate: 125, calc: '+50' },
        { key: 'rate1101_1200', label: '1101-1200 ft', startRate: 130, calc: '+55' },
        { key: 'rate1201_1300', label: '1201-1300 ft', startRate: 135, calc: '+60' },
        { key: 'rate1301_1400', label: '1301-1400 ft', startRate: 140, calc: '+65' },
        { key: 'rate1401_1500', label: '1401-1500 ft', startRate: 145, calc: '+70' },
        { key: 'rate1501_1600', label: '1501-1600 ft', startRate: 150, calc: '+75' },
        { key: 'rate1600_plus', label: '1600+ ft', startRate: 155, calc: '+80' }
      ];
    } else {
      rateFields = [
        { key: 'rate1_300', label: '1-300 ft', startRate: 75, calc: '+0' },
        { key: 'rate301_400', label: '301-400 ft', startRate: 80, calc: '+5' },
        { key: 'rate401_500', label: '401-500 ft', startRate: 85, calc: '+10' },
        { key: 'rate501_600', label: '501-600 ft', startRate: 95, calc: '+20' },
        { key: 'rate601_700', label: '601-700 ft', startRate: 105, calc: '+30' },
        { key: 'rate701_800', label: '701-800 ft', startRate: 115, calc: '+40' },
        { key: 'rate801_900', label: '801-900 ft', startRate: 125, calc: '+50' },
        { key: 'rate901_1000', label: '901-1000 ft', startRate: 135, calc: '+60' },
        { key: 'rate1001_1100', label: '1001-1100 ft', startRate: 235, calc: '+100' },
        { key: 'rate1101_1200', label: '1101-1200 ft', startRate: 335, calc: '+100' },
        { key: 'rate1201_1300', label: '1201-1300 ft', startRate: 435, calc: '+100' },
        { key: 'rate1301_1400', label: '1301-1400 ft', startRate: 535, calc: '+100' },
        { key: 'rate1401_1500', label: '1401-1500 ft', startRate: 635, calc: '+100' },
        { key: 'rate1501_1600', label: '1501-1600 ft', startRate: 735, calc: '+100' },
        { key: 'rate1600_plus', label: '1600+ ft', startRate: 835, calc: '+100' }
      ];
      
      if (type === 'type3') {
        rateFields.push({ key: 'rate1_500', label: '1-500 ft', startRate: 75, calc: '+0' });
      }
    }

    const handleAutoFill = () => {
      let baseRate: number;
      let newRates: any = { ...slabRateConfig[type] };
      
      if (type === 'type2') {
        baseRate = slabRateConfig[type].rate1_100 || 75;
      } else {
        baseRate = slabRateConfig[type].rate1_300 || 75;
      }
      
      rateFields.forEach(field => {
        const calcValue = calcValues[type]?.[field.key] || field.calc;
        const increment = parseInt(calcValue.replace(/[+-]/g, '')) || 0;
        const isNegative = calcValue.startsWith('-');
        const finalIncrement = isNegative ? -increment : increment;
        
        newRates[field.key] = baseRate + finalIncrement;
      });
      
      setSlabRateConfig({
        ...slabRateConfig,
        [type]: newRates
      });
      
      toast.success(`Auto-filled ${slabNames[type]} rates! ✨`);
    };

    const getThemeColors = (type: 'type1' | 'type2' | 'type3') => {
      switch (type) {
        case 'type1': return { bg: 'from-blue-500 to-blue-600', border: 'border-blue-200', accent: 'text-blue-600' };
        case 'type2': return { bg: 'from-green-500 to-green-600', border: 'border-green-200', accent: 'text-green-600' };
        case 'type3': return { bg: 'from-purple-500 to-purple-600', border: 'border-purple-200', accent: 'text-purple-600' };
      }
    };

    const colors = getThemeColors(type);

    return (
      <div className="space-y-3">
        {/* Dynamic Auto-fill button */}
        <div className="text-center mb-6">
          <button
            onClick={handleAutoFill}
            className={`relative overflow-hidden px-6 py-3 bg-gradient-to-r ${colors.bg} text-white font-semibold rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 group`}
          >
            <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
            <div className="relative flex items-center space-x-2">
              <svg className="w-5 h-5 animate-spin group-hover:animate-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>Auto Fill Rates</span>
            </div>
          </button>
        </div>

        {/* Collapsible Rate Groups */}
        <div className="space-y-2">
          {rateFields.reduce((groups: any[], field, index) => {
            const groupIndex = Math.floor(index / 4);
            if (!groups[groupIndex]) groups[groupIndex] = [];
            groups[groupIndex].push(field);
            return groups;
          }, []).map((group, groupIndex) => {
            const groupKey = `${type}_group_${groupIndex}`;
            const isGroupExpanded = isExpanded[groupKey] !== false; // Default to expanded
            
            return (
              <div key={groupKey} className={`border-2 ${colors.border} rounded-xl overflow-hidden bg-white shadow-sm hover:shadow-md transition-all duration-300`}>
                <button
                  onClick={() => toggleExpand(groupKey)}
                  className={`w-full px-4 py-3 bg-gradient-to-r ${colors.bg} text-white font-semibold text-left flex items-center justify-between hover:opacity-90 transition-opacity`}
                >
                  <span>Depth Range: {group[0].label.split(' ')[0]} - {group[group.length - 1].label.split(' ')[0]}</span>
                  <svg 
                    className={`w-5 h-5 transform transition-transform duration-300 ${isGroupExpanded ? 'rotate-180' : ''}`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                <div className={`transition-all duration-300 ease-in-out ${isGroupExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'} overflow-hidden`}>
                  <div className="p-4 space-y-3">
                    {group.map((field: any) => (
                      <div key={field.key} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        <div className="flex-1">
                          <label className={`block text-sm font-semibold ${colors.accent} mb-1`}>
                            {field.label} (₹/ft)
                          </label>
                          <input
                            type="number"
                            value={(slabRateConfig[type] as any)[field.key] || field.startRate}
                            onChange={(e) => setSlabRateConfig({
                              ...slabRateConfig,
                              [type]: {
                                ...slabRateConfig[type],
                                [field.key]: parseFloat(e.target.value) || field.startRate
                              } as any
                            })}
                            className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 text-lg font-bold text-gray-900 focus:outline-none focus:border-blue-500 transition-colors"
                            placeholder={field.startRate.toString()}
                          />
                        </div>
                        
                        <div className="flex-shrink-0">
                          <label className="block text-xs font-semibold text-gray-600 mb-1">Calc</label>
                          <input
                            type="text"
                            value={calcValues[type]?.[field.key] || field.calc}
                            onChange={(e) => {
                              setCalcValues(prev => ({
                                ...prev,
                                [type]: {
                                  ...prev[type],
                                  [field.key]: e.target.value
                                }
                              }));
                            }}
                            className="w-16 border-2 border-gray-200 rounded-lg px-2 py-1 text-sm font-mono font-bold text-center focus:border-blue-500 transition-colors"
                            placeholder="+0"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const getTabColor = (type: 'type1' | 'type2' | 'type3') => {
    if (activeTab === type) {
      switch (type) {
        case 'type1': return 'bg-blue-500 text-white shadow-lg';
        case 'type2': return 'bg-green-500 text-white shadow-lg';
        case 'type3': return 'bg-purple-500 text-white shadow-lg';
      }
    }
    return 'bg-gray-100 text-gray-600 hover:bg-gray-200';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Floating Header */}
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate(-1)}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-all duration-200 hover:scale-110"
              >
                <ArrowLeftIcon className="h-6 w-6" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Slab Rate Configuration</h1>
                <p className="text-gray-600 text-sm">Dynamic pricing system</p>
              </div>
            </div>
            <button
              onClick={saveConfiguration}
              className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
            >
              Save All Changes
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Dynamic Tab Navigation */}
        <div className="flex justify-center mb-8">
          <div className="flex bg-gray-100 rounded-full p-1 shadow-inner">
            {(['type1', 'type2', 'type3'] as const).map((type, index) => (
              <button
                key={type}
                onClick={() => setActiveTab(type)}
                className={`px-6 py-3 rounded-full font-semibold transition-all duration-300 transform ${getTabColor(type)} ${
                  activeTab === type ? 'scale-105' : 'hover:scale-102'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <span className="w-6 h-6 rounded-full bg-current opacity-20 flex items-center justify-center text-xs font-bold">
                    {index + 1}
                  </span>
                  <span>{slabNames[type]}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Dynamic Content Area */}
        <div className="transition-all duration-500 ease-in-out">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
            {/* Tab Header */}
            <div className={`p-6 bg-gradient-to-r ${
              activeTab === 'type1' ? 'from-blue-500 to-blue-600' :
              activeTab === 'type2' ? 'from-green-500 to-green-600' :
              'from-purple-500 to-purple-600'
            } text-white`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                    <span className="text-2xl font-bold">
                      {activeTab === 'type1' ? '1' : activeTab === 'type2' ? '2' : '3'}
                    </span>
                  </div>
                  <div>
                    <input
                      type="text"
                      value={slabNames[activeTab]}
                      onChange={(e) => setSlabNames({...slabNames, [activeTab]: e.target.value})}
                      className="text-2xl font-bold bg-transparent border-b-2 border-white/30 focus:border-white outline-none text-white placeholder-white/70"
                      placeholder="Enter slab name"
                    />
                    <p className="text-white/80 mt-1">
                      {activeTab === 'type1' ? 'Traditional 300ft base system' :
                       activeTab === 'type2' ? 'Progressive 100ft increment system' :
                       'Flexible custom configuration'}
                    </p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => resetSlabToDefaults(activeTab)}
                    className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
                    title="Reset to defaults"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {/* Tab Content */}
            <div className="p-6">
              {renderRateInputs(activeTab)}
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          {(['type1', 'type2', 'type3'] as const).map((type, index) => {
            const rates = Object.values(slabRateConfig[type]);
            const avgRate = rates.reduce((a, b) => a + b, 0) / rates.length;
            const minRate = Math.min(...rates);
            const maxRate = Math.max(...rates);
            
            return (
              <div key={type} className="bg-white rounded-xl p-4 shadow-lg border border-gray-200 hover:shadow-xl transition-shadow">
                <div className="flex items-center space-x-3 mb-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                    type === 'type1' ? 'bg-blue-500' :
                    type === 'type2' ? 'bg-green-500' : 'bg-purple-500'
                  }`}>
                    {index + 1}
                  </div>
                  <span className="font-semibold text-gray-900">{slabNames[type]}</span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Min Rate:</span>
                    <span className="font-semibold">₹{minRate}/ft</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Max Rate:</span>
                    <span className="font-semibold">₹{maxRate}/ft</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Avg Rate:</span>
                    <span className="font-semibold">₹{avgRate.toFixed(0)}/ft</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default SlabRateConfigurationDynamic;
