/**
 * Send error response
 * @param {Object} param
 * @param {Object} param.data
 * @param {String} param.message
 */
const success = function ({ data, message }) {
  this.json({
    success: true,
    data,
    status: 200,
    message: message || 'success',
  });
};

/**
 * Send error response
 * @param {Object} param
 * @param {Object} param.errors
 * @param {Number} param.status
 * @param {String} param.message
 */
const error = function ({
  errors,
  status,
  message,
}) {
  let errorMessages = errors;
  const isExpressValidatorErrors = errors && typeof errors.array === 'function';
  if (isExpressValidatorErrors) {
    errorMessages = {};
    errors.array().forEach((e) => {
      if (!errorMessages[e.param]) {
        errorMessages[e.param] = e.msg;
      }
    });
  }
  this.json({
    success: false,
    errors: errorMessages,
    message: message || 'error',
    status: status || 200,
  });
};

const ResonseUtil = {
  success,
  error,
};
export default ResonseUtil;
