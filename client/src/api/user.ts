import api from './axios';

export interface UserProfile {
    _id: string;
    username: string;
    email: string;
    firstName?: string;
    lastName?: string;
    bio?: string;
    avatarUrl?: string;
}

export const userApi = {
    // Fetch any user's profile by their ID
    getUserById: (userId: string) =>
        api.get<UserProfile>(`/user/${userId}`),
};
