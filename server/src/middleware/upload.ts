import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Make sure the uploads folder exists when the server starts
<<<<<<< HEAD
const uploadDirCandidates = process.env.NODE_ENV === 'production'
    ? [
        path.join(__dirname, '..', 'uploads'),      // prod build: server/dist/uploads
        path.join(__dirname, '..', '..', 'uploads') // fallback: server/uploads
    ]
    : [
        path.join(__dirname, '..', '..', 'uploads'), // dev ts-node: server/uploads
        path.join(__dirname, '..', 'uploads')        // fallback: server/src/uploads
    ];
=======
const uploadDirCandidates = [
    path.join(__dirname, '..', '..', 'uploads'), // dev ts-node: server/uploads
    path.join(__dirname, '..', 'uploads'),       // prod build: server/dist/uploads
    path.join(__dirname, 'uploads')
];
>>>>>>> f391cb0 (upload)
const uploadDir = uploadDirCandidates.find((dir) => fs.existsSync(dir)) || uploadDirCandidates[0];
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure where and how multer saves files
const storage = multer.diskStorage({
    // destination: the folder on disk where files are saved
    destination: (_req, _file, cb) => {
        cb(null, uploadDir);
    },

    // filename: give each file a unique name using the current timestamp
    // so two files with the same original name never overwrite each other
    filename: (_req, file, cb) => {
        const unique = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
        const ext = path.extname(file.originalname); // e.g. ".jpg"
        cb(null, `photo-${unique}${ext}`);
    },
});

// Only accept JPG and PNG images
const fileFilter = (_req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const allowed = ['image/jpeg', 'image/png'];
    if (allowed.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Only JPG and PNG images are allowed'));
    }
};

// Export the configured multer middleware
// .single('image') means we expect one file under the field name "image"
export const uploadImage = multer({
    storage,
    fileFilter,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB max
}).single('image');
