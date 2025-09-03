const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  console.log('🔧 Setting up enhanced proxy middleware...');
  
  // Add body parser middleware for JSON requests
  app.use('/api', (req, res, next) => {
    if (req.method === 'POST' || req.method === 'PUT') {
      let body = '';
      req.on('data', chunk => {
        body += chunk.toString();
      });
      req.on('end', () => {
        try {
          req.body = JSON.parse(body);
        } catch (error) {
          req.body = {};
        }
        next();
      });
    } else {
      next();
    }
  });
  
  // Mock API endpoint for customer creation
  app.post('/api/customers', (req, res) => {
    console.log('👤 Customer creation request received:', req.body);
    const { name, phoneNumber, address, whatsappNumber, email } = req.body;
    
    // Validate required fields
    if (!name || !phoneNumber || !address) {
      console.log('❌ Customer validation failed:', { name, phoneNumber, address });
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: name, phoneNumber, and address are required'
      });
    }
    
    // Simulate API processing delay
    setTimeout(() => {
      const newCustomer = {
        id: `cust_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: name.trim(),
        phoneNumber: phoneNumber.trim(),
        address: address.trim(),
        whatsappNumber: whatsappNumber?.trim() || null,
        email: email?.trim() || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      console.log('✅ Customer created via API:', newCustomer);
      
      res.status(201).json({
        success: true,
        data: newCustomer,
        message: 'Customer created successfully'
      });
    }, 500); // 500ms delay to simulate network request
  });

  // Mock API endpoint for invoice creation
  app.post('/api/invoices', (req, res) => {
    console.log('📝 Invoice creation request received:');
    console.log('📝 Request headers:', req.headers);
    console.log('📝 Request body:', req.body);
    console.log('📝 Request body type:', typeof req.body);
    
    const { customerId, serviceDetails, items, subtotal, taxAmount, taxRate, totalAmount, notes, terms } = req.body || {};
    
    // Validate required fields
    if (!customerId || !serviceDetails || !items || items.length === 0) {
      console.log('❌ Validation failed:', { customerId, serviceDetails, items });
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: customerId, serviceDetails, and items are required'
      });
    }
    
    // Simulate API processing delay
    setTimeout(() => {
      const invoiceNumber = `INV-${Date.now().toString().slice(-6)}`;
      
      const newInvoice = {
        id: `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        invoiceNumber,
        customerId,
        serviceDetails,
        items,
        subtotal,
        taxAmount,
        taxRate,
        totalAmount,
        paidAmount: 0,
        pendingAmount: totalAmount,
        status: 'DRAFT',
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
        invoiceDate: new Date().toISOString(),
        notes: notes || '',
        terms: terms || 'Payment due within 30 days',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      console.log('✅ Invoice created via API:', newInvoice);
      
      res.status(201).json({
        success: true,
        data: newInvoice,
        message: 'Invoice created successfully'
      });
    }, 800); // 800ms delay to simulate network request
  });
  
  // Add CORS headers for preflight requests
  app.use('/PiConnectTP', (req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    if (req.method === 'OPTIONS') {
      res.sendStatus(200);
    } else {
      next();
    }
  });
  
  app.use(
    '/PiConnectTP',
    createProxyMiddleware({
      target: 'https://piconnect.flattrade.in',
      changeOrigin: true,
      secure: true,
      logLevel: 'debug',
      onProxyReq: (proxyReq, req, res) => {
        console.log('🚀 Proxying request:', req.method, req.url, '→', proxyReq.path);
      },
      onProxyRes: (proxyRes, req, res) => {
        console.log('✅ Proxy response:', proxyRes.statusCode, req.url);
      },
      onError: (err, req, res) => {
        console.error('❌ Proxy error:', err.message);
      }
    })
  );
  
  console.log('✅ Enhanced proxy middleware configured for /PiConnectTP → https://piconnect.flattrade.in');
};
