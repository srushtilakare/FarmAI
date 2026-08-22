/* eslint-env node */

const express = require('express');
const router = express.Router();

const CropCalendar = require('../models/CropCalendar');
const Notification = require('../models/Notification');
const auth = require('../middleware/auth');
const { logActivity } = require('./activities');

// =========================================================
// UTILITY FUNCTION: DETERMINE SEASON FROM DATE
// =========================================================

function getSeasonFromDate(date) {
  const month = date.getMonth() + 1;

  // Kharif: June-October
  if (month >= 6 && month <= 10) {
    return 'kharif';
  }

  // Rabi: November-April
  if (month >= 11 || month <= 4) {
    return 'rabi';
  }

  // Zaid: March-June
  if (month >= 3 && month <= 6) {
    return 'zaid';
  }

  return 'year-round';
}

// =========================================================
// CROP-SPECIFIC TASK TEMPLATES
// =========================================================

const cropTaskTemplates = {

  tomato: {
    season: 'kharif',
    durationDays: 90,

    tasks: [
      {
        type: 'sowing',
        title: 'Sow tomato seeds',
        offsetDays: 0,
        stage: 'Sowing'
      },

      {
        type: 'irrigation',
        title: 'First irrigation',
        offsetDays: 3,
        stage: 'Germination'
      },

      {
        type: 'fertilizer',
        title: 'Apply basal fertilizer (NPK)',
        offsetDays: 7,
        stage: 'Basal'
      },

      {
        type: 'irrigation',
        title: 'Regular irrigation',
        offsetDays: 10,
        stage: 'Vegetative',
        recurring: 3
      },

      {
        type: 'fertilizer',
        title: 'First top dressing',
        offsetDays: 21,
        stage: 'Vegetative'
      },

      {
        type: 'pesticide',
        title: 'Preventive spray for early blight',
        offsetDays: 25,
        stage: 'Vegetative'
      },

      {
        type: 'fertilizer',
        title: 'Second top dressing',
        offsetDays: 35,
        stage: 'Flowering'
      },

      {
        type: 'pesticide',
        title: 'Spray for fruit borer',
        offsetDays: 45,
        stage: 'Flowering'
      },

      {
        type: 'irrigation',
        title: 'Critical irrigation during flowering',
        offsetDays: 40,
        stage: 'Flowering'
      },

      {
        type: 'fertilizer',
        title: 'Potash application for fruit quality',
        offsetDays: 50,
        stage: 'Fruiting'
      },

      {
        type: 'pesticide',
        title: 'Late season disease control',
        offsetDays: 60,
        stage: 'Fruiting'
      },

      {
        type: 'harvesting',
        title: 'Begin harvesting',
        offsetDays: 75,
        stage: 'Harvesting'
      },

      {
        type: 'harvesting',
        title: 'Continue harvesting',
        offsetDays: 85,
        stage: 'Harvesting'
      }
    ]
  },

  wheat: {
    season: 'rabi',
    durationDays: 120,

    tasks: [
      {
        type: 'sowing',
        title: 'Sow wheat seeds',
        offsetDays: 0,
        stage: 'Sowing'
      },

      {
        type: 'irrigation',
        title: 'Pre-sowing irrigation',
        offsetDays: -3,
        stage: 'Pre-Sowing'
      },

      {
        type: 'fertilizer',
        title: 'Apply basal fertilizer',
        offsetDays: 0,
        stage: 'Basal'
      },

      {
        type: 'irrigation',
        title: 'Crown root irrigation',
        offsetDays: 21,
        stage: 'Tillering'
      },

      {
        type: 'fertilizer',
        title: 'First nitrogen top dressing',
        offsetDays: 21,
        stage: 'Tillering'
      },

      {
        type: 'irrigation',
        title: 'Late tillering irrigation',
        offsetDays: 40,
        stage: 'Tillering'
      },

      {
        type: 'fertilizer',
        title: 'Second nitrogen top dressing',
        offsetDays: 40,
        stage: 'Jointing'
      },

      {
        type: 'irrigation',
        title: 'Jointing stage irrigation',
        offsetDays: 60,
        stage: 'Jointing'
      },

      {
        type: 'pesticide',
        title: 'Rust disease spray if needed',
        offsetDays: 65,
        stage: 'Booting'
      },

      {
        type: 'irrigation',
        title: 'Flowering irrigation',
        offsetDays: 75,
        stage: 'Flowering'
      },

      {
        type: 'irrigation',
        title: 'Milk stage irrigation',
        offsetDays: 90,
        stage: 'Grain Filling'
      },

      {
        type: 'irrigation',
        title: 'Dough stage irrigation',
        offsetDays: 100,
        stage: 'Grain Filling'
      },

      {
        type: 'harvesting',
        title: 'Harvest wheat',
        offsetDays: 120,
        stage: 'Harvesting'
      }
    ]
  },

  rice: {
    season: 'kharif',
    durationDays: 120,

    tasks: [
      {
        type: 'sowing',
        title: 'Prepare nursery and sow seeds',
        offsetDays: 0,
        stage: 'Nursery'
      },

      {
        type: 'irrigation',
        title: 'Maintain water in nursery',
        offsetDays: 1,
        stage: 'Nursery'
      },

      {
        type: 'fertilizer',
        title: 'Apply fertilizer in main field',
        offsetDays: 20,
        stage: 'Pre-Transplant'
      },

      {
        type: 'sowing',
        title: 'Transplant seedlings',
        offsetDays: 25,
        stage: 'Transplanting'
      },

      {
        type: 'irrigation',
        title: 'Maintain standing water',
        offsetDays: 30,
        stage: 'Tillering',
        recurring: 5
      },

      {
        type: 'fertilizer',
        title: 'First top dressing (Nitrogen)',
        offsetDays: 35,
        stage: 'Tillering'
      },

      {
        type: 'pesticide',
        title: 'Stem borer management',
        offsetDays: 40,
        stage: 'Tillering'
      },

      {
        type: 'fertilizer',
        title: 'Second top dressing',
        offsetDays: 55,
        stage: 'Panicle Initiation'
      },

      {
        type: 'irrigation',
        title: 'Critical irrigation during flowering',
        offsetDays: 70,
        stage: 'Flowering'
      },

      {
        type: 'pesticide',
        title: 'Blast disease spray if needed',
        offsetDays: 75,
        stage: 'Flowering'
      },

      {
        type: 'irrigation',
        title: 'Grain filling irrigation',
        offsetDays: 90,
        stage: 'Grain Filling'
      },

      {
        type: 'irrigation',
        title: 'Stop irrigation',
        offsetDays: 110,
        stage: 'Maturity'
      },

      {
        type: 'harvesting',
        title: 'Harvest rice',
        offsetDays: 120,
        stage: 'Harvesting'
      }
    ]
  },

  maize: {
    season: 'kharif',
    durationDays: 100,

    tasks: [
      {
        type: 'sowing',
        title: 'Sow maize seeds',
        offsetDays: 0,
        stage: 'Sowing'
      },

      {
        type: 'irrigation',
        title: 'First irrigation',
        offsetDays: 3,
        stage: 'Germination'
      },

      {
        type: 'fertilizer',
        title: 'Apply basal fertilizer',
        offsetDays: 7,
        stage: 'Basal'
      },

      {
        type: 'irrigation',
        title: 'Regular irrigation',
        offsetDays: 15,
        stage: 'Vegetative',
        recurring: 7
      },

      {
        type: 'fertilizer',
        title: 'First top dressing',
        offsetDays: 25,
        stage: 'Vegetative'
      },

      {
        type: 'pesticide',
        title: 'Pest control spray',
        offsetDays: 35,
        stage: 'Vegetative'
      },

      {
        type: 'fertilizer',
        title: 'Second top dressing',
        offsetDays: 45,
        stage: 'Tasseling'
      },

      {
        type: 'irrigation',
        title: 'Critical irrigation during tasseling',
        offsetDays: 50,
        stage: 'Tasseling'
      },

      {
        type: 'irrigation',
        title: 'Silking stage irrigation',
        offsetDays: 60,
        stage: 'Silking'
      },

      {
        type: 'harvesting',
        title: 'Harvest maize',
        offsetDays: 100,
        stage: 'Harvesting'
      }
    ]
  },

  cotton: {
    season: 'kharif',
    durationDays: 150,

    tasks: [
      {
        type: 'sowing',
        title: 'Sow cotton seeds',
        offsetDays: 0,
        stage: 'Sowing'
      },

      {
        type: 'irrigation',
        title: 'First irrigation',
        offsetDays: 5,
        stage: 'Germination'
      },

      {
        type: 'fertilizer',
        title: 'Apply basal fertilizer',
        offsetDays: 10,
        stage: 'Basal'
      },

      {
        type: 'irrigation',
        title: 'Regular irrigation',
        offsetDays: 15,
        stage: 'Vegetative',
        recurring: 10
      },

      {
        type: 'fertilizer',
        title: 'First top dressing',
        offsetDays: 30,
        stage: 'Vegetative'
      },

      {
        type: 'pesticide',
        title: 'Bollworm management',
        offsetDays: 45,
        stage: 'Flowering'
      },

      {
        type: 'fertilizer',
        title: 'Second top dressing',
        offsetDays: 50,
        stage: 'Flowering'
      },

      {
        type: 'pesticide',
        title: 'Late season pest control',
        offsetDays: 70,
        stage: 'Boll Formation'
      },

      {
        type: 'harvesting',
        title: 'First picking',
        offsetDays: 120,
        stage: 'Harvesting'
      },

      {
        type: 'harvesting',
        title: 'Second picking',
        offsetDays: 140,
        stage: 'Harvesting'
      }
    ]
  },

  sugarcane: {
    season: 'year-round',
    durationDays: 365,

    tasks: [
      {
        type: 'sowing',
        title: 'Plant sugarcane setts',
        offsetDays: 0,
        stage: 'Planting'
      },

      {
        type: 'irrigation',
        title: 'First irrigation',
        offsetDays: 3,
        stage: 'Germination'
      },

      {
        type: 'fertilizer',
        title: 'Apply basal fertilizer',
        offsetDays: 7,
        stage: 'Basal'
      },

      {
        type: 'irrigation',
        title: 'Regular irrigation',
        offsetDays: 15,
        stage: 'Tillering',
        recurring: 10
      },

      {
        type: 'fertilizer',
        title: 'First top dressing',
        offsetDays: 60,
        stage: 'Tillering'
      },

      {
        type: 'fertilizer',
        title: 'Second top dressing',
        offsetDays: 120,
        stage: 'Grand Growth'
      },

      {
        type: 'pesticide',
        title: 'Pest and disease control',
        offsetDays: 90,
        stage: 'Grand Growth'
      },

      {
        type: 'harvesting',
        title: 'Harvest sugarcane',
        offsetDays: 365,
        stage: 'Harvesting'
      }
    ]
  },

  potato: {
    season: 'rabi',
    durationDays: 90,

    tasks: [
      {
        type: 'sowing',
        title: 'Plant potato tubers',
        offsetDays: 0,
        stage: 'Planting'
      },

      {
        type: 'irrigation',
        title: 'First irrigation',
        offsetDays: 3,
        stage: 'Germination'
      },

      {
        type: 'fertilizer',
        title: 'Apply basal fertilizer',
        offsetDays: 7,
        stage: 'Basal'
      },

      {
        type: 'irrigation',
        title: 'Regular irrigation',
        offsetDays: 10,
        stage: 'Vegetative',
        recurring: 5
      },

      {
        type: 'fertilizer',
        title: 'First top dressing',
        offsetDays: 30,
        stage: 'Tuber Initiation'
      },

      {
        type: 'irrigation',
        title: 'Critical irrigation during tuber formation',
        offsetDays: 40,
        stage: 'Tuber Formation'
      },

      {
        type: 'pesticide',
        title: 'Late blight control',
        offsetDays: 50,
        stage: 'Tuber Formation'
      },

      {
        type: 'harvesting',
        title: 'Harvest potatoes',
        offsetDays: 90,
        stage: 'Harvesting'
      }
    ]
  },

  onion: {
    season: 'rabi',
    durationDays: 120,

    tasks: [
      {
        type: 'sowing',
        title: 'Sow onion seeds/transplant',
        offsetDays: 0,
        stage: 'Sowing'
      },

      {
        type: 'irrigation',
        title: 'First irrigation',
        offsetDays: 3,
        stage: 'Germination'
      },

      {
        type: 'fertilizer',
        title: 'Apply basal fertilizer',
        offsetDays: 7,
        stage: 'Basal'
      },

      {
        type: 'irrigation',
        title: 'Regular irrigation',
        offsetDays: 10,
        stage: 'Vegetative',
        recurring: 7
      },

      {
        type: 'fertilizer',
        title: 'First top dressing',
        offsetDays: 30,
        stage: 'Vegetative'
      },

      {
        type: 'fertilizer',
        title: 'Second top dressing',
        offsetDays: 60,
        stage: 'Bulb Formation'
      },

      {
        type: 'irrigation',
        title: 'Stop irrigation before harvest',
        offsetDays: 100,
        stage: 'Maturity'
      },

      {
        type: 'harvesting',
        title: 'Harvest onions',
        offsetDays: 120,
        stage: 'Harvesting'
      }
    ]
  },

  soybean: {
    season: 'kharif',
    durationDays: 100,

    tasks: [
      {
        type: 'sowing',
        title: 'Sow soybean seeds',
        offsetDays: 0,
        stage: 'Sowing'
      },

      {
        type: 'irrigation',
        title: 'First irrigation',
        offsetDays: 3,
        stage: 'Germination'
      },

      {
        type: 'fertilizer',
        title: 'Apply basal fertilizer',
        offsetDays: 7,
        stage: 'Basal'
      },

      {
        type: 'irrigation',
        title: 'Regular irrigation',
        offsetDays: 15,
        stage: 'Vegetative',
        recurring: 10
      },

      {
        type: 'fertilizer',
        title: 'First top dressing',
        offsetDays: 30,
        stage: 'Flowering'
      },

      {
        type: 'pesticide',
        title: 'Pest control',
        offsetDays: 40,
        stage: 'Pod Formation'
      },

      {
        type: 'harvesting',
        title: 'Harvest soybean',
        offsetDays: 100,
        stage: 'Harvesting'
      }
    ]
  },

  groundnut: {
    season: 'kharif',
    durationDays: 110,

    tasks: [
      {
        type: 'sowing',
        title: 'Sow groundnut seeds',
        offsetDays: 0,
        stage: 'Sowing'
      },

      {
        type: 'irrigation',
        title: 'First irrigation',
        offsetDays: 3,
        stage: 'Germination'
      },

      {
        type: 'fertilizer',
        title: 'Apply basal fertilizer',
        offsetDays: 7,
        stage: 'Basal'
      },

      {
        type: 'irrigation',
        title: 'Regular irrigation',
        offsetDays: 15,
        stage: 'Vegetative',
        recurring: 10
      },

      {
        type: 'fertilizer',
        title: 'First top dressing',
        offsetDays: 30,
        stage: 'Flowering'
      },

      {
        type: 'pesticide',
        title: 'Pest control',
        offsetDays: 50,
        stage: 'Pod Formation'
      },

      {
        type: 'harvesting',
        title: 'Harvest groundnut',
        offsetDays: 110,
        stage: 'Harvesting'
      }
    ]
  }
};

// =========================================================
// GENERATE TASKS FROM TEMPLATE
// =========================================================

function generateTasksFromTemplate(
  crop,
  sowingDate,
  _location
) {
  const template =
    cropTaskTemplates[
      crop.toLowerCase()
    ];

  if (!template) {
    throw new Error(
      `Crop template not found for: ${crop}`
    );
  }

  const tasks = [];

  template.tasks.forEach(
    (taskTemplate) => {

      if (taskTemplate.recurring) {

        for (let i = 0; i < 10; i++) {

          const scheduledDate =
            new Date(sowingDate);

          scheduledDate.setDate(
            scheduledDate.getDate() +
              taskTemplate.offsetDays +
              i *
                taskTemplate.recurring
          );

          if (
            scheduledDate <=
            new Date(
              sowingDate.getTime() +
                template.durationDays *
                  24 *
                  60 *
                  60 *
                  1000
            )
          ) {
            tasks.push({

              taskType:
                taskTemplate.type,

              title:
                `${taskTemplate.title} (Week ${
                  i + 1
                })`,

              description:
                `Scheduled ${taskTemplate.stage} activity`,

              scheduledDate,

              stage:
                taskTemplate.stage
            });
          }
        }

      } else {

        const scheduledDate =
          new Date(sowingDate);

        scheduledDate.setDate(
          scheduledDate.getDate() +
            taskTemplate.offsetDays
        );

        tasks.push({

          taskType:
            taskTemplate.type,

          title:
            taskTemplate.title,

          description:
            `Scheduled ${taskTemplate.stage} activity`,

          scheduledDate,

          stage:
            taskTemplate.stage
        });
      }
    }
  );

  return {
    tasks,

    season:
      template.season,

    expectedHarvestDate:
      new Date(
        sowingDate.getTime() +
          template.durationDays *
            24 *
            60 *
            60 *
            1000
      )
  };
}

// =========================================================
// HELPER: CREATE CROP TASK NOTIFICATION
// =========================================================
//
// This directly uses the Notification model.
// We are NOT using notificationService.js here.
//
// This prevents the previous module/import problem.
//
// =========================================================

async function createCropTaskNotification(
  userId,
  calendar,
  task,
  notificationTitle,
  notificationMessage
) {
  try {

    const taskDate =
      new Date(
        task.scheduledDate
      );

    const dateKey =
      taskDate
        .toISOString()
        .split('T')[0];

    const uniqueKey =
      `crop_task_${userId}_${calendar._id}_${task._id}_${dateKey}`;

    // Prevent duplicate notification
    const existing =
      await Notification.findOne({
        uniqueKey
      });

    if (existing) {
      return existing;
    }

    const notification =
      await Notification.create({

        recipient:
          userId,

        sender:
          null,

        senderName:
          'FarmAI',

        type:
          'crop_task',

        category:
          'farming',

        title:
          notificationTitle,

        message:
          notificationMessage,

        icon:
          'calendar',

        relatedId:
          task._id,

        relatedModel:
          'CropTask',

        // We intentionally leave this empty
        // because the exact frontend calendar route
        // may differ.
        link:
          '',

        isRead:
          false,

        metadata: {

          crop:
            calendar.crop,

          calendarId:
            calendar._id,

          taskId:
            task._id,

          taskTitle:
            task.title,

          taskType:
            task.taskType,

          stage:
            task.stage,

          scheduledDate:
            task.scheduledDate
        },

        uniqueKey
      });

    return notification;

  } catch (error) {

    console.error(
      'Error creating crop task notification:',
      error
    );

    throw error;
  }
}

// =========================================================
// VALIDATE CROP-SEASON COMPATIBILITY
// =========================================================

router.post(
  '/validate-season',
  auth,
  async (req, res) => {

    try {

      const {
        crop,
        sowingDate
      } = req.body;

      if (
        !crop ||
        !sowingDate
      ) {
        return res.status(400).json({
          error:
            'Crop and sowing date are required'
        });
      }

      const date =
        new Date(
          sowingDate
        );

      const selectedSeason =
        getSeasonFromDate(
          date
        );

      const template =
        cropTaskTemplates[
          crop.toLowerCase()
        ];

      if (!template) {
        return res.status(400).json({
          error:
            'Crop not found'
        });
      }

      const cropSeason =
        template.season;

      const isCompatible =
        cropSeason ===
          'year-round' ||
        cropSeason ===
          selectedSeason;

      const recommendedCrops =
        Object.keys(
          cropTaskTemplates
        )
          .filter(
            (key) => {

              const t =
                cropTaskTemplates[
                  key
                ];

              return (
                t.season ===
                  'year-round' ||
                t.season ===
                  selectedSeason
              );
            }
          )
          .map(
            (key) => ({

              name:
                key,

              displayName:
                key.charAt(0).toUpperCase() +
                key.slice(1),

              season:
                cropTaskTemplates[
                  key
                ].season

            })
          );

      res.json({

        success:
          true,

        isCompatible,

        selectedSeason,

        cropSeason,

        recommendedCrops,

        message:
          isCompatible
            ? `${crop} is suitable for ${selectedSeason} season`
            : `${crop} is typically grown in ${cropSeason} season, but you selected ${selectedSeason} season`
      });

    } catch (error) {

      console.error(
        'Error validating season:',
        error
      );

      res.status(500).json({
        error:
          'Failed to validate season'
      });
    }
  }
);

// =========================================================
// GET RECOMMENDED CROPS FOR A DATE
// =========================================================

router.get(
  '/recommended-crops',
  auth,
  async (req, res) => {

    try {

      const {
        date
      } = req.query;

      if (!date) {
        return res.status(400).json({
          error:
            'Date is required'
        });
      }

      const selectedDate =
        new Date(
          date
        );

      const season =
        getSeasonFromDate(
          selectedDate
        );

      const recommendedCrops =
        Object.keys(
          cropTaskTemplates
        )
          .filter(
            (key) => {

              const template =
                cropTaskTemplates[
                  key
                ];

              return (
                template.season ===
                  'year-round' ||
                template.season ===
                  season
              );
            }
          )
          .map(
            (key) => ({

              name:
                key,

              displayName:
                key.charAt(0).toUpperCase() +
                key.slice(1),

              season:
                cropTaskTemplates[
                  key
                ].season,

              durationDays:
                cropTaskTemplates[
                  key
                ].durationDays

            })
          );

      res.json({

        success:
          true,

        season,

        recommendedCrops
      });

    } catch (error) {

      console.error(
        'Error getting recommended crops:',
        error
      );

      res.status(500).json({
        error:
          'Failed to get recommended crops'
      });
    }
  }
);

// =========================================================
// CREATE A NEW CROP CALENDAR
// =========================================================

router.post(
  '/create',
  auth,
  async (req, res) => {

    try {

      const {
        crop,
        sowingDate,
        location
      } = req.body;

      if (
        !crop ||
        !sowingDate
      ) {
        return res.status(400).json({
          error:
            'Crop and sowing date are required'
        });
      }

      // -----------------------------------------------------
      // Validate season
      // -----------------------------------------------------

      const date =
        new Date(
          sowingDate
        );

      const selectedSeason =
        getSeasonFromDate(
          date
        );

      const template =
        cropTaskTemplates[
          crop.toLowerCase()
        ];

      if (!template) {
        return res.status(400).json({
          error:
            'Crop not found'
        });
      }

      const cropSeason =
        template.season;

      const isCompatible =
        cropSeason ===
          'year-round' ||
        cropSeason ===
          selectedSeason;

      if (!isCompatible) {

        return res.status(400).json({

          error:
            `Season mismatch: ${crop} is typically grown in ${cropSeason} season, but you selected ${selectedSeason} season`,

          selectedSeason,

          cropSeason,

          isCompatible:
            false
        });
      }

      // -----------------------------------------------------
      // Generate tasks
      // -----------------------------------------------------

      const {
        tasks,
        season,
        expectedHarvestDate
      } =
        generateTasksFromTemplate(
          crop,
          date,
          location
        );

      // -----------------------------------------------------
      // Create calendar
      // -----------------------------------------------------

      const cropCalendar =
        new CropCalendar({

          userId:
            req.user._id,

          crop,

          season,

          location:
            location || {},

          sowingDate:
            new Date(
              sowingDate
            ),

          expectedHarvestDate,

          tasks

        });

      await cropCalendar.save();

      // -----------------------------------------------------
      // Log activity
      // -----------------------------------------------------

      await logActivity(
        req.user._id,
        {

          activityType:
            'crop-calendar',

          title:
            `Crop Calendar Created - ${crop}`,

          description:
            `Created crop calendar for ${crop} with ${tasks.length} tasks`,

          status:
            'completed',

          result:
            `${tasks.length} tasks scheduled`,

          relatedId:
            cropCalendar._id,

          relatedModel:
            'CropCalendar',

          metadata: {

            crop,

            season,

            taskCount:
              tasks.length

          }

        }
      );

      // -----------------------------------------------------
      // IMPORTANT:
      // We DO NOT create all notifications immediately.
      //
      // Notifications are created when the task becomes
      // due today or tomorrow.
      // -----------------------------------------------------

      res.json({

        success:
          true,

        message:
          'Crop calendar created successfully',

        calendar:
          cropCalendar

      });

    } catch (error) {

      console.error(
        'Error creating crop calendar:',
        error
      );

      res.status(500).json({
        error:
          'Failed to create crop calendar'
      });
    }
  }
);

// =========================================================
// GET ALL CALENDARS FOR USER
// =========================================================

router.get(
  '/my-calendars',
  auth,
  async (req, res) => {

    try {

      const calendars =
        await CropCalendar.find({

          userId:
            req.user._id,

          active:
            true

        })
          .sort({
            sowingDate:
              -1
          });

      res.json({

        success:
          true,

        calendars

      });

    } catch (error) {

      console.error(
        'Error fetching calendars:',
        error
      );

      res.status(500).json({
        error:
          'Failed to fetch calendars'
      });
    }
  }
);

// =========================================================
// GET UPCOMING TASKS
// =========================================================
//
// IMPORTANT:
// This keeps your original upcoming-task functionality.
//
// Additionally, while fetching upcoming tasks, it checks
// whether a task is due today or tomorrow and creates a
// notification.
//
// Therefore, when your frontend calls this endpoint,
// notifications will be generated automatically.
// =========================================================

router.get(
  '/upcoming-tasks',
  auth,
  async (req, res) => {

    try {

      const {
        days = 7
      } = req.query;

      const now =
        new Date();

      const futureDate =
        new Date();

      futureDate.setDate(
        futureDate.getDate() +
          parseInt(
            days,
            10
          )
      );

      const calendars =
        await CropCalendar.find({

          userId:
            req.user._id,

          active:
            true,

          'tasks.scheduledDate': {

            $gte:
              now,

            $lte:
              futureDate

          },

          'tasks.completed':
            false

        });

      const upcomingTasks =
        [];

      // -----------------------------------------------------
      // Process calendars
      // -----------------------------------------------------

      for (
        const calendar of calendars
      ) {

        for (
          const task of calendar.tasks
        ) {

          if (
            task.completed
          ) {
            continue;
          }

          const scheduledDate =
            new Date(
              task.scheduledDate
            );

          // -------------------------------------------------
          // Existing upcoming-task functionality
          // -------------------------------------------------

          if (
            scheduledDate >=
              now &&
            scheduledDate <=
              futureDate
          ) {

            upcomingTasks.push({

              ...task.toObject(),

              crop:
                calendar.crop,

              calendarId:
                calendar._id

            });
          }

          // -------------------------------------------------
          // NEW: Notification
          //
          // Notify only when task is today or tomorrow.
          // -------------------------------------------------

          if (
            !task.reminderSent
          ) {

            const today =
              new Date();

            today.setHours(
              0,
              0,
              0,
              0
            );

            const tomorrow =
              new Date(
                today
              );

            tomorrow.setDate(
              tomorrow.getDate() +
                1
            );

            tomorrow.setHours(
              23,
              59,
              59,
              999
            );

            if (
              scheduledDate >=
                today &&
              scheduledDate <=
                tomorrow
            ) {

              const taskDay =
                new Date(
                  scheduledDate
                );

              taskDay.setHours(
                0,
                0,
                0,
                0
              );

              const todayDay =
                new Date(
                  today
                );

              todayDay.setHours(
                0,
                0,
                0,
                0
              );

              const difference =
                Math.round(
                  (
                    taskDay -
                    todayDay
                  ) /
                    (
                      1000 *
                      60 *
                      60 *
                      24
                    )
                );

              let notificationTitle;

              let notificationMessage;

              // ---------------------------------------------
              // TODAY
              // ---------------------------------------------

              if (
                difference ===
                0
              ) {

                notificationTitle =
                  'Crop Task Due Today';

                notificationMessage =
                  `${task.title} is scheduled for today for your ${calendar.crop} crop.`;

              }

              // ---------------------------------------------
              // TOMORROW
              // ---------------------------------------------

              else {

                notificationTitle =
                  'Crop Task Tomorrow';

                notificationMessage =
                  `${task.title} is scheduled for tomorrow for your ${calendar.crop} crop.`;
              }

              try {

                await createCropTaskNotification(

                  req.user._id,

                  calendar,

                  task,

                  notificationTitle,

                  notificationMessage

                );

                // -------------------------------------------
                // Mark reminder as sent
                // -------------------------------------------

                task.reminderSent =
                  true;

                await calendar.save();

              } catch (
                notificationError
              ) {

                console.error(
                  'Crop task notification error:',
                  notificationError
                );

                // Do NOT fail the existing
                // upcoming-task request
              }
            }
          }
        }
      }

      // -----------------------------------------------------
      // Sort tasks by date
      // -----------------------------------------------------

      upcomingTasks.sort(
        (a, b) =>
          new Date(
            a.scheduledDate
          ) -
          new Date(
            b.scheduledDate
          )
      );

      res.json({

        success:
          true,

        tasks:
          upcomingTasks

      });

    } catch (error) {

      console.error(
        'Error fetching upcoming tasks:',
        error
      );

      res.status(500).json({
        error:
          'Failed to fetch upcoming tasks'
      });
    }
  }
);

// =========================================================
// MARK TASK AS COMPLETED
// =========================================================

router.put(
  '/task/:calendarId/:taskId/complete',
  auth,
  async (req, res) => {

    try {

      const {
        calendarId,
        taskId
      } = req.params;

      const {
        notes
      } = req.body;

      const calendar =
        await CropCalendar.findOne({

          _id:
            calendarId,

          userId:
            req.user._id

        });

      if (!calendar) {

        return res.status(404).json({
          error:
            'Calendar not found'
        });
      }

      const task =
        calendar.tasks.id(
          taskId
        );

      if (!task) {

        return res.status(404).json({
          error:
            'Task not found'
        });
      }

      // -----------------------------------------------------
      // Existing completion validation
      // -----------------------------------------------------

      const today =
        new Date();

      today.setHours(
        0,
        0,
        0,
        0
      );

      const scheduledDate =
        new Date(
          task.scheduledDate
        );

      scheduledDate.setHours(
        0,
        0,
        0,
        0
      );

      const daysDifference =
        Math.ceil(
          (
            scheduledDate -
            today
          ) /
            (
              1000 *
              60 *
              60 *
              24
            )
        );

      if (
        daysDifference >
        1
      ) {

        return res.status(400).json({

          error:
            'Task cannot be completed yet',

          message:
            `This task is scheduled for ${task.scheduledDate.toLocaleDateString(
              'en-IN'
            )}. You can complete it starting ${
              daysDifference - 1
            } day(s) before the scheduled date.`,

          daysUntilAvailable:
            daysDifference - 1

        });
      }

      // -----------------------------------------------------
      // Complete task
      // -----------------------------------------------------

      task.completed =
        true;

      task.completedDate =
        new Date();

      if (notes) {
        task.notes =
          notes;
      }

      await calendar.save();

      // -----------------------------------------------------
      // Existing activity logging
      // -----------------------------------------------------

      await logActivity(
        req.user._id,
        {

          activityType:
            'crop-calendar',

          title:
            `Task Completed - ${task.title}`,

          description:
            `Completed task: ${task.title} for ${calendar.crop}`,

          status:
            'completed',

          result:
            'Task marked as completed',

          relatedId:
            calendar._id,

          relatedModel:
            'CropCalendar',

          metadata: {

            crop:
              calendar.crop,

            taskType:
              task.taskType,

            taskStage:
              task.stage

          }

        }
      );

      res.json({

        success:
          true,

        message:
          'Task marked as completed',

        task

      });

    } catch (error) {

      console.error(
        'Error completing task:',
        error
      );

      res.status(500).json({
        error:
          'Failed to complete task'
      });
    }
  }
);

// =========================================================
// GET CALENDAR BY ID
// =========================================================

router.get(
  '/:calendarId',
  auth,
  async (req, res) => {

    try {

      const calendar =
        await CropCalendar.findOne({

          _id:
            req.params.calendarId,

          userId:
            req.user._id

        });

      if (!calendar) {

        return res.status(404).json({
          error:
            'Calendar not found'
        });
      }

      res.json({

        success:
          true,

        calendar

      });

    } catch (error) {

      console.error(
        'Error fetching calendar:',
        error
      );

      res.status(500).json({
        error:
          'Failed to fetch calendar'
      });
    }
  }
);

// =========================================================
// DELETE / DEACTIVATE CALENDAR
// =========================================================

router.delete(
  '/:calendarId',
  auth,
  async (req, res) => {

    try {

      const calendar =
        await CropCalendar.findOne({

          _id:
            req.params.calendarId,

          userId:
            req.user._id

        });

      if (!calendar) {

        return res.status(404).json({
          error:
            'Calendar not found'
        });
      }

      calendar.active =
        false;

      await calendar.save();

      res.json({

        success:
          true,

        message:
          'Calendar deactivated'

      });

    } catch (error) {

      console.error(
        'Error deleting calendar:',
        error
      );

      res.status(500).json({
        error:
          'Failed to delete calendar'
      });
    }
  }
);

// =========================================================
// EXPORT
// =========================================================

module.exports = router;

module.exports.cropTaskTemplates =
  cropTaskTemplates;

module.exports.getSeasonFromDate =
  getSeasonFromDate;