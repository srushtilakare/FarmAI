const express = require("express");
const router = express.Router();

const GovernmentScheme = require("../models/GovernmentScheme");
const User = require("../models/User");

const auth = require("../middleware/auth");

const {
  logActivity,
  getUserIdFromRequest,
} = require("./activities");

// =========================================================
// HELPER: GET AUTHENTICATED USER ID
// =========================================================

function getAuthenticatedUserId(req) {
  return (
    req.userId ||
    req.user?._id ||
    req.user?.id ||
    req.user?.userId
  );
}

// =========================================================
// HELPER: CALCULATE AGE
// =========================================================

function calculateAge(dateOfBirth) {
  if (!dateOfBirth) return null;

  const dob = new Date(dateOfBirth);

  if (Number.isNaN(dob.getTime())) {
    return null;
  }

  const today = new Date();

  let age =
    today.getFullYear() -
    dob.getFullYear();

  const monthDifference =
    today.getMonth() -
    dob.getMonth();

  if (
    monthDifference < 0 ||
    (monthDifference === 0 &&
      today.getDate() < dob.getDate())
  ) {
    age--;
  }

  return age;
}

// =========================================================
// HELPER: NORMALIZE ARRAY
// =========================================================

function normalizeArray(value) {
  if (
    value === null ||
    value === undefined
  ) {
    return [];
  }

  if (Array.isArray(value)) {
    return value
      .map((item) =>
        String(item)
          .trim()
          .toLowerCase()
      )
      .filter(Boolean);
  }

  return [
    String(value)
      .trim()
      .toLowerCase(),
  ].filter(Boolean);
}

// =========================================================
// HELPER: CHECK RULE MATCH
// =========================================================

function matchesRule(
  userValue,
  allowedValues
) {
  const allowed =
    normalizeArray(allowedValues);

  // No restriction
  if (allowed.length === 0) {
    return true;
  }

  // "all" means everyone
  if (allowed.includes("all")) {
    return true;
  }

  // Information missing
  if (
    userValue === null ||
    userValue === undefined ||
    userValue === ""
  ) {
    return null;
  }

  const normalizedUserValue =
    String(userValue)
      .trim()
      .toLowerCase();

  return allowed.includes(
    normalizedUserValue
  );
}

// =========================================================
// HELPER: CONVERT LAND TO HECTARES
// =========================================================

function convertLandToHectares(
  value,
  unit
) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  const numericValue = Number(value);

  if (Number.isNaN(numericValue)) {
    return null;
  }

  if (unit === "acre") {
    return numericValue * 0.404686;
  }

  if (unit === "hectare") {
    return numericValue;
  }

  return numericValue;
}

// =========================================================
// HELPER: BASIC PROFILE MISSING FIELDS
// =========================================================

function getBasicProfileMissingFields(
  user
) {
  const missing = [];

  if (!user.fullName) {
    missing.push("Full name");
  }

  if (!user.state) {
    missing.push("State");
  }

  if (!user.district) {
    missing.push("District");
  }

  if (!user.farmerCategory) {
    missing.push("Farmer category");
  }

  if (!user.socialCategory) {
    missing.push("Social category");
  }

  if (!user.gender) {
    missing.push("Gender");
  }

  if (!user.dateOfBirth) {
    missing.push("Date of birth");
  }

  if (
    user.landHolding === null ||
    user.landHolding === undefined ||
    user.landHolding === ""
  ) {
    missing.push("Land holding");
  }

  if (!user.landUnit) {
    missing.push("Land unit");
  }

  if (!user.landOwnership) {
    missing.push("Land ownership");
  }

  if (!user.irrigationType) {
    missing.push("Irrigation type");
  }

  if (
    user.annualFamilyIncome ===
      null ||
    user.annualFamilyIncome ===
      undefined ||
    user.annualFamilyIncome ===
      ""
  ) {
    missing.push(
      "Annual family income"
    );
  }

  if (
    user.aadhaarLinked === null ||
    user.aadhaarLinked === undefined
  ) {
    missing.push(
      "Aadhaar linkage status"
    );
  }

  if (
    user.bankAccountAvailable ===
      null ||
    user.bankAccountAvailable ===
      undefined
  ) {
    missing.push(
      "Bank account status"
    );
  }

  if (
    user.pmKisanRegistered ===
      null ||
    user.pmKisanRegistered ===
      undefined
  ) {
    missing.push(
      "PM-KISAN registration status"
    );
  }

  return missing;
}

// =========================================================
// ELIGIBILITY ENGINE
// =========================================================

function evaluateSchemeEligibility(
  user,
  scheme
) {
  const rules =
    scheme.eligibilityRules || {};

  const passedCriteria = [];
  const failedCriteria = [];
  const missingInformation = [];

  // =======================================================
  // STATE
  // =======================================================

  const schemeState = String(
    scheme.state || "all"
  )
    .trim()
    .toLowerCase();

  const userState = String(
    user.state || ""
  )
    .trim()
    .toLowerCase();

  if (schemeState === "all") {
    passedCriteria.push(
      "Available across India"
    );
  } else if (
    userState &&
    schemeState === userState
  ) {
    passedCriteria.push(
      "State requirement satisfied"
    );
  } else if (!userState) {
    missingInformation.push(
      "State is required"
    );
  } else {
    failedCriteria.push(
      `This scheme is not available in ${
        user.state || "your state"
      }`
    );
  }

  // =======================================================
  // SOCIAL CATEGORY
  // =======================================================

  const categoryRules =
    rules.requiredCategory &&
    rules.requiredCategory.length > 0
      ? rules.requiredCategory
      : scheme.category;

  const categoryMatch =
    matchesRule(
      user.socialCategory,
      categoryRules
    );

  if (categoryMatch === true) {
    passedCriteria.push(
      "Social category requirement satisfied"
    );
  } else if (
    categoryMatch === null
  ) {
    missingInformation.push(
      "Social category is required"
    );
  } else {
    failedCriteria.push(
      "Social category does not match this scheme"
    );
  }

  // =======================================================
  // FARMER CATEGORY
  // =======================================================

  const farmerTypeRules =
    rules.requiredFarmerType &&
    rules.requiredFarmerType.length > 0
      ? rules.requiredFarmerType
      : scheme.farmerType;

  const farmerTypeMatch =
    matchesRule(
      user.farmerCategory,
      farmerTypeRules
    );

  if (farmerTypeMatch === true) {
    passedCriteria.push(
      "Farmer category requirement satisfied"
    );
  } else if (
    farmerTypeMatch === null
  ) {
    missingInformation.push(
      "Farmer category is required"
    );
  } else {
    failedCriteria.push(
      "Farmer category does not match this scheme"
    );
  }

  // =======================================================
  // GENDER
  // =======================================================

  const genderRules =
    rules.requiredGender &&
    rules.requiredGender.length > 0
      ? rules.requiredGender
      : scheme.gender;

  const genderMatch =
    matchesRule(
      user.gender,
      genderRules
    );

  if (genderMatch === true) {
    passedCriteria.push(
      "Gender requirement satisfied"
    );
  } else if (
    genderMatch === null
  ) {
    missingInformation.push(
      "Gender is required"
    );
  } else {
    failedCriteria.push(
      "Gender does not match this scheme"
    );
  }

  // =======================================================
  // AGE
  // =======================================================

  const hasAgeRule =
    (rules.minAge !== null &&
      rules.minAge !== undefined) ||
    (rules.maxAge !== null &&
      rules.maxAge !== undefined);

  if (hasAgeRule) {
    const age = calculateAge(
      user.dateOfBirth
    );

    if (age === null) {
      missingInformation.push(
        "Date of birth is required"
      );
    } else {
      let ageValid = true;

      if (
        rules.minAge !== null &&
        rules.minAge !== undefined &&
        age < rules.minAge
      ) {
        ageValid = false;
      }

      if (
        rules.maxAge !== null &&
        rules.maxAge !== undefined &&
        age > rules.maxAge
      ) {
        ageValid = false;
      }

      if (ageValid) {
        passedCriteria.push(
          `Age requirement satisfied (${age} years)`
        );
      } else {
        let rangeText = "";

        if (
          rules.minAge !== null &&
          rules.minAge !== undefined &&
          rules.maxAge !== null &&
          rules.maxAge !== undefined
        ) {
          rangeText = `${rules.minAge}-${rules.maxAge} years`;
        } else if (
          rules.minAge !== null &&
          rules.minAge !== undefined
        ) {
          rangeText = `minimum ${rules.minAge} years`;
        } else {
          rangeText = `maximum ${rules.maxAge} years`;
        }

        failedCriteria.push(
          `Age requirement not satisfied (requires ${rangeText})`
        );
      }
    }
  }

  // =======================================================
  // LAND HOLDING
  // =======================================================

  const hasLandRule =
    (rules.minLandHolding !== null &&
      rules.minLandHolding !== undefined) ||
    (rules.maxLandHolding !== null &&
      rules.maxLandHolding !== undefined);

  if (hasLandRule) {
    if (
      user.landHolding ===
        null ||
      user.landHolding ===
        undefined ||
      user.landHolding === ""
    ) {
      missingInformation.push(
        "Land holding information is required"
      );
    } else {
      const userLandUnit =
        user.landUnit || "acre";

      const userLandInHectares =
        convertLandToHectares(
          user.landHolding,
          userLandUnit
        );

      if (
        userLandInHectares === null
      ) {
        missingInformation.push(
          "Valid land holding information is required"
        );
      } else {
        let landValid = true;

        let minLandHectares =
          null;

        let maxLandHectares =
          null;

        if (
          rules.minLandHolding !==
            null &&
          rules.minLandHolding !==
            undefined
        ) {
          minLandHectares =
            convertLandToHectares(
              rules.minLandHolding,
              rules.landUnit ===
                "any"
                ? "hectare"
                : rules.landUnit
            );
        }

        if (
          rules.maxLandHolding !==
            null &&
          rules.maxLandHolding !==
            undefined
        ) {
          maxLandHectares =
            convertLandToHectares(
              rules.maxLandHolding,
              rules.landUnit ===
                "any"
                ? "hectare"
                : rules.landUnit
            );
        }

        if (
          minLandHectares !==
            null &&
          userLandInHectares <
            minLandHectares
        ) {
          landValid = false;
        }

        if (
          maxLandHectares !==
            null &&
          userLandInHectares >
            maxLandHectares
        ) {
          landValid = false;
        }

        if (landValid) {
          passedCriteria.push(
            "Land holding requirement satisfied"
          );
        } else {
          failedCriteria.push(
            "Land holding does not satisfy the scheme requirement"
          );
        }
      }
    }
  }

  // =======================================================
  // LAND OWNERSHIP
  // =======================================================

  if (
    rules.landOwnership &&
    rules.landOwnership.length > 0
  ) {
    const ownershipMatch =
      matchesRule(
        user.landOwnership,
        rules.landOwnership
      );

    if (
      ownershipMatch === true
    ) {
      passedCriteria.push(
        "Land ownership requirement satisfied"
      );
    } else if (
      ownershipMatch === null
    ) {
      missingInformation.push(
        "Land ownership information is required"
      );
    } else {
      failedCriteria.push(
        "Land ownership requirement not satisfied"
      );
    }
  }

  // =======================================================
  // ANNUAL FAMILY INCOME
  // =======================================================

  const hasIncomeRule =
    (rules.minAnnualIncome !==
      null &&
      rules.minAnnualIncome !==
        undefined) ||
    (rules.maxAnnualIncome !==
      null &&
      rules.maxAnnualIncome !==
        undefined);

  if (hasIncomeRule) {
    if (
      user.annualFamilyIncome ===
        null ||
      user.annualFamilyIncome ===
        undefined ||
      user.annualFamilyIncome ===
        ""
    ) {
      missingInformation.push(
        "Annual family income is required"
      );
    } else {
      const income = Number(
        user.annualFamilyIncome
      );

      if (Number.isNaN(income)) {
        missingInformation.push(
          "Valid annual family income is required"
        );
      } else {
        let incomeValid = true;

        if (
          rules.minAnnualIncome !==
            null &&
          rules.minAnnualIncome !==
            undefined &&
          income <
            rules.minAnnualIncome
        ) {
          incomeValid = false;
        }

        if (
          rules.maxAnnualIncome !==
            null &&
          rules.maxAnnualIncome !==
            undefined &&
          income >
            rules.maxAnnualIncome
        ) {
          incomeValid = false;
        }

        if (incomeValid) {
          passedCriteria.push(
            "Annual income requirement satisfied"
          );
        } else {
          failedCriteria.push(
            "Annual family income does not satisfy the scheme requirement"
          );
        }
      }
    }
  }

  // =======================================================
  // IRRIGATION
  // =======================================================

  if (
    rules.requiredIrrigationType &&
    rules.requiredIrrigationType
      .length > 0 &&
    !rules.requiredIrrigationType.includes(
      "all"
    )
  ) {
    const irrigationMatch =
      matchesRule(
        user.irrigationType,
        rules.requiredIrrigationType
      );

    if (
      irrigationMatch === true
    ) {
      passedCriteria.push(
        "Irrigation requirement satisfied"
      );
    } else if (
      irrigationMatch === null
    ) {
      missingInformation.push(
        "Irrigation type is required"
      );
    } else {
      failedCriteria.push(
        "Irrigation type does not match this scheme"
      );
    }
  }

  // =======================================================
  // AADHAAR
  // =======================================================

  if (
    rules.aadhaarRequired === true
  ) {
    if (
      user.aadhaarLinked === null ||
      user.aadhaarLinked ===
        undefined
    ) {
      missingInformation.push(
        "Aadhaar linkage status is required"
      );
    } else if (
      user.aadhaarLinked === true
    ) {
      passedCriteria.push(
        "Aadhaar-linked requirement satisfied"
      );
    } else {
      failedCriteria.push(
        "Aadhaar must be linked"
      );
    }
  }

  // =======================================================
  // BANK ACCOUNT
  // =======================================================

  if (
    rules.bankAccountRequired ===
    true
  ) {
    if (
      user.bankAccountAvailable ===
        null ||
      user.bankAccountAvailable ===
        undefined
    ) {
      missingInformation.push(
        "Bank account status is required"
      );
    } else if (
      user.bankAccountAvailable ===
      true
    ) {
      passedCriteria.push(
        "Bank account requirement satisfied"
      );
    } else {
      failedCriteria.push(
        "A bank account is required"
      );
    }
  }

  // =======================================================
  // PM-KISAN
  // =======================================================

  if (
    rules.pmKisanRequired === true
  ) {
    if (
      user.pmKisanRegistered ===
        null ||
      user.pmKisanRegistered ===
        undefined
    ) {
      missingInformation.push(
        "PM-KISAN registration status is required"
      );
    } else if (
      user.pmKisanRegistered ===
      true
    ) {
      passedCriteria.push(
        "PM-KISAN registration requirement satisfied"
      );
    } else {
      failedCriteria.push(
        "PM-KISAN registration is required"
      );
    }
  }

  // =======================================================
  // UNIQUE MISSING INFORMATION
  // =======================================================

  const uniqueMissingInformation =
    [
      ...new Set(
        missingInformation
      ),
    ];

  // =======================================================
  // FINAL STATUS
  // =======================================================

  let status = "eligible";

  if (
    failedCriteria.length > 0
  ) {
    status = "not_eligible";
  } else if (
    uniqueMissingInformation.length >
    0
  ) {
    status =
      "profile_incomplete";
  }

  return {
    status,

    eligible:
      status === "eligible",

    partiallyEligible:
      status ===
      "profile_incomplete",

    passedCriteria,

    failedCriteria,

    missingInformation:
      uniqueMissingInformation,

    reason:
      status === "eligible"
        ? "Based on the information in your profile, you appear eligible for this scheme."
        : status ===
          "not_eligible"
        ? "Based on the information in your profile, you do not currently meet all eligibility requirements."
        : "Complete your profile to check your eligibility accurately.",
  };
}

// =========================================================
// HELPER: ATTACH ELIGIBILITY
// =========================================================

function attachEligibility(
  scheme,
  user
) {
  if (!user) {
    return {
      ...scheme,

      eligibilityResult: {
        status:
          "profile_incomplete",

        eligible: false,

        partiallyEligible: true,

        passedCriteria: [],

        failedCriteria: [],

        missingInformation: [
          "Login required to check eligibility",
        ],

        reason:
          "Login and complete your profile to check eligibility.",
      },
    };
  }

  const eligibilityResult =
    evaluateSchemeEligibility(
      user,
      scheme
    );

  return {
    ...scheme,
    eligibilityResult,
  };
}

// =========================================================
// GET RECOMMENDED SCHEMES
// =========================================================

router.get(
  "/recommended",
  auth,
  async (req, res) => {
    try {
      const userId =
        getAuthenticatedUserId(
          req
        );

      if (!userId) {
        return res.status(401).json({
          success: false,
          error:
            "User authentication required",
        });
      }

      const user =
        await User.findById(
          userId
        ).lean();

      if (!user) {
        return res.status(404).json({
          success: false,
          error: "User not found",
        });
      }

      const userState =
        String(user.state || "")
          .trim()
          .toLowerCase();

      const userCategory =
        String(
          user.socialCategory || ""
        )
          .trim()
          .toLowerCase();

      const userFarmerType =
        String(
          user.farmerCategory || ""
        )
          .trim()
          .toLowerCase();

      const userGender =
        String(user.gender || "")
          .trim()
          .toLowerCase();

      const userCrops =
        normalizeArray(
          user.crops
        );

      const schemes =
        await GovernmentScheme.find({
          active: true,

          $or: [
            {
              state: user.state,
            },
            {
              state: "all",
            },
          ],
        })
          .sort({
            priority: -1,
            createdAt: -1,
          })
          .limit(100)
          .lean();

      const recommended =
        schemes
          .map((scheme) => {
            let score = 0;

            const schemeCategories =
              normalizeArray(
                scheme.category
              );

            const schemeFarmerTypes =
              normalizeArray(
                scheme.farmerType
              );

            const schemeGenders =
              normalizeArray(
                scheme.gender
              );

            const schemeEligibility =
              normalizeArray(
                scheme.eligibility
              );

            const schemeState =
              String(
                scheme.state || "all"
              )
                .trim()
                .toLowerCase();

            // State
            if (
              schemeState === "all"
            ) {
              score += 10;
            } else if (
              schemeState ===
              userState
            ) {
              score += 25;
            }

            // Farmer type
            if (
              userFarmerType &&
              (
                schemeFarmerTypes.includes(
                  "all"
                ) ||
                schemeFarmerTypes.includes(
                  userFarmerType
                )
              )
            ) {
              score += 15;
            }

            // Gender
            if (
              userGender &&
              (
                schemeGenders.includes(
                  "all"
                ) ||
                schemeGenders.includes(
                  userGender
                )
              )
            ) {
              score += 10;
            }

            // Social category
            if (
              userCategory &&
              (
                schemeCategories.includes(
                  "all"
                ) ||
                schemeCategories.includes(
                  userCategory
                )
              )
            ) {
              score += 10;
            }

            // Crop relevance
            if (
              userCrops.length > 0
            ) {
              const schemeText =
                [
                  scheme.schemeName,
                  scheme.description,
                  scheme.benefits,
                  ...schemeEligibility,
                ]
                  .join(" ")
                  .toLowerCase();

              const cropMatch =
                userCrops.some(
                  (crop) =>
                    schemeText.includes(
                      crop
                    )
                );

              if (cropMatch) {
                score += 20;
              }
            }

            // Priority
            score += Math.min(
              Number(
                scheme.priority || 0
              ),
              10
            );

            return {
              scheme,
              score,
            };
          })
          .sort(
            (a, b) =>
              b.score - a.score
          )
          .slice(0, 50);

          const evaluatedSchemes =
          recommended
            .map(({ scheme, score }) => {
              const schemeWithEligibility =
                attachEligibility(
                  scheme,
                  user
                );
        
              return {
                ...schemeWithEligibility,
                recommendationScore:
                  score,
              };
            })
            .filter(
              (scheme) =>
                scheme.eligibilityResult?.status ===
                "eligible"
            );
            
      const missingFields =
        getBasicProfileMissingFields(
          user
        );

      return res.json({
        success: true,

        schemes:
          evaluatedSchemes,

        count:
          evaluatedSchemes.length,

        profileComplete:
          missingFields.length === 0,

        profileMissingFields:
          missingFields,
      });
    } catch (error) {
      console.error(
        "Error fetching recommended schemes:",
        error
      );

      return res.status(500).json({
        success: false,
        error:
          "Failed to fetch recommended schemes",
      });
    }
  }
);

// =========================================================
// GET ALL SCHEMES
// =========================================================

router.get(
  "/all",
  async (req, res) => {
    try {
      const {
        state,
        category,
        schemeType,
        search,
        page = 1,
        limit = 20,
      } = req.query;

      const pageNumber =
        Math.max(
          parseInt(page) || 1,
          1
        );

      const limitNumber =
        Math.min(
          Math.max(
            parseInt(limit) || 20,
            1
          ),
          100
        );

      const query = {
        active: true,
      };

      // State
      if (state) {
        query.$and =
          query.$and || [];

        query.$and.push({
          $or: [
            {
              state: state,
            },
            {
              state: "all",
            },
          ],
        });
      }

      // Category
      if (category) {
        query.category = {
          $in: [
            category,
            "all",
          ],
        };
      }

      // Scheme type
      if (schemeType) {
        query.schemeType =
          schemeType;
      }

      // Search
      if (search) {
        query.$and =
          query.$and || [];

        query.$and.push({
          $or: [
            {
              schemeName: {
                $regex:
                  String(search),
                $options: "i",
              },
            },
            {
              description: {
                $regex:
                  String(search),
                $options: "i",
              },
            },
            {
              benefits: {
                $regex:
                  String(search),
                $options: "i",
              },
            },
            {
              ministry: {
                $regex:
                  String(search),
                $options: "i",
              },
            },
          ],
        });
      }

      const schemes =
        await GovernmentScheme.find(
          query
        )
          .sort({
            priority: -1,
            createdAt: -1,
          })
          .limit(limitNumber)
          .skip(
            (pageNumber - 1) *
              limitNumber
          )
          .lean();

      const count =
        await GovernmentScheme.countDocuments(
          query
        );

      // Try authenticated user
      let user = null;

      try {
        const userId =
          getAuthenticatedUserId(
            req
          );

        if (userId) {
          user =
            await User.findById(
              userId
            ).lean();
        }
      } catch (error) {
        user = null;
      }

      const schemesWithEligibility =
        user
          ? schemes.map(
              (scheme) =>
                attachEligibility(
                  scheme,
                  user
                )
            )
          : schemes;

      const missingFields =
        user
          ? getBasicProfileMissingFields(
              user
            )
          : [];

      return res.json({
        success: true,

        schemes:
          schemesWithEligibility,

        totalPages:
          Math.ceil(
            count /
              limitNumber
          ),

        currentPage:
          pageNumber,

        totalSchemes:
          count,

        profileComplete:
          user
            ? missingFields.length ===
              0
            : false,

        profileMissingFields:
          missingFields,
      });
    } catch (error) {
      console.error(
        "Error fetching schemes:",
        error
      );

      return res.status(500).json({
        success: false,
        error:
          "Failed to fetch schemes",
      });
    }
  }
);

// =========================================================
// SEARCH SCHEMES
// =========================================================

router.get(
  "/search",
  async (req, res) => {
    try {
      const { q } =
        req.query;

      if (
        !q ||
        !String(q).trim()
      ) {
        return res.status(400).json({
          success: false,
          error:
            "Search query is required",
        });
      }

      const searchQuery =
        String(q).trim();

      const schemes =
        await GovernmentScheme.find({
          active: true,

          $or: [
            {
              schemeName: {
                $regex:
                  searchQuery,
                $options: "i",
              },
            },
            {
              description: {
                $regex:
                  searchQuery,
                $options: "i",
              },
            },
            {
              benefits: {
                $regex:
                  searchQuery,
                $options: "i",
              },
            },
            {
              ministry: {
                $regex:
                  searchQuery,
                $options: "i",
              },
            },
          ],
        })
          .sort({
            priority: -1,
            createdAt: -1,
          })
          .limit(20)
          .lean();

      return res.json({
        success: true,
        schemes,
      });
    } catch (error) {
      console.error(
        "Error searching schemes:",
        error
      );

      return res.status(500).json({
        success: false,
        error:
          "Failed to search schemes",
      });
    }
  }
);

// =========================================================
// SCHEME METADATA
// =========================================================

router.get(
  "/meta/types",
  async (req, res) => {
    try {
      const types =
        await GovernmentScheme.distinct(
          "schemeType"
        );

      const categories =
        await GovernmentScheme.distinct(
          "category"
        );

      const states =
        await GovernmentScheme.distinct(
          "state"
        );

      return res.json({
        success: true,

        schemeTypes:
          types,

        categories:
          categories.filter(
            (c) => c !== "all"
          ),

        states:
          states.filter(
            (s) => s !== "all"
          ),
      });
    } catch (error) {
      console.error(
        "Error fetching scheme metadata:",
        error
      );

      return res.status(500).json({
        success: false,
        error:
          "Failed to fetch metadata",
      });
    }
  }
);

// =========================================================
// CHECK ELIGIBILITY
// =========================================================
//
// IMPORTANT:
// This route is BEFORE /:schemeId.
//
// Supports both GET and POST so the frontend can use
// either method without breaking the eligibility feature.
// =========================================================

async function checkEligibility(
  req,
  res
) {
  try {
    const userId =
      getAuthenticatedUserId(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        error:
          "User authentication required",
      });
    }

    const user =
      await User.findById(
        userId
      ).lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    const schemeId =
      req.params.schemeId;

    if (!schemeId) {
      return res.status(400).json({
        success: false,
        error:
          "Scheme ID is required",
      });
    }

    const scheme =
      await GovernmentScheme.findById(
        schemeId
      ).lean();

    if (!scheme) {
      return res.status(404).json({
        success: false,
        error:
          "Scheme not found",
      });
    }

    const eligibilityResult =
      evaluateSchemeEligibility(
        user,
        scheme
      );

    return res.status(200).json({
      success: true,

      schemeId:
        scheme._id,

      schemeName:
        scheme.schemeName,

      eligibilityResult,
    });
  } catch (error) {
    console.error(
      "================================================="
    );

    console.error(
      "CHECK ELIGIBILITY ERROR"
    );

    console.error(
      "Scheme ID:",
      req.params.schemeId
    );

    console.error(
      "Error:",
      error
    );

    console.error(
      "================================================="
    );

    return res.status(500).json({
      success: false,
      error:
        error.message ||
        "Failed to check eligibility",
    });
  }
}

// GET eligibility
router.get(
  "/:schemeId/eligibility",
  auth,
  checkEligibility
);

// POST eligibility
router.post(
  "/:schemeId/eligibility",
  auth,
  checkEligibility
);

// =========================================================
// GET SINGLE SCHEME BY ID
// =========================================================

router.get(
  "/:schemeId",
  async (req, res) => {
    try {
      const scheme =
        await GovernmentScheme.findById(
          req.params.schemeId
        ).lean();

      if (!scheme) {
        return res.status(404).json({
          success: false,
          error:
            "Scheme not found",
        });
      }

      let eligibilityResult =
        null;

      const userId =
        await getUserIdFromRequest(
          req
        );

      if (userId) {
        const user =
          await User.findById(
            userId
          ).lean();

        if (user) {
          eligibilityResult =
            evaluateSchemeEligibility(
              user,
              scheme
            );
        }
      }

      // Activity logging
      if (userId) {
        try {
          await logActivity(
            userId,
            {
              activityType:
                "government-scheme",

              title:
                `Scheme Viewed - ${scheme.schemeName}`,

              description:
                `Viewed government scheme: ${scheme.schemeName}`,

              status:
                "viewed",

              result:
                "Scheme details viewed",

              relatedId:
                scheme._id,

              relatedModel:
                "GovernmentScheme",

              metadata: {
                schemeType:
                  scheme.schemeType,

                ministry:
                  scheme.ministry,
              },
            }
          );
        } catch (
          activityError
        ) {
          console.error(
            "Scheme activity logging failed:",
            activityError
          );
        }
      }

      return res.json({
        success: true,

        scheme,

        eligibilityResult,
      });
    } catch (error) {
      console.error(
        "Error fetching scheme:",
        error
      );

      return res.status(500).json({
        success: false,
        error:
          "Failed to fetch scheme",
      });
    }
  }
);

// =========================================================
// ADMIN: CREATE SCHEME
// =========================================================

router.post(
  "/admin/create",
  async (req, res) => {
    try {
      const scheme =
        new GovernmentScheme(
          req.body
        );

      await scheme.save();

      return res.json({
        success: true,

        message:
          "Scheme created successfully",

        scheme,
      });
    } catch (error) {
      console.error(
        "Error creating scheme:",
        error
      );

      return res.status(500).json({
        success: false,
        error:
          "Failed to create scheme",
      });
    }
  }
);

// =========================================================
// EXPORT
// =========================================================

module.exports = router;