require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/authRoutes');
const employeeRoutes = require('./routes/employeeRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const payrollRoutes = require('./routes/payrollRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/payroll', payrollRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Health check & statutory info endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ONLINE',
    service: 'PayRolleey Sri Lanka Statutory Payroll Engine',
    version: '2026.1.0',
    compliance: {
      country: 'Sri Lanka',
      year: 2026,
      employeeEpf: '8%',
      employerEpf: '12%',
      employerEtf: '3%',
      taxRelief: 'LKR 150,000 / month',
      taxBands: [
        'First 83,333.33 @ 6%',
        'Next 41,666.67 @ 18%',
        'Next 41,666.67 @ 24%',
        'Next 41,666.67 @ 30%',
        'Remaining Balance @ 36%'
      ]
    },
    timestamp: new Date().toISOString()
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({
    success: false,
    message: err.message || 'Internal server error occurred.'
  });
});

app.listen(PORT, () => {
  console.log(`PayRolleey Backend running on http://localhost:${PORT}`);
  console.log(`Sri Lanka 2026 Statutory Payroll Engine initialized.`);
});
