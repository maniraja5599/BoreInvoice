import React, { useState, useEffect } from 'react';
import { ArrowLeftIcon, Cog6ToothIcon } from '@heroicons/react/24/outline';
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
    rate1_500: number;
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
  const generateDefaultRates = (startRate: number = 90) => {
    const rates: { [key: string]: number } = {};
    
    // Define the increment pattern: 90, 100, 120, 150, 190, 240, 300, 370, then +100 each
    const increments = [0, 10, 30, 60, 100, 150, 210, 280]; // For rates 1-8
    
    // First 8 ranges with specific increments
    const rateKeys = [
      'rate1_300', 'rate301_400', 'rate401_500', 'rate501_600',
      'rate601_700', 'rate701_800', 'rate801_900', 'rate901_1000'
    ];
    
    rateKeys.forEach((key, index) => {
      rates[key] = startRate + increments[index];
    });
    
    // For ranges 1001+ (9th range onwards), increment by 100 each time
    const baseFor1001Plus = startRate + 280; // This gives us the 901-1000 rate (370 if startRate=90)
    const additionalRanges = [
      'rate1001_1100', 'rate1101_1200', 'rate1201_1300', 'rate1301_1400',
      'rate1401_1500', 'rate1501_1600', 'rate1600_plus'
    ];
    
    additionalRanges.forEach((key, index) => {
      rates[key] = baseFor1001Plus + ((index + 1) * 100); // +100, +200, +300, +400...
    });
    
    return rates;
  };

  const [slabRateConfig, setSlabRateConfig] = useState<SlabRateConfig>({
    type1: {
      ...generateDefaultRates(90),
      rate1_500: 90 // This will be overridden for type1
    } as any,
    type2: {
      ...generateDefaultRates(90),
      rate1_500: 90
    } as any,
    type3: {
      ...generateDefaultRates(90),
      rate1_500: 90
    } as any
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
    const defaultRates = {
      ...generateDefaultRates(90),
      rate1_500: 90
    } as any;

    setSlabRateConfig({
      ...slabRateConfig,
      [slabType]: defaultRates
    });

    toast.success(`${slabNames[slabType]} reset to default values`);
  };

  // Helper function to render rate input fields
  const renderRateInputs = (type: 'type1' | 'type2' | 'type3', excludeFields: string[] = []) => {
    const rateFields = [
      { key: 'rate1_300', label: '1-300 feet (₹/ft)', startRate: 90 },
      { key: 'rate301_400', label: '301-400 feet (₹/ft)', startRate: 100 },
      { key: 'rate401_500', label: '401-500 feet (₹/ft)', startRate: 120 },
      { key: 'rate1_500', label: '1-500 feet (₹/ft)', startRate: 90 },
      { key: 'rate501_600', label: '501-600 feet (₹/ft)', startRate: 150 },
      { key: 'rate601_700', label: '601-700 feet (₹/ft)', startRate: 190 },
      { key: 'rate701_800', label: '701-800 feet (₹/ft)', startRate: 240 },
      { key: 'rate801_900', label: '801-900 feet (₹/ft)', startRate: 300 },
      { key: 'rate901_1000', label: '901-1000 feet (₹/ft)', startRate: 370 },
      { key: 'rate1001_1100', label: '1001-1100 feet (₹/ft)', startRate: 470 },
      { key: 'rate1101_1200', label: '1101-1200 feet (₹/ft)', startRate: 570 },
      { key: 'rate1201_1300', label: '1201-1300 feet (₹/ft)', startRate: 670 },
      { key: 'rate1301_1400', label: '1301-1400 feet (₹/ft)', startRate: 770 },
      { key: 'rate1401_1500', label: '1401-1500 feet (₹/ft)', startRate: 870 },
      { key: 'rate1501_1600', label: '1501-1600 feet (₹/ft)', startRate: 970 },
      { key: 'rate1600_plus', label: '1600+ feet (₹/ft)', startRate: 1070 }
    ];

    // Auto-fill function based on first slab rate
    const handleAutoFill = () => {
      let baseRate: number;
      let newRates: any = { ...slabRateConfig[type] };
      
      // Get the base rate depending on slab type
      if (type === 'type2') {
        baseRate = slabRateConfig[type].rate1_500 || 90;
      } else {
        baseRate = slabRateConfig[type].rate1_300 || 90;
      }
      
      // Define the increment pattern based on your specification
      const increments = [0, 10, 30, 60, 100, 150, 210, 280]; // For rates 1-8 (90, 100, 120, 150, 190, 240, 300, 370)
      
      if (type === 'type2') {
        // For type2, start with rate1_500, then continue with the pattern from rate501_600
        newRates.rate1_500 = baseRate;
        
        // Apply increments starting from rate501_600 (which would be index 3 in the pattern)
        const type2Fields = rateFields.filter(field => field.key !== 'rate1_300' && field.key !== 'rate301_400' && field.key !== 'rate401_500');
        type2Fields.forEach((field, index) => {
          const adjustedIndex = index + 3; // Start from increment index 3 (rate501_600)
          if (adjustedIndex < 8) {
            newRates[field.key] = baseRate + increments[adjustedIndex];
          } else {
            // For ranges 1001+ increment by 100 each time
            const baseFor1001Plus = baseRate + 280;
            const additionalIncrement = (adjustedIndex - 7) * 100;
            newRates[field.key] = baseFor1001Plus + additionalIncrement;
          }
        });
      } else {
        // For type1 and type3, use the full pattern starting from rate1_300
        rateFields.forEach((field, index) => {
          if (index < 8) {
            // For the first 8 ranges, use the specific increment pattern
            newRates[field.key] = baseRate + increments[index];
          } else {
            // For ranges 1001+ increment by 100 each time
            const baseFor1001Plus = baseRate + 280;
            const additionalIncrement = (index - 7) * 100;
            newRates[field.key] = baseFor1001Plus + additionalIncrement;
          }
        });
      }
      
      setSlabRateConfig({
        ...slabRateConfig,
        [type]: newRates
      });
      
      toast.success(`Auto-filled ${slabNames[type]} rates based on ₹${baseRate}!`);
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
            'Enter rate for 1-500 feet, then click Auto Fill to calculate all other rates' : 
            'Enter rate for 1-300 feet, then click Auto Fill to calculate all other rates'
          }
        </p>

        {/* Rate input fields - clean version */}
        <div className="space-y-3">
          {rateFields
            .filter(field => !excludeFields.includes(field.key))
            .map((field, index) => (
              <div key={field.key} className="flex items-center space-x-2">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {field.label}
                  </label>
                  <input
                    type="number"
                    value={slabRateConfig[type][field.key as keyof typeof slabRateConfig[typeof type]] || field.startRate}
                    onChange={(e) => setSlabRateConfig({
                      ...slabRateConfig,
                      [type]: {
                        ...slabRateConfig[type],
                        [field.key]: parseFloat(e.target.value) || field.startRate
                      }
                    })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    placeholder={field.startRate.toString()}
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
    const ranges = [
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

    return (
      <div className={`mt-6 p-4 ${bgColor} rounded-md max-h-64 overflow-y-auto`}>
        <h4 className="text-sm font-medium text-blue-900 mb-2">System Overview</h4>
        <div className="text-xs text-blue-800 space-y-1">
          {ranges.map(range => (
            <div key={range.key}>
              • {range.label}: ₹{slabRateConfig[type][range.key as keyof typeof slabRateConfig[typeof type]] || 0}/ft
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
                <p className="text-sm text-gray-600">Start from 1-500 feet</p>
              </div>
            </div>

            <div className="space-y-4 max-h-96 overflow-y-auto">
              {renderRateInputs('type2', ['rate1_300', 'rate301_400', 'rate401_500'])}
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
