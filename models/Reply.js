const mongoose = require('mongoose');

const ReplySchema = new mongoose.Schema({
  thread_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Thread', required: true },
  text: { type: String, required: true },
  delete_password: { type: String, required: true },
  reported: { type: Boolean, default: false },
  created_on: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Reply', ReplySchema); 