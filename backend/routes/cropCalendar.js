const express = require('express');
const router = express.Router();
const CropCalendar = require('../models/CropCalendar');
const auth = require('../middleware/auth');
const { logActivity } = require('./activities');

// Crop-specific task templates based on agricultural practices
const cropTaskTemplates = {
  tomato: {
    season: 'kharif',
    durationDays: 90,
    tasks: [
      { type: 'sowing', title: 'Sow tomato seeds', offsetDays: 0, stage: 'Sowing' },
      { type: 'irrigation', title: 'First irrigation', offsetDays: 3, stage: 'Germination' },
      { type: 'fertilizer', title: 'Apply basal fertilizer (NPK)', offsetDays: 7, stage: 'Basal' },
      { type: 'irrigation', title: 'Regular irrigation', offsetDays: 10, stage: 'Vegetative', recurring: 3 },
      { type: 'fertilizer', title: 'First top dressing', offsetDays: 21, stage: 'Vegetative' },
      { type: 'pesticide', title: 'Preventive spray for early blight', offsetDays: 25, stage: 'Vegetative' },
      { type: 'fertilizer', title: 'Second top dressing', offsetDays: 35, stage: 'Flowering' },
      { type: 'pesticide', title: 'Spray for fruit borer', offsetDays: 45, stage: 'Flowering' },
      { type: 'irrigation', title: 'Critical irrigation during flowering', offsetDays: 40, stage: 'Flowering' },
      { type: 'fertilizer', title: 'Potash application for fruit quality', offsetDays: 50, stage: 'Fruiting' },
      { type: 'pesticide', title: 'Late season disease control', offsetDays: 60, stage: 'Fruiting' },
      { type: 'harvesting', title: 'Begin harvesting', offsetDays: 75, stage: 'Harvesting' },
      { type: 'harvesting', title: 'Continue harvesting', offsetDays: 85, stage: 'Harvesting' }
    ]
  },
  wheat: {
    season: 'rabi',
    durationDays: 120,
    tasks: [
      { type: 'sowing', title: 'Sow wheat seeds', offsetDays: 0, stage: 'Sowing' },
      { type: 'irrigation', title: 'Pre-sowing irrigation', offsetDays: -3, stage: 'Pre-Sowing' },
      { type: 'fertilizer', title: 'Apply basal fertilizer', offsetDays: 0, stage: 'Basal' },
      { type: 'irrigation', title: 'Crown root irrigation', offsetDays: 21, stage: 'Tillering' },
      { type: 'fertilizer', title: 'First nitrogen top dressing', offsetDays: 21, stage: 'Tillering' },
      { type: 'irrigation', title: 'Late tillering irrigation', offsetDays: 40, stage: 'Tillering' },
      { type: 'fertilizer', title: 'Second nitrogen top dressing', offsetDays: 40, stage: 'Jointing' },
      { type: 'irrigation', title: 'Jointing stage irrigation', offsetDays: 60, stage: 'Jointing' },
      { type: 'pesticide', title: 'Rust disease spray if needed', offsetDays: 65, stage: 'Booting' },
      { type: 'irrigation', title: 'Flowering irrigation', offsetDays: 75, stage: 'Flowering' },
      { type: 'irrigation', title: 'Milk stage irrigation', offsetDays: 90, stage: 'Grain Filling' },
      { type: 'irrigation', title: 'Dough stage irrigation', offsetDays: 100, stage: 'Grain Filling' },
      { type: 'harvesting', title: 'Harvest wheat', offsetDays: 120, stage: 'Harvesting' }
    ]
  },
  rice: {
    season: 'kharif',
    durationDays: 120,
    tasks: [
      { type: 'sowing', title: 'Prepare nursery and sow seeds', offsetDays: 0, stage: 'Nursery' },
      { type: 'irrigation', title: 'Maintain water in nursery', offsetDays: 1, stage: 'Nursery' },
      { type: 'fertilizer', title: 'Apply fertilizer in main field', offsetDays: 20, stage: 'Pre-Transplant' },
      { type: 'sowing', title: 'Transplant seedlings', offsetDays: 25, stage: 'Transplanting' },
      { type: 'irrigation', title: 'Maintain standing water', offsetDays: 30, stage: 'Tillering', recurring: 5 },
      { type: 'fertilizer', title: 'First top dressing (Nitrogen)', offsetDays: 35, stage: 'Tillering' },
      { type: 'pesticide', title: 'Stem borer management', offsetDays: 40, stage: 'Tillering' },
      { type: 'fertilizer', title: 'Second top dressing', offsetDays: 55, stage: 'Panicle Initiation' },
      { type: 'irrigation', title: 'Critical irrigation during flowering', offsetDays: 70, stage: 'Flowering' },
      { type: 'pesticide', title: 'Blast disease spray if needed', offsetDays: 75, stage: 'Flowering' },
      { type: 'irrigation', title: 'Grain filling irrigation', offsetDays: 90, stage: 'Grain Filling' },
      { type: 'irrigation', title: 'Stop irrigation', offsetDays: 110, stage: 'Maturity' },
      { type: 'harvesting', title: 'Harvest rice', offsetDays: 120, stage: 'Harvesting' }
    ]
  },
  // Add more crops as needed
  default: {
    season: 'year-round',
    durationDays: 90,
    tasks: [
      { type: 'sowing', title: 'Sow seeds', offsetDays: 0, stage: 'Sowing' },
      { type: 'irrigation', title: 'First irrigation', offsetDays: 3, stage: 'Early Growth' },
      { type: 'fertilizer', title: 'Apply basal fertilizer', offsetDays: 7, stage: 'Basal' },
      { type: 'irrigation', title: 'Regular irrigation', offsetDays: 15, stage: 'Growth', recurring: 7 },
      { type: 'fertilizer', title: 'First top dressing', offsetDays: 30, stage: 'Mid Growth' },
      { type: 'pesticide', title: 'Preventive pest control', offsetDays: 35, stage: 'Mid Growth' },
      { type: 'fertilizer', title: 'Second top dressing', offsetDays: 50, stage: 'Late Growth' },
      { type: 'harvesting', title: 'Harvest', offsetDays: 90, stage: 'Harvesting' }
    ]
  }
};

// Generate tasks from template
function generateTasksFromTemplate(crop, sowingDate, location) {
  const template = cropTaskTemplates[crop.toLowerCase()] || cropTaskTemplates.default;
  const tasks = [];
  
  template.tasks.forEach(taskTemplate => {
    if (taskTemplate.recurring) {
      // Generate recurring tasks
      for (let i = 0; i < 10; i++) { // Max 10 recurring instances
        const scheduledDate = new Date(sowingDate);
        scheduledDate.setDate(scheduledDate.getDate() + taskTemplate.offsetDays + (i * taskTemplate.recurring));
        
        if (scheduledDate <= new Date(sowingDate.getTime() + template.durationDays * 24 * 60 * 60 * 1000)) {
          tasks.push({
            taskType: taskTemplate.type,
            title: `${taskTemplate.title} (Week ${i + 1})`,
            description: `Scheduled ${taskTemplate.stage} activity`,
            scheduledDate: scheduledDate,
            stage: taskTemplate.stage
          });
        }
      }
    } else {
      const scheduledDate = new Date(sowingDate);
      scheduledDate.setDate(scheduledDate.getDate() + taskTemplate.offsetDays);
      
      tasks.push({
        taskType: taskTemplate.type,
        title: taskTemplate.title,
        description: `Scheduled ${taskTemplate.stage} activity`,
        scheduledDate: scheduledDate,
        stage: taskTemplate.stage
      });
    }
  });
  
  return { tasks, season: template.season, expectedHarvestDate: new Date(sowingDate.getTime() + template.durationDays * 24 * 60 * 60 * 1000) };
}

// Create a new crop calendar
router.post('/create', auth, async (req, res) => {
  try {
    const { crop, sowingDate, location } = req.body;
    
    if (!crop || !sowingDate) {
      return res.status(400).json({ error: 'Crop and sowing date are required' });
    }
    
    const { tasks, season, expectedHarvestDate } = generateTasksFromTemplate(crop, new Date(sowingDate), location);
    
    const cropCalendar = new CropCalendar({
      userId: req.user._id,
      crop,
      season,
      location: location || {},
      sowingDate: new Date(sowingDate),
      expectedHarvestDate,
      tasks
    });
    
    await cropCalendar.save();
    
    // Log activity
    await logActivity(req.user._id, {
      activityType: 'crop-calendar',
      title: `Crop Calendar Created - ${crop}`,
      description: `Created crop calendar for ${crop} with ${tasks.length} tasks`,
      status: 'completed',
      result: `${tasks.length} tasks scheduled`,
      relatedId: cropCalendar._id,
      relatedModel: 'CropCalendar',
      metadata: { crop, season, taskCount: tasks.length }
    });
    
    res.json({
      success: true,
      message: 'Crop calendar created successfully',
      calendar: cropCalendar
    });
  } catch (error) {
    console.error('Error creating crop calendar:', error);
    res.status(500).json({ error: 'Failed to create crop calendar' });
  }
});

// Get all calendars for user
router.get('/my-calendars', auth, async (req, res) => {
  try {
    const calendars = await CropCalendar.find({ 
      userId: req.user._id,
      active: true 
    }).sort({ sowingDate: -1 });
    
    res.json({ success: true, calendars });
  } catch (error) {
    console.error('Error fetching calendars:', error);
    res.status(500).json({ error: 'Failed to fetch calendars' });
  }
});

// Get upcoming tasks
router.get('/upcoming-tasks', auth, async (req, res) => {
  try {
    const { days = 7 } = req.query;
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + parseInt(days));
    
    const calendars = await CropCalendar.find({
      userId: req.user._id,
      active: true,
      'tasks.scheduledDate': {
        $gte: new Date(),
        $lte: futureDate
      },
      'tasks.completed': false
    });
    
    // Extract and flatten upcoming tasks
    const upcomingTasks = [];
    calendars.forEach(calendar => {
      calendar.tasks.forEach(task => {
        if (!task.completed && 
            task.scheduledDate >= new Date() && 
            task.scheduledDate <= futureDate) {
          upcomingTasks.push({
            ...task.toObject(),
            crop: calendar.crop,
            calendarId: calendar._id
          });
        }
      });
    });
    
    // Sort by date
    upcomingTasks.sort((a, b) => a.scheduledDate - b.scheduledDate);
    
    res.json({ success: true, tasks: upcomingTasks });
  } catch (error) {
    console.error('Error fetching upcoming tasks:', error);
    res.status(500).json({ error: 'Failed to fetch upcoming tasks' });
  }
});

// Mark task as completed
router.put('/task/:calendarId/:taskId/complete', auth, async (req, res) => {
  try {
    const { calendarId, taskId } = req.params;
    const { notes } = req.body;
    
    const calendar = await CropCalendar.findOne({
      _id: calendarId,
      userId: req.user._id
    });
    
    if (!calendar) {
      return res.status(404).json({ error: 'Calendar not found' });
    }
    
    const task = calendar.tasks.id(taskId);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    task.completed = true;
    task.completedDate = new Date();
    if (notes) task.notes = notes;
    
    await calendar.save();
    
    // Log activity
    await logActivity(req.user._id, {
      activityType: 'crop-calendar',
      title: `Task Completed - ${task.title}`,
      description: `Completed task: ${task.title} for ${calendar.crop}`,
      status: 'completed',
      result: 'Task marked as completed',
      relatedId: calendar._id,
      relatedModel: 'CropCalendar',
      metadata: { crop: calendar.crop, taskType: task.type, taskStage: task.stage }
    });
    
    res.json({
      success: true,
      message: 'Task marked as completed',
      task
    });
  } catch (error) {
    console.error('Error completing task:', error);
    res.status(500).json({ error: 'Failed to complete task' });
  }
});

// Get calendar by ID
router.get('/:calendarId', auth, async (req, res) => {
  try {
    const calendar = await CropCalendar.findOne({
      _id: req.params.calendarId,
      userId: req.user._id
    });
    
    if (!calendar) {
      return res.status(404).json({ error: 'Calendar not found' });
    }
    
    res.json({ success: true, calendar });
  } catch (error) {
    console.error('Error fetching calendar:', error);
    res.status(500).json({ error: 'Failed to fetch calendar' });
  }
});

// Delete/deactivate calendar
router.delete('/:calendarId', auth, async (req, res) => {
  try {
    const calendar = await CropCalendar.findOne({
      _id: req.params.calendarId,
      userId: req.user._id
    });
    
    if (!calendar) {
      return res.status(404).json({ error: 'Calendar not found' });
    }
    
    calendar.active = false;
    await calendar.save();
    
    res.json({ success: true, message: 'Calendar deactivated' });
  } catch (error) {
    console.error('Error deleting calendar:', error);
    res.status(500).json({ error: 'Failed to delete calendar' });
  }
});

module.exports = router;

