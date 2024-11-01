import multer from 'multer';
import path from 'path';

// Configure storage options for multer
const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, 'public/avatar/');
    },
    filename: function(req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// Configure multer with the storage settings and file constraints
export const upload = multer({
    storage: storage,
    limits: { fileSize: 5000000 },  // Limit file size to 5MB
    fileFilter: function(req, file, cb) {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed!'), false);
        }
    }
}).single('avatar');  // Handle single file upload under 'avatar' field name

export default upload;