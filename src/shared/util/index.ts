export const printLog = (...message) => {
  if (process.env.DEBUG_MODE === 'true') {
    console.log(...message);
  }
};
