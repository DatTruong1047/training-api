const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        require: true
    },
    description: String,
    sku: {
      type: String,
      unique: true
    },
    price: {
      type: Number,
      required: true
    },
    quantity: {
      type: Number,
      required: true
    },
    thumbnail: String,
    image: String,
    createdAt: {
      type: Date,
      default: Date.now
    },
    updatedAt: {
      type: Date,
      default: Date.now
    }
});

productSchema.pre('save',async function(next) {
    if(!this.sku) {
        let unique = false;
        let skuGenerated;
        while (!unique) {
          const namePart = this.name.substring(0, 3).toUpperCase();
          const randomNumber = Math.floor(1000 + Math.random() * 9000);
          skuGenerated = `${namePart}-${randomNumber}`;
          // Kiểm tra xem SKU đã tồn tại hay chưa
          const existingProduct = await mongoose.models.Product.findOne({ sku: skuGenerated });
          if (!existingProduct) {
            unique = true;
          }
        }
        this.sku = skuGenerated;
      }
      next();
});

module.exports =  mongoose.model('Product', productSchema);