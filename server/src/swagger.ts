const swaggerSpec = {
    openapi: "3.0.3",
    info: {
        title: "Spotly API",
        version: "1.0.0",
        description: "API documentation for Spotly backend services.",
    },
    servers: [
        {
            url: "http://localhost:3000",
            description: "Local development server",
        },
    ],
    tags: [
        { name: "Auth", description: "Authentication endpoints" },
        { name: "Posts", description: "Post management endpoints" },
        { name: "Comments", description: "Comment management endpoints" },
        { name: "Users", description: "User management endpoints" },
    ],
    components: {
        securitySchemes: {
            bearerAuth: {
                type: "http",
                scheme: "bearer",
                bearerFormat: "JWT",
            },
        },
        schemas: {
            ErrorResponse: {
                type: "object",
                properties: {
                    error: { type: "string" },
                },
                required: ["error"],
            },
            MessageResponse: {
                type: "object",
                properties: {
                    message: { type: "string" },
                },
                required: ["message"],
            },
            UserPublic: {
                type: "object",
                properties: {
                    _id: { type: "string", example: "665fc1a5a8f8a3f2e4c3b123" },
                    username: { type: "string", example: "john_doe" },
                    email: { type: "string", format: "email", example: "john@example.com" },
                    firstName: { type: "string", nullable: true },
                    lastName: { type: "string", nullable: true },
                    bio: { type: "string", nullable: true },
                    avatarUrl: { type: "string", nullable: true, example: "/uploads/photo-123.jpg" },
                    createdAt: { type: "string", format: "date-time" },
                    updatedAt: { type: "string", format: "date-time" },
                },
            },
            RegisterRequest: {
                type: "object",
                properties: {
                    username: { type: "string", minLength: 3 },
                    email: { type: "string", format: "email" },
                    password: { type: "string", minLength: 6 },
                },
                required: ["username", "email", "password"],
            },
            LoginRequest: {
                type: "object",
                properties: {
                    email: { type: "string", format: "email" },
                    password: { type: "string" },
                },
                required: ["email", "password"],
            },
            GoogleAuthRequest: {
                type: "object",
                properties: {
                    idToken: { type: "string" },
                },
                required: ["idToken"],
            },
            AuthResponse: {
                type: "object",
                properties: {
                    message: { type: "string" },
                    accessToken: { type: "string" },
                    refreshToken: { type: "string" },
                    user: { $ref: "#/components/schemas/UserPublic" },
                },
                required: ["message", "accessToken", "refreshToken"],
            },
            TokenRefreshResponse: {
                type: "object",
                properties: {
                    message: { type: "string" },
                    accessToken: { type: "string" },
                    refreshToken: { type: "string" },
                },
                required: ["message", "accessToken", "refreshToken"],
            },
            Post: {
                type: "object",
                properties: {
                    _id: { type: "string", example: "665fc1a5a8f8a3f2e4c3b999" },
                    title: { type: "string" },
                    content: { type: "string", nullable: true },
                    category: { type: "string", nullable: true },
                    imageUrl: { type: "string", nullable: true, example: "/uploads/photo-123.jpg" },
                    userId: {
                        oneOf: [
                            { type: "string" },
                            { $ref: "#/components/schemas/UserPublic" },
                        ],
                    },
                    likes: {
                        type: "array",
                        items: { type: "string" },
                    },
                    commentCount: { type: "number", nullable: true },
                    createdAt: { type: "string", format: "date-time" },
                    updatedAt: { type: "string", format: "date-time" },
                },
            },
            CreatePostRequest: {
                type: "object",
                properties: {
                    title: { type: "string" },
                    content: { type: "string" },
                    category: { type: "string" },
                    image: { type: "string", format: "binary" },
                },
                required: ["title"],
            },
            UpdatePostRequest: {
                type: "object",
                properties: {
                    title: { type: "string" },
                    content: { type: "string" },
                    category: { type: "string" },
                    image: { type: "string", format: "binary" },
                },
            },
            Comment: {
                type: "object",
                properties: {
                    _id: { type: "string" },
                    postId: { type: "string" },
                    userId: {
                        oneOf: [
                            { type: "string" },
                            {
                                type: "object",
                                properties: {
                                    _id: { type: "string" },
                                    username: { type: "string" },
                                    email: { type: "string", format: "email" },
                                },
                            },
                        ],
                    },
                    content: { type: "string" },
                    createdAt: { type: "string", format: "date-time" },
                    updatedAt: { type: "string", format: "date-time" },
                },
            },
            CreateCommentRequest: {
                type: "object",
                properties: {
                    content: { type: "string" },
                },
                required: ["content"],
            },
            UpdateCommentRequest: {
                type: "object",
                properties: {
                    content: { type: "string" },
                },
                required: ["content"],
            },
            CreateUserRequest: {
                type: "object",
                properties: {
                    username: { type: "string", minLength: 3 },
                    email: { type: "string", format: "email" },
                    password: { type: "string", minLength: 6 },
                },
                required: ["username", "email", "password"],
            },
            UpdateUserRequest: {
                type: "object",
                properties: {
                    username: { type: "string" },
                    email: { type: "string", format: "email" },
                    firstName: { type: "string" },
                    lastName: { type: "string" },
                    bio: { type: "string" },
                    image: { type: "string", format: "binary" },
                },
            },
        },
    },
    paths: {
        "/auth/register": {
            post: {
                tags: ["Auth"],
                summary: "Register a user",
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/RegisterRequest" },
                        },
                    },
                },
                responses: {
                    "201": {
                        description: "User registered",
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/AuthResponse" },
                            },
                        },
                    },
                    "400": { description: "Bad request" },
                    "409": { description: "User already exists" },
                },
            },
        },
        "/auth/login": {
            post: {
                tags: ["Auth"],
                summary: "Login user",
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/LoginRequest" },
                        },
                    },
                },
                responses: {
                    "200": {
                        description: "Login successful",
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/AuthResponse" },
                            },
                        },
                    },
                    "401": { description: "Invalid credentials" },
                },
            },
        },
        "/auth/google": {
            post: {
                tags: ["Auth"],
                summary: "Authenticate with Google",
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/GoogleAuthRequest" },
                        },
                    },
                },
                responses: {
                    "200": {
                        description: "Google login successful",
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/AuthResponse" },
                            },
                        },
                    },
                    "400": { description: "Google idToken is required" },
                    "401": { description: "Google authentication failed" },
                },
            },
        },
        "/auth/logout": {
            post: {
                tags: ["Auth"],
                summary: "Logout user",
                security: [{ bearerAuth: [] }],
                responses: {
                    "200": {
                        description: "Logout successful",
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/MessageResponse" },
                            },
                        },
                    },
                    "401": { description: "Token required" },
                    "403": { description: "Invalid token" },
                },
            },
        },
        "/auth/refresh": {
            post: {
                tags: ["Auth"],
                summary: "Refresh access token",
                security: [{ bearerAuth: [] }],
                responses: {
                    "200": {
                        description: "Token refreshed",
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/TokenRefreshResponse" },
                            },
                        },
                    },
                    "401": { description: "Refresh token required" },
                    "403": { description: "Invalid refresh token" },
                },
            },
        },
        "/post": {
            post: {
                tags: ["Posts"],
                summary: "Create a post",
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        "multipart/form-data": {
                            schema: { $ref: "#/components/schemas/CreatePostRequest" },
                        },
                    },
                },
                responses: {
                    "201": {
                        description: "Post created",
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/Post" },
                            },
                        },
                    },
                    "400": { description: "Validation error" },
                },
            },
            get: {
                tags: ["Posts"],
                summary: "Get posts",
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        name: "userId",
                        in: "query",
                        required: false,
                        schema: { type: "string" },
                        description: "Filter posts by user ID",
                    },
                    {
                        name: "skip",
                        in: "query",
                        required: false,
                        schema: { type: "integer", minimum: 0 },
                    },
                    {
                        name: "limit",
                        in: "query",
                        required: false,
                        schema: { type: "integer", minimum: 0 },
                    },
                ],
                responses: {
                    "200": {
                        description: "List of posts",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "array",
                                    items: { $ref: "#/components/schemas/Post" },
                                },
                            },
                        },
                    },
                },
            },
        },
        "/post/{postId}": {
            get: {
                tags: ["Posts"],
                summary: "Get post by ID",
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        name: "postId",
                        in: "path",
                        required: true,
                        schema: { type: "string" },
                    },
                ],
                responses: {
                    "200": {
                        description: "Post found",
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/Post" },
                            },
                        },
                    },
                    "404": { description: "Post not found" },
                },
            },
            put: {
                tags: ["Posts"],
                summary: "Update post by ID",
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        name: "postId",
                        in: "path",
                        required: true,
                        schema: { type: "string" },
                    },
                ],
                requestBody: {
                    required: true,
                    content: {
                        "multipart/form-data": {
                            schema: { $ref: "#/components/schemas/UpdatePostRequest" },
                        },
                        "application/json": {
                            schema: { $ref: "#/components/schemas/UpdatePostRequest" },
                        },
                    },
                },
                responses: {
                    "200": {
                        description: "Post updated",
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/Post" },
                            },
                        },
                    },
                    "403": { description: "Forbidden" },
                    "404": { description: "Post not found" },
                },
            },
            delete: {
                tags: ["Posts"],
                summary: "Delete post by ID",
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        name: "postId",
                        in: "path",
                        required: true,
                        schema: { type: "string" },
                    },
                ],
                responses: {
                    "200": {
                        description: "Post deleted",
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/MessageResponse" },
                            },
                        },
                    },
                    "403": { description: "Forbidden" },
                    "404": { description: "Post not found" },
                },
            },
        },
        "/post/{postId}/comment": {
            post: {
                tags: ["Comments"],
                summary: "Create comment for post",
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        name: "postId",
                        in: "path",
                        required: true,
                        schema: { type: "string" },
                    },
                ],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/CreateCommentRequest" },
                        },
                    },
                },
                responses: {
                    "201": {
                        description: "Comment created",
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/Comment" },
                            },
                        },
                    },
                    "404": { description: "Post not found" },
                },
            },
            get: {
                tags: ["Comments"],
                summary: "Get comments by post",
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        name: "postId",
                        in: "path",
                        required: true,
                        schema: { type: "string" },
                    },
                ],
                responses: {
                    "200": {
                        description: "Comments fetched",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "array",
                                    items: { $ref: "#/components/schemas/Comment" },
                                },
                            },
                        },
                    },
                },
            },
        },
        "/post/{postId}/like": {
            post: {
                tags: ["Posts"],
                summary: "Toggle like on a post",
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        name: "postId",
                        in: "path",
                        required: true,
                        schema: { type: "string" },
                    },
                ],
                responses: {
                    "200": {
                        description: "Like toggled",
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/Post" },
                            },
                        },
                    },
                    "404": { description: "Post not found" },
                },
            },
        },
        "/comment": {
            get: {
                tags: ["Comments"],
                summary: "Get all comments",
                security: [{ bearerAuth: [] }],
                responses: {
                    "200": {
                        description: "Comments fetched",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "array",
                                    items: { $ref: "#/components/schemas/Comment" },
                                },
                            },
                        },
                    },
                },
            },
        },
        "/comment/{commentId}": {
            get: {
                tags: ["Comments"],
                summary: "Get comment by ID",
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        name: "commentId",
                        in: "path",
                        required: true,
                        schema: { type: "string" },
                    },
                ],
                responses: {
                    "200": {
                        description: "Comment found",
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/Comment" },
                            },
                        },
                    },
                    "404": { description: "Comment not found" },
                },
            },
            put: {
                tags: ["Comments"],
                summary: "Update comment by ID",
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        name: "commentId",
                        in: "path",
                        required: true,
                        schema: { type: "string" },
                    },
                ],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/UpdateCommentRequest" },
                        },
                    },
                },
                responses: {
                    "200": {
                        description: "Comment updated",
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/Comment" },
                            },
                        },
                    },
                    "403": { description: "Forbidden" },
                    "404": { description: "Comment not found" },
                },
            },
            delete: {
                tags: ["Comments"],
                summary: "Delete comment by ID",
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        name: "commentId",
                        in: "path",
                        required: true,
                        schema: { type: "string" },
                    },
                ],
                responses: {
                    "200": {
                        description: "Comment deleted",
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/MessageResponse" },
                            },
                        },
                    },
                    "403": { description: "Forbidden" },
                    "404": { description: "Comment not found" },
                },
            },
        },
        "/user": {
            post: {
                tags: ["Users"],
                summary: "Create user",
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/CreateUserRequest" },
                        },
                    },
                },
                responses: {
                    "201": {
                        description: "User created",
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/UserPublic" },
                            },
                        },
                    },
                    "409": { description: "User already exists" },
                },
            },
            get: {
                tags: ["Users"],
                summary: "Get all users",
                security: [{ bearerAuth: [] }],
                responses: {
                    "200": {
                        description: "Users fetched",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "array",
                                    items: { $ref: "#/components/schemas/UserPublic" },
                                },
                            },
                        },
                    },
                },
            },
        },
        "/user/{userId}": {
            get: {
                tags: ["Users"],
                summary: "Get user by ID",
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        name: "userId",
                        in: "path",
                        required: true,
                        schema: { type: "string" },
                    },
                ],
                responses: {
                    "200": {
                        description: "User found",
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/UserPublic" },
                            },
                        },
                    },
                    "404": { description: "User not found" },
                },
            },
            put: {
                tags: ["Users"],
                summary: "Update user profile",
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        name: "userId",
                        in: "path",
                        required: true,
                        schema: { type: "string" },
                    },
                ],
                requestBody: {
                    required: true,
                    content: {
                        "multipart/form-data": {
                            schema: { $ref: "#/components/schemas/UpdateUserRequest" },
                        },
                        "application/json": {
                            schema: { $ref: "#/components/schemas/UpdateUserRequest" },
                        },
                    },
                },
                responses: {
                    "200": {
                        description: "User updated",
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/UserPublic" },
                            },
                        },
                    },
                    "403": { description: "Forbidden" },
                    "404": { description: "User not found" },
                },
            },
            delete: {
                tags: ["Users"],
                summary: "Delete user by ID",
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        name: "userId",
                        in: "path",
                        required: true,
                        schema: { type: "string" },
                    },
                ],
                responses: {
                    "200": {
                        description: "User deleted",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        message: { type: "string" },
                                        user: { $ref: "#/components/schemas/UserPublic" },
                                    },
                                },
                            },
                        },
                    },
                    "403": { description: "Forbidden" },
                    "404": { description: "User not found" },
                },
            },
        },
        "/user/{userId}/posts": {
            get: {
                tags: ["Users"],
                summary: "Get posts by user ID",
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        name: "userId",
                        in: "path",
                        required: true,
                        schema: { type: "string" },
                    },
                ],
                responses: {
                    "200": {
                        description: "User posts fetched",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "array",
                                    items: { $ref: "#/components/schemas/Post" },
                                },
                            },
                        },
                    },
                },
            },
        },
        "/user/{userId}/comments": {
            get: {
                tags: ["Users"],
                summary: "Get comments by user ID",
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        name: "userId",
                        in: "path",
                        required: true,
                        schema: { type: "string" },
                    },
                ],
                responses: {
                    "200": {
                        description: "User comments fetched",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "array",
                                    items: { $ref: "#/components/schemas/Comment" },
                                },
                            },
                        },
                    },
                },
            },
        },
    },
} as const;

export default swaggerSpec;
