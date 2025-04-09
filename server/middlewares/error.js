const errorMiddleware = (err, req, res, next) => {
  err.message ||= "Internal Server Error";
  err.statusCode ||= 500;
  console.log(err);

  return res.status(err.statusCode).json({
    success: false,
    message: err.message,
  });
};

module.exports = { errorMiddleware };
