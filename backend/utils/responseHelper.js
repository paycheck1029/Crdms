export const sendSuccess = (res, data = {}, message = 'Success', status = 200) => {
  return res.status(status).json({
    success: true,
    message,
    data
  });
};

export const sendError = (res, message = 'Error occurred', error = {}, status = 400) => {
  return res.status(status).json({
    success: false,
    message,
    error
  });
};

export default {
  sendSuccess,
  sendError
};
