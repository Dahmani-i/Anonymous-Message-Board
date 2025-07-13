const mongoose = require('mongoose');

const ThreadSchema = new mongoose.Schema({
  board: { type: String, required: true },
  text: { type: String, required: true },
  delete_password: { type: String, required: true },
  reported: { type: Boolean, default: false },
  replies: [{
    _id: { type: mongoose.Schema.Types.ObjectId, required: true },
    text: { type: String, required: true },
    created_on: { type: Date, required: true },
    delete_password: { type: String, required: true },
    reported: { type: Boolean, default: false }
  }],
  replycount: { type: Number, default: 0 },
  created_on: { type: Date, default: Date.now },
  bumped_on: { type: Date, default: Date.now }
});

// Ensure replies array is always initialized
ThreadSchema.pre('save', function(next) {
  if (!this.replies) {
    this.replies = [];
  }
  if (!this.replycount) {
    this.replycount = 0;
  }
  next();
});

module.exports = mongoose.model('Thread', ThreadSchema); 