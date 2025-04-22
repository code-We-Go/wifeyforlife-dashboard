import mongoose from 'mongoose';

const ShippingZonesSchema = new mongoose.Schema({
  zone_name: { type: String, required: true },
  zone_rate: { type: Number, required: true },
}, { timestamps: true });
const shippingZonesModel = mongoose.models.shipping_zones || mongoose.model('shipping_zones', ShippingZonesSchema);
export default shippingZonesModel