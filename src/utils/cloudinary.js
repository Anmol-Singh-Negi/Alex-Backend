import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

// Configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;
    //upload the file on cloudinary..
    const response = await cloudinary.uploader.upload(localFilePath, {
      resourse_type: "auto",
    });
    //File has been uploaded successfully
    console.log("File is uploaded successfully", response.url);
    return response;
  } catch (error) {
    fs.unlinkSync(localFilePath); //remove the locally saved temprory file as the upload operation got failed
    return null;
  }
};

/*const uploadResult = await cloudinary.uploader
  .upload(
    "https://res.cloudinary.com/demo/image/upload/getting-started/shoes.jpg",
    {
      public_id: "shoes",
    }
  )
  .catch((error) => {
    console.log(error);
  });

console.log(uploadResult);
*/ //applicable
export { uploadOnCloudinary };
