'use client';

import { useState, useEffect } from 'react';
import { Calendar, Plus, CheckCircle2, Clock, Droplets, Leaf, Spray, Wheat } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
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

const taskIcons: { [key: string]: any } = {
  sowing: Leaf,
  irrigation: Droplets,
  fertilizer: Spray,
  pesticide: Spray,
  harvesting: Wheat,
  other: Clock
};

const taskColors: { [key: string]: string } = {
  sowing: 'bg-green-500',
  irrigation: 'bg-blue-500',
  fertilizer: 'bg-yellow-500',
  pesticide: 'bg-red-500',
  harvesting: 'bg-purple-500',
  other: 'bg-gray-500'
};

export default function CropCalendarPage() {
  const { t } = useLanguage();
  const [calendars, setCalendars] = useState<CropCalendar[]>([]);
  const [upcomingTasks, setUpcomingTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedCrop, setSelectedCrop] = useState('');
  const [sowingDate, setSowingDate] = useState('');
  const [viewCalendar, setViewCalendar] = useState<CropCalendar | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchCalendars();
    fetchUpcomingTasks();
  }, []);

  const fetchCalendars = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/crop-calendar/my-calendars', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setCalendars(data.calendars);
      }
    } catch (error) {
      console.error('Error fetching calendars:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUpcomingTasks = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/crop-calendar/upcoming-tasks?days=14', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setUpcomingTasks(data.tasks);
      }
    } catch (error) {
      console.error('Error fetching upcoming tasks:', error);
    }
  };

  const createCalendar = async () => {
    if (!selectedCrop || !sowingDate) {
      toast({
        title: 'Missing Information',
        description: 'Please select a crop and sowing date',
        variant: 'destructive'
      });
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/crop-calendar/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          crop: selectedCrop,
          sowingDate,
          location: {}
        })
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Crop calendar created successfully!'
        });
        setIsCreateDialogOpen(false);
        fetchCalendars();
        fetchUpcomingTasks();
      } else {
        throw new Error('Failed to create calendar');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create crop calendar',
        variant: 'destructive'
      });
    }
  };

  const completeTask = async (calendarId: string, taskId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `http://localhost:5000/api/crop-calendar/task/${calendarId}/${taskId}/complete`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ notes: '' })
        }
      );

      if (response.ok) {
        // Log gamification activity
        await fetch('http://localhost:5000/api/gamification/log-activity', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            activityType: 'task_completed',
            description: 'Completed crop calendar task'
          })
        });

        toast({
          title: 'Task Completed',
          description: 'Great job! Keep up the good work.'
        });
        
        fetchCalendars();
        fetchUpcomingTasks();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to complete task',
        variant: 'destructive'
      });
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric' 
    });
  };

  const getDaysUntil = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const diffTime = date.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <div className="p-2 rounded-full bg-teal-500">
              <Calendar className="h-8 w-8 text-white" />
            </div>
            {t("smartCropCalendar")}
          </h1>
          <p className="text-gray-600 mt-1">
            {t("planAndTrackActivities")}
          </p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-green-600 hover:bg-green-700">
              <Plus className="h-4 w-4 mr-2" />
              {t("createCalendar")}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{t("createCropCalendar")}</DialogTitle>
              <DialogDescription>
                {t("automatedTaskScheduling")}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="crop">{t("selectCrop")}</Label>
                <Select value={selectedCrop} onValueChange={setSelectedCrop}>
                  <SelectTrigger>
                    <SelectValue placeholder={t("chooseCrop")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tomato">🍅 Tomato</SelectItem>
                    <SelectItem value="wheat">🌾 Wheat</SelectItem>
                    <SelectItem value="rice">🌾 Rice</SelectItem>
                    <SelectItem value="maize">🌽 Maize</SelectItem>
                    <SelectItem value="cotton">☁️ Cotton</SelectItem>
                    <SelectItem value="sugarcane">🌿 Sugarcane</SelectItem>
                    <SelectItem value="potato">🥔 Potato</SelectItem>
                    <SelectItem value="onion">🧅 Onion</SelectItem>
                    <SelectItem value="soybean">🌱 Soybean</SelectItem>
                    <SelectItem value="groundnut">🥜 Groundnut</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="sowingDate">{t("sowingDate")}</Label>
                <Input
                  id="sowingDate"
                  type="date"
                  value={sowingDate}
                  onChange={(e) => setSowingDate(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={createCalendar} className="bg-green-600 hover:bg-green-700">
                {t("createCalendar")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Upcoming Tasks Section */}
      <Card>
        <CardHeader>
          <CardTitle>{t("upcomingTasks")}</CardTitle>
          <CardDescription>{t("tasksNeedAttention")}</CardDescription>
        </CardHeader>
        <CardContent>
          {upcomingTasks.length === 0 ? (
            <p className="text-center text-gray-500 py-8">
              {t("noUpcomingTasks")}
            </p>
          ) : (
            <div className="space-y-3">
              {upcomingTasks.slice(0, 5).map((task) => {
                const Icon = taskIcons[task.taskType] || Clock;
                const daysUntil = getDaysUntil(task.scheduledDate);
                
                return (
                  <div
                    key={task._id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${taskColors[task.taskType]}`}>
                        <Icon className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h4 className="font-medium">{task.title}</h4>
                        <p className="text-sm text-gray-600">
                          {task.crop} • {formatDate(task.scheduledDate)}
                          {daysUntil === 0 && <span className="text-red-500 ml-2">• {t("today")}</span>}
                          {daysUntil > 0 && <span className="text-blue-500 ml-2">• {t("inDays").replace("{days}", daysUntil.toString())}</span>}
                        </p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => completeTask(task.calendarId!, task._id)}
                      className="text-green-600 hover:bg-green-50"
                    >
                      <CheckCircle2 className="h-4 w-4 mr-1" />
                      {t("complete")}
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Active Calendars */}
      <div className="grid gap-6 md:grid-cols-2">
        {calendars.map((calendar) => {
          const completedTasks = calendar.tasks.filter(t => t.completed).length;
          const totalTasks = calendar.tasks.length;
          const progress = (completedTasks / totalTasks) * 100;

          return (
            <Card key={calendar._id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl">{calendar.crop}</CardTitle>
                    <CardDescription>
                      {calendar.season.charAt(0).toUpperCase() + calendar.season.slice(1)} {t("season")}
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="text-green-600">
                    {completedTasks}/{totalTasks} {t("tasks")}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>{t("progress")}</span>
                    <span>{Math.round(progress)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-600 h-2 rounded-full transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">{t("sowingDate")}</p>
                    <p className="font-medium">{formatDate(calendar.sowingDate)}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">{t("expectedHarvest")}</p>
                    <p className="font-medium">{formatDate(calendar.expectedHarvestDate)}</p>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">{t("recentTasks")}</h4>
                  <div className="space-y-2">
                    {calendar.tasks.slice(0, 3).map((task) => {
                      const Icon = taskIcons[task.taskType] || Clock;
                      
                      return (
                        <div
                          key={task._id}
                          className="flex items-center justify-between text-sm p-2 rounded bg-gray-50"
                        >
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4 text-gray-600" />
                            <span className={task.completed ? 'line-through text-gray-500' : ''}>
                              {task.title}
                            </span>
                          </div>
                          {task.completed && (
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => setViewCalendar(calendar)}
                >
                  {t("viewFullCalendar")}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Full Calendar View Dialog */}
      {viewCalendar && viewCalendar.tasks && (
        <Dialog open={!!viewCalendar} onOpenChange={() => setViewCalendar(null)}>
          <DialogContent className="sm:max-w-[800px] max-h-[85vh] flex flex-col">
            <DialogHeader className="flex-shrink-0">
              <DialogTitle className="text-2xl flex items-center gap-2">
                <Leaf className="h-6 w-6 text-green-600" />
                {viewCalendar.crop} {t("calendarSeason").replace("{season}", viewCalendar.season?.charAt(0).toUpperCase() + viewCalendar.season?.slice(1))}
              </DialogTitle>
              <DialogDescription>
                {t("sowingDate")}: {formatDate(viewCalendar.sowingDate)} • {t("expectedHarvest")}: {formatDate(viewCalendar.expectedHarvestDate)}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 mt-4 overflow-y-auto pr-2 flex-1">
              {/* Progress Bar */}
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="font-medium">{t("overallProgress")}</span>
                  <span>{viewCalendar.tasks?.filter(t => t.completed).length || 0} / {viewCalendar.tasks?.length || 0} {t("tasksCompleted")}</span>
                </div>
                <Progress 
                  value={viewCalendar.tasks?.length > 0 ? ((viewCalendar.tasks.filter(t => t.completed).length / viewCalendar.tasks.length) * 100) : 0} 
                  className="h-2"
                />
              </div>

              {/* All Tasks Grouped by Type */}
              <div className="space-y-4">
                {['sowing', 'irrigation', 'fertilizer', 'pesticide', 'harvesting'].map((type) => {
                  const tasksOfType = viewCalendar.tasks.filter(t => t.taskType === type);
                  if (tasksOfType.length === 0) return null;
                  
                  const Icon = taskIcons[type] || Clock;
                  
                  return (
                    <div key={type} className="space-y-2">
                      <h4 className="font-semibold flex items-center gap-2 text-sm">
                        {Icon && <Icon className="h-4 w-4" />}
                        {type === 'sowing' ? t("sowingTasks") : 
                         type === 'irrigation' ? t("irrigationTasks") :
                         type === 'fertilizer' ? t("fertilizerTasks") :
                         type === 'pesticide' ? t("pesticideTasks") :
                         type === 'harvesting' ? t("harvestingTasks") :
                         type.charAt(0).toUpperCase() + type.slice(1) + " " + t("tasks")}
                      </h4>
                      <div className="space-y-2 pl-6">
                        {tasksOfType.map((task) => {
                          const daysUntil = getDaysUntil(task.scheduledDate);
                          const isPast = daysUntil < 0;
                          const isToday = daysUntil === 0;
                          
                          return (
                            <div
                              key={task._id}
                              className={`flex items-center justify-between p-3 rounded-lg border ${
                                task.completed
                                  ? 'bg-green-50 border-green-200'
                                  : isPast && !task.completed
                                  ? 'bg-red-50 border-red-200'
                                  : isToday
                                  ? 'bg-yellow-50 border-yellow-200'
                                  : 'bg-gray-50 border-gray-200'
                              }`}
                            >
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <p className={`font-medium text-sm ${task.completed ? 'line-through text-gray-500' : ''}`}>
                                    {task.title}
                                  </p>
                                  {task.stage && (
                                    <Badge variant="outline" className="text-xs">
                                      {task.stage}
                                    </Badge>
                                  )}
                                </div>
                                <div className="flex items-center gap-3 mt-1 text-xs text-gray-600">
                                  <span>{formatDate(task.scheduledDate)}</span>
                                  {!task.completed && (
                                    <>
                                      {isToday && <span className="text-yellow-600 font-medium">• {t("today")}</span>}
                                      {daysUntil > 0 && <span className="text-blue-600">• {t("inDays").replace("{days}", daysUntil.toString())}</span>}
                                      {isPast && <span className="text-red-600 font-medium">• {t("overdueByDays").replace("{days}", Math.abs(daysUntil).toString())}</span>}
                                    </>
                                  )}
                                  {task.completed && task.completedDate && (
                                    <span className="text-green-600">• {t("completedOn").replace("{date}", formatDate(task.completedDate))}</span>
                                  )}
                                </div>
                                {task.description && (
                                  <p className="text-xs text-gray-500 mt-1">{task.description}</p>
                                )}
                              </div>
                              {!task.completed && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    completeTask(viewCalendar._id, task._id);
                                    // Refresh the view
                                    setTimeout(() => {
                                      const updated = calendars.find(c => c._id === viewCalendar._id);
                                      if (updated) setViewCalendar(updated);
                                    }, 500);
                                  }}
                                  className="text-green-600 hover:bg-green-50"
                                >
                                  <CheckCircle2 className="h-4 w-4" />
                                </Button>
                              )}
                              {task.completed && (
                                <CheckCircle2 className="h-5 w-5 text-green-600" />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {calendars.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <Calendar className="h-16 w-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold mb-2">{t("noCropCalendarsYet")}</h3>
            <p className="text-gray-600 mb-4">
              {t("createFirstCalendar")}
            </p>
            <Button
              onClick={() => setIsCreateDialogOpen(true)}
              className="bg-green-600 hover:bg-green-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              {t("createYourFirstCalendar")}
            </Button>
          </CardContent>
        </Card>
      )}
      </div>
    </DashboardLayout>
  );
}

