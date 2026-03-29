const mongoose = require('mongoose');

const tradeSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    pair: { type: String, required: true, trim: true, uppercase: true },
    type: { type: String, enum: ['buy', 'sell'], required: true },
    lotSize: { type: Number, required: true, min: 0 },
    entryPrice: { type: Number, required: true },
    stopLoss: { type: Number },
    takeProfit: { type: Number },
    exitPrice: { type: Number },
    profitLoss: { type: Number },
    strategy: { type: String, trim: true, default: '' },
    notes: { type: String, default: '' },
    /** { url, publicId } from Cloudinary, or legacy local filename string */
    screenshots: [{ type: mongoose.Schema.Types.Mixed }],
    openedAt: { type: Date, required: true },
    closedAt: { type: Date },
    status: { type: String, enum: ['open', 'closed'], default: 'closed' },
    /** Optional psychology / daily journal line tied to this trade */
    psychologyNote: { type: String, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Trade', tradeSchema);
