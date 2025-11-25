'use client';

import { useState, useEffect, useCallback } from 'react';
import { Newspaper, TrendingUp, Bell, Eye, ThumbsUp, Filter, Calendar, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { DashboardLayout } from '@/components/dashboard-layout';
import { useLanguage } from '@/lib/i18n/LanguageContext';

interface AgriNews {
  _id: string;
  title: string;
  content: string;
  category: string;
  subCategory?: string;
  relevantStates: string[];
  relevantCrops: string[];
  imageUrl?: string;
  videoUrl?: string;
  source: {
    name: string;
    url?: string;
    type: string;
  };
  publishDate: string;
  priority: string;
  tags: string[];
  views: number;
  likes: string[];
  active: boolean;
}

const categoryIcons: { [key: string]: any } = {
  weather: '🌤️',
  market: '💰',
  'pest-alert': '🐛',
  government: '🏛️',
  'crop-advisory': '🌾',
  technology: '💻',
  general: '📰'
};

const categoryColors: { [key: string]: string } = {
  weather: 'bg-blue-100 text-blue-800',
  market: 'bg-green-100 text-green-800',
  'pest-alert': 'bg-red-100 text-red-800',
  government: 'bg-purple-100 text-purple-800',
  'crop-advisory': 'bg-yellow-100 text-yellow-800',
  technology: 'bg-cyan-100 text-cyan-800',
  general: 'bg-gray-100 text-gray-800'
};

const priorityColors: { [key: string]: string } = {
  critical: 'bg-red-600 text-white',
  high: 'bg-orange-600 text-white',
  medium: 'bg-blue-600 text-white',
  low: 'bg-gray-600 text-white'
};

export default function AgriNewsPage() {
  const { t } = useLanguage();
  const [news, setNews] = useState<AgriNews[]>([]);
  const [trendingNews, setTrendingNews] = useState<AgriNews[]>([]);
  const [selectedNews, setSelectedNews] = useState<AgriNews | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [activeTab, setActiveTab] = useState('feed');
  const { toast } = useToast();

  const fetchNewsFeed = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      let url = 'http://localhost:5000/api/news/feed?';
      if (selectedCategory !== 'all') url += `category=${selectedCategory}`;
      
      console.log('📰 Fetching news from:', url);
      const response = await fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('📰 News response:', { 
          success: data.success, 
          newsCount: data.news?.length || 0,
          totalNews: data.totalNews || 0
        });
        setNews(data.news || []);
      } else if (response.status === 401) {
        // Token expired - try public endpoint
        console.log('🔄 Token expired, trying public endpoint...');
        const publicUrl = `http://localhost:5000/api/news/all?${selectedCategory !== 'all' ? `category=${selectedCategory}` : ''}`;
        const publicResponse = await fetch(publicUrl);
        if (publicResponse.ok) {
          const publicData = await publicResponse.json();
          console.log('📰 Public news response:', { newsCount: publicData.news?.length || 0 });
          setNews(publicData.news || []);
        } else {
          throw new Error('Failed to fetch news');
        }
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('❌ News fetch failed:', response.status, errorData);
        toast({
          title: 'Error',
          description: errorData.error || 'Failed to fetch news',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('❌ Error fetching news feed:', error);
      toast({
        title: 'Error',
        description: 'Failed to load news. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchTrendingNews = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/news/trending');
      
      if (response.ok) {
        const data = await response.json();
        setTrendingNews(data.news);
      }
    } catch (error) {
      console.error('Error fetching trending news:', error);
    } finally {
      setLoading(false);
    }
  };

  const viewNews = async (newsItem: AgriNews) => {
    setSelectedNews(newsItem);
    
    // Log activity for gamification
    try {
      const token = localStorage.getItem('token');
      await fetch('http://localhost:5000/api/gamification/log-activity', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          activityType: 'news_read',
          description: 'Read agriculture news'
        })
      });
    } catch (error) {
      console.error('Error logging activity:', error);
    }
  };

  const likeNews = async (newsId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/news/${newsId}/like`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.ok) {
        // Refresh news
        if (activeTab === 'feed') {
          fetchNewsFeed();
        } else {
          fetchTrendingNews();
        }
        
        if (selectedNews && selectedNews._id === newsId) {
          const updatedNews = await fetch(`http://localhost:5000/api/news/${newsId}`);
          const data = await updatedNews.json();
          setSelectedNews(data.news);
        }
      }
    } catch (error) {
      console.error('Error liking news:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString('en-IN');
  };

  const refreshNews = async (force = false) => {
    try {
      setRefreshing(true);
      const now = Date.now();
      
      // Check if we need to refresh (only refresh if last refresh was > 1 hour ago or forced)
      if (!force) {
        const lastRefresh = localStorage.getItem('lastNewsRefresh');
        const oneHour = 60 * 60 * 1000; // 1 hour in milliseconds
        
        if (lastRefresh && (now - parseInt(lastRefresh)) < oneHour) {
          console.log('⏭️  Skipping refresh - last refresh was less than 1 hour ago');
          setRefreshing(false);
          // Just fetch existing news
          if (activeTab === 'feed') {
            await fetchNewsFeed();
          } else if (activeTab === 'trending') {
            await fetchTrendingNews();
          }
          return;
        }
      }
      
      console.log('🔄 Refreshing news from external sources...');
      const response = await fetch('http://localhost:5000/api/news/admin/refresh-all');
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ News refreshed:', {
          saved: data.savedCount,
          sources: data.sources,
          stats: data.databaseStats
        });
        
        // Update last refresh time
        localStorage.setItem('lastNewsRefresh', now.toString());
        
        // Show toast notification
        if (data.savedCount > 0) {
          toast({
            title: 'News Updated',
            description: `Fetched ${data.savedCount} new articles from ${data.sources.rss + data.sources.newsapi} sources`,
          });
        }
        
        // After refresh, fetch the news feed
        if (activeTab === 'feed') {
          await fetchNewsFeed();
        } else if (activeTab === 'trending') {
          await fetchTrendingNews();
        }
      } else {
        console.warn('⚠️ News refresh failed, using existing news');
        // Still try to fetch existing news
        if (activeTab === 'feed') {
          await fetchNewsFeed();
        } else if (activeTab === 'trending') {
          await fetchTrendingNews();
        }
      }
    } catch (error) {
      console.error('❌ Error refreshing news:', error);
      // Still try to fetch existing news
      if (activeTab === 'feed') {
        await fetchNewsFeed();
      } else if (activeTab === 'trending') {
        await fetchTrendingNews();
      }
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    // Auto-refresh news when page loads
    refreshNews();
  }, []);

  useEffect(() => {
    if (activeTab === 'feed') {
      fetchNewsFeed();
    } else if (activeTab === 'trending') {
      fetchTrendingNews();
    }
  }, [activeTab, selectedCategory]);

  const NewsCard = ({ newsItem }: { newsItem: AgriNews }) => (
    <Card
      className="hover:shadow-lg transition-shadow cursor-pointer"
      onClick={() => viewNews(newsItem)}
    >
      {newsItem.imageUrl && (
        <div className="w-full h-48 overflow-hidden">
          <img
            src={newsItem.imageUrl}
            alt={newsItem.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      <CardHeader>
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex flex-wrap gap-2">
            <Badge className={categoryColors[newsItem.category]}>
              {categoryIcons[newsItem.category]} {newsItem.category}
            </Badge>
            {newsItem.priority !== 'low' && (
              <Badge className={priorityColors[newsItem.priority]}>
                {newsItem.priority}
              </Badge>
            )}
          </div>
        </div>
        <CardTitle className="text-lg">{newsItem.title}</CardTitle>
        <CardDescription className="line-clamp-2">{newsItem.content}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <Eye className="h-4 w-4" />
              <span>{newsItem.views}</span>
            </div>
            <div className="flex items-center gap-1">
              <ThumbsUp className="h-4 w-4" />
              <span>{newsItem.likes.length}</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span>{formatDate(newsItem.publishDate)}</span>
            </div>
          </div>
          <span className="text-xs">{newsItem.source?.name || 'Unknown Source'}</span>
        </div>
        {newsItem.tags && newsItem.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {newsItem.tags.slice(0, 3).map((tag, idx) => (
              <Badge key={idx} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <DashboardLayout>
      <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <div className="p-2 rounded-full bg-cyan-500">
            <Newspaper className="h-8 w-8 text-white" />
          </div>
          {t("agricultureNews")}
        </h1>
        <p className="text-gray-600 mt-1">
          {t("stayUpdatedLatest")}
        </p>
      </div>

      <div className="flex justify-between items-center">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex justify-between items-center mb-4">
            <TabsList>
              <TabsTrigger value="feed">
                <Bell className="h-4 w-4 mr-2" />
                {t("yourFeed")}
              </TabsTrigger>
              <TabsTrigger value="trending">
                <TrendingUp className="h-4 w-4 mr-2" />
                {t("trending")}
              </TabsTrigger>
            </TabsList>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  refreshNews(true); // Force refresh
                }}
                disabled={refreshing || loading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? t("refreshing") : t("refresh")}
              </Button>
              
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder={t("category")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("allCategories")}</SelectItem>
                <SelectItem value="weather">{t("weather")}</SelectItem>
                <SelectItem value="market">{t("marketPrices")}</SelectItem>
                <SelectItem value="pest-alert">Pest Alerts</SelectItem>
                <SelectItem value="government">Government</SelectItem>
                <SelectItem value="crop-advisory">{t("cropAdvisory")}</SelectItem>
                <SelectItem value="technology">Technology</SelectItem>
                <SelectItem value="general">{t("general")}</SelectItem>
              </SelectContent>
            </Select>
            </div>
          </div>

          <TabsContent value="feed" className="space-y-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
              </div>
            ) : news.length === 0 ? (
              <Card className="text-center py-12">
                <CardContent>
                  <Newspaper className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-xl font-semibold mb-2">{t("noNewsAvailable")}</h3>
                  <p className="text-gray-600">
                    {t("checkBackLater")}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {news.map((newsItem) => (
                  <NewsCard key={newsItem._id} newsItem={newsItem} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="trending" className="space-y-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
              </div>
            ) : trendingNews.length === 0 ? (
              <Card className="text-center py-12">
                <CardContent>
                  <TrendingUp className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-xl font-semibold mb-2">{t("noTrendingNews")}</h3>
                  <p className="text-gray-600">
                    {t("noTrendingArticles")}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {trendingNews.map((newsItem) => (
                  <NewsCard key={newsItem._id} newsItem={newsItem} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* News Detail Dialog */}
      {selectedNews && (
        <Dialog open={!!selectedNews} onOpenChange={() => setSelectedNews(null)}>
          <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <div className="flex items-start gap-2 mb-2">
                <Badge className={categoryColors[selectedNews.category]}>
                  {categoryIcons[selectedNews.category]} {selectedNews.category}
                </Badge>
                {selectedNews.priority !== 'low' && (
                  <Badge className={priorityColors[selectedNews.priority]}>
                    {selectedNews.priority}
                  </Badge>
                )}
              </div>
              <DialogTitle className="text-2xl">{selectedNews.title}</DialogTitle>
              <DialogDescription className="flex items-center gap-2 text-sm">
                <span>{selectedNews.source.name}</span>
                <span>•</span>
                <span>{formatDate(selectedNews.publishDate)}</span>
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              {selectedNews.imageUrl && (
                <img
                  src={selectedNews.imageUrl}
                  alt={selectedNews.title}
                  className="w-full rounded-lg"
                />
              )}
              
              <div className="prose max-w-none">
                <p className="text-gray-700 whitespace-pre-wrap">{selectedNews.content}</p>
              </div>
              
              {selectedNews.tags && selectedNews.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {selectedNews.tags.map((tag, idx) => (
                    <Badge key={idx} variant="outline">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
              
              <div className="flex items-center justify-between pt-4 border-t">
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <Eye className="h-4 w-4" />
                    <span>{selectedNews.views} {t("views")}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <ThumbsUp className="h-4 w-4" />
                    <span>{selectedNews.likes.length} {t("likes")}</span>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => likeNews(selectedNews._id)}
                  >
                    <ThumbsUp className="h-4 w-4 mr-2" />
                    {t("like")}
                  </Button>
                  {selectedNews.source.url && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(selectedNews.source.url, '_blank')}
                    >
                      {t("readMore")}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
      </div>
    </DashboardLayout>
  );
}

