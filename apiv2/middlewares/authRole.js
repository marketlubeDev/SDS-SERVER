import catchAsync from "../utils/catchAsync.js";
import AppError from "../utils/appError.js";

// export const authRole = catchAsync(async (roles) => {
//   (req,res,next) => {
//     if (!roles.includes(req.user.role))
//       return next(
//         new AppError("You are not authorized to access this resource", 403)
//       );
//     next();
//   };
// });

// export default authRole;
export const authRole = (...roles) => {

    return catchAsync(async (req, res, next) => {
        if (!roles.includes(req.user.role)) return next(new AppError("You are not authorized to access this resource", 403));
        next();
    });
};
