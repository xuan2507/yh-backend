const mongoose = require('mongoose');

const ConceptSchema = new mongoose.Schema({
  id: String,
  title: String,
  description: String,
  tags: [String],
  palette: [String],
  typography: {
    primary: String,
    secondary: String
  },
  layout: {
    type: String,
    description: String
  },
  mood: {
    name: String,
    description: String
  },
  template: mongoose.Schema.Types.Mixed,
  generatedAt: String
}, { _id: false });

const AiLogSchema = new mongoose.Schema({
  message: String,
  type: String,
  time: Number,
  timestamp: { type: String, default: () => new Date().toISOString() }
}, { _id: false });

const OrderSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true },
  email: { type: String, required: true },
  package: { type: String, default: 'not_specified' },
  brief: { type: String, required: true },
  source: { type: String, default: 'website' },
  status: { type: String, default: 'received' },
  paymentMethod: { type: String, default: '' },
  paymentRef: { type: String, default: '' },
  price: { type: String, default: '' },
  service: { type: String, default: '' },
  concepts: [ConceptSchema],
  aiLogs: [AiLogSchema],
  aiAnalysis: mongoose.Schema.Types.Mixed,
  error: String,
  createdAt: { type: String, default: () => new Date().toISOString() },
  updatedAt: { type: String, default: () => new Date().toISOString() }
});

module.exports = mongoose.model('Order', OrderSchema);
