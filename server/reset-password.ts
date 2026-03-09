/**
 * reset-password.ts — One-time script to reset a user's password
 * Usage: npx ts-node reset-password.ts
 */
import mongoose from 'mongoose';
import User from './models/user';
import dotenv from 'dotenv';

dotenv.config();

const TARGET_EMAIL = 'ben2@ben2.com';
const NEW_PASSWORD = '123123';

async function resetPassword() {
    const dbUrl = process.env.DATABASE_URL || process.env.MONGODB_URI;
    if (!dbUrl) {
        throw new Error('DATABASE_URL / MONGODB_URI not set in .env');
    }
    await mongoose.connect(dbUrl);
    console.log('✅ Connected to DB');

    const user = await User.findOne({ email: TARGET_EMAIL });
    if (!user) {
        console.error(`❌ User "${TARGET_EMAIL}" not found`);
        process.exit(1);
    }

    // Setting the password and saving triggers the pre-save bcrypt hook
    user.password = NEW_PASSWORD;
    await user.save();

    console.log(`✅ Password for "${TARGET_EMAIL}" reset to "${NEW_PASSWORD}"`);
    await mongoose.disconnect();
}

resetPassword().catch(err => {
    console.error('❌ Error:', err.message);
    process.exit(1);
});
