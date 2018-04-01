var mongoose = require('mongoose'),
Schema = mongoose.Schema;

// History Schema
var HistorySchema = new Schema ({
	from: { type: String },
	to: { type: String },
	amount: { type: Number },
	hash: { type: String },
	action: { type: String }
}, {timestamps: true});

module.exports = mongoose.model('History', HistorySchema);