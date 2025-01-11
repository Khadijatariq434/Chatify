const multer=require('multer');
const path=require('path')

// Set up storage for Multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); // Set destination folder
    },
    filename: (req, file, cb) => {
        // Store the file with a unique name (original name + timestamp)
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

// Set up file filter to only allow images
const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Only image files are allowed'), false);
    }
};

// Set up the upload middleware
const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // Limit file size to 5 MB
});
module.exports=upload
