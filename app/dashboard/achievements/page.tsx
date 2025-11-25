'use client';

import { useState, useEffect } from 'react';
import { Trophy, Award, Target, TrendingUp, Users, Star, Medal, Crown } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { DashboardLayout } from '@/components/dashboard-layout';
import { useLanguage } from '@/lib/i18n/LanguageContext';

interface UserScore {
  totalPoints: number;
  level: number;
  levelName: string;
  stats: any;
  badges: Array<{
    badgeId: string;
    badgeName: string;
    badgeDescription: string;
    badgeIcon: string;
    category: string;
    earnedDate: string;
  }>;
  streaks: {
    currentLoginStreak: number;
    longestLoginStreak: number;
    currentTaskStreak: number;
    longestTaskStreak: number;
  };
  achievements: {
    [key: string]: {
      current: number;
      target: number;
      completed: boolean;
    };
  };
  recentActivities: Array<{
    activityType: string;
    points: number;
    description: string;
    date: string;
  }>;
}

interface LeaderboardEntry {
  rank: number;
  userName: string;
  state: string;
  totalPoints: number;
  level: number;
  levelName: string;
  badgeCount: number;
}

export default function AchievementsPage() {
  const { t } = useLanguage();
  const [userScore, setUserScore] = useState<UserScore | null>(null);
  const [userRank, setUserRank] = useState<number>(0);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      
      const [scoreRes, rankRes, leaderboardRes] = await Promise.all([
        fetch('http://localhost:5000/api/gamification/my-score', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch('http://localhost:5000/api/gamification/my-rank', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch('http://localhost:5000/api/gamification/leaderboard?limit=10')
      ]);

      if (scoreRes.ok) {
        const scoreData = await scoreRes.json();
        setUserScore(scoreData.score);
      }
      
      if (rankRes.ok) {
        const rankData = await rankRes.json();
        setUserRank(rankData.rank);
      }
      
      if (leaderboardRes.ok) {
        const leaderboardData = await leaderboardRes.json();
        setLeaderboard(leaderboardData.leaderboard);
      }
    } catch (error) {
      console.error('Error fetching achievements:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !userScore) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  const achievementsList = [
    {
      id: 'expertAdviser',
      titleKey: 'expertAdviser',
      descriptionKey: 'help50Farmers',
      icon: '👨‍🌾',
      category: 'Community'
    },
    {
      id: 'activeFarmer',
      titleKey: 'activeFarmer',
      descriptionKey: 'maintain30DayStreak',
      icon: '🌟',
      category: 'Activity'
    },
    {
      id: 'diseaseDetector',
      titleKey: 'diseaseDetector',
      descriptionKey: 'uploadDetect20Diseases',
      icon: '🏆',
      category: 'Expertise'
    },
    {
      id: 'soilMaster',
      titleKey: 'soilMaster',
      descriptionKey: 'upload5Reports',
      icon: '🌱',
      category: 'Analysis'
    },
    {
      id: 'weatherWatcher',
      titleKey: 'weatherWatcher',
      descriptionKey: 'checkWeather100Times',
      icon: '🌤️',
      category: 'Diligence'
    },
    {
      id: 'communityHelper',
      titleKey: 'communityHelper',
      descriptionKey: 'create25Posts',
      icon: '🤝',
      category: 'Community'
    }
  ];

  return (
    <DashboardLayout>
      <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Trophy className="h-8 w-8 text-yellow-600" />
          {t("achievementsRewards")}
        </h1>
        <p className="text-gray-600 mt-1">
          {t("trackProgressCompete")}
        </p>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">{t("overview")}</TabsTrigger>
          <TabsTrigger value="badges">{t("badges")}</TabsTrigger>
          <TabsTrigger value="achievements">{t("achievements")}</TabsTrigger>
          <TabsTrigger value="leaderboard">{t("leaderboard")}</TabsTrigger>
          <TabsTrigger value="activity">{t("activityLog")}</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid md:grid-cols-3 gap-6">
            {/* Level Card */}
            <Card className="bg-gradient-to-br from-yellow-50 to-orange-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Crown className="h-5 w-5 text-yellow-600" />
                  {t("level")} {userScore.level}
                </CardTitle>
                <CardDescription>{userScore.levelName}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <p className="text-4xl font-bold text-yellow-600">{userScore.totalPoints}</p>
                  <p className="text-sm text-gray-600">{t("totalXP")}</p>
                </div>
              </CardContent>
            </Card>

            {/* Rank Card */}
            <Card className="bg-gradient-to-br from-blue-50 to-purple-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                  {t("yourRank")}
                </CardTitle>
                <CardDescription>{t("amongAllFarmers")}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <p className="text-4xl font-bold text-blue-600">#{userRank}</p>
                  <p className="text-sm text-gray-600">{t("globalRanking")}</p>
                </div>
              </CardContent>
            </Card>

            {/* Badges Card */}
            <Card className="bg-gradient-to-br from-green-50 to-teal-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-green-600" />
                  {t("badgesEarned")}
                </CardTitle>
                <CardDescription>{t("achievementsUnlocked")}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <p className="text-4xl font-bold text-green-600">{userScore.badges.length}</p>
                  <p className="text-sm text-gray-600">{t("totalBadges")}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Streaks */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-orange-600" />
                  {t("loginStreak")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">{t("currentStreak")}</span>
                  <Badge className="bg-orange-100 text-orange-800">
                    🔥 {userScore.streaks.currentLoginStreak} {t("days")}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">{t("longestStreak")}</span>
                  <Badge variant="outline">
                    {userScore.streaks.longestLoginStreak} {t("days")}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-green-600" />
                  {t("taskStreak")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">{t("currentStreak")}</span>
                  <Badge className="bg-green-100 text-green-800">
                    ✅ {userScore.streaks.currentTaskStreak} {t("days")}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">{t("longestStreak")}</span>
                  <Badge variant="outline">
                    {userScore.streaks.longestTaskStreak} {t("days")}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="badges">
          <div className="grid md:grid-cols-4 gap-4">
            {userScore.badges.length === 0 ? (
              <Card className="col-span-4 text-center py-12">
                <CardContent>
                  <Award className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-xl font-semibold mb-2">{t("noBadgesYet")}</h3>
                  <p className="text-gray-600">
                    {t("completeActivitiesForBadge")}
                  </p>
                </CardContent>
              </Card>
            ) : (
              userScore.badges.map((badge) => (
                <Card key={badge.badgeId} className="text-center">
                  <CardContent className="pt-6">
                    <div className="text-6xl mb-3">{badge.badgeIcon}</div>
                    <h3 className="font-bold mb-1">{badge.badgeName}</h3>
                    <p className="text-sm text-gray-600 mb-2">{badge.badgeDescription}</p>
                    <Badge variant="outline" className="text-xs">
                      {badge.category}
                    </Badge>
                    <p className="text-xs text-gray-500 mt-2">
                      {t("earned")} {new Date(badge.earnedDate).toLocaleDateString('en-IN')}
                    </p>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="achievements" className="space-y-4">
          {achievementsList.map((achievement) => {
            const progress = userScore.achievements[achievement.id];
            const progressPercent = progress ? (progress.current / progress.target) * 100 : 0;
            
            return (
              <Card key={achievement.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="text-5xl">{achievement.icon}</div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h3 className="font-bold">{t(achievement.titleKey)}</h3>
                          <p className="text-sm text-gray-600">{t(achievement.descriptionKey)}</p>
                        </div>
                        <Badge variant="outline">{achievement.category}</Badge>
                      </div>
                      {progress && (
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>{t("progress")}</span>
                            <span>{progress.current} / {progress.target}</span>
                          </div>
                          <Progress value={progressPercent} className="h-2" />
                          {progress.completed && (
                            <Badge className="mt-2 bg-green-600">{t("completed")}!</Badge>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>

        <TabsContent value="leaderboard">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Medal className="h-5 w-5 text-yellow-600" />
                {t("topFarmers")}
              </CardTitle>
              <CardDescription>{t("seeHowYouCompare")}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {leaderboard.map((entry) => (
                  <div
                    key={entry.rank}
                    className={`flex items-center gap-4 p-4 rounded-lg ${
                      entry.rank <= 3
                        ? 'bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200'
                        : 'bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div className="text-2xl font-bold text-gray-400 w-8">
                        {entry.rank <= 3 ? (
                          <span>
                            {entry.rank === 1 && '🥇'}
                            {entry.rank === 2 && '🥈'}
                            {entry.rank === 3 && '🥉'}
                          </span>
                        ) : (
                          `#${entry.rank}`
                        )}
                      </div>
                      <Avatar>
                        <AvatarFallback>
                          {entry.userName.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold">{entry.userName}</p>
                        <p className="text-sm text-gray-600">{entry.state}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-green-600">{entry.totalPoints} XP</p>
                      <p className="text-xs text-gray-600">
                        Level {entry.level} • {entry.badgeCount} badges
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity">
          <Card>
            <CardHeader>
              <CardTitle>{t("recentActivity")}</CardTitle>
              <CardDescription>{t("latestAchievementsPoints")}</CardDescription>
            </CardHeader>
            <CardContent>
              {userScore.recentActivities.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  {t("noRecentActivity")}
                </div>
              ) : (
                <div className="space-y-3">
                  {userScore.recentActivities.map((activity, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div>
                        <p className="font-medium">{activity.description}</p>
                        <p className="text-xs text-gray-600">
                          {new Date(activity.date).toLocaleString('en-IN')}
                        </p>
                      </div>
                      <Badge className="bg-green-600">+{activity.points} XP</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      </div>
    </DashboardLayout>
  );
}

