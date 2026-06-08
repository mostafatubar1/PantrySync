const mongoose = require('mongoose');
const { Schema } = mongoose;

const categories = ['dairy', 'meat', 'vegetables', 'fruits', 'grains', 'beverages', 'snacks', 'other'];
const zones = ['fridge', 'top', 'middle', 'bottom', 'veg', 'fruit', 'pantry'];
const units = ['pcs', 'g', 'kg', 'ml', 'liter', 'pack', 'cup', 'tbsp'];

const itemSchema = new Schema({
    owner: { type: Schema.ObjectId, ref: 'User', required: true },
    name: { type: String, required:true,  trim: true },
    category: { type: String, enum: categories },
    amount: { type: Number, required: true, min: 0 },
    unit: { type: String, enum: units },
    expiryDate: { type: Date, required: true },
    zone: { type: String, enum: zones },
    notes: { type: String, default: '', trim: true },
    price: { type: Number, default: 0, min: 0 }
}, { timestamps: true });

itemSchema.statics.zones = zones;
itemSchema.statics.units = units;
itemSchema.statics.categories = categories;

module.exports = mongoose.model('Item', itemSchema);