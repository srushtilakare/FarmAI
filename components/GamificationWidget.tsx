'use client';

import { useState, useEffect } from 'react';
import { Trophy, Star, TrendingUp, Award, Target } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

interface UserScore {
  totalPoints: number;
  level: number;
  levelName: string;
  stats: {
    totalLogins: number;
    tasksCompleted: number;
    diseaseUploads: number;
    soilReportsUploaded: number;
    weatherChecks: number;
    forumPosts: number;
    forumReplies: number;
  };
  badges: Array<{
    badgeId: string;
    badgeName: string;
    badgeDescription: string;
    badgeIcon: string;
    earnedDate: string;
  }>;
  streaks: {
    currentLoginStreak: number;
    longestLoginStreak: number;
  };
  achievements: {
    [key: string]: {
      current: number;
      target: number;
      completed: boolean;
    };
  };
}

export default function GamificationWidget() {
  const [userScore, setUserScore] = useState<UserScore | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchUserScore();
  }, []);

  const fetchUserScore = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/gamification/my-score', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setUserScore(data.score);
      }
    } catch (error) {
      console.error('Error fetching user score:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !userScore) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const nextLevelPoints = (userScore.level + 1) * 300; // Simplified calculation
  const progressToNextLevel = (userScore.totalPoints % 300) / 3; // Progress percentage

  return (
    <Card className="bg-gradient-to-br from-green-50 to-blue-50">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-600" />
              Your Progress
            </CardTitle>
            <CardDescription>Keep farming, keep earning!</CardDescription>
          </div>
          <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white">
            Level {userScore.level}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Level Progress */}
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="font-medium">{userScore.levelName}</span>
            <span className="text-gray-600">{userScore.totalPoints} XP</span>
          </div>
          <Progress value={progressToNextLevel} className="h-2" />
          <p className="text-xs text-gray-500 mt-1">
            {Math.max(0, nextLevelPoints - userScore.totalPoints)} XP to next level
          </p>
        </div>

        {/* Login Streak */}
        {userScore.streaks.currentLoginStreak > 0 && (
          <div className="flex items-center gap-2 p-3 bg-white rounded-lg">
            <div className="p-2 bg-orange-100 rounded-full">
              <Star className="h-4 w-4 text-orange-600" />
            </div>
            <div>
              <p className="text-sm font-medium">🔥 {userScore.streaks.currentLoginStreak} Day Streak!</p>
              <p className="text-xs text-gray-600">Keep it up!</p>
            </div>
          </div>
        )}

        {/* Recent Badges */}
        {userScore.badges.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold mb-2 flex items-center gap-1">
              <Award className="h-4 w-4" />
              Recent Badges
            </h4>
            <div className="flex gap-2 overflow-x-auto">
              {userScore.badges.slice(0, 4).map((badge) => (
                <div
                  key={badge.badgeId}
                  className="flex-shrink-0 p-2 bg-white rounded-lg text-center min-w-[60px]"
                  title={badge.badgeDescription}
                >
                  <div className="text-2xl mb-1">{badge.badgeIcon}</div>
                  <p className="text-xs font-medium line-clamp-1">{badge.badgeName}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-2 pt-2 border-t">
          <div className="text-center">
            <p className="text-lg font-bold text-green-600">{userScore.stats.tasksCompleted}</p>
            <p className="text-xs text-gray-600">Tasks Done</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-blue-600">{userScore.stats.forumPosts + userScore.stats.forumReplies}</p>
            <p className="text-xs text-gray-600">Forum Activity</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-purple-600">{userScore.badges.length}</p>
            <p className="text-xs text-gray-600">Badges</p>
          </div>
        </div>

        <Button
          variant="outline"
          className="w-full"
          onClick={() => router.push('/dashboard/achievements')}
        >
          View All Achievements
        </Button>
      </CardContent>
    </Card>
  );
}

