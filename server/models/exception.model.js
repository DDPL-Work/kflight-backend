const mongoose = require('mongoose');
const { Schema } = mongoose;

// Exception Schema
const exceptionSchema = new Schema({
  exception_type: String,
  message: String,
  stack_trace: String,
  occurred_at: { type: Date, default: Date.now },
  user_id: { type: Schema.Types.ObjectId, ref: 'User' },
  related_entity_type: String,
  related_entity_id: Schema.Types.ObjectId
  
});

const Exception = mongoose.model('Exception', exceptionSchema);

module.exports = { Exception };