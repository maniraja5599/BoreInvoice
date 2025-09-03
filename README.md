# Anjaneya Borewells Service Management

A comprehensive web application for managing borewell drilling services, customer information, project tracking, and financial management.

## Features

### 🏠 Dashboard
- Overview of key business metrics
- Recent projects and quick actions
- Revenue and project statistics
- Visual status indicators

### 👥 Customer Management
- Add, edit, and manage customer information
- Search and filter customers
- Customer contact details and history
- Bulk customer operations

### 🔧 Project Management
- Create and track borewell projects
- Detailed project information including:
  - Customer details
  - Borewell location and specifications
  - Drilling depth and diameter
  - Cost calculations
  - Project status tracking
- Project filtering and search capabilities

### 💰 Payment Management
- Track all payments and advances
- Multiple payment methods (Cash, Bank Transfer, Cheque, UPI, Card)
- Payment history and reconciliation
- Pending payment tracking

### 📊 Reports & Analytics
- Financial reports and revenue analysis
- Project status distribution
- Customer spending analysis
- Monthly revenue trends
- Payment method breakdown

### ⚙️ Settings
- Company information management
- Application preferences
- Data export capabilities
- System configuration

## Technology Stack

- **Frontend**: React 18 with TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Heroicons
- **State Management**: React Hooks
- **Data Storage**: Local Storage (for demo purposes)
- **Build Tool**: Create React App

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd anjaneya-borewells-app
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

4. Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

## Project Structure

```
src/
├── components/          # React components
│   ├── Dashboard.tsx
│   ├── CustomerManagement.tsx
│   ├── ProjectManagement.tsx
│   ├── ProjectForm.tsx
│   ├── PaymentManagement.tsx
│   ├── Reports.tsx
│   ├── Settings.tsx
│   └── Layout.tsx
├── services/           # Business logic and data services
│   └── borewellService.ts
├── types/             # TypeScript type definitions
│   └── index.ts
├── contexts/          # React contexts (if needed)
├── App.tsx           # Main application component
└── index.tsx         # Application entry point
```

## Data Models

### Customer
- Basic information (name, address, phone, email)
- Creation and update timestamps

### Borewell Project
- Customer association
- Location and drilling details
- Technical specifications (depth, diameter)
- Cost breakdown
- Project status

### Payment
- Project and customer association
- Payment amount and method
- Payment date and type (advance/regular)
- Description and notes

## Key Features

### Customer Information Management
- **Customer Name**: Full name of the customer
- **Address**: Complete address details
- **Phone Number**: Contact number
- **Email**: Optional email address

### Borewell Details
- **Location/Address**: Site location for drilling
- **Drilling Date**: When the drilling was performed
- **Total Depth**: Depth drilled in feet
- **Diameter**: Borewell diameter in inches
- **Cost per Foot**: Drilling cost calculation
- **Casing Pipe**: Length and cost details
- **Flushing**: Number of flushes and charges
- **Additional Services**: Extra materials and services

### Payment Information
- **Advance Payment**: Any advance received
- **Payment Method**: Cash, bank transfer, cheque, UPI, or card
- **Payment Tracking**: Complete payment history

## Usage

### Adding a New Customer
1. Navigate to "Customers" section
2. Click "Add Customer" button
3. Fill in customer details
4. Save the customer information

### Creating a New Project
1. Navigate to "Projects" section
2. Click "New Project" button
3. Select customer from dropdown
4. Fill in borewell details and specifications
5. Add cost information
6. Record any advance payment
7. Save the project

### Managing Payments
1. Navigate to "Payments" section
2. View all payment records
3. Filter by payment method or search by customer
4. Track pending payments

### Generating Reports
1. Navigate to "Reports" section
2. Choose report type (Overview, Financial, Projects)
3. View detailed analytics and insights

## Development

### Adding New Features
1. Create new components in `src/components/`
2. Add TypeScript types in `src/types/index.ts`
3. Implement business logic in `src/services/`
4. Update routing in `src/App.tsx`

### Styling
The application uses Tailwind CSS for styling. All components follow a consistent design system with:
- Clean, modern interface
- Responsive design
- Accessible color schemes
- Consistent spacing and typography

### Data Persistence
Currently, the application uses localStorage for data persistence. For production use, consider:
- Implementing a backend API
- Using a database (PostgreSQL, MongoDB)
- Adding user authentication
- Implementing data backup and recovery

## Deployment

### Build for Production
```bash
npm run build
```

### Deploy Options
- **Netlify**: Drag and drop the `build` folder
- **Vercel**: Connect GitHub repository
- **AWS S3**: Upload build files to S3 bucket
- **Heroku**: Deploy using Heroku CLI

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please contact:
- Email: support@anjaneyaborewells.com
- Phone: +91 98765 43210

## Future Enhancements

- [ ] User authentication and authorization
- [ ] Backend API integration
- [ ] Database implementation
- [ ] Mobile app development
- [ ] Advanced reporting features
- [ ] Invoice generation
- [ ] SMS/Email notifications
- [ ] GPS location tracking
- [ ] Photo documentation
- [ ] Work order management



