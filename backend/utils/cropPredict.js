const axios = require("axios");

async function predictCropDisease(imagePath) {
  if (!imagePath) return null;

  try {
    const response = await axios.post("http://127.0.0.1:6000/predict", {
      imagePath,
    });
    return response.data.prediction;
  } catch (err) {
    console.error(err);
    return null;
  }
}

module.exports = { predictCropDisease };
