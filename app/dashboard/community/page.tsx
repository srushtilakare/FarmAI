'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  MessageSquare,
  Plus,
  ThumbsUp,
  Eye,
  Send,
  Image as ImageIcon,
  X,
  AlertTriangle,
  ShieldCheck,
  Clock,
  Ban,
  Search,
  SlidersHorizontal,
  TrendingUp,
  Users,
  Sparkles,
  ArrowUpRight,
  ChevronRight,
  MessageCircle,
  CheckCircle2,
  Filter,
  Leaf,
  Camera,
  Tag,
  Sprout,
  MoreHorizontal
} from 'lucide-react';

import {
  Card,
  CardContent
} from '@/components/ui/card';

import { Button } from '@/components/ui/button';

import { Badge } from '@/components/ui/badge';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';

import { Input } from '@/components/ui/input';

import { Label } from '@/components/ui/label';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';

import { Textarea } from '@/components/ui/textarea';

import {
  Avatar,
  AvatarFallback
} from '@/components/ui/avatar';

import { useToast } from '@/hooks/use-toast';

import { DashboardLayout } from '@/components/dashboard-layout';

import { useLanguage } from '@/lib/i18n/LanguageContext';


// =========================================================
// TYPES
// =========================================================

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

interface ForumStatus {
  forumStatus: 'active' | 'suspended' | 'banned';
  canParticipate: boolean;
  blocked: boolean;
  suspended: boolean;
  banned: boolean;
  warnings: number;
  blockedUntil: string | null;
  remainingMs: number;
  message: string;
}

interface ModerationResult {
  isAbusive: boolean;
  detectedWords: string[];
  severity: 'low' | 'medium' | 'high';
}


// =========================================================
// CONSTANTS
// =========================================================

const API_BASE_URL = 'http://localhost:5000';


// =========================================================
// CATEGORIES
// =========================================================

const getCategories = (t: any) => [
  {
    value: 'all',
    label: t('allCategories'),
    icon: MessageSquare
  },
  {
    value: 'pests',
    label: t('pestsDiseases'),
    icon: Leaf
  },
  {
    value: 'fertilizer',
    label: t('fertilizer'),
    icon: Sprout
  },
  {
    value: 'weather',
    label: t('weather'),
    icon: Sparkles
  },
  {
    value: 'machinery',
    label: t('machinery'),
    icon: SlidersHorizontal
  },
  {
    value: 'seeds',
    label: t('seeds'),
    icon: Sprout
  },
  {
    value: 'irrigation',
    label: t('irrigation'),
    icon: Leaf
  },
  {
    value: 'market',
    label: t('marketPrices'),
    icon: TrendingUp
  },
  {
    value: 'general',
    label: t('general'),
    icon: MessageSquare
  }
];

const categoryColors: {
  [key: string]: string
} = {
  pests:
    'bg-red-50 text-red-700 border-red-100',
  fertilizer:
    'bg-yellow-50 text-yellow-700 border-yellow-100',
  weather:
    'bg-blue-50 text-blue-700 border-blue-100',
  machinery:
    'bg-gray-50 text-gray-700 border-gray-100',
  seeds:
    'bg-emerald-50 text-emerald-700 border-emerald-100',
  irrigation:
    'bg-cyan-50 text-cyan-700 border-cyan-100',
  market:
    'bg-purple-50 text-purple-700 border-purple-100',
  general:
    'bg-orange-50 text-orange-700 border-orange-100'
};


// =========================================================
// MODERATION WORDS
// =========================================================

const abusiveWords = [
  'damn',
  'hell',
  'crap',
  'stupid',
  'idiot',
  'fool',
  'shit',
  'fuck',
  'bitch',
  'ass',
  'shut up',
  'you are wrong',
  'you dont know',
  'you are lying',
  'hate you',
  'kill yourself',
  'you should die',
  'buy now',
  'click here',
  'free money',
  'get rich quick'
];


// =========================================================
// TEXT NORMALIZATION
// =========================================================

function normalizeText(text: string): string {
  if (!text || typeof text !== 'string') {
    return '';
  }

  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}


// =========================================================
// REGEX ESCAPE
// =========================================================

function escapeRegex(text: string): string {
  return text.replace(
    /[.*+?^${}()|[\]\\]/g,
    '\\$&'
  );
}


// =========================================================
// FRONTEND MODERATION
// =========================================================

function checkContentModeration(
  content: string,
  title = ''
): ModerationResult {
  const fullText = normalizeText(
    `${title} ${content}`
  );

  if (!fullText) {
    return {
      isAbusive: false,
      detectedWords: [],
      severity: 'low'
    };
  }

  const detectedWords: string[] = [];

  abusiveWords.forEach((word) => {
    const normalizedWord =
      normalizeText(word);

    if (!normalizedWord) {
      return;
    }

    const regex = new RegExp(
      `\\b${escapeRegex(
        normalizedWord
      )}\\b`,
      'i'
    );

    if (regex.test(fullText)) {
      detectedWords.push(word);
    }
  });

  const uniqueWords = [
    ...new Set(detectedWords)
  ];

  return {
    isAbusive:
      uniqueWords.length > 0,
    detectedWords: uniqueWords,
    severity:
      uniqueWords.length > 2
        ? 'high'
        : uniqueWords.length > 0
        ? 'medium'
        : 'low'
  };
}


// =========================================================
// COMPONENT
// =========================================================

export default function CommunityForumPage() {
  const { t } = useLanguage();

  const categories =
    getCategories(t);

  const [posts, setPosts] =
    useState<ForumPost[]>([]);

  const [selectedPost, setSelectedPost] =
    useState<ForumPost | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [
    isCreateDialogOpen,
    setIsCreateDialogOpen
  ] = useState(false);

  const [
    selectedCategory,
    setSelectedCategory
  ] = useState('all');

  const [
    searchQuery,
    setSearchQuery
  ] = useState('');

  const [
    sortOption,
    setSortOption
  ] = useState('recent');

  const [
    replyContent,
    setReplyContent
  ] = useState('');

  const [
    postImages,
    setPostImages
  ] = useState<File[]>([]);

  const [
    replyImages,
    setReplyImages
  ] = useState<File[]>([]);

  const [
    forumStatus,
    setForumStatus
  ] = useState<ForumStatus | null>(
    null
  );

  const [
    statusLoading,
    setStatusLoading
  ] = useState(true);

  const [
    countdownNow,
    setCountdownNow
  ] = useState(Date.now());

  const [
    creatingPost,
    setCreatingPost
  ] = useState(false);

  const [
    addingReply,
    setAddingReply
  ] = useState(false);

  const [
    replyModeration,
    setReplyModeration
  ] = useState<ModerationResult>({
    isAbusive: false,
    detectedWords: [],
    severity: 'low'
  });

  const [
    postModeration,
    setPostModeration
  ] = useState<ModerationResult>({
    isAbusive: false,
    detectedWords: [],
    severity: 'low'
  });

  const { toast } =
    useToast();


  // =======================================================
  // FORM STATE
  // =======================================================

  const [newPost, setNewPost] =
    useState({
      title: '',
      content: '',
      category: 'general',
      crop: '',
      tags: ''
    });


  // =======================================================
  // FETCH POSTS
  // =======================================================

  useEffect(() => {
    fetchPosts();
  }, [
    selectedCategory,
    searchQuery,
    sortOption
  ]);


  // =======================================================
  // FETCH FORUM STATUS
  // =======================================================

  useEffect(() => {
    fetchForumStatus();
  }, []);


  // =======================================================
  // SUSPENSION COUNTDOWN TIMER
  // =======================================================

  useEffect(() => {
    if (
      !forumStatus?.suspended ||
      !forumStatus.blockedUntil
    ) {
      return;
    }

    const timer =
      setInterval(() => {
        setCountdownNow(
          Date.now()
        );
      }, 1000);

    return () =>
      clearInterval(timer);
  }, [
    forumStatus?.suspended,
    forumStatus?.blockedUntil
  ]);


  // =======================================================
  // AUTOMATIC STATUS REFRESH
  // =======================================================

  useEffect(() => {
    if (
      forumStatus?.suspended &&
      forumStatus.blockedUntil
    ) {
      const endTime =
        new Date(
          forumStatus.blockedUntil
        ).getTime();

      if (
        countdownNow >= endTime
      ) {
        fetchForumStatus();
      }
    }
  }, [
    countdownNow,
    forumStatus?.suspended,
    forumStatus?.blockedUntil
  ]);


  // =======================================================
  // FETCH FORUM STATUS
  // =======================================================

  const fetchForumStatus =
    async (): Promise<ForumStatus | null> => {
      try {
        setStatusLoading(true);

        const token =
          localStorage.getItem(
            'token'
          );

        if (!token) {
          setForumStatus(null);
          return null;
        }

        const response =
          await fetch(
            `${API_BASE_URL}/api/forum/status`,
            {
              headers: {
                Authorization:
                  `Bearer ${token}`
              }
            }
          );

        if (response.ok) {
          const data =
            await response.json();

          setForumStatus(data);

          return data;
        }

        return null;
      } catch (error) {
        console.error(
          'Error fetching forum status:',
          error
        );

        return null;
      } finally {
        setStatusLoading(false);
      }
    };


  // =======================================================
  // FETCH POSTS
  // =======================================================

  const fetchPosts =
    async () => {
      try {
        setLoading(true);

        let url =
          `${API_BASE_URL}/api/forum/posts?`;

        if (
          selectedCategory !==
          'all'
        ) {
          url +=
            `category=${encodeURIComponent(
              selectedCategory
            )}&`;
        }

        if (searchQuery.trim()) {
          url +=
            `search=${encodeURIComponent(
              searchQuery.trim()
            )}&`;
        }

        url +=
          `sort=${encodeURIComponent(
            sortOption
          )}`;

        const response =
          await fetch(url);

        if (response.ok) {
          const data =
            await response.json();

          setPosts(
            data.posts || []
          );
        }
      } catch (error) {
        console.error(
          'Error fetching posts:',
          error
        );

        toast({
          title: 'Error',
          description:
            'Failed to load community posts.',
          variant:
            'destructive'
        });
      } finally {
        setLoading(false);
      }
    };


  // =======================================================
  // CREATE POST
  // =======================================================

  const createPost =
    async () => {
      if (
        !newPost.title.trim() ||
        !newPost.content.trim() ||
        !newPost.category
      ) {
        toast({
          title:
            'Missing Information',
          description:
            'Please add a title, category and describe your question.',
          variant:
            'destructive'
        });

        return;
      }

      const moderation =
        checkContentModeration(
          newPost.content,
          newPost.title
        );

      if (
        moderation.isAbusive
      ) {
        setPostModeration(
          moderation
        );

        toast({
          title:
            '⚠️ Inappropriate Language',
          description:
            'Please remove the inappropriate language before posting.',
          variant:
            'destructive',
          duration: 6000
        });

        return;
      }

      const latestStatus =
        await fetchForumStatus();

      if (
        latestStatus &&
        !latestStatus.canParticipate
      ) {
        showForumRestrictionToast(
          latestStatus
        );

        return;
      }

      try {
        setCreatingPost(true);

        const token =
          localStorage.getItem(
            'token'
          );

        const formData =
          new FormData();

        formData.append(
          'title',
          newPost.title.trim()
        );

        formData.append(
          'content',
          newPost.content.trim()
        );

        formData.append(
          'category',
          newPost.category
        );

        if (
          newPost.crop.trim()
        ) {
          formData.append(
            'crop',
            newPost.crop.trim()
          );
        }

        if (
          newPost.tags.trim()
        ) {
          const tagsArray =
            newPost.tags
              .split(',')
              .map((tag) =>
                tag.trim()
              )
              .filter(
                (tag) =>
                  tag !== ''
              );

          formData.append(
            'tags',
            JSON.stringify(
              tagsArray
            )
          );
        }

        postImages.forEach(
          (image) => {
            formData.append(
              'images',
              image
            );
          }
        );

        const response =
          await fetch(
            `${API_BASE_URL}/api/forum/posts`,
            {
              method: 'POST',
              headers: {
                Authorization:
                  `Bearer ${token}`
              },
              body: formData
            }
          );

        let data: any = {};

        try {
          data =
            await response.json();
        } catch {
          data = {};
        }

        if (response.ok) {
          toast({
            title: 'Posted!',
            description:
              'Your question has been shared with the farming community.'
          });

          setIsCreateDialogOpen(
            false
          );

          resetPostForm();

          await fetchPosts();
          await fetchForumStatus();

          return;
        }

        if (data.warned) {
          const moderationResponse: ModerationResult =
            {
              isAbusive: true,
              detectedWords:
                data.detectedWords ||
                [],
              severity:
                'medium'
            };

          setPostModeration(
            moderationResponse
          );

          toast({
            title:
              '⚠️ Content Warning',
            description:
              data.error ||
              'Please revise your content.',
            variant:
              'destructive',
            duration: 7000
          });

          return;
        }

        if (
          data.suspended ||
          data.forumStatus ===
            'suspended'
        ) {
          await fetchForumStatus();

          setIsCreateDialogOpen(
            false
          );

          resetPostForm();

          toast({
            title:
              '⏳ Forum Suspended',
            description:
              data.error ||
              'Your forum posting access has been suspended for 7 days.',
            variant:
              'destructive',
            duration: 7000
          });

          return;
        }

        if (
          data.banned ||
          data.forumStatus ===
            'banned'
        ) {
          await fetchForumStatus();

          setIsCreateDialogOpen(
            false
          );

          resetPostForm();

          toast({
            title:
              '🚫 Forum Participation Blocked',
            description:
              data.error ||
              'You can still read the forum, but you can no longer create posts or comments.',
            variant:
              'destructive',
            duration: 8000
          });

          return;
        }

        toast({
          title: 'Error',
          description:
            data.error ||
            'Failed to create post.',
          variant:
            'destructive'
        });
      } catch (error) {
        console.error(
          'Error creating post:',
          error
        );

        toast({
          title: 'Error',
          description:
            'Something went wrong while creating the post.',
          variant:
            'destructive'
        });
      } finally {
        setCreatingPost(
          false
        );
      }
    };


  // =======================================================
  // RESET POST FORM
  // =======================================================

  const resetPostForm =
    () => {
      setNewPost({
        title: '',
        content: '',
        category: 'general',
        crop: '',
        tags: ''
      });

      setPostImages([]);

      setPostModeration({
        isAbusive: false,
        detectedWords: [],
        severity: 'low'
      });
    };


  // =======================================================
  // SHOW FORUM RESTRICTION
  // =======================================================

  const showForumRestrictionToast =
    (
      status: ForumStatus | null =
        forumStatus
    ) => {
      if (!status) {
        return;
      }

      if (
        status.forumStatus ===
        'banned'
      ) {
        toast({
          title:
            '🚫 Forum Participation Blocked',
          description:
            'You can still read posts and comments, but posting and commenting are permanently disabled because of repeated inappropriate-language violations.',
          variant:
            'destructive',
          duration: 8000
        });

        return;
      }

      if (
        status.forumStatus ===
        'suspended'
      ) {
        toast({
          title:
            '⏳ Forum Access Suspended',
          description:
            formatSuspensionMessage(
              status
            ),
          variant:
            'destructive',
          duration: 7000
        });
      }
    };


  // =======================================================
  // UPVOTE POST
  // =======================================================

  const upvotePost =
    async (
      postId: string
    ) => {
      try {
        const token =
          localStorage.getItem(
            'token'
          );

        const response =
          await fetch(
            `${API_BASE_URL}/api/forum/posts/${postId}/upvote`,
            {
              method: 'POST',
              headers: {
                Authorization:
                  `Bearer ${token}`
              }
            }
          );

        const data =
          await response.json();

        if (
          response.status ===
          403
        ) {
          handleForumRestrictionResponse(
            data
          );

          return;
        }

        if (response.ok) {
          await fetchPosts();

          if (
            selectedPost &&
            selectedPost._id ===
              postId
          ) {
            await fetchPostDetail(
              postId
            );
          }
        }
      } catch (error) {
        console.error(
          'Error upvoting post:',
          error
        );
      }
    };


  // =======================================================
  // FETCH POST DETAIL
  // =======================================================

  const fetchPostDetail =
    async (
      postId: string
    ) => {
      try {
        const response =
          await fetch(
            `${API_BASE_URL}/api/forum/posts/${postId}`
          );

        if (response.ok) {
          const data =
            await response.json();

          setSelectedPost(
            data.post
          );
        }
      } catch (error) {
        console.error(
          'Error fetching post detail:',
          error
        );
      }
    };


  // =======================================================
  // ADD REPLY
  // =======================================================

  const addReply =
    async (
      postId: string
    ) => {
      if (
        !replyContent.trim()
      ) {
        toast({
          title:
            'Empty Reply',
          description:
            'Please write something before posting your reply.',
          variant:
            'destructive'
        });

        return;
      }

      const moderation =
        checkContentModeration(
          replyContent
        );

      if (
        moderation.isAbusive
      ) {
        setReplyModeration(
          moderation
        );

        toast({
          title:
            '⚠️ Inappropriate Language',
          description:
            'Please remove the inappropriate language before posting your reply.',
          variant:
            'destructive',
          duration: 6000
        });

        return;
      }

      const latestStatus =
        await fetchForumStatus();

      if (
        latestStatus &&
        !latestStatus.canParticipate
      ) {
        showForumRestrictionToast(
          latestStatus
        );

        return;
      }

      try {
        setAddingReply(true);

        const token =
          localStorage.getItem(
            'token'
          );

        const formData =
          new FormData();

        formData.append(
          'content',
          replyContent.trim()
        );

        replyImages.forEach(
          (image) => {
            formData.append(
              'images',
              image
            );
          }
        );

        const response =
          await fetch(
            `${API_BASE_URL}/api/forum/posts/${postId}/replies`,
            {
              method: 'POST',
              headers: {
                Authorization:
                  `Bearer ${token}`
              },
              body: formData
            }
          );

        let data: any = {};

        try {
          data =
            await response.json();
        } catch {
          data = {};
        }

        if (response.ok) {
          await fetch(
            `${API_BASE_URL}/api/gamification/log-activity`,
            {
              method: 'POST',
              headers: {
                'Content-Type':
                  'application/json',
                Authorization:
                  `Bearer ${token}`
              },
              body: JSON.stringify({
                activityType:
                  'forum_reply',
                description:
                  'Replied to a forum post'
              })
            }
          );

          toast({
            title:
              'Reply posted!',
            description:
              'Your reply has been added to the discussion.'
          });

          setReplyContent(
            ''
          );

          setReplyImages([]);

          setReplyModeration({
            isAbusive:
              false,
            detectedWords:
              [],
            severity:
              'low'
          });

          await fetchPostDetail(
            postId
          );

          await fetchPosts();

          return;
        }

        if (data.warned) {
          setReplyModeration({
            isAbusive:
              true,
            detectedWords:
              data.detectedWords ||
              [],
            severity:
              'medium'
          });

          toast({
            title:
              '⚠️ Content Warning',
            description:
              data.error ||
              'Please revise your reply.',
            variant:
              'destructive',
            duration: 7000
          });

          return;
        }

        if (
          data.suspended ||
          data.forumStatus ===
            'suspended'
        ) {
          await fetchForumStatus();

          toast({
            title:
              '⏳ Forum Suspended',
            description:
              data.error ||
              'Your forum posting and commenting access has been suspended for 7 days.',
            variant:
              'destructive',
            duration: 7000
          });

          return;
        }

        if (
          data.banned ||
          data.forumStatus ===
            'banned'
        ) {
          await fetchForumStatus();

          toast({
            title:
              '🚫 Forum Participation Blocked',
            description:
              data.error ||
              'You can still read forum content, but posting and commenting are permanently disabled.',
            variant:
              'destructive',
            duration: 8000
          });

          return;
        }

        if (
          response.status ===
          403
        ) {
          handleForumRestrictionResponse(
            data
          );

          return;
        }

        toast({
          title: 'Error',
          description:
            data.error ||
            'Failed to add reply.',
          variant:
            'destructive'
        });
      } catch (error) {
        console.error(
          'Error adding reply:',
          error
        );

        toast({
          title: 'Error',
          description:
            'Failed to add reply. Please try again.',
          variant:
            'destructive'
        });
      } finally {
        setAddingReply(
          false
        );
      }
    };


  // =======================================================
  // REPLY UPVOTE
  // =======================================================

  const upvoteReply =
    async (
      postId: string,
      replyId: string
    ) => {
      try {
        const token =
          localStorage.getItem(
            'token'
          );

        const response =
          await fetch(
            `${API_BASE_URL}/api/forum/posts/${postId}/replies/${replyId}/upvote`,
            {
              method: 'POST',
              headers: {
                Authorization:
                  `Bearer ${token}`
              }
            }
          );

        const data =
          await response.json();

        if (
          response.status ===
          403
        ) {
          handleForumRestrictionResponse(
            data
          );

          return;
        }

        if (response.ok) {
          await fetchPostDetail(
            postId
          );
        }
      } catch (error) {
        console.error(
          'Error upvoting reply:',
          error
        );
      }
    };


  // =======================================================
  // HANDLE RESTRICTION RESPONSE
  // =======================================================

  const handleForumRestrictionResponse =
    (data: any) => {
      if (
        data?.banned ||
        data?.forumStatus ===
          'banned'
      ) {
        toast({
          title:
            '🚫 Forum Participation Blocked',
          description:
            data.error ||
            'You are permanently blocked from posting and commenting in the forum.',
          variant:
            'destructive',
          duration: 8000
        });

        fetchForumStatus();

        return;
      }

      if (
        data?.suspended ||
        data?.forumStatus ===
          'suspended'
      ) {
        toast({
          title:
            '⏳ Forum Access Suspended',
          description:
            data.error ||
            'Your forum participation is temporarily suspended.',
          variant:
            'destructive',
          duration: 7000
        });

        fetchForumStatus();

        return;
      }

      if (data?.blocked) {
        toast({
          title:
            'Forum Access Restricted',
          description:
            data.error ||
            'You cannot perform this action right now.',
          variant:
            'destructive',
          duration: 6000
        });

        fetchForumStatus();
      }
    };


  // =======================================================
  // FORMAT DATE
  // =======================================================

  const formatDate =
    (
      dateString: string
    ) => {
      const date =
        new Date(dateString);

      if (
        Number.isNaN(
          date.getTime()
        )
      ) {
        return 'Unknown date';
      }

      return date.toLocaleString(
        'en-IN',
        {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        }
      );
    };


  // =======================================================
  // RELATIVE DATE
  // =======================================================

  const formatRelativeDate =
    (
      dateString: string
    ) => {
      const date =
        new Date(dateString);

      if (
        Number.isNaN(
          date.getTime()
        )
      ) {
        return '';
      }

      const now =
        new Date();

      const diffMs =
        now.getTime() -
        date.getTime();

      const diffSeconds =
        Math.floor(
          diffMs / 1000
        );

      const diffMinutes =
        Math.floor(
          diffSeconds / 60
        );

      const diffHours =
        Math.floor(
          diffMinutes / 60
        );

      const diffDays =
        Math.floor(
          diffHours / 24
        );

      if (
        diffSeconds < 60
      ) {
        return 'Just now';
      }

      if (
        diffMinutes < 60
      ) {
        return `${diffMinutes} minute${
          diffMinutes !== 1
            ? 's'
            : ''
        } ago`;
      }

      if (
        diffHours < 24
      ) {
        return `${diffHours} hour${
          diffHours !== 1
            ? 's'
            : ''
        } ago`;
      }

      if (
        diffDays < 7
      ) {
        return `${diffDays} day${
          diffDays !== 1
            ? 's'
            : ''
        } ago`;
      }

      return formatDate(
        dateString
      );
    };


  // =======================================================
  // SUSPENSION COUNTDOWN
  // =======================================================

  const getCountdown =
    (
      blockedUntil:
        string | null
    ) => {
      if (!blockedUntil) {
        return null;
      }

      const end =
        new Date(
          blockedUntil
        ).getTime();

      const difference =
        Math.max(
          0,
          end -
            countdownNow
        );

      const totalSeconds =
        Math.floor(
          difference / 1000
        );

      const days =
        Math.floor(
          totalSeconds /
            86400
        );

      const hours =
        Math.floor(
          (totalSeconds %
            86400) /
            3600
        );

      const minutes =
        Math.floor(
          (totalSeconds %
            3600) /
            60
        );

      const seconds =
        totalSeconds %
        60;

      return {
        days,
        hours,
        minutes,
        seconds,
        totalMs:
          difference
      };
    };


  // =======================================================
  // SUSPENSION MESSAGE
  // =======================================================

  const formatSuspensionMessage =
    (
      status: ForumStatus | null =
        forumStatus
    ) => {
      if (
        !status?.blockedUntil
      ) {
        return 'Your forum participation is temporarily suspended.';
      }

      const countdown =
        getCountdown(
          status.blockedUntil
        );

      if (
        !countdown ||
        countdown.totalMs <=
          0
      ) {
        return 'Your suspension has ended. Please refresh your forum access.';
      }

      return (
        `Posting and commenting are disabled. ` +
        `You can participate again in ` +
        `${countdown.days}d ` +
        `${countdown.hours}h ` +
        `${countdown.minutes}m.`
      );
    };


  // =======================================================
  // IMAGE URL HELPER
  // =======================================================

  const getImageUrl =
    (
      imageUrl: string
    ) => {
      if (!imageUrl) {
        return '';
      }

      if (
        imageUrl.startsWith(
          'http://'
        ) ||
        imageUrl.startsWith(
          'https://'
        )
      ) {
        return imageUrl;
      }

      if (
        imageUrl.startsWith('/')
      ) {
        return `${API_BASE_URL}${imageUrl}`;
      }

      return `${API_BASE_URL}/${imageUrl}`;
    };


  // =======================================================
  // IMAGE SELECT
  // =======================================================

  const handlePostImageSelect =
    (
      e: React.ChangeEvent<HTMLInputElement>
    ) => {
      const files =
        e.target.files;

      if (!files) {
        return;
      }

      const availableSlots =
        3 -
        postImages.length;

      const selectedFiles =
        Array.from(files).slice(
          0,
          availableSlots
        );

      const validImages =
        selectedFiles.filter(
          (file) => {
            if (
              !file.type.startsWith(
                'image/'
              )
            ) {
              toast({
                title:
                  'Invalid File',
                description:
                  `${file.name} is not an image file.`,
                variant:
                  'destructive'
              });

              return false;
            }

            if (
              file.size >
              5 *
                1024 *
                1024
            ) {
              toast({
                title:
                  'File Too Large',
                description:
                  `${file.name} is larger than 5MB.`,
                variant:
                  'destructive'
              });

              return false;
            }

            return true;
          }
        );

      setPostImages([
        ...postImages,
        ...validImages
      ]);

      e.target.value = '';
    };


  const handleReplyImageSelect =
    (
      e: React.ChangeEvent<HTMLInputElement>
    ) => {
      const files =
        e.target.files;

      if (!files) {
        return;
      }

      const availableSlots =
        2 -
        replyImages.length;

      const selectedFiles =
        Array.from(files).slice(
          0,
          availableSlots
        );

      const validImages =
        selectedFiles.filter(
          (file) => {
            if (
              !file.type.startsWith(
                'image/'
              )
            ) {
              toast({
                title:
                  'Invalid File',
                description:
                  `${file.name} is not an image file.`,
                variant:
                  'destructive'
              });

              return false;
            }

            if (
              file.size >
              5 *
                1024 *
                1024
            ) {
              toast({
                title:
                  'File Too Large',
                description:
                  `${file.name} is larger than 5MB.`,
                variant:
                  'destructive'
              });

              return false;
            }

            return true;
          }
        );

      setReplyImages([
        ...replyImages,
        ...validImages
      ]);

      e.target.value = '';
    };


  // =======================================================
  // REMOVE IMAGES
  // =======================================================

  const removePostImage =
    (index: number) => {
      setPostImages(
        postImages.filter(
          (_, i) =>
            i !== index
        )
      );
    };

  const removeReplyImage =
    (index: number) => {
      setReplyImages(
        replyImages.filter(
          (_, i) =>
            i !== index
        )
      );
    };


  // =======================================================
  // MODERATION STATE
  // =======================================================

  const handlePostContentChange =
    (
      value: string
    ) => {
      setNewPost({
        ...newPost,
        content: value
      });

      const moderation =
        checkContentModeration(
          value,
          newPost.title
        );

      setPostModeration(
        moderation
      );
    };


  const handlePostTitleChange =
    (
      value: string
    ) => {
      setNewPost({
        ...newPost,
        title: value
      });

      const moderation =
        checkContentModeration(
          newPost.content,
          value
        );

      setPostModeration(
        moderation
      );
    };


  const handleReplyContentChange =
    (
      value: string
    ) => {
      setReplyContent(
        value
      );

      const moderation =
        checkContentModeration(
          value
        );

      setReplyModeration(
        moderation
      );
    };


  // =======================================================
  // CATEGORY HELPER
  // =======================================================

  const getCategoryLabel =
    (category: string) =>
      categories.find(
        (item) =>
          item.value ===
          category
      )?.label ||
      category;


  // =======================================================
  // TRENDING POSTS
  // =======================================================

  const trendingPosts =
    useMemo(() => {
      return [...posts]
        .sort(
          (a, b) =>
            (
              (b.upvotes
                ?.length ||
                0) +
              (b.replyCount ||
                0) * 2 +
              (b.views || 0) *
                0.1
            ) -
            (
              (a.upvotes
                ?.length ||
                0) +
              (a.replyCount ||
                0) * 2 +
              (a.views || 0) *
                0.1
            )
        )
        .slice(0, 3);
    }, [posts]);


  // =======================================================
  // STATUS BANNER
  // =======================================================

  const statusBanner =
    useMemo(() => {
      if (
        statusLoading ||
        !forumStatus
      ) {
        return null;
      }

      if (
        forumStatus.forumStatus ===
        'banned'
      ) {
        return (
          <Card className="border-red-200 bg-red-50/80 shadow-none">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="rounded-full bg-red-100 p-2">
                  <Ban className="h-5 w-5 text-red-600" />
                </div>

                <div className="flex-1">
                  <h3 className="font-semibold text-red-800">
                    Forum participation is blocked
                  </h3>

                  <p className="text-sm text-red-700 mt-1 leading-relaxed">
                    You can still read
                    discussions, view
                    comments and images,
                    but posting and
                    commenting are
                    permanently disabled.
                  </p>

                  <div className="mt-2 text-xs font-medium text-red-600">
                    Recorded violations:{' '}
                    {
                      forumStatus.warnings
                    }
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      }

      if (
        forumStatus.forumStatus ===
        'suspended'
      ) {
        const countdown =
          getCountdown(
            forumStatus.blockedUntil
          );

        return (
          <Card className="border-orange-200 bg-orange-50/80 shadow-none">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="rounded-full bg-orange-100 p-2">
                  <Clock className="h-5 w-5 text-orange-600" />
                </div>

                <div className="flex-1">
                  <h3 className="font-semibold text-orange-800">
                    Forum access temporarily suspended
                  </h3>

                  <p className="text-sm text-orange-700 mt-1">
                    You can continue reading
                    the community while
                    posting and commenting
                    are temporarily disabled.
                  </p>

                  {countdown &&
                    countdown.totalMs >
                      0 && (
                      <div className="mt-3">
                        <div className="text-xs font-semibold uppercase tracking-wide text-orange-700">
                          Time remaining
                        </div>

                        <div className="flex gap-2 mt-2 flex-wrap">
                          <div className="rounded-lg border border-orange-200 bg-white px-3 py-2 text-center">
                            <div className="text-lg font-bold text-orange-800">
                              {
                                countdown.days
                              }
                            </div>
                            <div className="text-[10px] uppercase text-orange-600">
                              Days
                            </div>
                          </div>

                          <div className="rounded-lg border border-orange-200 bg-white px-3 py-2 text-center">
                            <div className="text-lg font-bold text-orange-800">
                              {
                                countdown.hours
                              }
                            </div>
                            <div className="text-[10px] uppercase text-orange-600">
                              Hours
                            </div>
                          </div>

                          <div className="rounded-lg border border-orange-200 bg-white px-3 py-2 text-center">
                            <div className="text-lg font-bold text-orange-800">
                              {
                                countdown.minutes
                              }
                            </div>
                            <div className="text-[10px] uppercase text-orange-600">
                              Min
                            </div>
                          </div>

                          <div className="rounded-lg border border-orange-200 bg-white px-3 py-2 text-center">
                            <div className="text-lg font-bold text-orange-800">
                              {
                                countdown.seconds
                              }
                            </div>
                            <div className="text-[10px] uppercase text-orange-600">
                              Sec
                            </div>
                          </div>
                        </div>

                        <p className="text-xs text-orange-700 mt-2">
                          Access will be restored on{' '}
                          {formatDate(
                            forumStatus.blockedUntil!
                          )}
                        </p>
                      </div>
                    )}

                  <div className="mt-2 text-xs text-orange-600">
                    Recorded violations:{' '}
                    {
                      forumStatus.warnings
                    }
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      }

      return (
        <Card className="border-emerald-200 bg-emerald-50/70 shadow-none">
          <CardContent className="p-3">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-emerald-100 p-2">
                <ShieldCheck className="h-5 w-5 text-emerald-600" />
              </div>

              <div className="flex-1">
                <p className="text-sm text-emerald-800">
                  <strong>
                    Community access is active
                  </strong>{' '}
                  — Share your farming
                  experience, ask questions,
                  and help other farmers.
                </p>
              </div>

              {forumStatus.warnings >
                0 && (
                <Badge
                  variant="outline"
                  className="border-emerald-200 text-emerald-700"
                >
                  Warnings:{' '}
                  {
                    forumStatus.warnings
                  }
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      );
    }, [
      forumStatus,
      statusLoading,
      countdownNow
    ]);


  // =======================================================
  // RENDER
  // =======================================================

  return (
    <DashboardLayout>
      <div className="min-h-full bg-gradient-to-b from-emerald-50/40 via-white to-white">

        <div className="container mx-auto max-w-7xl px-4 sm:px-6 py-6 space-y-6">

          {/* =================================================
              HERO / HEADER
          ================================================= */}

          <div className="relative overflow-hidden rounded-3xl border border-emerald-100 bg-white shadow-sm">

            <div className="absolute -right-16 -top-20 h-56 w-56 rounded-full bg-emerald-100/60 blur-3xl" />

            <div className="absolute -left-20 -bottom-24 h-52 w-52 rounded-full bg-green-100/50 blur-3xl" />

            <div className="relative p-5 sm:p-7">

              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">

                <div className="flex items-start gap-4">

                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 shadow-lg shadow-emerald-200">
                    <Users className="h-7 w-7 text-white" />
                  </div>

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">
                        Farmer Community
                      </h1>

                      <Badge className="border-0 bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                        <Sparkles className="h-3 w-3 mr-1" />
                        Community
                      </Badge>
                    </div>

                    <p className="mt-1 max-w-2xl text-sm sm:text-base text-gray-600">
                      Ask questions, share
                      farming experience,
                      discover practical
                      solutions, and learn
                      from fellow farmers.
                    </p>

                    <div className="mt-3 flex items-center gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1.5">
                        <MessageCircle className="h-4 w-4 text-emerald-600" />
                        Discussions
                      </span>

                      <span className="flex items-center gap-1.5">
                        <Users className="h-4 w-4 text-emerald-600" />
                        Farmers helping farmers
                      </span>

                      <span className="hidden sm:flex items-center gap-1.5">
                        <ShieldCheck className="h-4 w-4 text-emerald-600" />
                        Safe community
                      </span>
                    </div>
                  </div>
                </div>


                {/* ASK QUESTION */}

                <Button
                  onClick={() => {
                    if (
                      forumStatus &&
                      !forumStatus.canParticipate
                    ) {
                      showForumRestrictionToast();

                      return;
                    }

                    setIsCreateDialogOpen(
                      true
                    );
                  }}
                  disabled={
                    !!forumStatus &&
                    !forumStatus.canParticipate
                  }
                  className="w-full lg:w-auto h-11 rounded-xl bg-emerald-600 px-5 font-semibold shadow-sm hover:bg-emerald-700"
                >
                  <Plus className="h-4 w-4 mr-2" />

                  {forumStatus?.banned
                    ? 'Posting Blocked'
                    : forumStatus?.suspended
                    ? 'Posting Suspended'
                    : 'Ask a Question'}
                </Button>

              </div>
            </div>
          </div>


          {/* =================================================
              STATUS
          ================================================= */}

          {statusBanner}


          {/* =================================================
              MAIN GRID
          ================================================= */}

          <div className="grid grid-cols-1 xl:grid-cols-[1fr_300px] gap-6">

            {/* =================================================
                MAIN FEED
            ================================================= */}

            <main className="min-w-0 space-y-5">

              {/* SEARCH / FILTER BAR */}

              <Card className="border-gray-200 shadow-sm rounded-2xl">
                <CardContent className="p-4">

                  <div className="flex flex-col md:flex-row gap-3">

                    <div className="relative flex-1">

                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />

                      <Input
                        placeholder="Search farming questions and discussions..."
                        value={
                          searchQuery
                        }
                        onChange={(
                          e
                        ) =>
                          setSearchQuery(
                            e.target.value
                          )
                        }
                        className="h-11 rounded-xl border-gray-200 bg-gray-50 pl-10 focus:bg-white"
                      />

                      {searchQuery && (
                        <button
                          type="button"
                          onClick={() =>
                            setSearchQuery(
                              ''
                            )
                          }
                          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-700"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}

                    </div>


                    <div className="flex gap-2">

                      <Select
                        value={
                          selectedCategory
                        }
                        onValueChange={
                          setSelectedCategory
                        }
                      >
                        <SelectTrigger className="h-11 w-full md:w-[180px] rounded-xl border-gray-200 bg-gray-50">
                          <Filter className="h-4 w-4 mr-2 text-gray-500" />

                          <SelectValue />
                        </SelectTrigger>

                        <SelectContent>
                          {categories.map(
                            (
                              cat
                            ) => (
                              <SelectItem
                                key={
                                  cat.value
                                }
                                value={
                                  cat.value
                                }
                              >
                                {
                                  cat.label
                                }
                              </SelectItem>
                            )
                          )}
                        </SelectContent>
                      </Select>


                      <Select
                        value={
                          sortOption
                        }
                        onValueChange={
                          setSortOption
                        }
                      >
                        <SelectTrigger className="h-11 w-[140px] rounded-xl border-gray-200 bg-gray-50">
                          <SlidersHorizontal className="h-4 w-4 mr-2 text-gray-500" />

                          <SelectValue />
                        </SelectTrigger>

                        <SelectContent>
                          <SelectItem value="recent">
                            Latest
                          </SelectItem>

                          <SelectItem value="popular">
                            Popular
                          </SelectItem>

                          <SelectItem value="answered">
                            Most Discussed
                          </SelectItem>
                        </SelectContent>
                      </Select>

                    </div>

                  </div>


                  {/* CATEGORY CHIPS */}

                  <div className="mt-4 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">

                    {categories.map(
                      (cat) => {
                        const Icon =
                          cat.icon;

                        const active =
                          selectedCategory ===
                          cat.value;

                        return (
                          <button
                            key={
                              cat.value
                            }
                            type="button"
                            onClick={() =>
                              setSelectedCategory(
                                cat.value
                              )
                            }
                            className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                              active
                                ? 'border-emerald-600 bg-emerald-600 text-white shadow-sm'
                                : 'border-gray-200 bg-white text-gray-600 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700'
                            }`}
                          >
                            <Icon className="h-3.5 w-3.5" />

                            {
                              cat.label
                            }
                          </button>
                        );
                      }
                    )}

                  </div>

                </CardContent>
              </Card>


              {/* FEED HEADER */}

              <div className="flex items-center justify-between">

                <div>
                  <h2 className="text-lg font-bold text-gray-900">
                    {selectedCategory ===
                    'all'
                      ? 'Community discussions'
                      : getCategoryLabel(
                          selectedCategory
                        )}
                  </h2>

                  <p className="text-xs text-gray-500 mt-0.5">
                    {searchQuery
                      ? `Results for "${searchQuery}"`
                      : 'Questions, answers and farming experiences'}
                  </p>
                </div>

                <span className="text-xs text-gray-500">
                  {posts.length}{' '}
                  discussion
                  {posts.length !==
                  1
                    ? 's'
                    : ''}
                </span>

              </div>


              {/* =================================================
                  POSTS
              ================================================= */}

              {loading ? (
                <div className="space-y-4">

                  {[1, 2, 3].map(
                    (item) => (
                      <Card
                        key={
                          item
                        }
                        className="rounded-2xl border-gray-200"
                      >
                        <CardContent className="p-5">
                          <div className="animate-pulse space-y-4">

                            <div className="flex gap-3">
                              <div className="h-10 w-10 rounded-full bg-gray-200" />

                              <div className="flex-1 space-y-2">
                                <div className="h-4 w-32 rounded bg-gray-200" />
                                <div className="h-3 w-24 rounded bg-gray-100" />
                              </div>
                            </div>

                            <div className="h-5 w-3/4 rounded bg-gray-200" />

                            <div className="h-12 w-full rounded bg-gray-100" />

                            <div className="h-8 w-48 rounded bg-gray-100" />

                          </div>
                        </CardContent>
                      </Card>
                    )
                  )}

                </div>
              ) : posts.length ===
                0 ? (
                <Card className="rounded-2xl border-dashed border-gray-300">
                  <CardContent className="py-16 text-center">

                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50">
                      <MessageSquare className="h-8 w-8 text-emerald-500" />
                    </div>

                    <h3 className="mt-4 text-lg font-bold text-gray-900">
                      No discussions found
                    </h3>

                    <p className="mx-auto mt-1 max-w-md text-sm text-gray-500">
                      Try another search
                      or category, or
                      start a new
                      discussion with
                      the farming
                      community.
                    </p>

                    <Button
                      onClick={() =>
                        setIsCreateDialogOpen(
                          true
                        )
                      }
                      disabled={
                        !!forumStatus &&
                        !forumStatus.canParticipate
                      }
                      className="mt-5 rounded-xl bg-emerald-600 hover:bg-emerald-700"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Ask a Question
                    </Button>

                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">

                  {posts.map(
                    (post) => (
                      <Card
                        key={
                          post._id
                        }
                        className="group overflow-hidden rounded-2xl border-gray-200 bg-white shadow-sm transition-all hover:-translate-y-[1px] hover:border-emerald-200 hover:shadow-md"
                      >
                        <CardContent className="p-0">

                          <div className="p-5">

                            {/* USER HEADER */}

                            <div className="flex items-start justify-between gap-3">

                              <div className="flex items-center gap-3 min-w-0">

                                <Avatar className="h-10 w-10 border-2 border-emerald-50">
                                  <AvatarFallback className="bg-emerald-100 text-emerald-700 font-semibold">
                                    {post.userName
                                      ?.charAt(
                                        0
                                      )
                                      .toUpperCase() ||
                                      'F'}
                                  </AvatarFallback>
                                </Avatar>

                                <div className="min-w-0">

                                  <div className="flex items-center gap-2 flex-wrap">

                                    <span className="font-semibold text-sm text-gray-900">
                                      {
                                        post.userName
                                      }
                                    </span>

                                    <span className="text-xs text-gray-400">
                                      •
                                    </span>

                                    <span className="text-xs text-gray-500">
                                      {
                                        formatRelativeDate(
                                          post.createdAt
                                        )
                                      }
                                    </span>

                                  </div>

                                  {post.userLocation && (
                                    <p className="text-xs text-gray-500 mt-0.5 truncate">
                                      Farmer from{' '}
                                      {
                                        post.userLocation
                                      }
                                    </p>
                                  )}

                                </div>

                              </div>


                              <Badge
                                variant="outline"
                                className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium ${
                                  categoryColors[
                                    post.category
                                  ] ||
                                  'bg-gray-50 text-gray-700 border-gray-100'
                                }`}
                              >
                                {
                                  getCategoryLabel(
                                    post.category
                                  )
                                }
                              </Badge>

                            </div>


                            {/* TITLE */}

                            <button
                              type="button"
                              onClick={() =>
                                fetchPostDetail(
                                  post._id
                                )
                              }
                              className="mt-4 block w-full text-left"
                            >
                              <h3 className="text-lg font-bold leading-snug text-gray-900 transition-colors group-hover:text-emerald-700">
                                {
                                  post.title
                                }
                              </h3>

                              <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-gray-600">
                                {
                                  post.content
                                }
                              </p>
                            </button>


                            {/* CROP */}

                            {post.crop && (
                              <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700">
                                <Sprout className="h-3.5 w-3.5" />
                                {
                                  post.crop
                                }
                              </div>
                            )}


                            {/* IMAGE PREVIEW */}

                            {post.images &&
                              post.images.length >
                                0 && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    fetchPostDetail(
                                      post._id
                                    )
                                  }
                                  className={`mt-4 grid w-full gap-2 overflow-hidden rounded-xl ${
                                    post.images.length ===
                                    1
                                      ? 'grid-cols-1'
                                      : 'grid-cols-2'
                                  }`}
                                >
                                  {post.images
                                    .slice(
                                      0,
                                      2
                                    )
                                    .map(
                                      (
                                        image,
                                        index
                                      ) => (
                                        <div
                                          key={
                                            index
                                          }
                                          className={`relative overflow-hidden bg-gray-100 ${
                                            post.images.length ===
                                              1
                                              ? 'h-64'
                                              : 'h-40'
                                          }`}
                                        >
                                          <img
                                            src={getImageUrl(
                                              image
                                            )}
                                            alt="Discussion image"
                                            className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
                                          />

                                          {index ===
                                            1 &&
                                            post.images
                                              .length >
                                              2 && (
                                              <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                                                <span className="rounded-full bg-black/60 px-3 py-1.5 text-sm font-semibold text-white">
                                                  +
                                                  {post.images.length -
                                                    2}{' '}
                                                  more
                                                </span>
                                              </div>
                                            )}
                                        </div>
                                      )
                                    )}
                                </button>
                              )}


                            {/* TAGS */}

                            {post.tags &&
                              post.tags.length >
                                0 && (
                                <div className="mt-3 flex flex-wrap gap-1.5">
                                  {post.tags
                                    .slice(
                                      0,
                                      4
                                    )
                                    .map(
                                      (
                                        tag,
                                        index
                                      ) => (
                                        <span
                                          key={
                                            index
                                          }
                                          className="inline-flex items-center rounded-full bg-gray-50 px-2 py-1 text-[11px] text-gray-500"
                                        >
                                          #
                                          {
                                            tag
                                          }
                                        </span>
                                      )
                                    )}
                                </div>
                              )}

                          </div>


                          {/* ACTION BAR */}

                          <div className="border-t border-gray-100 bg-gray-50/50 px-5 py-3">

                            <div className="flex items-center justify-between gap-2">

                              <div className="flex items-center gap-1">

                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    upvotePost(
                                      post._id
                                    )
                                  }
                                  className="h-9 rounded-lg px-3 text-gray-600 hover:bg-emerald-50 hover:text-emerald-700"
                                >
                                  <ThumbsUp className="mr-1.5 h-4 w-4" />

                                  <span className="font-medium">
                                    {
                                      post
                                        .upvotes
                                        ?.length ||
                                      0
                                    }
                                  </span>

                                  <span className="ml-1 hidden sm:inline text-xs">
                                    Like
                                  </span>
                                </Button>


                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    fetchPostDetail(
                                      post._id
                                    )
                                  }
                                  className="h-9 rounded-lg px-3 text-gray-600 hover:bg-blue-50 hover:text-blue-700"
                                >
                                  <MessageCircle className="mr-1.5 h-4 w-4" />

                                  <span className="font-medium">
                                    {
                                      post.replyCount ||
                                      0
                                    }
                                  </span>

                                  <span className="ml-1 hidden sm:inline text-xs">
                                    Replies
                                  </span>
                                </Button>


                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    fetchPostDetail(
                                      post._id
                                    )
                                  }
                                  className="h-9 rounded-lg px-3 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                                >
                                  <Eye className="mr-1.5 h-4 w-4" />

                                  <span className="font-medium">
                                    {
                                      post.views ||
                                      0
                                    }
                                  </span>

                                  <span className="ml-1 hidden sm:inline text-xs">
                                    Views
                                  </span>
                                </Button>

                              </div>


                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  fetchPostDetail(
                                    post._id
                                  )
                                }
                                className="h-9 rounded-lg px-2 text-xs text-gray-500 hover:text-emerald-700"
                              >
                                Open discussion
                                <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
                              </Button>

                            </div>

                          </div>

                        </CardContent>
                      </Card>
                    )
                  )}

                </div>
              )}

            </main>


            {/* =================================================
                RIGHT SIDEBAR
            ================================================= */}

            <aside className="hidden xl:block space-y-5">

              {/* COMMUNITY CARD */}

              <Card className="rounded-2xl border-emerald-100 bg-gradient-to-br from-emerald-50 to-white shadow-sm">
                <CardContent className="p-5">

                  <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-emerald-100 p-2.5">
                      <Users className="h-5 w-5 text-emerald-600" />
                    </div>

                    <div>
                      <h3 className="font-bold text-gray-900">
                        Farmer Community
                      </h3>

                      <p className="text-xs text-gray-500">
                        Learn together
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 space-y-3">

                    <div className="flex items-start gap-2.5">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-600" />

                      <p className="text-xs leading-relaxed text-gray-600">
                        Ask practical
                        questions about
                        crops, pests,
                        weather and farming.
                      </p>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-600" />

                      <p className="text-xs leading-relaxed text-gray-600">
                        Share your
                        experience and help
                        other farmers.
                      </p>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-600" />

                      <p className="text-xs leading-relaxed text-gray-600">
                        Keep discussions
                        respectful and useful.
                      </p>
                    </div>

                  </div>

                </CardContent>
              </Card>


              {/* TRENDING */}

              {trendingPosts.length >
                0 && (
                <Card className="rounded-2xl border-gray-200 shadow-sm">
                  <CardContent className="p-5">

                    <div className="flex items-center justify-between mb-4">

                      <div className="flex items-center gap-2">
                        <div className="rounded-lg bg-orange-50 p-2">
                          <TrendingUp className="h-4 w-4 text-orange-500" />
                        </div>

                        <div>
                          <h3 className="font-bold text-gray-900">
                            Trending
                          </h3>

                          <p className="text-[11px] text-gray-500">
                            Popular discussions
                          </p>
                        </div>
                      </div>

                    </div>


                    <div className="space-y-4">

                      {trendingPosts.map(
                        (
                          post,
                          index
                        ) => (
                          <button
                            type="button"
                            key={
                              post._id
                            }
                            onClick={() =>
                              fetchPostDetail(
                                post._id
                              )
                            }
                            className="group flex w-full items-start gap-3 text-left"
                          >

                            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-500">
                              {index +
                                1}
                            </div>

                            <div className="min-w-0 flex-1">

                              <p className="line-clamp-2 text-sm font-semibold text-gray-800 group-hover:text-emerald-700">
                                {
                                  post.title
                                }
                              </p>

                              <div className="mt-1 flex items-center gap-2 text-[11px] text-gray-500">

                                <span>
                                  {
                                    post.upvotes
                                      ?.length ||
                                    0
                                  }{' '}
                                  likes
                                </span>

                                <span>
                                  •
                                </span>

                                <span>
                                  {
                                    post.replyCount ||
                                    0
                                  }{' '}
                                  replies
                                </span>

                              </div>

                            </div>

                            <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-gray-300 group-hover:text-emerald-500" />

                          </button>
                        )
                      )}

                    </div>

                  </CardContent>
                </Card>
              )}


              {/* CATEGORY GUIDE */}

              <Card className="rounded-2xl border-gray-200 shadow-sm">
                <CardContent className="p-5">

                  <div className="flex items-center gap-2 mb-4">
                    <Tag className="h-4 w-4 text-emerald-600" />

                    <h3 className="font-bold text-gray-900">
                      Explore topics
                    </h3>
                  </div>

                  <div className="space-y-1">

                    {categories
                      .filter(
                        (cat) =>
                          cat.value !==
                          'all'
                      )
                      .map(
                        (cat) => {
                          const Icon =
                            cat.icon;

                          return (
                            <button
                              key={
                                cat.value
                              }
                              type="button"
                              onClick={() =>
                                setSelectedCategory(
                                  cat.value
                                )
                              }
                              className="flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-sm text-gray-600 transition hover:bg-emerald-50 hover:text-emerald-700"
                            >
                              <span className="flex items-center gap-2">
                                <Icon className="h-4 w-4" />

                                {
                                  cat.label
                                }
                              </span>

                              <ChevronRight className="h-3.5 w-3.5 text-gray-300" />
                            </button>
                          );
                        }
                      )}

                  </div>

                </CardContent>
              </Card>

            </aside>

          </div>


          {/* =================================================
              ASK QUESTION DIALOG
          ================================================= */}

          <Dialog
            open={
              isCreateDialogOpen
            }
            onOpenChange={(
              open
            ) => {
              if (
                open &&
                forumStatus &&
                !forumStatus.canParticipate
              ) {
                showForumRestrictionToast();

                return;
              }

              setIsCreateDialogOpen(
                open
              );

              if (!open) {
                resetPostForm();
              }
            }}
          >

            <DialogContent className="w-[96vw] max-w-2xl max-h-[92vh] overflow-y-auto rounded-3xl border-gray-200 p-0">

              {/* DIALOG HEADER */}

              <div className="sticky top-0 z-10 border-b border-gray-100 bg-white/95 px-6 py-5 backdrop-blur">

                <DialogHeader>

                  <div className="flex items-start gap-3">

                    <div className="rounded-xl bg-emerald-100 p-2.5">
                      <MessageSquare className="h-5 w-5 text-emerald-600" />
                    </div>

                    <div>
                      <DialogTitle className="text-xl">
                        Ask the farming community
                      </DialogTitle>

                      <DialogDescription className="mt-1">
                        Describe your problem
                        clearly so other
                        farmers can help you.
                      </DialogDescription>
                    </div>

                  </div>

                </DialogHeader>

              </div>


              <div className="space-y-6 px-6 py-5">

                {/* TITLE */}

                <div className="space-y-2">

                  <Label
                    htmlFor="title"
                    className="font-semibold text-gray-800"
                  >
                    What do you need help with?
                  </Label>

                  <Input
                    id="title"
                    maxLength={200}
                    placeholder="e.g. Yellow spots appearing on my tomato leaves"
                    value={
                      newPost.title
                    }
                    onChange={(
                      e
                    ) =>
                      handlePostTitleChange(
                        e.target.value
                      )
                    }
                    className="h-12 rounded-xl border-gray-200"
                  />

                  <div className="flex justify-end text-[11px] text-gray-400">
                    {
                      newPost.title
                        .length
                    }
                    /200
                  </div>

                </div>


                {/* CATEGORY */}

                <div className="space-y-2">

                  <Label className="font-semibold text-gray-800">
                    Topic
                  </Label>

                  <Select
                    value={
                      newPost.category
                    }
                    onValueChange={(
                      value
                    ) =>
                      setNewPost({
                        ...newPost,
                        category:
                          value
                      })
                    }
                  >
                    <SelectTrigger className="h-12 rounded-xl border-gray-200">
                      <SelectValue placeholder="Choose a topic" />
                    </SelectTrigger>

                    <SelectContent>
                      {categories
                        .filter(
                          (cat) =>
                            cat.value !==
                            'all'
                        )
                        .map(
                          (cat) => {
                            const Icon =
                              cat.icon;

                            return (
                              <SelectItem
                                key={
                                  cat.value
                                }
                                value={
                                  cat.value
                                }
                              >
                                <span className="flex items-center gap-2">
                                  <Icon className="h-4 w-4" />
                                  {
                                    cat.label
                                  }
                                </span>
                              </SelectItem>
                            );
                          }
                        )}
                    </SelectContent>
                  </Select>

                  <p className="text-[11px] text-gray-500">
                    This helps other
                    farmers find your
                    question.
                  </p>

                </div>


                {/* CONTENT */}

                <div className="space-y-2">

                  <div className="flex items-center justify-between">

                    <Label
                      htmlFor="content"
                      className="font-semibold text-gray-800"
                    >
                      Tell us more
                    </Label>

                    <span className="text-[11px] text-gray-400">
                      {
                        newPost.content
                          .length
                      }
                      /5000
                    </span>

                  </div>

                  <Textarea
                    id="content"
                    maxLength={5000}
                    placeholder="Explain what you are seeing, what you have already tried, and any details that may help..."
                    rows={6}
                    value={
                      newPost.content
                    }
                    onChange={(
                      e
                    ) =>
                      handlePostContentChange(
                        e.target.value
                      )
                    }
                    className="resize-none rounded-xl border-gray-200 leading-relaxed"
                  />

                </div>


                {/* MODERATION */}

                {postModeration.isAbusive && (
                  <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">

                    <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />

                    <div>
                      <strong>
                        Inappropriate language detected.
                      </strong>

                      <p className="mt-1">
                        Please remove it
                        before submitting
                        your question.
                      </p>

                      {postModeration
                        .detectedWords
                        .length >
                        0 && (
                        <p className="mt-2 text-xs">
                          Detected:{' '}
                          {postModeration.detectedWords.join(
                            ', '
                          )}
                        </p>
                      )}
                    </div>

                  </div>
                )}


                {/* CROP */}

                <div className="space-y-2">

                  <Label
                    htmlFor="crop"
                    className="font-semibold text-gray-800"
                  >
                    Which crop is this about?
                    <span className="ml-1 font-normal text-gray-400">
                      Optional
                    </span>
                  </Label>

                  <Input
                    id="crop"
                    placeholder="e.g. Tomato, Wheat, Onion"
                    value={
                      newPost.crop
                    }
                    onChange={(
                      e
                    ) =>
                      setNewPost({
                        ...newPost,
                        crop:
                          e.target.value
                      })
                    }
                    className="h-11 rounded-xl border-gray-200"
                  />

                </div>


                {/* OPTIONAL TAGS */}

                <div className="space-y-2">

                  <Label
                    htmlFor="tags"
                    className="font-semibold text-gray-800"
                  >
                    Keywords
                    <span className="ml-1 font-normal text-gray-400">
                      Optional
                    </span>
                  </Label>

                  <Input
                    id="tags"
                    placeholder="e.g. pest control, organic farming"
                    value={
                      newPost.tags
                    }
                    onChange={(
                      e
                    ) =>
                      setNewPost({
                        ...newPost,
                        tags:
                          e.target.value
                      })
                    }
                    className="h-11 rounded-xl border-gray-200"
                  />

                  <p className="text-[11px] text-gray-500">
                    Separate multiple
                    keywords with commas.
                  </p>

                </div>


                {/* IMAGES */}

                <div className="space-y-2">

                  <div className="flex items-center justify-between">

                    <Label
                      htmlFor="post-images"
                      className="font-semibold text-gray-800"
                    >
                      Add photos
                      <span className="ml-1 font-normal text-gray-400">
                        Optional
                      </span>
                    </Label>

                    <span className="text-[11px] text-gray-400">
                      Up to 3 photos
                    </span>

                  </div>


                  <label
                    htmlFor="post-images"
                    className={`flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed p-5 text-sm transition ${
                      postImages.length >=
                      3
                        ? 'cursor-not-allowed border-gray-200 bg-gray-50 text-gray-400'
                        : 'border-emerald-200 bg-emerald-50/40 text-emerald-700 hover:border-emerald-400 hover:bg-emerald-50'
                    }`}
                  >

                    <Camera className="h-5 w-5" />

                    <span className="font-medium">
                      {postImages.length >=
                      3
                        ? 'Maximum photos selected'
                        : 'Click to add photos'}
                    </span>

                    <Input
                      id="post-images"
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={
                        handlePostImageSelect
                      }
                      disabled={
                        postImages.length >=
                        3
                      }
                      className="hidden"
                    />

                  </label>


                  {postImages.length >
                    0 && (
                    <div className="grid grid-cols-3 gap-2">

                      {postImages.map(
                        (
                          image,
                          index
                        ) => (
                          <div
                            key={
                              index
                            }
                            className="group relative overflow-hidden rounded-xl border bg-gray-50"
                          >

                            <img
                              src={URL.createObjectURL(
                                image
                              )}
                              alt={`Preview ${
                                index +
                                1
                              }`}
                              className="h-24 w-full object-cover"
                            />

                            <button
                              type="button"
                              onClick={() =>
                                removePostImage(
                                  index
                                )
                              }
                              className="absolute right-1.5 top-1.5 rounded-full bg-black/70 p-1 text-white opacity-0 transition group-hover:opacity-100"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>

                          </div>
                        )
                      )}

                    </div>
                  )}

                </div>


                {/* GUIDANCE */}

                <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">

                  <div className="flex items-start gap-3">

                    <Leaf className="mt-0.5 h-5 w-5 text-emerald-600" />

                    <div>

                      <p className="text-sm font-semibold text-gray-800">
                        Tip for getting better answers
                      </p>

                      <p className="mt-1 text-xs leading-relaxed text-gray-500">
                        Mention the crop,
                        symptoms, location,
                        weather conditions,
                        and what treatment
                        you have already
                        tried. A clear photo
                        can also help.
                      </p>

                    </div>

                  </div>

                </div>

              </div>


              {/* FOOTER */}

              <DialogFooter className="sticky bottom-0 border-t border-gray-100 bg-white px-6 py-4">

                <Button
                  variant="outline"
                  onClick={() => {
                    setIsCreateDialogOpen(
                      false
                    );

                    resetPostForm();
                  }}
                  className="rounded-xl"
                >
                  Cancel
                </Button>

                <Button
                  onClick={
                    createPost
                  }
                  disabled={
                    creatingPost ||
                    postModeration.isAbusive ||
                    !newPost.title.trim() ||
                    !newPost.content.trim()
                  }
                  className="rounded-xl bg-emerald-600 px-5 hover:bg-emerald-700"
                >
                  {creatingPost
                    ? 'Posting...'
                    : (
                      <>
                        <Send className="mr-2 h-4 w-4" />
                        Post Question
                      </>
                    )}
                </Button>

              </DialogFooter>

            </DialogContent>
          </Dialog>


          {/* =================================================
              POST DETAIL / DISCUSSION
          ================================================= */}

          {selectedPost && (
            <Dialog
              open={
                !!selectedPost
              }
              onOpenChange={(
                open
              ) => {
                if (!open) {
                  setSelectedPost(
                    null
                  );

                  setReplyContent(
                    ''
                  );

                  setReplyImages(
                    []
                  );

                  setReplyModeration({
                    isAbusive:
                      false,
                    detectedWords:
                      [],
                    severity:
                      'low'
                  });

                  fetchPosts();
                }
              }}
            >

              <DialogContent className="w-[96vw] max-w-3xl max-h-[92vh] overflow-y-auto rounded-3xl border-gray-200 p-0">

                {/* THREAD HEADER */}

                <div className="border-b border-gray-100 bg-white px-6 py-5">

                  <DialogHeader>

                    <div className="flex items-start justify-between gap-3">

                      <div className="min-w-0">

                        <div className="mb-2 flex items-center gap-2 flex-wrap">

                          <Badge
                            variant="outline"
                            className={`rounded-full ${
                              categoryColors[
                                selectedPost.category
                              ] ||
                              'bg-gray-50'
                            }`}
                          >
                            {
                              getCategoryLabel(
                                selectedPost.category
                              )
                            }
                          </Badge>

                          {selectedPost.status ===
                            'answered' && (
                            <Badge className="rounded-full border-0 bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                              <CheckCircle2 className="mr-1 h-3 w-3" />
                              Answered
                            </Badge>
                          )}

                        </div>

                        <DialogTitle className="text-xl sm:text-2xl leading-tight">
                          {
                            selectedPost.title
                          }
                        </DialogTitle>

                        <DialogDescription className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
                          <span className="font-medium text-gray-700">
                            {
                              selectedPost.userName
                            }
                          </span>

                          {selectedPost.userLocation && (
                            <>
                              <span>
                                •
                              </span>

                              <span>
                                {
                                  selectedPost.userLocation
                                }
                              </span>
                            </>
                          )}

                          <span>
                            •
                          </span>

                          <span>
                            {
                              formatRelativeDate(
                                selectedPost.createdAt
                              )
                            }
                          </span>
                        </DialogDescription>

                      </div>

                    </div>

                  </DialogHeader>

                </div>


                <div className="space-y-5 px-6 py-5">

                  {/* ORIGINAL POST */}

                  <div className="rounded-2xl border border-emerald-100 bg-emerald-50/30 p-5">

                    <div className="flex items-start gap-3">

                      <Avatar className="h-10 w-10 border-2 border-white shadow-sm">
                        <AvatarFallback className="bg-emerald-100 text-emerald-700 font-semibold">
                          {selectedPost.userName
                            ?.charAt(
                              0
                            )
                            .toUpperCase() ||
                            'F'}
                        </AvatarFallback>
                      </Avatar>

                      <div className="min-w-0 flex-1">

                        <div className="flex items-center justify-between gap-2">

                          <div>
                            <p className="text-sm font-semibold text-gray-900">
                              {
                                selectedPost.userName
                              }
                            </p>

                            <p className="text-xs text-gray-500">
                              {
                                formatDate(
                                  selectedPost.createdAt
                                )
                              }
                            </p>
                          </div>

                          {selectedPost.crop && (
                            <Badge
                              variant="outline"
                              className="rounded-full border-emerald-200 bg-white text-emerald-700"
                            >
                              <Sprout className="mr-1 h-3 w-3" />
                              {
                                selectedPost.crop
                              }
                            </Badge>
                          )}

                        </div>

                        <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-gray-700">
                          {
                            selectedPost.content
                          }
                        </p>

                      </div>

                    </div>


                    {/* POST IMAGES */}

                    {selectedPost.images &&
                      selectedPost.images.length >
                        0 && (
                      <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">

                        {selectedPost.images.map(
                          (
                            imageUrl,
                            index
                          ) => {
                            const fullImageUrl =
                              getImageUrl(
                                imageUrl
                              );

                            return (
                              <a
                                key={
                                  index
                                }
                                href={
                                  fullImageUrl
                                }
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group relative overflow-hidden rounded-xl border bg-white"
                              >
                                <img
                                  src={
                                    fullImageUrl
                                  }
                                  alt={`Post image ${
                                    index +
                                    1
                                  }`}
                                  className="h-60 w-full object-cover transition duration-300 group-hover:scale-[1.02]"
                                  onError={(
                                    e
                                  ) => {
                                    e.currentTarget.style.display =
                                      'none';
                                  }}
                                />

                                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-3 opacity-0 transition group-hover:opacity-100">
                                  <span className="text-xs font-medium text-white">
                                    Open image
                                  </span>
                                </div>
                              </a>
                            );
                          }
                        )}

                      </div>
                    )}


                    {/* POST ACTIONS */}

                    <div className="mt-4 flex items-center gap-2 border-t border-emerald-100 pt-3">

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          upvotePost(
                            selectedPost._id
                          )
                        }
                        className="rounded-lg text-gray-600 hover:bg-white hover:text-emerald-700"
                      >
                        <ThumbsUp className="mr-1.5 h-4 w-4" />

                        {
                          selectedPost
                            .upvotes
                            ?.length ||
                          0
                        }

                        <span className="ml-1 text-xs">
                          Likes
                        </span>
                      </Button>

                      <span className="text-xs text-gray-400">
                        {
                          selectedPost
                            .views ||
                          0
                        }{' '}
                        views
                      </span>

                    </div>

                  </div>


                  {/* REPLIES */}

                  <div>

                    <div className="flex items-center justify-between mb-4">

                      <div className="flex items-center gap-2">

                        <MessageCircle className="h-5 w-5 text-emerald-600" />

                        <h3 className="font-bold text-gray-900">
                          {selectedPost
                            .replies
                            ?.length ||
                            0}{' '}
                          {
                            selectedPost
                              .replies
                              ?.length ===
                            1
                              ? 'Reply'
                              : 'Replies'
                          }
                        </h3>

                      </div>

                      <span className="text-xs text-gray-400">
                        Share helpful
                        advice
                      </span>

                    </div>


                    {selectedPost.replies &&
                    selectedPost.replies.length >
                      0 ? (
                      <div className="space-y-4">

                        {selectedPost.replies.map(
                          (
                            reply,
                            index
                          ) => (
                            <div
                              key={
                                reply._id
                              }
                              className="relative pl-4"
                            >

                              <div className="absolute bottom-0 left-0 top-0 w-px bg-gray-200" />

                              <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">

                                <div className="flex items-center justify-between gap-2">

                                  <div className="flex items-center gap-2">

                                    <Avatar className="h-8 w-8">
                                      <AvatarFallback className="bg-gray-100 text-gray-700 text-xs font-semibold">
                                        {reply.userName
                                          ?.charAt(
                                            0
                                          )
                                          .toUpperCase() ||
                                          'F'}
                                      </AvatarFallback>
                                    </Avatar>

                                    <div>

                                      <p className="text-sm font-semibold text-gray-900">
                                        {
                                          reply.userName
                                        }
                                      </p>

                                      <p className="text-[11px] text-gray-500">
                                        {
                                          formatRelativeDate(
                                            reply.createdAt
                                          )
                                        }
                                      </p>

                                    </div>

                                  </div>

                                  <span className="text-[10px] text-gray-400">
                                    #{index +
                                      1}
                                  </span>

                                </div>


                                <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-gray-700">
                                  {
                                    reply.content
                                  }
                                </p>


                                {/* REPLY IMAGES */}

                                {reply.images &&
                                  reply.images.length >
                                    0 && (
                                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">

                                    {reply.images.map(
                                      (
                                        imageUrl,
                                        imageIndex
                                      ) => {
                                        const fullImageUrl =
                                          getImageUrl(
                                            imageUrl
                                          );

                                        return (
                                          <a
                                            key={
                                              imageIndex
                                            }
                                            href={
                                              fullImageUrl
                                            }
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="overflow-hidden rounded-xl border"
                                          >
                                            <img
                                              src={
                                                fullImageUrl
                                              }
                                              alt={`Reply image ${
                                                imageIndex +
                                                1
                                              }`}
                                              className="h-40 w-full object-cover"
                                            />
                                          </a>
                                        );
                                      }
                                    )}

                                  </div>
                                )}


                                {/* REPLY LIKE */}

                                <div className="mt-3 border-t border-gray-100 pt-2">

                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 rounded-lg px-2 text-xs text-gray-500 hover:bg-emerald-50 hover:text-emerald-700"
                                    onClick={() =>
                                      upvoteReply(
                                        selectedPost._id,
                                        reply._id
                                      )
                                    }
                                  >
                                    <ThumbsUp className="mr-1.5 h-3.5 w-3.5" />

                                    {
                                      reply
                                        .upvotes
                                        ?.length ||
                                      0
                                    }

                                    <span className="ml-1">
                                      Helpful
                                    </span>
                                  </Button>

                                </div>

                              </div>

                            </div>
                          )
                        )}

                      </div>
                    ) : (
                      <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-8 text-center">

                        <MessageCircle className="mx-auto h-8 w-8 text-gray-300" />

                        <p className="mt-2 text-sm font-medium text-gray-600">
                          No replies yet
                        </p>

                        <p className="mt-1 text-xs text-gray-400">
                          Be the first farmer
                          to share a helpful
                          answer.
                        </p>

                      </div>
                    )}

                  </div>


                  {/* REPLY FORM */}

                  <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">

                    <div className="flex items-center justify-between gap-3">

                      <div>
                        <h4 className="font-semibold text-gray-900">
                          Add your answer
                        </h4>

                        <p className="text-xs text-gray-500 mt-0.5">
                          Share useful
                          experience or advice.
                        </p>
                      </div>

                      {forumStatus?.suspended && (
                        <Badge
                          variant="outline"
                          className="border-orange-200 text-orange-700"
                        >
                          Posting suspended
                        </Badge>
                      )}

                      {forumStatus?.banned && (
                        <Badge
                          variant="destructive"
                          className="rounded-full"
                        >
                          Posting blocked
                        </Badge>
                      )}

                    </div>


                    <Textarea
                      id="reply"
                      placeholder={
                        forumStatus?.canParticipate
                          ? 'Write a helpful reply...'
                          : 'You cannot reply while your forum access is restricted.'
                      }
                      rows={4}
                      value={
                        replyContent
                      }
                      disabled={
                        !!forumStatus &&
                        !forumStatus.canParticipate
                      }
                      onChange={(
                        e
                      ) =>
                        handleReplyContentChange(
                          e.target.value
                        )
                      }
                      className="mt-4 resize-none rounded-xl border-gray-200 bg-white"
                    />


                    {/* REPLY MODERATION */}

                    {replyModeration.isAbusive && (
                      <div className="mt-3 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">

                        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />

                        <div>
                          <strong>
                            Inappropriate language detected.
                          </strong>

                          <p className="mt-1 text-xs">
                            Please remove it
                            before submitting
                            your reply.
                          </p>

                          {replyModeration
                            .detectedWords
                            .length >
                            0 && (
                            <p className="mt-1 text-xs">
                              Detected:{' '}
                              {replyModeration.detectedWords.join(
                                ', '
                              )}
                            </p>
                          )}
                        </div>

                      </div>
                    )}


                    {/* REPLY IMAGE UPLOAD */}

                    <div className="mt-3">

                      <div className="flex items-center gap-2">

                        <label
                          htmlFor="reply-images"
                          className={`flex flex-1 cursor-pointer items-center gap-2 rounded-xl border border-dashed px-3 py-2.5 text-xs ${
                            replyImages.length >=
                            2
                              ? 'cursor-not-allowed border-gray-200 text-gray-400'
                              : 'border-gray-200 bg-white text-gray-500 hover:border-emerald-300 hover:text-emerald-700'
                          }`}
                        >
                          <ImageIcon className="h-4 w-4" />

                          {replyImages.length >
                          0
                            ? `${replyImages.length} photo${
                                replyImages.length !==
                                1
                                  ? 's'
                                  : ''
                              } selected`
                            : 'Add photos (optional)'}

                          <Input
                            id="reply-images"
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={
                              handleReplyImageSelect
                            }
                            disabled={
                              replyImages.length >=
                                2 ||
                              (!!forumStatus &&
                                !forumStatus.canParticipate)
                            }
                            className="hidden"
                          />
                        </label>

                        {replyImages.length >
                          0 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              setReplyImages(
                                []
                              )
                            }
                            className="rounded-xl"
                          >
                            <X className="mr-1 h-4 w-4" />
                            Clear
                          </Button>
                        )}

                      </div>


                      {replyImages.length >
                        0 && (
                        <div className="mt-2 grid grid-cols-2 gap-2">

                          {replyImages.map(
                            (
                              image,
                              index
                            ) => (
                              <div
                                key={
                                  index
                                }
                                className="group relative overflow-hidden rounded-xl border bg-white"
                              >
                                <img
                                  src={URL.createObjectURL(
                                    image
                                  )}
                                  alt={`Preview ${
                                    index +
                                    1
                                  }`}
                                  className="h-24 w-full object-cover"
                                />

                                <button
                                  type="button"
                                  onClick={() =>
                                    removeReplyImage(
                                      index
                                    )
                                  }
                                  className="absolute right-1 top-1 rounded-full bg-black/70 p-1 text-white opacity-0 transition group-hover:opacity-100"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </div>
                            )
                          )}

                        </div>
                      )}

                    </div>


                    {/* REPLY BUTTON */}

                    <div className="mt-4 flex justify-end">

                      <Button
                        onClick={() =>
                          addReply(
                            selectedPost._id
                          )
                        }
                        disabled={
                          addingReply ||
                          !forumStatus?.canParticipate ||
                          replyModeration.isAbusive
                        }
                        className="rounded-xl bg-emerald-600 px-5 hover:bg-emerald-700"
                      >
                        <Send className="mr-2 h-4 w-4" />

                        {addingReply
                          ? 'Posting...'
                          : 'Post Reply'}
                      </Button>

                    </div>


                    {/* RESTRICTION MESSAGE */}

                    {!forumStatus?.canParticipate &&
                      forumStatus && (
                      <div className="mt-3 rounded-xl border bg-white p-3 text-xs text-gray-600">

                        {forumStatus.suspended && (
                          <div className="flex items-start gap-2">
                            <Clock className="mt-0.5 h-4 w-4 text-orange-500" />

                            <span>
                              {formatSuspensionMessage()}
                            </span>
                          </div>
                        )}

                        {forumStatus.banned && (
                          <div className="flex items-start gap-2">
                            <Ban className="mt-0.5 h-4 w-4 text-red-500" />

                            <span>
                              Your forum
                              participation
                              has been
                              permanently
                              blocked. You
                              can still read
                              posts and
                              comments.
                            </span>
                          </div>
                        )}

                      </div>
                    )}

                  </div>

                </div>

              </DialogContent>

            </Dialog>
          )}

        </div>
      </div>
    </DashboardLayout>
  );
}