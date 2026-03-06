/**
 * list-users.ts — One-time script to list all users in the DB
 */
import mongoose from 'mongoose';
import User from './models/user';
import dotenv from 'dotenv';

dotenv.config();

async function listUsers() {
    const dbUrl = process.env.DATABASE_URL || process.env.MONGODB_URI;
    if (!dbUrl) throw new Error('DATABASE_URL not set');
    await mongoose.connect(dbUrl);

    const users = await User.find({}).select('username email createdAt').lean();
    console.log('\n=== ALL USERS IN DB ===');
    users.forEach(u => console.log(`  ${u.email}  (${u.username})`));
    console.log(`\nTotal: ${users.length} users`);

    await mongoose.disconnect();
}

listUsers().catch(err => { console.error(err.message); process.exit(1); });
