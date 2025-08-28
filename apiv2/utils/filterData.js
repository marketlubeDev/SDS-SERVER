import AppError from "./appError.js";

export default function filterData(type) {
  let allowedFields;

  switch (type) {
    case "Product":
      allowedFields = [
        "name",
        "description",
        "price",
        "stock",
        "category",
        "image",
      ];
      break;

    case "User":
      allowedFields = ["name", "email", "phone", "password", "confirmPassword"];
      break;

    case "PasswordReset":
      allowedFields = ["password", "newPassword", "confirmNewPassword"];
      break;

    case "Coupon":
      allowedFields = ["name", "discountPercent", "permanant", "expireDate"];
      break;

    default:
      next(new AppError("Invalid Model type gave to filterData", 401));
  }

  return (req, res, next) => {
    const filteredBody = {};
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        filteredBody[field] = req.body[field];
      }
    });
    req.body = filteredBody;
    next();
  };
}
