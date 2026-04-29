import pool from '../config/connectDatabase.js';
import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

// Cloudinary config (already in .env, but let's be sure)
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadToCloudinary = async (filePath, folder = 'cnpm_websach_products') => {
    try {
        if (!fs.existsSync(filePath)) {
            console.warn(`File not found: ${filePath}`);
            return null;
        }
        const result = await cloudinary.uploader.upload(filePath, {
            folder: folder,
        });
        return result.secure_url;
    } catch (error) {
        console.error(`Error uploading ${filePath}:`, error.message);
        return null;
    }
};

const migrate = async () => {
    console.log('🚀 Starting migration to Cloudinary...');

    try {
        // 1. Migrate primary images in 'sanpham' table
        const [products] = await pool.query('SELECT MaSP, HinhAnh FROM sanpham');
        console.log(`Found ${products.length} products to check.`);

        for (const product of products) {
            const hinhAnh = product.HinhAnh;
            if (hinhAnh && !hinhAnh.startsWith('http')) {
                const cleanName = hinhAnh.replace(/^\/img\/products\//, '').replace(/^\/+/, '');
                const localPath = path.join(process.cwd(), 'uploads', 'products', cleanName);

                console.log(`Uploading primary image for SP ${product.MaSP}: ${cleanName}...`);
                const url = await uploadToCloudinary(localPath);

                if (url) {
                    await pool.query('UPDATE sanpham SET HinhAnh = ? WHERE MaSP = ?', [url, product.MaSP]);
                    console.log(`✅ Updated SP ${product.MaSP} -> ${url}`);
                }
            }
        }

        // 2. Migrate extra images in 'sanpham_anh' table
        const [extraImages] = await pool.query('SELECT Id, FileName FROM sanpham_anh');
        console.log(`Found ${extraImages.length} extra images to check.`);

        for (const img of extraImages) {
            const hinhAnh = img.FileName;
            if (hinhAnh && !hinhAnh.startsWith('http')) {
                const cleanName = hinhAnh.replace(/^\/img\/products\//, '').replace(/^\/+/, '');
                const localPath = path.join(process.cwd(), 'uploads', 'products', cleanName);

                console.log(`Uploading extra image ID ${img.Id}: ${cleanName}...`);
                const url = await uploadToCloudinary(localPath);

                if (url) {
                    await pool.query('UPDATE sanpham_anh SET FileName = ? WHERE Id = ?', [url, img.Id]);
                    console.log(`✅ Updated Extra Image ${img.Id} -> ${url}`);
                }
            }
        }

        console.log('🎉 Migration completed successfully!');
    } catch (error) {
        console.error('❌ Migration failed:', error);
    } finally {
        process.exit();
    }
};

migrate();
