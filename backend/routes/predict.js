const express = require("express");
const router = express.Router();
const multer = require("multer");
const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");
const axios = require("axios");
const { logActivity, getUserIdFromRequest } = require("./activities");

// Configure multer for uploads
const uploadDir = path.resolve("backend/uploads/");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const upload = multer({
  dest: uploadDir,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB
  },
});

// Supported crops
const SUPPORTED_CROPS = [
  "apple",
  "cherry_(including_sour)",
  "corn_(maize)",
  "grape",
  "peach",
  "pepper_bell",
  "potato",
  "strawberry",
  "tomato",
];

// POST /api/predict/:crop
router.post("/:crop", upload.single("image"), async (req, res) => {
  let imgPath = null;

  try {
    const crop = req.params.crop;
    const cropNormalized = crop.toLowerCase();

    // Validate crop
    if (!SUPPORTED_CROPS.includes(cropNormalized)) {
      return res.status(400).json({
        error: `Unsupported crop: ${crop}`,
        supportedCrops: SUPPORTED_CROPS,
        note:
          "Available crops: Apple, Cherry, Corn, Grape, Peach, Pepper, Potato, Strawberry, Tomato",
      });
    }

    // Validate uploaded image
    if (!req.file) {
      return res.status(400).json({
        error: "No image uploaded",
      });
    }

    imgPath = path.resolve(req.file.path);

    // Resolve the Python prediction script
    const mlScriptPath = path.resolve(__dirname, "../../ml/predict.py");

    if (!fs.existsSync(mlScriptPath)) {
      console.error("Prediction script not found:", mlScriptPath);

      return res.status(500).json({
        error: "Prediction script not found",
      });
    }

    console.log("Starting crop prediction", {
      crop: cropNormalized,
      script: mlScriptPath,
      imageExists: fs.existsSync(imgPath),
    });

    // Use PYTHON_EXECUTABLE if configured; otherwise use python.
    // On Render, configure this only if your environment requires a
    // specific Python executable.
    const pythonExecutable = process.env.PYTHON_EXECUTABLE || "python";

    const pythonProcess = spawn(
      pythonExecutable,
      [
        mlScriptPath,
        "--image",
        imgPath,
        "--crop",
        cropNormalized,
      ],
      {
        cwd: path.resolve(__dirname, "../.."),
        env: process.env,
      }
    );

    let result = "";
    let errorOutput = "";
    let responseSent = false;

    const sendError = (status, body) => {
      if (!responseSent && !res.headersSent) {
        responseSent = true;
        return res.status(status).json(body);
      }
    };

    // Capture Python standard output
    pythonProcess.stdout.on("data", (data) => {
      const output = data.toString();
      result += output;
      console.log("Python stdout:", output);
    });

    // Capture Python standard error
    pythonProcess.stderr.on("data", (data) => {
      const output = data.toString();
      errorOutput += output;
      console.error("Python stderr:", output);
    });

    // Handle failure to start Python
    pythonProcess.on("error", (err) => {
      console.error("Could not start Python process:", err);

      sendError(500, {
        error: "Could not start Python prediction process",
        details: err.message,
      });
    });

    // Handle prediction completion
    pythonProcess.on("close", async (code, signal) => {
      try {
        console.log("Python process finished", {
          exitCode: code,
          signal,
          stdoutLength: result.length,
          stderrLength: errorOutput.length,
        });

        if (code !== 0) {
          console.error("Python prediction failed", {
            exitCode: code,
            signal,
            stdout: result,
            stderr: errorOutput,
          });

          return sendError(500, {
            error: "Prediction failed",
            exitCode: code,
            signal: signal || null,
            details:
              errorOutput.trim() ||
              result.trim() ||
              "Python exited without providing an error message.",
          });
        }

        // Parse JSON returned by predict.py
        let parsedResult;

        try {
          // The Python script must print valid JSON to stdout.
          // Diagnostic messages should be printed to stderr.
          parsedResult = JSON.parse(result.trim());
        } catch (parseError) {
          console.error("Could not parse Python prediction JSON", {
            parseError: parseError.message,
            stdout: result,
            stderr: errorOutput,
          });

          return sendError(500, {
            error: "Invalid response from prediction system",
            details: parseError.message,
            output: result.trim().slice(0, 2000),
          });
        }

        if (
          !parsedResult ||
          typeof parsedResult !== "object" ||
          !parsedResult.disease
        ) {
          console.error("Prediction JSON missing disease field:", parsedResult);

          return sendError(500, {
            error: "Prediction result is missing the disease field",
            output: parsedResult,
          });
        }

        const lang =
          typeof req.query.lang === "string" ? req.query.lang : "en";

        // Capitalize the first word and preserve the rest of the crop name.
        const capitalizedCrop = cropNormalized
          .split("_")
          .map((word, index) =>
            index === 0
              ? word.charAt(0).toUpperCase() + word.slice(1)
              : word
          )
          .join("_");

        console.log(
          `ML Prediction - Crop: "${cropNormalized}" -> "${capitalizedCrop}", Disease: "${parsedResult.disease}"`
        );

        // Fetch disease details. If this lookup fails, use fallback content.
        const diseaseInfo = await fetchDiseaseInfo(
          capitalizedCrop,
          parsedResult.disease,
          lang
        );

        const response = {
          ...parsedResult,
          ...diseaseInfo,
        };

        // Activity logging is optional; prediction should still succeed
        // if activity logging fails.
        try {
          const userId = await getUserIdFromRequest(req);

          console.log("Disease detection userId:", userId || "Not authenticated");

          if (userId) {
            await logActivity(userId, {
              activityType: "disease-detection",
              title: `Disease Detection - ${capitalizedCrop}`,
              description: `Detected ${parsedResult.disease} in ${capitalizedCrop} with ${
                parsedResult.confidence ?? "N/A"
              }% confidence`,
              status: "completed",
              result:
                parsedResult.disease === "Healthy"
                  ? "Crop is healthy"
                  : `Disease detected: ${parsedResult.disease}`,
              metadata: {
                crop: capitalizedCrop,
                disease: parsedResult.disease,
                confidence: parsedResult.confidence,
              },
            });

            console.log("Disease detection activity logged");
          }
        } catch (activityError) {
          console.error(
            "Activity logging failed; prediction will still be returned:",
            activityError
          );
        }

        if (!responseSent && !res.headersSent) {
          responseSent = true;
          return res.json(response);
        }
      } catch (err) {
        console.error("Unexpected prediction route error:", err);

        sendError(500, {
          error: "Error processing prediction result",
          details: err.message,
        });
      } finally {
        // Always remove the uploaded temporary image.
        if (imgPath) {
          try {
            if (fs.existsSync(imgPath)) {
              fs.unlinkSync(imgPath);
            }
          } catch (cleanupError) {
            console.error(
              "Failed to remove temporary image:",
              cleanupError.message
            );
          }
        }
      }
    });
  } catch (err) {
    console.error("Prediction route error:", err);

    if (imgPath) {
      try {
        if (fs.existsSync(imgPath)) {
          fs.unlinkSync(imgPath);
        }
      } catch (cleanupError) {
        console.error("Temporary image cleanup failed:", cleanupError.message);
      }
    }

    if (!res.headersSent) {
      return res.status(500).json({
        error: "Internal server error",
        details: err.message,
      });
    }
  }
});

// Fetch disease information from the database API
async function fetchDiseaseInfo(crop, disease, lang) {
  try {
    // Use the configured API base if provided; otherwise use the local
    // Express server port for the internal API request.
    const port = process.env.PORT || 5000;
    const baseURL =
      process.env.INTERNAL_API_URL || `http://127.0.0.1:${port}`;

    const response = await axios.get(
      `${baseURL}/api/disease-info/${encodeURIComponent(crop)}/${encodeURIComponent(
        disease
      )}`,
      {
        params: { lang },
        timeout: 10000,
      }
    );

    return response.data;
  } catch (err) {
    console.error("Disease information lookup failed:", {
      message: err.message,
      status: err.response?.status,
      data: err.response?.data,
    });

    // Preserve the successful ML prediction even if disease details
    // are unavailable.
    return {
      name: disease,
      description:
        "Disease detected. Consult a local agricultural expert for treatment.",
      treatment: ["Consult an agricultural expert"],
      prevention: ["Follow standard crop management practices"],
    };
  }
}

module.exports = router;