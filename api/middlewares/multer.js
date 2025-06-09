import multer, { diskStorage } from "multer";

const storage = diskStorage({
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});

export const upload = multer({ storage: storage });
// import multer from "multer";

// const storage = multer.memoryStorage(); // Store files in memory (RAM)

// export const upload = multer({ storage });
