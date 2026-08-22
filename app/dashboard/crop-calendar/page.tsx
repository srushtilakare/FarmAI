'use client';

import { useState, useEffect } from 'react';
import {
  Calendar,
  Plus,
  CheckCircle2,
  Clock,
  Droplets,
  Leaf,
  Wheat,
  AlertCircle,
  Info,
  X,
} from 'lucide-react';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { Progress } from '@/components/ui/progress';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

import { useToast } from '@/hooks/use-toast';
import { DashboardLayout } from '@/components/dashboard-layout';
import { useLanguage } from '@/lib/i18n/LanguageContext';

interface Task {
  _id: string;
  taskType: string;
  title: string;
  description: string;
  scheduledDate: string;
  completed: boolean;
  stage: string;
  crop?: string;
  calendarId?: string;
  completedDate?: string;
}

interface CropCalendar {
  _id: string;
  crop: string;
  season: string;
  sowingDate: string;
  expectedHarvestDate: string;
  tasks: Task[];
  active: boolean;
}

interface RecommendedCrop {
  name: string;
  displayName: string;
  season: string;
  durationDays?: number;
}

interface SeasonValidation {
  isCompatible: boolean;
  selectedSeason: string;
  cropSeason: string;
  recommendedCrops: RecommendedCrop[];
  message: string;
}

const taskIcons: { [key: string]: any } = {
  sowing: Leaf,
  irrigation: Droplets,
  fertilizer: Leaf,
  pesticide: Leaf,
  harvesting: Wheat,
  other: Clock,
};

const taskColors: { [key: string]: string } = {
  sowing: 'bg-green-500',
  irrigation: 'bg-blue-500',
  fertilizer: 'bg-yellow-500',
  pesticide: 'bg-red-500',
  harvesting: 'bg-purple-500',
  other: 'bg-gray-500',
};

const cropOptions = [
  { value: 'tomato', label: 'Tomato', emoji: '🍅' },
  { value: 'wheat', label: 'Wheat', emoji: '🌾' },
  { value: 'rice', label: 'Rice', emoji: '🌾' },
  { value: 'maize', label: 'Maize', emoji: '🌽' },
  { value: 'cotton', label: 'Cotton', emoji: '☁️' },
  { value: 'sugarcane', label: 'Sugarcane', emoji: '🌿' },
  { value: 'potato', label: 'Potato', emoji: '🥔' },
  { value: 'onion', label: 'Onion', emoji: '🧅' },
  { value: 'soybean', label: 'Soybean', emoji: '🌱' },
  { value: 'groundnut', label: 'Groundnut', emoji: '🥜' },
];

export default function CropCalendarPage() {
  const { t } = useLanguage();

  const [calendars, setCalendars] = useState<CropCalendar[]>([]);
  const [upcomingTasks, setUpcomingTasks] = useState<Task[]>([]);

  const [loading, setLoading] = useState(true);

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const [selectedCrop, setSelectedCrop] = useState('');
  const [sowingDate, setSowingDate] = useState('');

  const [viewCalendar, setViewCalendar] =
    useState<CropCalendar | null>(null);

  const [seasonValidation, setSeasonValidation] =
    useState<SeasonValidation | null>(null);

  const [recommendedCrops, setRecommendedCrops] =
    useState<RecommendedCrop[]>([]);

  const [showRecommendations, setShowRecommendations] =
    useState(false);

  const { toast } = useToast();

  // ============================================================
  // INITIAL LOAD
  // ============================================================

  useEffect(() => {
    fetchCalendars();
    fetchUpcomingTasks();
  }, []);

  // ============================================================
  // FETCH CALENDARS
  // ============================================================

  const fetchCalendars = async () => {
    try {
      const token = localStorage.getItem('token');

      const response = await fetch(
        'http://localhost:5000/api/crop-calendar/my-calendars',
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setCalendars(data.calendars || []);
      }
    } catch (error) {
      console.error('Error fetching calendars:', error);
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // FETCH UPCOMING TASKS
  // ============================================================

  const fetchUpcomingTasks = async () => {
    try {
      const token = localStorage.getItem('token');

      const response = await fetch(
        'http://localhost:5000/api/crop-calendar/upcoming-tasks?days=14',
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setUpcomingTasks(data.tasks || []);
      }
    } catch (error) {
      console.error('Error fetching upcoming tasks:', error);
    }
  };

  // ============================================================
  // VALIDATE SEASON
  // ============================================================

  const validateSeason = async (
    crop: string,
    date: string
  ) => {
    if (!crop || !date) {
      setSeasonValidation(null);
      return;
    }

    try {
      const token = localStorage.getItem('token');

      const response = await fetch(
        'http://localhost:5000/api/crop-calendar/validate-season',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            crop,
            sowingDate: date,
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        setSeasonValidation(data);
      }
    } catch (error) {
      console.error('Error validating season:', error);
    }
  };

  // ============================================================
  // FETCH RECOMMENDED CROPS
  // ============================================================

  const fetchRecommendedCrops = async (date: string) => {
    if (!date) {
      setRecommendedCrops([]);
      setShowRecommendations(false);
      return;
    }

    try {
      const token = localStorage.getItem('token');

      const response = await fetch(
        `http://localhost:5000/api/crop-calendar/recommended-crops?date=${date}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();

        setRecommendedCrops(
          data.recommendedCrops || []
        );

        setShowRecommendations(true);
      }
    } catch (error) {
      console.error(
        'Error fetching recommended crops:',
        error
      );
    }
  };

  // ============================================================
  // DATE CHANGE
  // ============================================================

  const handleDateChange = (date: string) => {
    setSowingDate(date);

    if (date) {
      fetchRecommendedCrops(date);

      if (selectedCrop) {
        validateSeason(selectedCrop, date);
      }
    } else {
      setSeasonValidation(null);
      setRecommendedCrops([]);
      setShowRecommendations(false);
    }
  };

  // ============================================================
  // CROP CHANGE
  // ============================================================

  const handleCropChange = (crop: string) => {
    setSelectedCrop(crop);

    if (crop && sowingDate) {
      validateSeason(crop, sowingDate);
    } else {
      setSeasonValidation(null);
    }
  };

  // ============================================================
  // RESET CREATE FORM
  // ============================================================

  const resetCreateForm = () => {
    setSelectedCrop('');
    setSowingDate('');
    setSeasonValidation(null);
    setRecommendedCrops([]);
    setShowRecommendations(false);
  };

  // ============================================================
  // CREATE CALENDAR
  // ============================================================

  const createCalendar = async () => {
    if (!selectedCrop || !sowingDate) {
      toast({
        title: 'Missing Information',
        description:
          'Please select a crop and sowing date',
        variant: 'destructive',
      });

      return;
    }

    if (
      seasonValidation &&
      !seasonValidation.isCompatible
    ) {
      toast({
        title: 'Season Mismatch',
        description:
          seasonValidation.message,
        variant: 'destructive',
      });

      return;
    }

    try {
      const token = localStorage.getItem('token');

      const response = await fetch(
        'http://localhost:5000/api/crop-calendar/create',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            crop: selectedCrop,
            sowingDate,
            location: {},
          }),
        }
      );

      if (response.ok) {
        toast({
          title: 'Success',
          description:
            'Crop calendar created successfully!',
        });

        setIsCreateDialogOpen(false);

        resetCreateForm();

        fetchCalendars();
        fetchUpcomingTasks();
      } else {
        const errorData = await response.json();

        throw new Error(
          errorData.error ||
            'Failed to create calendar'
        );
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description:
          error.message ||
          'Failed to create crop calendar',
        variant: 'destructive',
      });
    }
  };

  // ============================================================
  // CAN COMPLETE TASK
  // ============================================================

  const canCompleteTask = (
    scheduledDate: string
  ) => {
    const today = new Date();

    today.setHours(
      0,
      0,
      0,
      0
    );

    const taskDate = new Date(
      scheduledDate
    );

    taskDate.setHours(
      0,
      0,
      0,
      0
    );

    const daysDifference = Math.ceil(
      (taskDate.getTime() -
        today.getTime()) /
        (1000 * 60 * 60 * 24)
    );

    return daysDifference <= 1;
  };

  // ============================================================
  // COMPLETE TASK
  // ============================================================

  const completeTask = async (
    calendarId: string,
    taskId: string
  ) => {
    try {
      const token =
        localStorage.getItem('token');

      const response = await fetch(
        `http://localhost:5000/api/crop-calendar/task/${calendarId}/${taskId}/complete`,
        {
          method: 'PUT',
          headers: {
            'Content-Type':
              'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            notes: '',
          }),
        }
      );

      if (response.ok) {
        // Gamification
        await fetch(
          'http://localhost:5000/api/gamification/log-activity',
          {
            method: 'POST',
            headers: {
              'Content-Type':
                'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              activityType:
                'task_completed',
              description:
                'Completed crop calendar task',
            }),
          }
        );

        toast({
          title: 'Task Completed',
          description:
            'Great job! Keep up the good work.',
        });

        await fetchCalendars();
        await fetchUpcomingTasks();

        // Update currently opened calendar
        const refreshed =
          calendars.find(
            (calendar) =>
              calendar._id ===
              calendarId
          );

        if (refreshed) {
          setViewCalendar(refreshed);
        }
      } else {
        const errorData =
          await response.json();

        toast({
          title:
            'Cannot Complete Task',
          description:
            errorData.message ||
            'This task is not yet due for completion',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description:
          'Failed to complete task',
        variant: 'destructive',
      });
    }
  };

  // ============================================================
  // FORMAT DATE
  // ============================================================

  const formatDate = (
    dateString: string
  ) => {
    const date = new Date(
      dateString
    );

    return date.toLocaleDateString(
      'en-IN',
      {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }
    );
  };

  // ============================================================
  // DAYS UNTIL
  // ============================================================

  const getDaysUntil = (
    dateString: string
  ) => {
    const date = new Date(
      dateString
    );

    const today = new Date();

    const diffTime =
      date.getTime() -
      today.getTime();

    return Math.ceil(
      diffTime /
        (1000 * 60 * 60 * 24)
    );
  };

  // ============================================================
  // LOADING
  // ============================================================

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-green-600" />
      </div>
    );
  }

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <DashboardLayout>
      <div className="container mx-auto space-y-6 p-4 sm:p-6">

        {/* =====================================================
            PAGE HEADER
        ===================================================== */}

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold sm:text-3xl">

              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-teal-500">
                <Calendar className="h-6 w-6 text-white sm:h-8 sm:w-8" />
              </div>

              {t('smartCropCalendar')}
            </h1>

            <p className="mt-1 text-sm text-gray-600 sm:text-base">
              {t('planAndTrackActivities')}
            </p>
          </div>

          {/* =================================================
              CREATE CALENDAR
          ================================================= */}

          <Dialog
            open={isCreateDialogOpen}
            onOpenChange={(open) => {
              setIsCreateDialogOpen(open);

              if (!open) {
                resetCreateForm();
              }
            }}
          >

            <DialogTrigger asChild>
              <Button className="w-full bg-green-600 hover:bg-green-700 sm:w-auto">
                <Plus className="mr-2 h-4 w-4" />
                {t('createCalendar')}
              </Button>
            </DialogTrigger>

            {/* =================================================
                IMPROVED CREATE DIALOG
            ================================================= */}

            <DialogContent
              className="
                flex
                max-h-[90vh]
                w-[calc(100%-1.5rem)]
                max-w-xl
                flex-col
                overflow-hidden
                rounded-2xl
                p-0
              "
            >

              {/* HEADER */}

              <DialogHeader className="flex-shrink-0 border-b bg-white px-5 py-4 sm:px-6">

                <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-100">
                    <Calendar className="h-5 w-5 text-green-600" />
                  </div>

                  {t('createCropCalendar')}
                </DialogTitle>

                <DialogDescription className="text-xs sm:text-sm">
                  {t('automatedTaskScheduling')}
                </DialogDescription>

              </DialogHeader>

              {/* =================================================
                  SCROLLABLE CONTENT
              ================================================= */}

              <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-6">

                <div className="space-y-5">

                  {/* =================================================
                      DATE
                  ================================================= */}

                  <div className="space-y-2">

                    <Label
                      htmlFor="sowingDate"
                      className="text-sm font-semibold text-gray-800"
                    >
                      {t('sowingDate')}
                    </Label>

                    <Input
                      id="sowingDate"
                      type="date"
                      value={sowingDate}
                      onChange={(e) =>
                        handleDateChange(
                          e.target.value
                        )
                      }
                      className="h-11"
                    />

                  </div>

                  {/* =================================================
                      RECOMMENDED CROPS
                  ================================================= */}

                  {showRecommendations &&
                    recommendedCrops.length >
                      0 && (
                      <div className="rounded-xl border border-green-200 bg-green-50/70 p-4">

                        <div className="mb-3 flex items-start gap-2">

                          <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-green-100">
                            <Info className="h-4 w-4 text-green-700" />
                          </div>

                          <div className="min-w-0 flex-1">

                            <div className="flex items-center justify-between gap-2">

                              <p className="text-sm font-semibold text-green-900">
                                Recommended crops
                              </p>

                              <button
                                type="button"
                                onClick={() =>
                                  setShowRecommendations(
                                    false
                                  )
                                }
                                className="rounded-md p-1 text-green-700 hover:bg-green-100"
                              >
                                <X className="h-4 w-4" />
                              </button>

                            </div>

                            <p className="mt-0.5 text-xs text-green-700">
                              Based on your selected sowing date
                            </p>

                          </div>

                        </div>

                        <div className="flex flex-wrap gap-2">

                          {recommendedCrops.map(
                            (crop) => (
                              <button
                                key={
                                  crop.name
                                }
                                type="button"
                                onClick={() => {
                                  handleCropChange(
                                    crop.name
                                  );

                                  setShowRecommendations(
                                    false
                                  );
                                }}
                                className="
                                  rounded-full
                                  border
                                  border-green-200
                                  bg-white
                                  px-3
                                  py-1.5
                                  text-xs
                                  font-medium
                                  text-green-800
                                  transition
                                  hover:border-green-400
                                  hover:bg-green-100
                                "
                              >
                                {crop.displayName ||
                                  crop.name
                                    .charAt(
                                      0
                                    )
                                    .toUpperCase() +
                                    crop.name.slice(
                                      1
                                    )}

                                <span className="ml-1 text-green-600">
                                  ({crop.season})
                                </span>
                              </button>
                            )
                          )}

                        </div>

                      </div>
                    )}

                  {/* =================================================
                      CROP SELECT
                  ================================================= */}

                  <div className="space-y-2">

                    <Label
                      htmlFor="crop"
                      className="text-sm font-semibold text-gray-800"
                    >
                      {t('selectCrop')}
                    </Label>

                    <Select
                      value={selectedCrop}
                      onValueChange={
                        handleCropChange
                      }
                    >

                      <SelectTrigger
                        id="crop"
                        className="h-11"
                      >
                        <SelectValue
                          placeholder={t(
                            'chooseCrop'
                          )}
                        />
                      </SelectTrigger>

                      <SelectContent>

                        {cropOptions.map(
                          (crop) => (
                            <SelectItem
                              key={
                                crop.value
                              }
                              value={
                                crop.value
                              }
                            >
                              <span className="flex items-center gap-2">
                                <span>
                                  {
                                    crop.emoji
                                  }
                                </span>

                                <span>
                                  {
                                    crop.label
                                  }
                                </span>
                              </span>
                            </SelectItem>
                          )
                        )}

                      </SelectContent>

                    </Select>

                  </div>

                  {/* =================================================
                      SEASON VALIDATION - MATCH
                  ================================================= */}

                  {seasonValidation &&
                    seasonValidation.isCompatible && (
                      <div className="rounded-xl border border-green-200 bg-green-50 p-4">

                        <div className="flex items-start gap-3">

                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-100">
                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                          </div>

                          <div>

                            <p className="text-sm font-semibold text-green-900">
                              Season Match
                            </p>

                            <p className="mt-1 text-xs leading-5 text-green-700">
                              {
                                seasonValidation.message
                              }
                            </p>

                          </div>

                        </div>

                      </div>
                    )}

                  {/* =================================================
                      SEASON VALIDATION - MISMATCH
                  ================================================= */}

                  {seasonValidation &&
                    !seasonValidation.isCompatible && (
                      <div className="rounded-xl border border-red-200 bg-red-50 p-4">

                        <div className="flex items-start gap-3">

                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-100">
                            <AlertCircle className="h-5 w-5 text-red-600" />
                          </div>

                          <div className="min-w-0 flex-1">

                            <p className="text-sm font-semibold text-red-900">
                              Season Mismatch
                            </p>

                            <p className="mt-1 text-xs leading-5 text-red-700">
                              {
                                seasonValidation.message
                              }
                            </p>

                            {seasonValidation
                              .recommendedCrops
                              .length >
                              0 && (
                              <div className="mt-4">

                                <p className="mb-2 text-xs font-semibold text-red-800">
                                  Recommended crops for{' '}
                                  {
                                    seasonValidation.selectedSeason
                                  }{' '}
                                  season:
                                </p>

                                <div className="flex flex-wrap gap-2">

                                  {seasonValidation.recommendedCrops.map(
                                    (crop) => (
                                      <button
                                        key={
                                          crop.name
                                        }
                                        type="button"
                                        onClick={() =>
                                          handleCropChange(
                                            crop.name
                                          )
                                        }
                                        className="
                                          rounded-full
                                          border
                                          border-red-200
                                          bg-white
                                          px-3
                                          py-1.5
                                          text-xs
                                          font-medium
                                          text-red-800
                                          transition
                                          hover:border-green-400
                                          hover:bg-green-50
                                          hover:text-green-800
                                        "
                                      >
                                        {
                                          crop.displayName
                                        }
                                      </button>
                                    )
                                  )}

                                </div>

                              </div>
                            )}

                          </div>

                        </div>

                      </div>
                    )}

                  {/* =================================================
                      SMALL HELP BOX
                  ================================================= */}

                  {!selectedCrop &&
                    sowingDate &&
                    !seasonValidation && (
                      <div className="rounded-xl border border-blue-100 bg-blue-50 p-3">

                        <div className="flex gap-2">

                          <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />

                          <p className="text-xs leading-5 text-blue-700">
                            Select a crop to check whether it
                            matches the selected agricultural
                            season.
                          </p>

                        </div>

                      </div>
                    )}

                </div>

              </div>

              {/* =================================================
                  FIXED FOOTER
              ================================================= */}

              <DialogFooter className="flex-shrink-0 border-t bg-white px-5 py-4 sm:px-6">

                <div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:justify-end">

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsCreateDialogOpen(
                        false
                      );
                      resetCreateForm();
                    }}
                    className="w-full sm:w-auto"
                  >
                    Cancel
                  </Button>

                  <Button
                    onClick={
                      createCalendar
                    }
                    className="w-full bg-green-600 hover:bg-green-700 sm:w-auto"
                    disabled={
                      !selectedCrop ||
                      !sowingDate ||
                      (!!seasonValidation &&
                        !seasonValidation.isCompatible)
                    }
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    {t('createCalendar')}
                  </Button>

                </div>

              </DialogFooter>

            </DialogContent>

          </Dialog>

        </div>

        {/* =====================================================
            UPCOMING TASKS
        ===================================================== */}

        <Card>

          <CardHeader>
            <CardTitle>
              {t('upcomingTasks')}
            </CardTitle>

            <CardDescription>
              {t('tasksNeedAttention')}
            </CardDescription>
          </CardHeader>

          <CardContent>

            {upcomingTasks.length === 0 ? (
              <p className="py-8 text-center text-gray-500">
                {t('noUpcomingTasks')}
              </p>
            ) : (
              <div className="space-y-3">

                {upcomingTasks
                  .slice(0, 5)
                  .map((task) => {

                    const Icon =
                      taskIcons[
                        task.taskType
                      ] || Clock;

                    const daysUntil =
                      getDaysUntil(
                        task.scheduledDate
                      );

                    const canComplete =
                      canCompleteTask(
                        task.scheduledDate
                      );

                    return (
                      <div
                        key={
                          task._id
                        }
                        className="flex flex-col gap-3 rounded-lg border p-4 transition hover:bg-gray-50 sm:flex-row sm:items-center sm:justify-between"
                      >

                        <div className="flex items-center gap-3">

                          <div
                            className={`rounded-full p-2 ${
                              taskColors[
                                task.taskType
                              ]
                            }`}
                          >
                            <Icon className="h-5 w-5 text-white" />
                          </div>

                          <div>

                            <h4 className="font-medium">
                              {task.title}
                            </h4>

                            <p className="text-sm text-gray-600">

                              {task.crop} •{' '}
                              {formatDate(
                                task.scheduledDate
                              )}

                              {daysUntil ===
                                0 && (
                                <span className="ml-2 text-red-500">
                                  •{' '}
                                  {t(
                                    'today'
                                  )}
                                </span>
                              )}

                              {daysUntil >
                                0 && (
                                <span className="ml-2 text-blue-500">
                                  •{' '}
                                  {t(
                                    'inDays'
                                  ).replace(
                                    '{days}',
                                    daysUntil.toString()
                                  )}
                                </span>
                              )}

                            </p>

                          </div>

                        </div>

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            completeTask(
                              task.calendarId!,
                              task._id
                            )
                          }
                          disabled={
                            !canComplete
                          }
                          className={
                            canComplete
                              ? 'text-green-600 hover:bg-green-50'
                              : 'cursor-not-allowed text-gray-400'
                          }
                          title={
                            !canComplete
                              ? `Available from ${formatDate(
                                  new Date(
                                    new Date(
                                      task.scheduledDate
                                    ).getTime() -
                                      24 *
                                        60 *
                                        60 *
                                        1000
                                  ).toISOString()
                                )}`
                              : 'Mark as complete'
                          }
                        >
                          <CheckCircle2 className="mr-1 h-4 w-4" />
                          {t('complete')}
                        </Button>

                      </div>
                    );
                  })}

              </div>
            )}

          </CardContent>

        </Card>

        {/* =====================================================
            ACTIVE CALENDARS
        ===================================================== */}

        <div className="grid gap-6 md:grid-cols-2">

          {calendars.map(
            (calendar) => {

              const completedTasks =
                calendar.tasks.filter(
                  (task) =>
                    task.completed
                ).length;

              const totalTasks =
                calendar.tasks.length;

              const progress =
                totalTasks > 0
                  ? (completedTasks /
                      totalTasks) *
                    100
                  : 0;

              return (
                <Card
                  key={
                    calendar._id
                  }
                >

                  <CardHeader>

                    <div className="flex items-start justify-between gap-3">

                      <div>

                        <CardTitle className="text-xl capitalize">
                          {calendar.crop}
                        </CardTitle>

                        <CardDescription>
                          {calendar.season
                            .charAt(0)
                            .toUpperCase() +
                            calendar.season.slice(
                              1
                            )}{' '}
                          {t('season')}
                        </CardDescription>

                      </div>

                      <Badge
                        variant="outline"
                        className="shrink-0 text-green-600"
                      >
                        {completedTasks}/
                        {totalTasks}{' '}
                        {t('tasks')}
                      </Badge>

                    </div>

                  </CardHeader>

                  <CardContent className="space-y-4">

                    {/* Progress */}

                    <div>

                      <div className="mb-1 flex justify-between text-sm">

                        <span>
                          {t(
                            'progress'
                          )}
                        </span>

                        <span>
                          {Math.round(
                            progress
                          )}
                          %
                        </span>

                      </div>

                      <div className="h-2 w-full rounded-full bg-gray-200">

                        <div
                          className="h-2 rounded-full bg-green-600 transition-all"
                          style={{
                            width: `${progress}%`,
                          }}
                        />

                      </div>

                    </div>

                    {/* Dates */}

                    <div className="grid grid-cols-2 gap-4 text-sm">

                      <div>

                        <p className="text-gray-600">
                          {t(
                            'sowingDate'
                          )}
                        </p>

                        <p className="font-medium">
                          {formatDate(
                            calendar.sowingDate
                          )}
                        </p>

                      </div>

                      <div>

                        <p className="text-gray-600">
                          {t(
                            'expectedHarvest'
                          )}
                        </p>

                        <p className="font-medium">
                          {formatDate(
                            calendar.expectedHarvestDate
                          )}
                        </p>

                      </div>

                    </div>

                    {/* Recent Tasks */}

                    <div>

                      <h4 className="mb-2 font-medium">
                        {t(
                          'recentTasks'
                        )}
                      </h4>

                      <div className="space-y-2">

                        {calendar.tasks
                          .slice(0, 3)
                          .map(
                            (
                              task
                            ) => {

                              const Icon =
                                taskIcons[
                                  task
                                    .taskType
                                ] ||
                                Clock;

                              return (
                                <div
                                  key={
                                    task._id
                                  }
                                  className="flex items-center justify-between rounded bg-gray-50 p-2 text-sm"
                                >

                                  <div className="flex items-center gap-2">

                                    <Icon className="h-4 w-4 text-gray-600" />

                                    <span
                                      className={
                                        task.completed
                                          ? 'text-gray-500 line-through'
                                          : ''
                                      }
                                    >
                                      {
                                        task.title
                                      }
                                    </span>

                                  </div>

                                  {task.completed && (
                                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                                  )}

                                </div>
                              );
                            }
                          )}

                      </div>

                    </div>

                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() =>
                        setViewCalendar(
                          calendar
                        )
                      }
                    >
                      {t(
                        'viewFullCalendar'
                      )}
                    </Button>

                  </CardContent>

                </Card>
              );
            }
          )}

        </div>

        {/* =====================================================
            FULL CALENDAR VIEW
        ===================================================== */}

        {viewCalendar &&
          viewCalendar.tasks && (
            <Dialog
              open={!!viewCalendar}
              onOpenChange={() =>
                setViewCalendar(null)
              }
            >

              <DialogContent
                className="
                  flex
                  max-h-[85vh]
                  w-[calc(100%-1.5rem)]
                  max-w-4xl
                  flex-col
                  overflow-hidden
                  rounded-2xl
                  p-0
                "
              >

                <DialogHeader className="flex-shrink-0 border-b px-5 py-4 sm:px-6">

                  <DialogTitle className="flex items-center gap-2 text-xl sm:text-2xl">

                    <Leaf className="h-6 w-6 text-green-600" />

                    <span className="capitalize">
                      {viewCalendar.crop}{' '}
                      {t(
                        'calendarSeason'
                      ).replace(
                        '{season}',
                        viewCalendar.season
                          ?.charAt(
                            0
                          )
                          .toUpperCase() +
                          viewCalendar.season?.slice(
                            1
                          )
                      )}
                    </span>

                  </DialogTitle>

                  <DialogDescription>
                    {t(
                      'sowingDate'
                    )}
                    :{' '}
                    {formatDate(
                      viewCalendar.sowingDate
                    )}{' '}
                    •{' '}
                    {t(
                      'expectedHarvest'
                    )}
                    :{' '}
                    {formatDate(
                      viewCalendar.expectedHarvestDate
                    )}
                  </DialogDescription>

                </DialogHeader>

                <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-6">

                  {/* Progress */}

                  <div className="mb-6">

                    <div className="mb-2 flex justify-between text-sm">

                      <span className="font-medium">
                        {t(
                          'overallProgress'
                        )}
                      </span>

                      <span>
                        {
                          viewCalendar.tasks.filter(
                            (task) =>
                              task.completed
                          ).length
                        }{' '}
                        /{' '}
                        {
                          viewCalendar
                            .tasks
                            .length
                        }{' '}
                        {t(
                          'tasksCompleted'
                        )}
                      </span>

                    </div>

                    <Progress
                      value={
                        viewCalendar
                          .tasks
                          .length >
                        0
                          ? (viewCalendar.tasks.filter(
                              (task) =>
                                task.completed
                            ).length /
                              viewCalendar
                                .tasks
                                .length) *
                            100
                          : 0
                      }
                      className="h-2"
                    />

                  </div>

                  {/* Tasks */}

                  <div className="space-y-5">

                    {[
                      'sowing',
                      'irrigation',
                      'fertilizer',
                      'pesticide',
                      'harvesting',
                    ].map(
                      (type) => {

                        const tasksOfType =
                          viewCalendar.tasks.filter(
                            (task) =>
                              task.taskType ===
                              type
                          );

                        if (
                          tasksOfType.length ===
                          0
                        ) {
                          return null;
                        }

                        const Icon =
                          taskIcons[
                            type
                          ] || Clock;

                        return (
                          <div
                            key={type}
                            className="space-y-2"
                          >

                            <h4 className="flex items-center gap-2 text-sm font-semibold">

                              <Icon className="h-4 w-4" />

                              {type ===
                              'sowing'
                                ? t(
                                    'sowingTasks'
                                  )
                                : type ===
                                  'irrigation'
                                ? t(
                                    'irrigationTasks'
                                  )
                                : type ===
                                  'fertilizer'
                                ? t(
                                    'fertilizerTasks'
                                  )
                                : type ===
                                  'pesticide'
                                ? t(
                                    'pesticideTasks'
                                  )
                                : type ===
                                  'harvesting'
                                ? t(
                                    'harvestingTasks'
                                  )
                                : `${type
                                    .charAt(
                                      0
                                    )
                                    .toUpperCase() +
                                    type.slice(
                                      1
                                    )} ${t(
                                    'tasks'
                                  )}`}

                            </h4>

                            <div className="space-y-2 sm:pl-6">

                              {tasksOfType.map(
                                (
                                  task
                                ) => {

                                  const daysUntil =
                                    getDaysUntil(
                                      task.scheduledDate
                                    );

                                  const isPast =
                                    daysUntil <
                                    0;

                                  const isToday =
                                    daysUntil ===
                                    0;

                                  const canComplete =
                                    canCompleteTask(
                                      task.scheduledDate
                                    );

                                  return (
                                    <div
                                      key={
                                        task._id
                                      }
                                      className={`flex flex-col gap-3 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between ${
                                        task.completed
                                          ? 'border-green-200 bg-green-50'
                                          : isPast
                                          ? 'border-red-200 bg-red-50'
                                          : isToday
                                          ? 'border-yellow-200 bg-yellow-50'
                                          : 'border-gray-200 bg-gray-50'
                                      }`}
                                    >

                                      <div className="flex-1">

                                        <div className="flex flex-wrap items-center gap-2">

                                          <p
                                            className={`text-sm font-medium ${
                                              task.completed
                                                ? 'text-gray-500 line-through'
                                                : ''
                                            }`}
                                          >
                                            {
                                              task.title
                                            }
                                          </p>

                                          {task.stage && (
                                            <Badge
                                              variant="outline"
                                              className="text-xs"
                                            >
                                              {
                                                task.stage
                                              }
                                            </Badge>
                                          )}

                                          {!task.completed &&
                                            !canComplete && (
                                              <Badge
                                                variant="outline"
                                                className="text-xs text-gray-400"
                                              >
                                                🔒
                                                Locked
                                              </Badge>
                                            )}

                                        </div>

                                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-600">

                                          <span>
                                            {formatDate(
                                              task.scheduledDate
                                            )}
                                          </span>

                                          {!task.completed && (
                                            <>
                                              {isToday && (
                                                <span className="font-medium text-yellow-600">
                                                  •{' '}
                                                  {t(
                                                    'today'
                                                  )}
                                                </span>
                                              )}

                                              {daysUntil >
                                                0 && (
                                                <span className="text-blue-600">
                                                  •{' '}
                                                  {t(
                                                    'inDays'
                                                  ).replace(
                                                    '{days}',
                                                    daysUntil.toString()
                                                  )}
                                                </span>
                                              )}

                                              {isPast && (
                                                <span className="font-medium text-red-600">
                                                  •{' '}
                                                  {t(
                                                    'overdueByDays'
                                                  ).replace(
                                                    '{days}',
                                                    Math.abs(
                                                      daysUntil
                                                    ).toString()
                                                  )}
                                                </span>
                                              )}
                                            </>
                                          )}

                                          {task.completed &&
                                            task.completedDate && (
                                              <span className="text-green-600">
                                                •{' '}
                                                {t(
                                                  'completedOn'
                                                ).replace(
                                                  '{date}',
                                                  formatDate(
                                                    task.completedDate
                                                  )
                                                )}
                                              </span>
                                            )}

                                        </div>

                                        {task.description && (
                                          <p className="mt-1 text-xs text-gray-500">
                                            {
                                              task.description
                                            }
                                          </p>
                                        )}

                                      </div>

                                      {!task.completed && (
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() =>
                                            completeTask(
                                              viewCalendar._id,
                                              task._id
                                            )
                                          }
                                          disabled={
                                            !canComplete
                                          }
                                          className={
                                            canComplete
                                              ? 'text-green-600 hover:bg-green-50'
                                              : 'cursor-not-allowed text-gray-400'
                                          }
                                          title={
                                            !canComplete
                                              ? `Available from ${formatDate(
                                                  new Date(
                                                    new Date(
                                                      task.scheduledDate
                                                    ).getTime() -
                                                      24 *
                                                        60 *
                                                        60 *
                                                        1000
                                                  ).toISOString()
                                                )}`
                                              : 'Mark as complete'
                                          }
                                        >
                                          <CheckCircle2 className="h-4 w-4" />
                                        </Button>
                                      )}

                                      {task.completed && (
                                        <CheckCircle2 className="h-5 w-5 shrink-0 text-green-600" />
                                      )}

                                    </div>
                                  );
                                }
                              )}

                            </div>

                          </div>
                        );
                      }
                    )}

                  </div>

                </div>

              </DialogContent>

            </Dialog>
          )}

        {/* =====================================================
            NO CALENDARS
        ===================================================== */}

        {calendars.length ===
          0 && (
          <Card className="py-12 text-center">

            <CardContent>

              <Calendar className="mx-auto mb-4 h-16 w-16 text-gray-400" />

              <h3 className="mb-2 text-xl font-semibold">
                {t(
                  'noCropCalendarsYet'
                )}
              </h3>

              <p className="mb-4 text-gray-600">
                {t(
                  'createFirstCalendar'
                )}
              </p>

              <Button
                onClick={() =>
                  setIsCreateDialogOpen(
                    true
                  )
                }
                className="bg-green-600 hover:bg-green-700"
              >
                <Plus className="mr-2 h-4 w-4" />
                {t(
                  'createYourFirstCalendar'
                )}
              </Button>

            </CardContent>

          </Card>
        )}

      </div>
    </DashboardLayout>
  );
}