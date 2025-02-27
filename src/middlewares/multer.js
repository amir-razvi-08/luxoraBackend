import multer from "multer";

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const isValid = allowedTypes.test(file.mimetype) && allowedTypes.test(file.originalname.toLowerCase());

    if (isValid) {
        cb(null, true);
    } else {
        cb(new Error("Only images are allowed (jpeg, jpg, png, gif, webp)"));
    }
};

const upload = multer({ storage, fileFilter });

export default upload;
