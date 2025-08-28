import multer, { diskStorage } from "multer";

const storage = diskStorage({
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});

// File filter to allow images and PDFs
const fileFilter = (req, file, cb) => {
  // Allow images for product images and variant images
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  }
  // Allow PDFs for product brochures
  else if (file.mimetype === "application/pdf") {
    cb(null, true);
  }
  // Reject other file types
  else {
    cb(
      new Error(
        "Only image files (JPEG, PNG, WebP) and PDF files are allowed!"
      ),
      false
    );
  }
};

export const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit (covers both images and PDFs)
  },
});
// import multer from "multer";

// const storage = multer.memoryStorage(); // Store files in memory (RAM)

// export const upload = multer({ storage });
