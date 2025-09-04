import React, { useState, useEffect } from 'react';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

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
    // Enhanced Slab #2 with 100-foot increments from 1-100 to 1501-1600
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

const SlabRateConfiguration: React.FC = () => {
  const navigate = useNavigate();
  
  // Slab names state
  const [slabNames, setSlabNames] = useState({
    type1: 'Slab #1',
    type2: 'Slab #2', 
    type3: 'Slab #3'
  });

  
  // Generate default rates using the new rate structure
  const generateDefaultRates = (startRate: number = 75, type: 'type1' | 'type2' | 'type3' = 'type1') => {
    const rates: { [key: string]: number } = {};
    
    if (type === 'type2') {
      // Enhanced Slab #2 with 100-foot increments: 1-100, 101-200, 201-300... up to 1600+
      const type2Ranges = [
        'rate1_100', 'rate101_200', 'rate201_300', 'rate301_400', 'rate401_500',
        'rate501_600', 'rate601_700', 'rate701_800', 'rate801_900', 'rate901_1000',
        'rate1001_1100', 'rate1101_1200', 'rate1201_1300', 'rate1301_1400',
        'rate1401_1500', 'rate1501_1600', 'rate1600_plus'
      ];
      
      // Progressive increment pattern for type2: 1-100ft calc +0, 101-200ft calc +5, 201-300ft calc +10, etc.
      const type2Increments = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80];
      
      type2Ranges.forEach((key, index) => {
        rates[key] = startRate + type2Increments[index];
      });
    } else {
      // Pattern for type1 and type3: 1-300ft calc +0, 301-400ft calc +5, 401-500ft calc +10, etc.
      const increments = [0, 5, 10, 20, 30, 40, 50, 60]; // For rates 1-8
      
      // First 8 ranges with specific increments
      const rateKeys = [
        'rate1_300', 'rate301_400', 'rate401_500', 'rate501_600',
        'rate601_700', 'rate701_800', 'rate801_900', 'rate901_1000'
      ];
      
      rateKeys.forEach((key, index) => {
        rates[key] = startRate + increments[index];
      });
      
      // For ranges 1001+ (9th range onwards), increment by 100 each time
      const baseFor1001Plus = startRate + 60; // This gives us the 901-1000 rate
      const additionalRanges = [
        'rate1001_1100', 'rate1101_1200', 'rate1201_1300', 'rate1301_1400',
        'rate1401_1500', 'rate1501_1600', 'rate1600_plus'
      ];
      
      additionalRanges.forEach((key, index) => {
        rates[key] = baseFor1001Plus + ((index + 1) * 100); // +100, +200, +300, +400...
      });
      
      // Add rate1_500 for type3
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

  // State to manage calc values for each slab type
  const [calcValues, setCalcValues] = useState<{[key: string]: {[key: string]: string}}>({
    type1: {},
    type2: {},
    type3: {}
  });

  useEffect(() => {
    // Load saved configuration from localStorage
    const savedConfig = localStorage.getItem('anjaneya_slab_rate_config');
    if (savedConfig) {
      try {
        const parsed = JSON.parse(savedConfig);
        setSlabRateConfig(parsed);
      } catch (error) {
        console.error('Error loading slab rate config:', error);
      }
    }

    // Load saved slab names
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
      toast.success('Configuration saved successfully!');
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

  // Helper function to render rate input fields
  const renderRateInputs = (type: 'type1' | 'type2' | 'type3', excludeFields: string[] = []) => {
    // Define rate fields based on slab type
    let rateFields: { key: string; label: string; startRate: number; calc: string }[] = [];
    
    if (type === 'type2') {
      // Enhanced Slab #2 with 100-foot increments
      rateFields = [
        { key: 'rate1_100', label: '1-100 feet (₹/ft)', startRate: 75, calc: '+0' },
        { key: 'rate101_200', label: '101-200 feet (₹/ft)', startRate: 80, calc: '+5' },
        { key: 'rate201_300', label: '201-300 feet (₹/ft)', startRate: 85, calc: '+10' },
        { key: 'rate301_400', label: '301-400 feet (₹/ft)', startRate: 90, calc: '+15' },
        { key: 'rate401_500', label: '401-500 feet (₹/ft)', startRate: 95, calc: '+20' },
        { key: 'rate501_600', label: '501-600 feet (₹/ft)', startRate: 100, calc: '+25' },
        { key: 'rate601_700', label: '601-700 feet (₹/ft)', startRate: 105, calc: '+30' },
        { key: 'rate701_800', label: '701-800 feet (₹/ft)', startRate: 110, calc: '+35' },
        { key: 'rate801_900', label: '801-900 feet (₹/ft)', startRate: 115, calc: '+40' },
        { key: 'rate901_1000', label: '901-1000 feet (₹/ft)', startRate: 120, calc: '+45' },
        { key: 'rate1001_1100', label: '1001-1100 feet (₹/ft)', startRate: 125, calc: '+50' },
        { key: 'rate1101_1200', label: '1101-1200 feet (₹/ft)', startRate: 130, calc: '+55' },
        { key: 'rate1201_1300', label: '1201-1300 feet (₹/ft)', startRate: 135, calc: '+60' },
        { key: 'rate1301_1400', label: '1301-1400 feet (₹/ft)', startRate: 140, calc: '+65' },
        { key: 'rate1401_1500', label: '1401-1500 feet (₹/ft)', startRate: 145, calc: '+70' },
        { key: 'rate1501_1600', label: '1501-1600 feet (₹/ft)', startRate: 150, calc: '+75' },
        { key: 'rate1600_plus', label: '1600+ feet (₹/ft)', startRate: 155, calc: '+80' }
      ];
    } else {
      // Original structure for type1 and type3
      rateFields = [
        { key: 'rate1_300', label: '1-300 feet (₹/ft)', startRate: 75, calc: '+0' },
        { key: 'rate301_400', label: '301-400 feet (₹/ft)', startRate: 80, calc: '+5' },
        { key: 'rate401_500', label: '401-500 feet (₹/ft)', startRate: 85, calc: '+10' },
        { key: 'rate501_600', label: '501-600 feet (₹/ft)', startRate: 95, calc: '+20' },
        { key: 'rate601_700', label: '601-700 feet (₹/ft)', startRate: 105, calc: '+30' },
        { key: 'rate701_800', label: '701-800 feet (₹/ft)', startRate: 115, calc: '+40' },
        { key: 'rate801_900', label: '801-900 feet (₹/ft)', startRate: 125, calc: '+50' },
        { key: 'rate901_1000', label: '901-1000 feet (₹/ft)', startRate: 135, calc: '+60' },
        { key: 'rate1001_1100', label: '1001-1100 feet (₹/ft)', startRate: 235, calc: '+100' },
        { key: 'rate1101_1200', label: '1101-1200 feet (₹/ft)', startRate: 335, calc: '+100' },
        { key: 'rate1201_1300', label: '1201-1300 feet (₹/ft)', startRate: 435, calc: '+100' },
        { key: 'rate1301_1400', label: '1301-1400 feet (₹/ft)', startRate: 535, calc: '+100' },
        { key: 'rate1401_1500', label: '1401-1500 feet (₹/ft)', startRate: 635, calc: '+100' },
        { key: 'rate1501_1600', label: '1501-1600 feet (₹/ft)', startRate: 735, calc: '+100' },
        { key: 'rate1600_plus', label: '1600+ feet (₹/ft)', startRate: 835, calc: '+100' }
      ];
      
      // Add rate1_500 for type3
      if (type === 'type3') {
        rateFields.push({ key: 'rate1_500', label: '1-500 feet (₹/ft)', startRate: 75, calc: '+0' });
      }
    }

    // Auto-fill function based on first slab rate
    const handleAutoFill = () => {
      let baseRate: number;
      let newRates: any = { ...slabRateConfig[type] };
      
      // Get the base rate depending on slab type
      if (type === 'type2') {
        baseRate = slabRateConfig[type].rate1_100 || 75;
      } else if (type === 'type3') {
        baseRate = slabRateConfig[type].rate1_300 || 75;
      } else {
        baseRate = slabRateConfig[type].rate1_300 || 75;
      }
      
      // Generate new rates using manual calc values if available
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
      
      toast.success(`Auto-filled ${slabNames[type]} rates based on ₹${baseRate} and manual calc values!`);
    };



    return (
      <div>
        {/* Auto-fill button */}
        <div className="mb-4 flex justify-center">
          <button
            onClick={handleAutoFill}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Auto Fill Based on First Rate
          </button>
        </div>
        <p className="text-xs text-gray-500 mb-4 text-center">
          {type === 'type2' ? 
            'Enter rate for 1-100 feet, then click Auto Fill to calculate all other rates (1-100, 101-200, 201-300... up to 1600+)' : 
            'Enter rate for 1-300 feet, then click Auto Fill to calculate all other rates'
          }
        </p>
        <p className="text-xs text-blue-600 mb-4 text-center font-medium">
          💡 Each row has an "Auto" button to set individual rates to default values
        </p>

        {/* Rate input fields with calculation pattern */}
        <div className="space-y-3">
          {rateFields
            .filter(field => !excludeFields.includes(field.key))
            .map((field, index) => (
              <div key={field.key} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {field.label}
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
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    placeholder={field.startRate.toString()}
                  />
                </div>
                
                {/* Manual calculation input */}
                <div className="flex-shrink-0">
                  <div className="text-xs text-gray-500 mb-1">Calc</div>
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
                    onKeyDown={(e) => {
                      if (e.key === 'ArrowUp') {
                        e.preventDefault();
                        const currentValue = calcValues[type]?.[field.key] || field.calc;
                        const numericValue = parseInt(currentValue.replace(/[+-]/g, '')) || 0;
                        const newValue = `+${numericValue + 5}`;
                        setCalcValues(prev => ({
                          ...prev,
                          [type]: {
                            ...prev[type],
                            [field.key]: newValue
                          }
                        }));
                      } else if (e.key === 'ArrowDown') {
                        e.preventDefault();
                        const currentValue = calcValues[type]?.[field.key] || field.calc;
                        const numericValue = parseInt(currentValue.replace(/[+-]/g, '')) || 0;
                        const newValue = numericValue - 5 >= 0 ? `+${numericValue - 5}` : `-${Math.abs(numericValue - 5)}`;
                        setCalcValues(prev => ({
                          ...prev,
                          [type]: {
                            ...prev[type],
                            [field.key]: newValue
                          }
                        }));
                      }
                    }}
                    className="w-16 border border-gray-300 rounded px-2 py-1 text-sm font-mono text-gray-700 text-center"
                    placeholder="+0"
                  />
                </div>
              </div>
            ))}
        </div>
      </div>
    );
  };

  // Helper function to render system overview
  const renderSystemOverview = (type: 'type1' | 'type2' | 'type3', bgColor: string, textColor: string) => {
    let ranges: { key: string; label: string }[] = [];
    
    if (type === 'type2') {
      // Enhanced Slab #2 with 100-foot increments
      ranges = [
        { key: 'rate1_100', label: '1-100 ft' },
        { key: 'rate101_200', label: '101-200 ft' },
        { key: 'rate201_300', label: '201-300 ft' },
        { key: 'rate301_400', label: '301-400 ft' },
        { key: 'rate401_500', label: '401-500 ft' },
        { key: 'rate501_600', label: '501-600 ft' },
        { key: 'rate601_700', label: '601-700 ft' },
        { key: 'rate701_800', label: '701-800 ft' },
        { key: 'rate801_900', label: '801-900 ft' },
        { key: 'rate901_1000', label: '901-1000 ft' },
        { key: 'rate1001_1100', label: '1001-1100 ft' },
        { key: 'rate1101_1200', label: '1101-1200 ft' },
        { key: 'rate1201_1300', label: '1201-1300 ft' },
        { key: 'rate1301_1400', label: '1301-1400 ft' },
        { key: 'rate1401_1500', label: '1401-1500 ft' },
        { key: 'rate1501_1600', label: '1501-1600 ft' },
        { key: 'rate1600_plus', label: '1600+ ft' }
      ];
    } else {
      // Original structure for type1 and type3
      ranges = [
        { key: 'rate1_300', label: '1-300 ft' },
        { key: 'rate301_400', label: '301-400 ft' },
        { key: 'rate401_500', label: '401-500 ft' },
        { key: 'rate501_600', label: '501-600 ft' },
        { key: 'rate601_700', label: '601-700 ft' },
        { key: 'rate701_800', label: '701-800 ft' },
        { key: 'rate801_900', label: '801-900 ft' },
        { key: 'rate901_1000', label: '901-1000 ft' },
        { key: 'rate1001_1100', label: '1001-1100 ft' },
        { key: 'rate1101_1200', label: '1101-1200 ft' },
        { key: 'rate1201_1300', label: '1201-1300 ft' },
        { key: 'rate1301_1400', label: '1301-1400 ft' },
        { key: 'rate1401_1500', label: '1401-1500 ft' },
        { key: 'rate1501_1600', label: '1501-1600 ft' },
        { key: 'rate1600_plus', label: '1600+ ft' }
      ];
      
      // Add rate1_500 for type3
      if (type === 'type3') {
        ranges.push({ key: 'rate1_500', label: '1-500 ft' });
      }
    }

    return (
      <div className={`mt-6 p-4 ${bgColor} rounded-md max-h-64 overflow-y-auto`}>
        <h4 className="text-sm font-medium text-blue-900 mb-2">System Overview</h4>
        <div className="text-xs text-blue-800 space-y-1">
          {ranges.map(range => (
            <div key={range.key}>
              • {range.label}: ₹{(slabRateConfig[type] as any)[range.key] || 0}/ft
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate(-1)}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
              >
                <ArrowLeftIcon className="h-6 w-6" />
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Slab Rate Configuration</h1>
                <p className="text-gray-600 mt-2">Configure pricing for different slab rate systems (1-300 to 1500-1600 ft)</p>
              </div>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={saveConfiguration}
                className="px-4 py-2 bg-blue-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Save Configuration
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Slab #1: 1-300 feet system */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 font-bold text-lg">1</span>
              </div>
              <div className="flex-1">
                <input
                  type="text"
                  value={slabNames.type1}
                  onChange={(e) => setSlabNames({...slabNames, type1: e.target.value})}
                  className="text-xl font-semibold text-gray-900 bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-1 -mx-1"
                  placeholder="Enter slab name"
                />
                <p className="text-sm text-gray-600">Start from 1-300 feet</p>
              </div>
            </div>

            <div className="space-y-4 max-h-96 overflow-y-auto">
              {renderRateInputs('type1')}
            </div>

            {/* Reset button inside slab */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <button
                onClick={() => resetSlabToDefaults('type1')}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                title={`Reset ${slabNames.type1} to defaults`}
              >
                Reset {slabNames.type1} to Defaults
              </button>
            </div>

            {renderSystemOverview('type1', 'bg-blue-50', 'text-blue-800')}
          </div>

          {/* Slab #2: 1-500 feet system */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-600 font-bold text-lg">2</span>
              </div>
              <div className="flex-1">
                <input
                  type="text"
                  value={slabNames.type2}
                  onChange={(e) => setSlabNames({...slabNames, type2: e.target.value})}
                  className="text-xl font-semibold text-gray-900 bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-green-500 rounded px-1 -mx-1"
                  placeholder="Enter slab name"
                />
                <p className="text-sm text-gray-600">Enhanced 100-foot increments: 1-100, 101-200, 201-300... up to 1600+</p>
              </div>
            </div>

            <div className="space-y-4 max-h-96 overflow-y-auto">
              {renderRateInputs('type2')}
            </div>

            {/* Reset button inside slab */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <button
                onClick={() => resetSlabToDefaults('type2')}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                title={`Reset ${slabNames.type2} to defaults`}
              >
                Reset {slabNames.type2} to Defaults
              </button>
            </div>

            {renderSystemOverview('type2', 'bg-green-50', 'text-green-800')}
          </div>

          {/* Slab #3: Manual configuration */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                <span className="text-purple-600 font-bold text-lg">3</span>
              </div>
              <div className="flex-1">
                <input
                  type="text"
                  value={slabNames.type3}
                  onChange={(e) => setSlabNames({...slabNames, type3: e.target.value})}
                  className="text-xl font-semibold text-gray-900 bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-purple-500 rounded px-1 -mx-1"
                  placeholder="Enter slab name"
                />
                <p className="text-sm text-gray-600">Manual configuration</p>
              </div>
            </div>

            <div className="space-y-4 max-h-96 overflow-y-auto">
              {renderRateInputs('type3')}
            </div>

            {/* Reset button inside slab */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <button
                onClick={() => resetSlabToDefaults('type3')}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                title={`Reset ${slabNames.type3} to defaults`}
              >
                Reset {slabNames.type3} to Defaults
              </button>
            </div>

            {renderSystemOverview('type3', 'bg-purple-50', 'text-purple-800')}
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="mt-8 flex justify-center">
          <button
            onClick={saveConfiguration}
            className="px-6 py-3 bg-blue-600 border border-transparent rounded-md text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Save Configuration
          </button>
        </div>
      </div>
    </div>
  );
};

export default SlabRateConfiguration;
