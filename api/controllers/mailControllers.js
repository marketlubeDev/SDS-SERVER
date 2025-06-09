import { Product } from "../models/productModel.js";
import catchAsync from "../utils/catchAsync.js";
import { otpToEmail } from "../utils/otp.js";

export const getInTouch = catchAsync(async (req, res) => {
  const { fullName, phoneNumber, email, message } = req.body;

  // Create email content for admin
  const adminEmail = process.env.ADMIN_EMAIL; // Make sure to add this to your .env file
  const emailContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
      <h2 style="color: #333; border-bottom: 2px solid #eee; padding-bottom: 10px;">New Contact Form Submission</h2>
      <div style="background-color: #f9f9f9; padding: 15px; border-radius: 4px;">
        <p style="margin: 8px 0;"><strong style="color: #555;">Name:</strong> ${fullName}</p>
        <p style="margin: 8px 0;"><strong style="color: #555;">Phone:</strong> ${phoneNumber}</p>
        <p style="margin: 8px 0;"><strong style="color: #555;">Email:</strong> ${email}</p>
        <div style="background-color: white; padding: 10px; border-left: 3px solid #007bff; margin-top: 5px;">
          <p style="margin: 8px 0;"><strong style="color: #555;">Message:</strong></p>
          ${message}
        </div>
      </div>
    </div>
  `;

  // Send email to admin
  const [response, status] = await otpToEmail(
    adminEmail,
    emailContent,
    "New Contact Form Submission"
  );


  if (status === "Failed") {
    return res.status(500).json({ message: "Failed to send email" });
  }

  res.status(200).json({ message: "Email sent successfully" });
});

export const raiseComplaint = catchAsync(async (req, res) => {
  const { fullName, phoneNumber, email, issueDescription, product } = req.body;

  //fetch product details
  const productDetails = await Product.findById(product);

  // Create email content for admin
  const adminEmail = process.env.ADMIN_EMAIL; // Make sure to add this to your .env file
  const emailContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
      <h2 style="color: #333; border-bottom: 2px solid #eee; padding-bottom: 10px;">New Complaint Form Submission</h2>
      <div style="background-color: #f9f9f9; padding: 15px; border-radius: 4px;">
        <p style="margin: 8px 0;"><strong style="color: #555;">Name:</strong> ${fullName}</p>
        <p style="margin: 8px 0;"><strong style="color: #555;">Phone:</strong> ${phoneNumber}</p>
        <p style="margin: 8px 0;"><strong style="color: #555;">Email:</strong> ${email}</p>
        <div style="background-color: white; padding: 10px; border-left: 3px solid #007bff; margin-top: 5px;">
          <p style="margin: 8px 0;"><strong style="color: #555;">Product ID:</strong> ${productDetails._id}</p>
          <p style="margin: 8px 0;"><strong style="color: #555;">Product Name:</strong> ${productDetails.name}</p>
          <p style="margin: 8px 0;"><strong style="color: #555;">Category:</strong> ${productDetails.category}</p>
          <p style="margin: 8px 0;"><strong style="color: #555;">Sub Category:</strong> ${productDetails.subCategory}</p>
          <p style="margin: 8px 0;"><strong style="color: #555;">Brand:</strong> ${productDetails.brand}</p>
          ${productDetails.productImage  ?
            `<img src="${productDetails.productImage}" alt="${productDetails.name}" style="max-width: 200px; margin-top: 10px;">`
            : ''}
        </div>

        <p style="margin: 8px 0;"><strong style="color: #555;">Issue Description:</strong></p>
        <div style="background-color: white; padding: 10px; border-left: 3px solid #007bff; margin-top: 5px;">
          ${issueDescription}
        </div>
      </div>
    </div>
  `;

  // Send email to admin
  const [response, status] = await otpToEmail(
    adminEmail,
    emailContent,
    "New Complaint Form Submission"
  );

  if (status === "Failed") {
    return res.status(500).json({ message: "Failed to send email" });
  }

  res.status(200).json({ message: "Email sent successfully" });
});
