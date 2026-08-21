/* eslint-env node */

const express = require('express');
const router = express.Router();
const ForumPost = require('../models/Forum');
const User = require('../models/User');
const auth = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { logActivity } = require('./activities');
const { moderateContent } = require('../utils/contentModeration');

// =========================================================
// NOTIFICATION SERVICE
// =========================================================

const {
  notifyPostLike,
  notifyPostReply,
  notifyReplyLike,
  notifyForumWarning,
  notifyForumSuspension,
  notifyForumBanned,
  notifyForumSuspensionEnded
} = require('../utils/notificationService');

// =========================================================
// MULTER CONFIGURATION FOR FORUM IMAGE UPLOADS
// =========================================================

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../uploads/forum');

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    cb(null, dir);
  },

  filename: (req, file, cb) => {
    const extension = path.extname(file.originalname).toLowerCase();

    cb(
      null,
      `${Date.now()}-${Math.random().toString(36).substring(2, 10)}${extension}`
    );
  }
});

const upload = multer({
  storage,

  limits: {
    fileSize: 5 * 1024 * 1024
  },

  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/heic',
      'image/heif'
    ];

    const allowedExtensions = [
      '.jpg',
      '.jpeg',
      '.png',
      '.gif',
      '.webp',
      '.heic',
      '.heif'
    ];

    const extension = path.extname(file.originalname).toLowerCase();

    if (
      allowedMimeTypes.includes(file.mimetype) ||
      allowedExtensions.includes(extension)
    ) {
      cb(null, true);
    } else {
      cb(
        new Error(
          'Only image files are allowed (jpg, jpeg, png, gif, webp, heic, heif)'
        )
      );
    }
  }
});

// =========================================================
// HELPER: DELETE UPLOADED FILES
// =========================================================

function deleteUploadedFiles(files) {
  if (!files || !Array.isArray(files)) {
    return;
  }

  files.forEach((file) => {
    try {
      if (file && file.path && fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
    } catch (error) {
      console.error('Error deleting uploaded file:', error);
    }
  });
}

// =========================================================
// HELPER: GET FORUM STATUS
// =========================================================

function getForumStatus(user) {
  const now = new Date();

  // -------------------------------------------------------
  // Backward compatibility with old permanent-block field
  // -------------------------------------------------------

  if (user.isBlockedFromForum === true) {
    return {
      status: 'banned',
      canParticipate: false,
      blocked: true,
      suspended: false,
      banned: true,
      warnings: user.forumWarnings || 0,
      blockedUntil: null,
      message:
        'Your forum participation has been permanently blocked due to repeated violations of the community guidelines.'
    };
  }

  // -------------------------------------------------------
  // Temporary suspension
  // -------------------------------------------------------

  if (
    user.forumBlockedUntil &&
    new Date(user.forumBlockedUntil) > now
  ) {
    return {
      status: 'suspended',
      canParticipate: false,
      blocked: true,
      suspended: true,
      banned: false,
      warnings: user.forumWarnings || 0,
      blockedUntil: user.forumBlockedUntil,
      message:
        'Your forum participation is temporarily suspended due to repeated violations of the community guidelines.'
    };
  }

  // -------------------------------------------------------
  // Expired old suspension
  // -------------------------------------------------------

  if (
    user.forumBlockedUntil &&
    new Date(user.forumBlockedUntil) <= now
  ) {
    return {
      status: 'active',
      canParticipate: true,
      blocked: false,
      suspended: false,
      banned: false,
      warnings: user.forumWarnings || 0,
      blockedUntil: null,
      message: 'Your forum access is active.'
    };
  }

  // -------------------------------------------------------
  // New forumStatus field
  // -------------------------------------------------------

  if (user.forumStatus === 'banned') {
    return {
      status: 'banned',
      canParticipate: false,
      blocked: true,
      suspended: false,
      banned: true,
      warnings: user.forumWarnings || 0,
      blockedUntil: null,
      message:
        'Your forum participation has been permanently blocked due to repeated violations of the community guidelines.'
    };
  }

  if (
    user.forumStatus === 'suspended' &&
    user.forumBlockedUntil &&
    new Date(user.forumBlockedUntil) > now
  ) {
    return {
      status: 'suspended',
      canParticipate: false,
      blocked: true,
      suspended: true,
      banned: false,
      warnings: user.forumWarnings || 0,
      blockedUntil: user.forumBlockedUntil,
      message:
        'Your forum participation is temporarily suspended due to repeated violations of the community guidelines.'
    };
  }

  // -------------------------------------------------------
  // Active user
  // -------------------------------------------------------

  return {
    status: 'active',
    canParticipate: true,
    blocked: false,
    suspended: false,
    banned: false,
    warnings: user.forumWarnings || 0,
    blockedUntil: null,
    message: 'Your forum access is active.'
  };
}

// =========================================================
// MIDDLEWARE: CHECK FORUM PARTICIPATION ACCESS
// =========================================================

async function checkForumAccess(req, res, next) {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    const forumStatus = getForumStatus(user);

    // -------------------------------------------------------
    // Automatically restore an expired suspension
    // -------------------------------------------------------

    if (
      user.forumBlockedUntil &&
      new Date(user.forumBlockedUntil) <= new Date() &&
      user.forumStatus === 'suspended'
    ) {
      user.forumBlockedUntil = null;
      user.forumStatus = 'active';

      await user.save();

      // Notify user that suspension has ended
      await notifyForumSuspensionEnded({
        userId: user._id
      });

      forumStatus.status = 'active';
      forumStatus.canParticipate = true;
      forumStatus.blocked = false;
      forumStatus.suspended = false;
      forumStatus.banned = false;
      forumStatus.blockedUntil = null;
      forumStatus.message = 'Your forum access is active.';
    }

    // -------------------------------------------------------
    // Permanent ban
    // -------------------------------------------------------

    if (
      forumStatus.status === 'banned' ||
      user.isBlockedFromForum === true
    ) {
      return res.status(403).json({
        success: false,
        error:
          'You have been permanently blocked from posting and commenting in the forum due to repeated inappropriate-language violations.',
        blocked: true,
        banned: true,
        suspended: false,
        forumStatus: 'banned',
        warnings: user.forumWarnings || 0,
        blockedUntil: null,
        canParticipate: false
      });
    }

    // -------------------------------------------------------
    // Temporary suspension
    // -------------------------------------------------------

    if (
      forumStatus.status === 'suspended' ||
      (
        user.forumBlockedUntil &&
        new Date(user.forumBlockedUntil) > new Date()
      )
    ) {
      const blockedUntil = user.forumBlockedUntil;

      const remainingMs =
        new Date(blockedUntil).getTime() - Date.now();

      const daysRemaining = Math.max(
        1,
        Math.ceil(
          remainingMs /
          (1000 * 60 * 60 * 24)
        )
      );

      return res.status(403).json({
        success: false,
        error:
          `Your forum participation is suspended. ` +
          `You can post and comment again after ${new Date(
            blockedUntil
          ).toLocaleString('en-IN')}.`,
        blocked: true,
        banned: false,
        suspended: true,
        forumStatus: 'suspended',
        warnings: user.forumWarnings || 0,
        blockedUntil,
        daysRemaining,
        canParticipate: false
      });
    }

    // Fresh user information
    req.user = user;

    next();
  } catch (error) {
    console.error(
      'Error checking forum access:',
      error
    );

    res.status(500).json({
      error: 'Failed to verify forum access'
    });
  }
}

// =========================================================
// HELPER: HANDLE CONTENT MODERATION
// =========================================================
//
// Violation rules:
//
// 1st inappropriate submission -> Warning
// 2nd inappropriate submission -> Warning
// 3rd inappropriate submission -> 7-day suspension
// 4th inappropriate submission -> Permanent forum ban
//
// IMPORTANT:
// Merely typing inappropriate words does NOT increase the count.
// The count increases only when the user attempts to submit
// inappropriate content to the forum.
//

async function handleContentModeration(
  user,
  content,
  title = ''
) {
  const moderationResult =
    moderateContent(
      content,
      title
    );

  // -------------------------------------------------------
  // Clean content
  // -------------------------------------------------------

  if (!moderationResult.isAbusive) {
    return {
      blocked: false,
      warned: false,
      suspended: false,
      banned: false,
      warnings:
        user.forumWarnings || 0,
      detectedWords: [],
      severity: 'low'
    };
  }

  // -------------------------------------------------------
  // Record the new violation
  // -------------------------------------------------------

  const currentWarnings =
    Number(
      user.forumWarnings || 0
    );

  const violationNumber =
    currentWarnings + 1;

  user.forumWarnings =
    violationNumber;

  if (
    !Array.isArray(
      user.forumWarningHistory
    )
  ) {
    user.forumWarningHistory = [];
  }

  const combinedContent =
    title
      ? `${title} ${content}`
      : content;

  // -------------------------------------------------------
  // 4TH VIOLATION = PERMANENT BAN
  // -------------------------------------------------------

  if (violationNumber >= 4) {
    user.forumWarnings = 4;
    user.forumStatus = 'banned';
    user.isBlockedFromForum = true;
    user.forumBlockedUntil = null;

    user.forumWarningHistory.push({
      date: new Date(),
      reason:
        `Detected inappropriate language: ${moderationResult.detectedWords.join(
          ', '
        )}`,
      content: combinedContent,
      violationNumber: 4,
      action: 'ban'
    });

    await user.save();

    // Send ban notification
    await notifyForumBanned({
      userId: user._id,
      warnings: 4
    });

    return {
      blocked: true,
      warned: false,
      suspended: false,
      banned: true,
      warnings: 4,
      blockedUntil: null,
      detectedWords:
        moderationResult.detectedWords,
      severity:
        moderationResult.severity,
      message:
        'Your forum participation has been permanently blocked after 4 inappropriate-language violations. You can still read posts and comments, but you cannot create posts or comments.'
    };
  }

  // -------------------------------------------------------
  // 3RD VIOLATION = 7-DAY SUSPENSION
  // -------------------------------------------------------

  if (violationNumber === 3) {
    const blockUntil =
      new Date();

    blockUntil.setDate(
      blockUntil.getDate() + 7
    );

    user.forumStatus =
      'suspended';

    user.isBlockedFromForum =
      false;

    user.forumBlockedUntil =
      blockUntil;

    user.forumWarningHistory.push({
      date: new Date(),
      reason:
        `Detected inappropriate language: ${moderationResult.detectedWords.join(
          ', '
        )}`,
      content: combinedContent,
      violationNumber: 3,
      action: 'suspension'
    });

    await user.save();

    // Send suspension notification
    await notifyForumSuspension({
      userId: user._id,
      blockedUntil: blockUntil,
      warnings: 3
    });

    return {
      blocked: true,
      warned: false,
      suspended: true,
      banned: false,
      warnings: 3,
      blockedUntil: blockUntil,
      detectedWords:
        moderationResult.detectedWords,
      severity:
        moderationResult.severity,
      message:
        'You have received your 3rd forum violation. Your ability to post and comment has been suspended for 7 days due to repeated inappropriate-language violations.'
    };
  }

  // -------------------------------------------------------
  // 1ST / 2ND VIOLATION = WARNING ONLY
  // -------------------------------------------------------

  user.forumStatus =
    'active';

  user.isBlockedFromForum =
    false;

  user.forumBlockedUntil =
    null;

  user.forumWarningHistory.push({
    date: new Date(),
    reason:
      `Detected inappropriate language: ${moderationResult.detectedWords.join(
        ', '
      )}`,
    content: combinedContent,
    violationNumber,
    action: 'warning'
  });

  await user.save();

  // Send warning notification
  await notifyForumWarning({
    userId: user._id,
    warningNumber:
      violationNumber
  });

  const remainingWarningsUntilSuspension =
    Math.max(
      0,
      3 - violationNumber
    );

  return {
    blocked: false,
    warned: true,
    suspended: false,
    banned: false,
    warnings:
      violationNumber,
    blockedUntil: null,
    detectedWords:
      moderationResult.detectedWords,
    severity:
      moderationResult.severity,
    message:
      `Warning ${violationNumber}: Your content contains inappropriate language. ` +
      `Please remove it before posting. ` +
      `${
        remainingWarningsUntilSuspension === 1
          ? 'One more violation will result in a 7-day forum suspension.'
          : `${remainingWarningsUntilSuspension} more violations will result in a 7-day forum suspension.`
      }`
  };
}

// =========================================================
// GET CURRENT USER'S FORUM STATUS
// =========================================================

router.get(
  '/status',
  auth,
  async (req, res) => {
    try {
      const user =
        await User.findById(
          req.user._id
        );

      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      const currentStatus =
        getForumStatus(user);

      // Automatically restore expired suspension
      if (
        user.forumStatus ===
          'suspended' &&
        user.forumBlockedUntil &&
        new Date(
          user.forumBlockedUntil
        ) <= new Date()
      ) {
        user.forumStatus =
          'active';

        user.forumBlockedUntil =
          null;

        user.isBlockedFromForum =
          false;

        await user.save();

        // Notify user
        await notifyForumSuspensionEnded({
          userId: user._id
        });

        currentStatus.status =
          'active';

        currentStatus.canParticipate =
          true;

        currentStatus.blocked =
          false;

        currentStatus.suspended =
          false;

        currentStatus.banned =
          false;

        currentStatus.blockedUntil =
          null;

        currentStatus.message =
          'Your forum access is active.';
      }

      let remainingMs = 0;

      if (
        currentStatus.status ===
          'suspended' &&
        currentStatus.blockedUntil
      ) {
        remainingMs =
          Math.max(
            0,
            new Date(
              currentStatus.blockedUntil
            ).getTime() -
            Date.now()
          );
      }

      res.json({
        success: true,

        forumStatus:
          currentStatus.status,

        canParticipate:
          currentStatus.canParticipate,

        blocked:
          currentStatus.blocked,

        suspended:
          currentStatus.suspended,

        banned:
          currentStatus.banned,

        warnings:
          user.forumWarnings || 0,

        blockedUntil:
          currentStatus.blockedUntil,

        remainingMs,

        message:
          currentStatus.message
      });
    } catch (error) {
      console.error(
        'Error fetching forum status:',
        error
      );

      res.status(500).json({
        success: false,
        error:
          'Failed to fetch forum status'
      });
    }
  }
);

// =========================================================
// CREATE A NEW FORUM POST
// =========================================================

router.post(
  '/posts',
  auth,
  checkForumAccess,
  upload.array('images', 3),
  async (req, res) => {
    try {
      console.log(
        '🔥 USER DATA:',
        req.user
      );

      console.log(
        '🔥 WARNINGS:',
        req.user.forumWarnings
      );

      console.log(
        '🔥 FORUM STATUS:',
        req.user.forumStatus
      );

      console.log(
        '🔥 BLOCKED UNTIL:',
        req.user.forumBlockedUntil
      );

      const {
        title,
        content,
        category,
        crop,
        tags
      } = req.body;

      // -------------------------------------------------------
      // Basic validation
      // -------------------------------------------------------

      if (
        !title ||
        !content ||
        !category
      ) {
        deleteUploadedFiles(
          req.files
        );

        return res.status(400).json({
          error:
            'Title, content, and category are required'
        });
      }

      // -------------------------------------------------------
      // Content moderation
      // -------------------------------------------------------

      const moderationResult =
        await handleContentModeration(
          req.user,
          content,
          title
        );

      // -------------------------------------------------------
      // 4th violation = permanent ban
      // -------------------------------------------------------

      if (
        moderationResult.banned
      ) {
        deleteUploadedFiles(
          req.files
        );

        return res.status(403).json({
          success: false,
          error:
            moderationResult.message,
          blocked: true,
          banned: true,
          suspended: false,
          warned: false,
          forumStatus: 'banned',
          warnings:
            moderationResult.warnings,
          blockedUntil: null,
          detectedWords:
            moderationResult.detectedWords
        });
      }

      // -------------------------------------------------------
      // 3rd violation = 7-day suspension
      // -------------------------------------------------------

      if (
        moderationResult.suspended
      ) {
        deleteUploadedFiles(
          req.files
        );

        return res.status(403).json({
          success: false,
          error:
            moderationResult.message,
          blocked: true,
          banned: false,
          suspended: true,
          warned: false,
          forumStatus:
            'suspended',
          warnings:
            moderationResult.warnings,
          blockedUntil:
            moderationResult.blockedUntil,
          detectedWords:
            moderationResult.detectedWords
        });
      }

      // -------------------------------------------------------
      // 1st / 2nd violation = warning
      // -------------------------------------------------------

      if (
        moderationResult.warned
      ) {
        deleteUploadedFiles(
          req.files
        );

        return res.status(400).json({
          success: false,
          error:
            moderationResult.message,
          blocked: false,
          banned: false,
          suspended: false,
          warned: true,
          forumStatus: 'active',
          warnings:
            moderationResult.warnings,
          blockedUntil: null,
          detectedWords:
            moderationResult.detectedWords
        });
      }

      // -------------------------------------------------------
      // Process images
      // -------------------------------------------------------

      const images =
        req.files
          ? req.files.map(
              (file) =>
                `/uploads/forum/${file.filename}`
            )
          : [];

      // -------------------------------------------------------
      // Parse tags safely
      // -------------------------------------------------------

      let parsedTags = [];

      if (tags) {
        try {
          parsedTags =
            JSON.parse(tags);

          if (
            !Array.isArray(
              parsedTags
            )
          ) {
            parsedTags = [];
          }
        } catch (error) {
          deleteUploadedFiles(
            req.files
          );

          return res.status(400).json({
            error:
              'Invalid tags format'
          });
        }
      }

      // -------------------------------------------------------
      // Create post
      // -------------------------------------------------------

      const forumPost =
        new ForumPost({
          userId:
            req.user._id,

          userName:
            req.user.fullName ||
            'Anonymous Farmer',

          userLocation:
            req.user.state || '',

          title:
            title.trim(),

          content:
            content.trim(),

          category,

          crop:
            crop
              ? crop.trim()
              : '',

          images,

          tags:
            parsedTags
        });

      await forumPost.save();

      // -------------------------------------------------------
      // Log activity
      // -------------------------------------------------------

      await logActivity(
        req.user._id,
        {
          activityType:
            'community-forum',

          title:
            `Forum Post Created - ${title}`,

          description:
            `Created forum post in ${category} category`,

          status:
            'completed',

          result:
            'Post published successfully',

          relatedId:
            forumPost._id,

          relatedModel:
            'ForumPost',

          metadata: {
            category,
            crop,
            hasImages:
              images.length > 0
          }
        }
      );

      res.json({
        success: true,

        message:
          'Post created successfully',

        post:
          forumPost
      });
    } catch (error) {
      console.error(
        'Error creating forum post:',
        error
      );

      deleteUploadedFiles(
        req.files
      );

      res.status(500).json({
        error:
          'Failed to create post'
      });
    }
  }
);

// =========================================================
// GET ALL FORUM POSTS
// =========================================================

router.get(
  '/posts',
  async (req, res) => {
    try {
      const {
        category,
        crop,
        status,
        search,
        page = 1,
        limit = 20,
        sort = 'recent'
      } = req.query;

      const query = {};

      if (category) {
        query.category =
          category;
      }

      if (crop) {
        query.crop = crop;
      }

      if (status) {
        query.status =
          status;
      }

      if (search) {
        query.$or = [
          {
            title: {
              $regex:
                search,
              $options:
                'i'
            }
          },
          {
            content: {
              $regex:
                search,
              $options:
                'i'
            }
          },
          {
            tags: {
              $regex:
                search,
              $options:
                'i'
            }
          }
        ];
      }

      let sortOption = {};

      if (
        sort ===
        'recent'
      ) {
        sortOption = {
          createdAt: -1
        };
      } else if (
        sort ===
        'popular'
      ) {
        sortOption = {
          views: -1,
          upvotes: -1
        };
      } else if (
        sort ===
        'answered'
      ) {
        sortOption = {
          replies: -1
        };
      }

      const parsedPage =
        Math.max(
          1,
          parseInt(
            page,
            10
          ) || 1
        );

      const parsedLimit =
        Math.min(
          50,
          Math.max(
            1,
            parseInt(
              limit,
              10
            ) || 20
          )
        );

      const posts =
        await ForumPost.find(
          query
        )
          .sort(
            sortOption
          )
          .limit(
            parsedLimit
          )
          .skip(
            (parsedPage - 1) *
              parsedLimit
          );

      // Add replyCount and remove full replies from list response
      const postsWithCount =
        posts.map(
          (post) => {
            const postObj =
              post.toObject();

            const replyCount =
              postObj.replies
                ? postObj.replies.length
                : 0;

            postObj.replyCount =
              replyCount;

            delete postObj.replies;

            return postObj;
          }
        );

      const count =
        await ForumPost.countDocuments(
          query
        );

      res.json({
        success: true,

        posts:
          postsWithCount,

        totalPages:
          Math.ceil(
            count /
              parsedLimit
          ),

        currentPage:
          parsedPage,

        totalPosts:
          count
      });
    } catch (error) {
      console.error(
        'Error fetching forum posts:',
        error
      );

      res.status(500).json({
        error:
          'Failed to fetch posts'
      });
    }
  }
);

// =========================================================
// GET SINGLE POST WITH REPLIES
// =========================================================

router.get(
  '/posts/:postId',
  async (req, res) => {
    try {
      const post =
        await ForumPost.findById(
          req.params.postId
        );

      if (!post) {
        return res.status(404).json({
          error:
            'Post not found'
        });
      }

      // Increment views
      post.views =
        (post.views || 0) + 1;

      await post.save();

      res.json({
        success: true,
        post
      });
    } catch (error) {
      console.error(
        'Error fetching post:',
        error
      );

      res.status(500).json({
        error:
          'Failed to fetch post'
      });
    }
  }
);

// =========================================================
// ADD REPLY
// =========================================================

router.post(
  '/posts/:postId/replies',
  auth,
  checkForumAccess,
  upload.array('images', 2),
  async (req, res) => {
    try {
      const {
        content
      } = req.body;

      if (
        !content ||
        !content.trim()
      ) {
        deleteUploadedFiles(
          req.files
        );

        return res.status(400).json({
          error:
            'Content is required'
        });
      }

      // -------------------------------------------------------
      // Content moderation
      // -------------------------------------------------------

      const moderationResult =
        await handleContentModeration(
          req.user,
          content
        );

      // -------------------------------------------------------
      // Permanent ban
      // -------------------------------------------------------

      if (
        moderationResult.banned
      ) {
        deleteUploadedFiles(
          req.files
        );

        return res.status(403).json({
          success: false,
          error:
            moderationResult.message,
          blocked: true,
          banned: true,
          suspended: false,
          warned: false,
          forumStatus:
            'banned',
          warnings:
            moderationResult.warnings,
          blockedUntil: null,
          detectedWords:
            moderationResult.detectedWords
        });
      }

      // -------------------------------------------------------
      // 7-day suspension
      // -------------------------------------------------------

      if (
        moderationResult.suspended
      ) {
        deleteUploadedFiles(
          req.files
        );

        return res.status(403).json({
          success: false,
          error:
            moderationResult.message,
          blocked: true,
          banned: false,
          suspended: true,
          warned: false,
          forumStatus:
            'suspended',
          warnings:
            moderationResult.warnings,
          blockedUntil:
            moderationResult.blockedUntil,
          detectedWords:
            moderationResult.detectedWords
        });
      }

      // -------------------------------------------------------
      // Warning
      // -------------------------------------------------------

      if (
        moderationResult.warned
      ) {
        deleteUploadedFiles(
          req.files
        );

        return res.status(400).json({
          success: false,
          error:
            moderationResult.message,
          blocked: false,
          banned: false,
          suspended: false,
          warned: true,
          forumStatus:
            'active',
          warnings:
            moderationResult.warnings,
          blockedUntil: null,
          detectedWords:
            moderationResult.detectedWords
        });
      }

      // -------------------------------------------------------
      // Find post
      // -------------------------------------------------------

      const post =
        await ForumPost.findById(
          req.params.postId
        );

      if (!post) {
        deleteUploadedFiles(
          req.files
        );

        return res.status(404).json({
          error:
            'Post not found'
        });
      }

      // -------------------------------------------------------
      // Process reply images
      // -------------------------------------------------------

      const images =
        req.files
          ? req.files.map(
              (file) =>
                `/uploads/forum/${file.filename}`
            )
          : [];

      const reply = {
        userId:
          req.user._id,

        userName:
          req.user.fullName ||
          'Anonymous Farmer',

        content:
          content.trim(),

        images
      };

      post.replies.push(
        reply
      );

      // Update status if open
      if (
        post.status ===
          'open' &&
        post.replies.length >
          0
      ) {
        post.status =
          'answered';
      }

      await post.save();

      // -------------------------------------------------------
      // NOTIFICATION: POST OWNER
      // -------------------------------------------------------

      await notifyPostReply({
        postOwnerId:
          post.userId,

        senderId:
          req.user._id,

        senderName:
          req.user.fullName ||
          'Anonymous Farmer',

        postId:
          post._id,

        postTitle:
          post.title
      });

      // -------------------------------------------------------
      // Log activity
      // -------------------------------------------------------

      await logActivity(
        req.user._id,
        {
          activityType:
            'community-forum',

          title:
            `Reply Added - ${post.title}`,

          description:
            `Added reply to forum post: ${post.title}`,

          status:
            'completed',

          result:
            'Reply published successfully',

          relatedId:
            post._id,

          relatedModel:
            'ForumPost',

          metadata: {
            postTitle:
              post.title,

            category:
              post.category,

            hasImages:
              images.length > 0
          }
        }
      );

      res.json({
        success: true,

        message:
          'Reply added successfully',

        reply:
          post.replies[
            post.replies.length - 1
          ]
      });
    } catch (error) {
      console.error(
        'Error adding reply:',
        error
      );

      deleteUploadedFiles(
        req.files
      );

      res.status(500).json({
        error:
          'Failed to add reply'
      });
    }
  }
);

// =========================================================
// UPVOTE A POST
// =========================================================

router.post(
  '/posts/:postId/upvote',
  auth,
  async (req, res) => {
    try {
      const post =
        await ForumPost.findById(
          req.params.postId
        );

      if (!post) {
        return res.status(404).json({
          error:
            'Post not found'
        });
      }

      const userId =
        req.user._id;

      const upvoteIndex =
        post.upvotes.indexOf(
          userId
        );

      if (
        upvoteIndex > -1
      ) {
        post.upvotes.splice(
          upvoteIndex,
          1
        );
      } else {
        post.upvotes.push(
          userId
        );
      }

      await post.save();

      // -------------------------------------------------------
      // NOTIFICATION: POST LIKE
      // Only notify when a like is added.
      // Do not notify when the user removes their like.
      // -------------------------------------------------------

      if (
        upvoteIndex === -1
      ) {
        await notifyPostLike({
          postOwnerId:
            post.userId,

          senderId:
            req.user._id,

          senderName:
            req.user.fullName ||
            'Anonymous Farmer',

          postId:
            post._id
        });
      }

      res.json({
        success: true,
        upvoted:
          upvoteIndex === -1,
        upvoteCount:
          post.upvotes.length
      });
    } catch (error) {
      console.error(
        'Error upvoting post:',
        error
      );

      res.status(500).json({
        error:
          'Failed to upvote post'
      });
    }
  }
);

// =========================================================
// UPVOTE A REPLY
// =========================================================

router.post(
  '/posts/:postId/replies/:replyId/upvote',
  auth,
  async (req, res) => {
    try {
      const post =
        await ForumPost.findById(
          req.params.postId
        );

      if (!post) {
        return res.status(404).json({
          error:
            'Post not found'
        });
      }

      const reply =
        post.replies.id(
          req.params.replyId
        );

      if (!reply) {
        return res.status(404).json({
          error:
            'Reply not found'
        });
      }

      const userId =
        req.user._id;

      const upvoteIndex =
        reply.upvotes.indexOf(
          userId
        );

      if (
        upvoteIndex > -1
      ) {
        reply.upvotes.splice(
          upvoteIndex,
          1
        );
      } else {
        reply.upvotes.push(
          userId
        );
      }

      await post.save();

      // -------------------------------------------------------
      // NOTIFICATION: REPLY LIKE
      // -------------------------------------------------------

      if (
        upvoteIndex === -1
      ) {
        await notifyReplyLike({
          replyOwnerId:
            reply.userId,

          senderId:
            req.user._id,

          senderName:
            req.user.fullName ||
            'Anonymous Farmer',

          postId:
            post._id,

          replyId:
            reply._id
        });
      }

      res.json({
        success: true,
        upvoted:
          upvoteIndex === -1,
        upvoteCount:
          reply.upvotes.length
      });
    } catch (error) {
      console.error(
        'Error upvoting reply:',
        error
      );

      res.status(500).json({
        error:
          'Failed to upvote reply'
      });
    }
  }
);

// =========================================================
// GET USER'S POSTS
// =========================================================

router.get(
  '/my-posts',
  auth,
  async (req, res) => {
    try {
      const posts =
        await ForumPost.find({
          userId:
            req.user._id
        })
          .sort({
            createdAt: -1
          })
          .select('-replies');

      res.json({
        success: true,
        posts
      });
    } catch (error) {
      console.error(
        'Error fetching user posts:',
        error
      );

      res.status(500).json({
        error:
          'Failed to fetch posts'
      });
    }
  }
);

// =========================================================
// FLAG A POST
// =========================================================

router.post(
  '/posts/:postId/flag',
  auth,
  async (req, res) => {
    try {
      const {
        reason
      } = req.body;

      const post =
        await ForumPost.findById(
          req.params.postId
        );

      if (!post) {
        return res.status(404).json({
          error:
            'Post not found'
        });
      }

      post.flagged = true;

      post.flagReason =
        reason ||
        'Reported by user';

      await post.save();

      res.json({
        success: true,

        message:
          'Post flagged for review'
      });
    } catch (error) {
      console.error(
        'Error flagging post:',
        error
      );

      res.status(500).json({
        error:
          'Failed to flag post'
      });
    }
  }
);

// =========================================================
// GET POPULAR TAGS
// =========================================================

router.get(
  '/tags',
  async (req, res) => {
    try {
      const posts =
        await ForumPost.find(
          {},
          'tags'
        );

      const tagCounts = {};

      posts.forEach(
        (post) => {
          post.tags.forEach(
            (tag) => {
              tagCounts[tag] =
                (tagCounts[tag] || 0) +
                1;
            }
          );
        }
      );

      const sortedTags =
        Object.entries(
          tagCounts
        )
          .sort(
            (a, b) =>
              b[1] - a[1]
          )
          .slice(0, 20)
          .map(
            ([tag, count]) => ({
              tag,
              count
            })
          );

      res.json({
        success: true,
        tags: sortedTags
      });
    } catch (error) {
      console.error(
        'Error fetching tags:',
        error
      );

      res.status(500).json({
        error:
          'Failed to fetch tags'
      });
    }
  }
);

// =========================================================
// MULTER / UPLOAD ERROR HANDLER
// =========================================================

router.use(
  (error, req, res, next) => {
    if (
      error instanceof
      multer.MulterError
    ) {
      if (
        error.code ===
        'LIMIT_FILE_SIZE'
      ) {
        return res.status(400).json({
          success: false,
          error:
            'Image size must be 5MB or smaller.'
        });
      }

      return res.status(400).json({
        success: false,
        error:
          error.message ||
          'Image upload failed.'
      });
    }

    if (error) {
      if (
        error.message &&
        error.message.includes(
          'Only image files are allowed'
        )
      ) {
        return res.status(400).json({
          success: false,
          error:
            error.message
        });
      }

      console.error(
        'Forum route error:',
        error
      );

      return res.status(500).json({
        success: false,
        error:
          'Forum request failed.'
      });
    }

    next();
  }
);

module.exports = router;