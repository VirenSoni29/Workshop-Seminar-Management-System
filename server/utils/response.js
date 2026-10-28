export const sendSuccess = (
   res,
   { data = null, message = "Success", statusCode = 200, meta } = {},
) => {
   return res.status(statusCode).json({
      success: true,
      message,
      data,
      ...(meta && { meta }),
   });
};

export const sendError = (
   res,
   { message = "Something went wrong", statusCode = 500, errors } = {},
) => {
   return res.status(statusCode).json({
      success: false,
      message,
      ...(errors && { errors }),
   });
};
