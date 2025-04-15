// Handle 404 Not Found errors
const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error); // Pass the error to the next middleware
};

// General error handler
const errorHandler = (err, req, res, next) => {
  // Sometimes errors come with status codes, otherwise default to 500
  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let message = err.message;

  // Mongoose Bad ObjectId Error
  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    message = `Resource not found`;
    statusCode = 404;
  }

  // Mongoose Validation Error
  if (err.name === 'ValidationError') {
    message = Object.values(err.errors).map(val => val.message).join(', ');
    statusCode = 400; // Bad Request
  }

    // Mongoose Duplicate Key Error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    message = `Duplicate field value entered for ${field}. Please use another value.`;
    statusCode = 400; // Bad Request
  }


  res.status(statusCode).json({
    message: message,
    // Provide stack trace only in development mode
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
};

module.exports = { notFound, errorHandler };
