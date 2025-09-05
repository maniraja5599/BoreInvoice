import React, { useState, useEffect } from 'react';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
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

const SlabRateConfigurationClean: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'type1' | 'type2' | 'type3'>('type1');
  
  // Slab names state
  const [slabNames, setSlabNames] = useState({
    type1: 'Slab Rate 1',
    type2: 'Slab Rate 2', 
    type3: 'Slab Rate 3'
  });

  // Custom slabs state
  const [customSlabs, setCustomSlabs] = useState<CustomSlab[]>([]);

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
  const renderRateInputs = (type: 'type1' | 'type2' | 'type3') => {
    let rateFields: { key: string; label: string; startRate: number; calc: string }[] = [];
    
    if (type === 'type2') {
      rateFields = [
        { key: 'rate1_100', label: '1-100 feet', startRate: 75, calc: '+0' },
        { key: 'rate101_200', label: '101-200 feet', startRate: 80, calc: '+5' },
        { key: 'rate201_300', label: '201-300 feet', startRate: 85, calc: '+10' },
        { key: 'rate301_400', label: '301-400 feet', startRate: 90, calc: '+15' },
        { key: 'rate401_500', label: '401-500 feet', startRate: 95, calc: '+20' },
        { key: 'rate501_600', label: '501-600 feet', startRate: 100, calc: '+25' },
        { key: 'rate601_700', label: '601-700 feet', startRate: 105, calc: '+30' },
        { key: 'rate701_800', label: '701-800 feet', startRate: 110, calc: '+35' },
        { key: 'rate801_900', label: '801-900 feet', startRate: 115, calc: '+40' },
        { key: 'rate901_1000', label: '901-1000 feet', startRate: 120, calc: '+45' },
        { key: 'rate1001_1100', label: '1001-1100 feet', startRate: 125, calc: '+50' },
        { key: 'rate1101_1200', label: '1101-1200 feet', startRate: 130, calc: '+55' },
        { key: 'rate1201_1300', label: '1201-1300 feet', startRate: 135, calc: '+60' },
        { key: 'rate1301_1400', label: '1301-1400 feet', startRate: 140, calc: '+65' },
        { key: 'rate1401_1500', label: '1401-1500 feet', startRate: 145, calc: '+70' },
        { key: 'rate1501_1600', label: '1501-1600 feet', startRate: 150, calc: '+75' },
        { key: 'rate1600_plus', label: '1600+ feet', startRate: 155, calc: '+80' }
      ];
    } else {
      rateFields = [
        { key: 'rate1_300', label: '1-300 feet', startRate: 75, calc: '+0' },
        { key: 'rate301_400', label: '301-400 feet', startRate: 80, calc: '+5' },
        { key: 'rate401_500', label: '401-500 feet', startRate: 85, calc: '+10' },
        { key: 'rate501_600', label: '501-600 feet', startRate: 95, calc: '+20' },
        { key: 'rate601_700', label: '601-700 feet', startRate: 105, calc: '+30' },
        { key: 'rate701_800', label: '701-800 feet', startRate: 115, calc: '+40' },
        { key: 'rate801_900', label: '801-900 feet', startRate: 125, calc: '+50' },
        { key: 'rate901_1000', label: '901-1000 feet', startRate: 135, calc: '+60' },
        { key: 'rate1001_1100', label: '1001-1100 feet', startRate: 235, calc: '+100' },
        { key: 'rate1101_1200', label: '1101-1200 feet', startRate: 335, calc: '+100' },
        { key: 'rate1201_1300', label: '1201-1300 feet', startRate: 435, calc: '+100' },
        { key: 'rate1301_1400', label: '1301-1400 feet', startRate: 535, calc: '+100' },
        { key: 'rate1401_1500', label: '1401-1500 feet', startRate: 635, calc: '+100' },
        { key: 'rate1501_1600', label: '1501-1600 feet', startRate: 735, calc: '+100' },
        { key: 'rate1600_plus', label: '1600+ feet', startRate: 835, calc: '+100' }
      ];
      
      if (type === 'type3') {
        rateFields.push({ key: 'rate1_500', label: '1-500 feet', startRate: 75, calc: '+0' });
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
      
      toast.success(`Auto-filled ${slabNames[type]} rates`);
    };

    return (
      <div>
        {/* Simple Auto-fill button */}
        <div className="mb-4">
          <button
            onClick={handleAutoFill}
            className="px-4 py-2 bg-gray-800 text-white font-medium rounded border"
          >
            Auto Fill Based on First Rate
          </button>
        </div>

        <div className="text-sm text-gray-600 mb-4">
          {type === 'type2' ? 
            'Enter rate for 1-100 feet, then click Auto Fill to calculate all other rates' : 
            'Enter rate for 1-300 feet, then click Auto Fill to calculate all other rates'
          }
        </div>

        {/* Simple Rate input fields */}
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {rateFields.map((field) => (
            <div key={field.key} className="flex items-center space-x-3 p-2 border rounded">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
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
                  className="w-full border border-gray-300 rounded px-3 py-1 text-gray-900 focus:outline-none focus:border-gray-500"
                  placeholder={field.startRate.toString()}
                />
              </div>
              
              <div className="flex-shrink-0">
                <label className="block text-xs text-gray-600 mb-1">Calc</label>
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
                  className="w-16 border border-gray-300 rounded px-2 py-1 text-sm text-gray-900 text-center focus:outline-none focus:border-gray-500"
                  placeholder="+0"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Simple Header */}
      <div className="border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate(-1)}
                className="p-2 text-gray-600 border rounded"
              >
                <ArrowLeftIcon className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Slab Rate Configuration</h1>
                <p className="text-gray-600 text-sm">Configure pricing rates</p>
              </div>
            </div>
            <button
              onClick={saveConfiguration}
              className="px-4 py-2 bg-gray-800 text-white font-medium rounded border"
            >
              Save Configuration
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Simple Tab Navigation */}
        <div className="mb-6">
          <div className="flex space-x-1 border-b border-gray-200">
            {(['type1', 'type2', 'type3'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setActiveTab(type)}
                className={`px-4 py-2 font-medium text-sm border-b-2 ${
                  activeTab === type 
                    ? 'border-gray-800 text-gray-900' 
                    : 'border-transparent text-gray-500'
                }`}
              >
                {slabNames[type]}
              </button>
            ))}
          </div>
        </div>

        {/* Simple Content Area */}
        <div className="border border-gray-200 rounded p-6">
          {/* Tab Header */}
          <div className="mb-6 pb-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <input
                  type="text"
                  value={slabNames[activeTab]}
                  onChange={(e) => setSlabNames({...slabNames, [activeTab]: e.target.value})}
                  className="text-lg font-bold text-gray-900 border-b border-gray-300 focus:outline-none focus:border-gray-500"
                  placeholder="Enter slab name"
                />
                <p className="text-gray-600 text-sm mt-1">
                  {activeTab === 'type1' ? 'Traditional 300ft base system' :
                   activeTab === 'type2' ? 'Progressive 100ft increment system' :
                   'Flexible custom configuration'}
                </p>
              </div>
              <button
                onClick={() => resetSlabToDefaults(activeTab)}
                className="px-3 py-1 text-sm border border-gray-300 rounded text-gray-700"
                title="Reset to defaults"
              >
                Reset to Defaults
              </button>
            </div>
          </div>

          {/* Tab Content */}
          <div>
            {renderRateInputs(activeTab)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SlabRateConfigurationClean;
