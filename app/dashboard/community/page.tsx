'use client';

import { useState, useEffect } from 'react';
import { MessageSquare, Plus, ThumbsUp, Eye, Search, Filter, Send, Image as ImageIcon } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { DashboardLayout } from '@/components/dashboard-layout';
import { useLanguage } from '@/lib/i18n/LanguageContext';

interface ForumPost {
  _id: string;
  userName: string;
  userLocation: string;
  title: string;
  content: string;
  category: string;
  crop?: string;
  images: string[];
  upvotes: string[];
  replies?: ForumReply[];
  replyCount: number;
  views: number;
  status: string;
  tags: string[];
  createdAt: string;
}

interface ForumReply {
  _id: string;
  userName: string;
  content: string;
  upvotes: string[];
  images: string[];
  createdAt: string;
}

const getCategories = (t: any) => [
  { value: 'all', label: t('allCategories') },
  { value: 'pests', label: t('pestsDiseases') },
  { value: 'fertilizer', label: t('fertilizer') },
  { value: 'weather', label: t('weather') },
  { value: 'machinery', label: t('machinery') },
  { value: 'seeds', label: t('seeds') },
  { value: 'irrigation', label: t('irrigation') },
  { value: 'market', label: t('marketPrices') },
  { value: 'general', label: t('general') }
];

const categoryColors: { [key: string]: string } = {
  pests: 'bg-red-100 text-red-800',
  fertilizer: 'bg-yellow-100 text-yellow-800',
  weather: 'bg-blue-100 text-blue-800',
  machinery: 'bg-gray-100 text-gray-800',
  seeds: 'bg-green-100 text-green-800',
  irrigation: 'bg-cyan-100 text-cyan-800',
  market: 'bg-purple-100 text-purple-800',
  general: 'bg-orange-100 text-orange-800'
};

export default function CommunityForumPage() {
  const { t } = useLanguage();
  const categories = getCategories(t);
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [selectedPost, setSelectedPost] = useState<ForumPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [replyContent, setReplyContent] = useState('');
  const { toast } = useToast();

  // Form state
  const [newPost, setNewPost] = useState({
    title: '',
    content: '',
    category: 'general',
    crop: '',
    tags: ''
  });

  useEffect(() => {
    fetchPosts();
  }, [selectedCategory, searchQuery]);

  const fetchPosts = async () => {
    try {
      let url = 'http://localhost:5000/api/forum/posts?';
      if (selectedCategory !== 'all') url += `category=${selectedCategory}&`;
      if (searchQuery) url += `search=${searchQuery}&`;
      
      const response = await fetch(url);
      
      if (response.ok) {
        const data = await response.json();
        console.log('📊 Fetched posts with reply counts:', data.posts.map((p: ForumPost) => ({ 
          title: p.title, 
          replyCount: p.replyCount 
        })));
        setPosts(data.posts);
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const createPost = async () => {
    if (!newPost.title || !newPost.content) {
      toast({
        title: 'Missing Information',
        description: 'Please provide title and content',
        variant: 'destructive'
      });
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('title', newPost.title);
      formData.append('content', newPost.content);
      formData.append('category', newPost.category);
      if (newPost.crop) formData.append('crop', newPost.crop);
      if (newPost.tags) formData.append('tags', JSON.stringify(newPost.tags.split(',').map(t => t.trim())));

      const response = await fetch('http://localhost:5000/api/forum/posts', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });

      if (response.ok) {
        // Log gamification activity
        await fetch('http://localhost:5000/api/gamification/log-activity', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            activityType: 'forum_post',
            description: 'Created a forum post'
          })
        });

        toast({
          title: 'Success',
          description: 'Post created successfully!'
        });
        setIsCreateDialogOpen(false);
        setNewPost({ title: '', content: '', category: 'general', crop: '', tags: '' });
        fetchPosts();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create post',
        variant: 'destructive'
      });
    }
  };

  const upvotePost = async (postId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/forum/posts/${postId}/upvote`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.ok) {
        fetchPosts();
        if (selectedPost && selectedPost._id === postId) {
          fetchPostDetail(postId);
        }
      }
    } catch (error) {
      console.error('Error upvoting post:', error);
    }
  };

  const fetchPostDetail = async (postId: string) => {
    try {
      const response = await fetch(`http://localhost:5000/api/forum/posts/${postId}`);
      if (response.ok) {
        const data = await response.json();
        setSelectedPost(data.post);
      }
    } catch (error) {
      console.error('Error fetching post detail:', error);
    }
  };

  const addReply = async (postId: string) => {
    if (!replyContent.trim()) return;

    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('content', replyContent);

      const response = await fetch(`http://localhost:5000/api/forum/posts/${postId}/replies`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });

      if (response.ok) {
        // Log gamification activity
        await fetch('http://localhost:5000/api/gamification/log-activity', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            activityType: 'forum_reply',
            description: 'Replied to a forum post'
          })
        });

        toast({
          title: 'Success',
          description: 'Reply added successfully!'
        });
        setReplyContent('');
        await fetchPostDetail(postId);
        await fetchPosts(); // Refresh the post list to update reply count
        console.log('🔄 Posts refreshed after reply');
        fetchPosts();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to add reply',
        variant: 'destructive'
      });
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString('en-IN');
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <div className="p-2 rounded-full bg-indigo-500">
              <MessageSquare className="h-8 w-8 text-white" />
            </div>
            {t("farmerCommunityForum")}
          </h1>
          <p className="text-gray-600 mt-1">
            {t("connectLearnShare")}
          </p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-green-600 hover:bg-green-700">
              <Plus className="h-4 w-4 mr-2" />
              {t("askQuestion")}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>{t("askAQuestion")}</DialogTitle>
              <DialogDescription>
                {t("shareQuestionWithCommunity")}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">{t("title")}</Label>
                <Input
                  id="title"
                  placeholder={t("briefSummary")}
                  value={newPost.title}
                  onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">{t("category")}</Label>
                <Select
                  value={newPost.category}
                  onValueChange={(value) => setNewPost({ ...newPost, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("selectCategory")} />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.filter(c => c.value !== 'all').map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="content">{t("description")}</Label>
                <Textarea
                  id="content"
                  placeholder={t("describeQuestionDetail")}
                  rows={6}
                  value={newPost.content}
                  onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="crop">{t("relatedCropOptional")}</Label>
                <Input
                  id="crop"
                  placeholder={t("relatedCropPlaceholder")}
                  value={newPost.crop}
                  onChange={(e) => setNewPost({ ...newPost, crop: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tags">{t("tagsOptional")}</Label>
                <Input
                  id="tags"
                  placeholder={t("tagsPlaceholder")}
                  value={newPost.tags}
                  onChange={(e) => setNewPost({ ...newPost, tags: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={createPost} className="bg-green-600 hover:bg-green-700">
                {t("postQuestion")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4 flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <Input
                placeholder={t("searchQuestions")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder={t("category")} />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Posts List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        </div>
      ) : posts.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <MessageSquare className="h-16 w-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold mb-2">{t("noPostsFound")}</h3>
            <p className="text-gray-600 mb-4">
              {t("beFirstToAsk")}
            </p>
            <Button
              onClick={() => setIsCreateDialogOpen(true)}
              className="bg-green-600 hover:bg-green-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              {t("askQuestion")}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <Card
              key={post._id}
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => fetchPostDetail(post._id)}
            >
              <CardContent className="pt-6">
                <div className="flex gap-4">
                  <div className="flex flex-col items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        upvotePost(post._id);
                      }}
                      className="flex flex-col h-auto p-2"
                    >
                      <ThumbsUp className="h-5 w-5" />
                      <span className="text-sm font-semibold">{post.upvotes.length}</span>
                    </Button>
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-lg font-semibold">{post.title}</h3>
                      <Badge className={categoryColors[post.category] || 'bg-gray-100'}>
                        {categories.find(c => c.value === post.category)?.label}
                      </Badge>
                    </div>
                    
                    <p className="text-gray-600 mb-3 line-clamp-2">{post.content}</p>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback>
                            {post.userName.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span>{post.userName}</span>
                        {post.userLocation && <span>• {post.userLocation}</span>}
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <MessageSquare className="h-4 w-4" />
                        <span>{post.replyCount || 0} {t("replies")}</span>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <Eye className="h-4 w-4" />
                        <span>{post.views} {t("views")}</span>
                      </div>
                      
                      <span>{formatDate(post.createdAt)}</span>
                    </div>
                    
                    {post.tags && post.tags.length > 0 && (
                      <div className="flex gap-2 mt-2">
                        {post.tags.map((tag, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Post Detail Dialog */}
      {selectedPost && (
        <Dialog open={!!selectedPost} onOpenChange={() => {
          setSelectedPost(null);
          fetchPosts(); // Refresh post list when closing dialog to update counts
        }}>
          <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedPost.title}</DialogTitle>
              <DialogDescription>
                {t("postedBy")} {selectedPost.userName} • {formatDate(selectedPost.createdAt)}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <p className="text-gray-700 whitespace-pre-wrap">{selectedPost.content}</p>
              </div>
              
              {selectedPost.replies && selectedPost.replies.length > 0 && (
                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-3">{selectedPost.replies.length} {t("replies")}</h4>
                  <div className="space-y-3">
                    {selectedPost.replies.map((reply) => (
                      <div key={reply._id} className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback>
                              {reply.userName.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium text-sm">{reply.userName}</span>
                          <span className="text-xs text-gray-500">
                            {formatDate(reply.createdAt)}
                          </span>
                        </div>
                        <p className="text-gray-700 text-sm">{reply.content}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Button variant="ghost" size="sm" className="h-6 text-xs">
                            <ThumbsUp className="h-3 w-3 mr-1" />
                            {reply.upvotes.length}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="border-t pt-4">
                <Label htmlFor="reply">{t("yourReply")}</Label>
                <Textarea
                  id="reply"
                  placeholder={t("shareKnowledge")}
                  rows={4}
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  className="mt-2"
                />
                <Button
                  onClick={() => addReply(selectedPost._id)}
                  className="mt-2 bg-green-600 hover:bg-green-700"
                >
                  <Send className="h-4 w-4 mr-2" />
                  {t("postReply")}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
      </div>
    </DashboardLayout>
  );
}

