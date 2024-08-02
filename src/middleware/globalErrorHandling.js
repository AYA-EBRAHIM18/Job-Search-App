const errorHandler = (err, req, res, next) => {
  let code = err.statusCode || 500;
  res.status(code).json({ error: "error", message: err.message, code });
};

export default errorHandler;
