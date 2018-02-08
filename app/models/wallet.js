var mongoose = require('mongoose'),
Schema = mongoose.Schema;

// Wallet Schema
var WalletSchema = new Schema ({
	userId : { type: Number },
	address: { type: String },
	privateKey: { type: String}
}, {timestamps: true});

module.exports = mongoose.model('Wallet', WalletSchema);