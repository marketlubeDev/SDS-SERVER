import { cloudinaryInstance } from "../config/cloudinary.js";


import { Readable } from "stream";

const bufferToStream = (buffer) => {
    const readable = new Readable();
    readable.push(buffer);
    readable.push(null); // Signals the end of the stream
    return readable;
};




const uploadToCloudinary = (buffer) => {
    return new Promise((resolve, reject) => {
        let stream = cloudinaryInstance.uploader.upload_stream({ folder: "sds_security/products" }, (error, result) => {
            if (error) reject(error);
            else resolve(result.secure_url);
        });

        bufferToStream(buffer).pipe(stream); // Using built-in Node.js stream
    });
};

export default uploadToCloudinary;