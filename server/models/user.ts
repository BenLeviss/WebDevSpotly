import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

/** Typed interface for User documents, exposing instance methods. */
export interface IUser extends Document {
    username: string;
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
    bio?: string;
    avatarUrl?: string;
    refreshTokens: string[];
    createdAt: Date;
    updatedAt: Date;
    comparePassword(candidatePassword: string): Promise<boolean>;
}

// Define the User schema
const userSchema: Schema<IUser> = new Schema(
    {
        username: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            minlength: 3,
            maxlength: 30
        },
        email: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            lowercase: true,
            match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address']
        },
        password: {
            type: String,
            required: true,
            minlength: 6
        },
        firstName: {
            type: String,
            trim: true,
            maxlength: 50
        },
        lastName: {
            type: String,
            trim: true,
            maxlength: 50
        },
        bio: {
            type: String,
            maxlength: 500
        },
        avatarUrl: {
            type: String  // stores a path like "/uploads/avatar-123.jpg"
        },
        refreshTokens: {
            type: [String],
            default: []
        }
    },
    {
        timestamps: true
    }
);

// Hash password before saving
userSchema.pre('save', async function () {
    if (!this.isModified('password')) {
        return;
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Method to compare passwords for login
userSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
    try {
        return await bcrypt.compare(candidatePassword, this.password);
    } catch (error) {
        return false;
    }
};

export default mongoose.model<IUser>('User', userSchema);
