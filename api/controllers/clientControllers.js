import Client from "../models/Client.js";
import catchAsync from "../utils/catchAsync.js";
import AppError from "../utils/appError.js";
import mongoose from "mongoose";

// Get all clients with optional search and pagination
export const getAllClients = catchAsync(async (req, res, next) => {
  const { q, limit = 10, page = 1 } = req.query;

  const query = {};

  // Search functionality
  if (q) {
    query.$or = [];
    query.$or.push({ name: { $regex: q, $options: "i" } });
    if (mongoose.Types.ObjectId.isValid(q)) {
      query.$or.push({ _id: q });
    }
  }

  // Pagination
  const skip = (page - 1) * limit;

  const clients = await Client.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const totalClients = await Client.countDocuments(query);

  res.status(200).json({
    status: "success",
    content: {
      clients,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalClients / limit),
        totalClients,
        hasNextPage: page < Math.ceil(totalClients / limit),
        hasPrevPage: page > 1,
      },
    },
  });
});

// Get single client by ID
export const getClientById = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(new AppError("Invalid client ID", 400));
  }

  const client = await Client.findById(id);

  if (!client) {
    return next(new AppError("No client found with that ID", 404));
  }

  res.status(200).json({
    status: "success",
    content: client,
  });
});

// Create new client
export const createClient = catchAsync(async (req, res, next) => {
  const { name } = req.body;

  if (!name || name.trim() === "") {
    return next(new AppError("Client name is required", 400));
  }

  // Check if client with same name already exists
  const existingClient = await Client.findOne({
    name: { $regex: new RegExp(`^${name.trim()}$`, "i") },
  });

  if (existingClient) {
    return next(new AppError("Client with this name already exists", 400));
  }

  const clientData = {
    name: name.trim(),
  };

  // Handle S3 image upload
  if (req.file) {
    clientData.image = req.file.location;
  } else {
    return next(new AppError("Client image is required", 400));
  }

  const client = await Client.create(clientData);

  res.status(201).json({
    status: "success",
    message: "Client created successfully",
    content: client,
  });
});

// Update client
export const updateClient = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { name } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(new AppError("Invalid client ID", 400));
  }

  const client = await Client.findById(id);

  if (!client) {
    return next(new AppError("No client found with that ID", 404));
  }

  const updateData = {};

  // Update name if provided
  if (name && name.trim() !== "") {
    // Check if another client with same name exists
    const existingClient = await Client.findOne({
      name: { $regex: new RegExp(`^${name.trim()}$`, "i") },
      _id: { $ne: id },
    });

    if (existingClient) {
      return next(new AppError("Client with this name already exists", 400));
    }

    updateData.name = name.trim();
  }

  // Update image if provided
  if (req.file) {
    updateData.image = req.file.location;
  }

  const updatedClient = await Client.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    status: "success",
    message: "Client updated successfully",
    content: updatedClient,
  });
});

// Delete client
export const deleteClient = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(new AppError("Invalid client ID", 400));
  }

  const client = await Client.findById(id);

  if (!client) {
    return next(new AppError("No client found with that ID", 404));
  }

  await Client.findByIdAndDelete(id);

  res.status(200).json({
    status: "success",
    message: "Client deleted successfully",
    content: null,
  });
});

// Get clients count for dashboard
export const getClientsCount = catchAsync(async (req, res, next) => {
  const totalClients = await Client.countDocuments();

  res.status(200).json({
    status: "success",
    content: {
      totalClients,
    },
  });
});

export default {
  getAllClients,
  getClientById,
  createClient,
  updateClient,
  deleteClient,
  getClientsCount,
};
