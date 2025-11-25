const express = require('express');
const router = express.Router();
const AgriNews = require('../models/AgriNews');
const auth = require('../middleware/auth');
const Parser = require('rss-parser');
const axios = require('axios');
const { logActivity, getUserIdFromRequest } = require('./activities');

const rssParser = new Parser();

// RSS feed sources for Indian agriculture news
const RSS_FEEDS = [
  {
    name: 'AgriFarming',
    url: 'https://agrifarming.in/feed',
    category: 'crop-advisory' // Maps to model enum
  },
  {
    name: 'India.gov Agriculture',
    url: 'https://services.india.gov.in/feed/rss?cat=1&ln=en',
    category: 'government'
  },
  {
    name: 'PIB Agriculture',
    url: 'https://pib.gov.in/RssMain.aspx?ModId=6&Lang=1',
    category: 'general' // Maps to model enum
  }
];

// NewsAPI configuration (optional - requires API key from https://newsapi.org/)
const NEWS_API_KEY = process.env.NEWS_API_KEY || null;

// Fetch fresh news from RSS feeds
router.get('/fetch-rss', async (req, res) => {
  try {
    const allNews = [];
    const errors = [];
    
    for (const feed of RSS_FEEDS) {
      try {
        console.log(`Fetching RSS from ${feed.name}: ${feed.url}`);
        const parsedFeed = await rssParser.parseURL(feed.url);
        
        if (parsedFeed && parsedFeed.items) {
          for (const item of parsedFeed.items.slice(0, 10)) { // Get latest 10 from each feed
            const newsItem = {
              title: item.title || 'Untitled',
              content: item.contentSnippet || item.content || item.description || '',
              summary: (item.contentSnippet || item.content || item.description || '').substring(0, 250),
              source: feed.name,
              sourceUrl: item.link || item.guid || '',
              imageUrl: item.enclosure?.url || item.image?.url || item.media?.thumbnail?.url || '',
              category: feed.category,
              publishDate: new Date(item.pubDate || item.isoDate || Date.now()),
              active: true,
              relevantStates: [],
              relevantCrops: [],
              priority: 'medium'
            };
            
            allNews.push(newsItem);
          }
          console.log(`✅ Successfully fetched ${parsedFeed.items.length} items from ${feed.name}`);
        }
      } catch (feedError) {
        const errorMsg = `Error fetching RSS from ${feed.name}: ${feedError.message}`;
        console.error(errorMsg);
        errors.push({ feed: feed.name, error: feedError.message });
      }
    }
    
    // If no news fetched from RSS, return sample news
    if (allNews.length === 0) {
      const sampleNews = getSampleNews();
      return res.json({
        success: true,
        news: sampleNews,
        count: sampleNews.length,
        message: 'RSS feeds unavailable. Showing sample agriculture news.',
        errors
      });
    }
    
    res.json({
      success: true,
      news: allNews,
      count: allNews.length,
      message: `Fetched ${allNews.length} news articles from RSS feeds`,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error('Error fetching RSS news:', error);
    // Return sample news as fallback
    const sampleNews = getSampleNews();
    res.json({
      success: true,
      news: sampleNews,
      count: sampleNews.length,
      message: 'RSS feeds unavailable. Showing sample agriculture news.',
      error: error.message
    });
  }
});

// Helper function to provide sample news when RSS fails
function getSampleNews() {
  return [
    {
      title: "PM-KISAN: New Payment Guidelines Released for 2025",
      content: "The Ministry of Agriculture has released updated guidelines for PM-KISAN scheme payments. Farmers are advised to verify their Aadhaar linkage and bank details to ensure timely receipt of the next installment.",
      source: {
        name: "Ministry of Agriculture",
        url: "https://pmkisan.gov.in/",
        type: "official"
      },
      imageUrl: "",
      category: "government",
      publishDate: new Date(),
      active: true,
      relevantStates: [],
      relevantCrops: [],
      priority: 'high',
      tags: []
    },
    {
      title: "Kharif Crop Planning: Expert Advisory for Upcoming Season",
      content: "Agricultural experts recommend early planning for Kharif season 2025. Focus on water conservation, soil health management, and selection of drought-resistant varieties based on monsoon predictions.",
      source: {
        name: "Agricultural Extension Services",
        url: "https://www.india.gov.in/topics/agriculture",
        type: "official"
      },
      imageUrl: "",
      category: "crop-advisory",
      publishDate: new Date(Date.now() - 86400000), // 1 day ago
      active: true,
      relevantStates: [],
      relevantCrops: ['rice', 'cotton', 'soybean'],
      priority: 'high',
      tags: []
    },
    {
      title: "Soil Health Card Distribution Accelerated Across States",
      content: "The government has intensified the distribution of Soil Health Cards to farmers. Over 50 lakh cards distributed this month, helping farmers optimize fertilizer use and improve soil quality.",
      source: {
        name: "Department of Agriculture",
        url: "https://soilhealth.dac.gov.in/",
        type: "official"
      },
      imageUrl: "",
      category: "government",
      publishDate: new Date(Date.now() - 172800000), // 2 days ago
      active: true,
      relevantStates: [],
      relevantCrops: [],
      priority: 'medium',
      tags: []
    },
    {
      title: "Organic Farming: Demand Surges, Export Opportunities Increase",
      content: "Indian organic produce seeing unprecedented global demand. APEDA reports 30% increase in organic exports. Farmers encouraged to adopt organic methods with government subsidies available.",
      source: {
        name: "APEDA News",
        url: "https://apeda.gov.in/",
        type: "official"
      },
      imageUrl: "",
      category: "market",
      publishDate: new Date(Date.now() - 259200000), // 3 days ago
      active: true,
      relevantStates: [],
      relevantCrops: [],
      priority: 'medium',
      tags: []
    },
    {
      title: "e-NAM: Record Trading Volume Achieved in Agricultural Commodities",
      content: "National Agriculture Market (e-NAM) platform records highest ever trading volume. Over 2.5 crore farmers now registered. Digital payment adoption increases to 85%.",
      source: {
        name: "e-NAM Platform",
        url: "https://www.enam.gov.in/",
        type: "official"
      },
      imageUrl: "",
      category: 'market',
      publishDate: new Date(Date.now() - 345600000), // 4 days ago
      active: true,
      relevantStates: [],
      relevantCrops: [],
      priority: 'medium',
      tags: []
    }
  ];
}

// Fetch news from NewsAPI (requires API key)
router.get('/fetch-newsapi', async (req, res) => {
  try {
    if (!NEWS_API_KEY) {
      return res.status(400).json({ 
        error: 'NewsAPI key not configured',
        message: 'Add NEWS_API_KEY to your .env file. Get key from https://newsapi.org/'
      });
    }
    
    const url = `https://newsapi.org/v2/top-headlines?country=in&category=general&q=agriculture OR farming&pageSize=20&apiKey=${NEWS_API_KEY}`;
    const response = await axios.get(url);
    const data = response.data;
    
    if (data.status !== 'ok') {
      throw new Error(data.message || 'NewsAPI request failed');
    }
    
    const formattedNews = data.articles.map(article => ({
      title: article.title,
      content: article.description || article.content || '',
      summary: (article.description || '').substring(0, 250),
      source: article.source.name,
      sourceUrl: article.url,
      imageUrl: article.urlToImage || '',
                category: 'general',
      publishDate: new Date(article.publishedAt),
      active: true,
      relevantStates: [],
      relevantCrops: [],
      priority: 'medium'
    }));
    
    res.json({
      success: true,
      news: formattedNews,
      count: formattedNews.length,
      message: `Fetched ${formattedNews.length} news articles from NewsAPI`
    });
  } catch (error) {
    console.error('Error fetching NewsAPI:', error);
    res.status(500).json({ error: 'Failed to fetch NewsAPI news', message: error.message });
  }
});

// Quick refresh endpoint (GET for easy browser testing)
router.get('/admin/refresh-all', async (req, res) => {
  // Redirect to POST handler
  try {
    let savedCount = 0;
    const sources = { rss: 0, newsapi: 0, sample: 0 };
    const errors = [];
    const fetchedItems = [];
    
    console.log('🔄 Starting comprehensive news refresh (GET)...');
    
    // 1. Fetch from RSS feeds
    for (const feed of RSS_FEEDS) {
      try {
        console.log(`\n📡 [RSS] Fetching from ${feed.name}: ${feed.url}`);
        const parsedFeed = await rssParser.parseURL(feed.url);
        
        if (parsedFeed && parsedFeed.items) {
          console.log(`   ✅ Received ${parsedFeed.items.length} items from ${feed.name}`);
          
          for (const item of parsedFeed.items.slice(0, 5)) {
            const sourceUrl = item.link || item.guid || `${feed.name}-${Date.now()}`;
            const existingNews = await AgriNews.findOne({ 'source.url': sourceUrl });
            
            if (!existingNews && item.title) {
              console.log(`   📝 Processing: "${item.title.substring(0, 50)}..."`);
              
              const newsItem = new AgriNews({
                title: item.title,
                content: item.contentSnippet || item.content || item.description || '',
                source: {
                  name: feed.name,
                  url: sourceUrl,
                  type: feed.category === 'government' ? 'official' : 'news'
                },
                imageUrl: item.enclosure?.url || item.image?.url || '',
                category: feed.category === 'government' ? 'government' : 'general',
                publishDate: new Date(item.pubDate || item.isoDate || Date.now()),
                active: true,
                relevantStates: [],
                relevantCrops: [],
                priority: 'medium',
                tags: []
              });
              
              await newsItem.save();
              savedCount++;
              sources.rss++;
              fetchedItems.push({ source: feed.name, title: item.title });
              console.log(`   ✅ Saved: "${item.title.substring(0, 50)}..."`);
            } else if (existingNews) {
              console.log(`   ⏭️  Skipped (already exists): "${item.title.substring(0, 50)}..."`);
            }
          }
        } else {
          console.log(`   ⚠️  No items received from ${feed.name}`);
        }
      } catch (feedError) {
        console.error(`   ❌ Error fetching RSS from ${feed.name}:`, feedError.message);
        errors.push({ source: feed.name, type: 'RSS', error: feedError.message });
      }
    }
    
    // 2. Fetch from NewsAPI if available
    if (NEWS_API_KEY) {
      try {
        console.log(`\n📡 [NewsAPI] Fetching agriculture news...`);
        const url = `https://newsapi.org/v2/everything?q=agriculture OR farming OR crops OR farmers&language=en&sortBy=publishedAt&pageSize=20&apiKey=${NEWS_API_KEY}`;
        const response = await axios.get(url);
        const data = response.data;
        
        console.log(`   📊 NewsAPI response status: ${data.status}`);
        
        if (data.status === 'ok' && data.articles) {
          console.log(`   ✅ Received ${data.articles.length} articles from NewsAPI`);
          
          for (const article of data.articles.slice(0, 10)) {
            const existingNews = await AgriNews.findOne({ 'source.url': article.url });
            
            if (!existingNews && article.title) {
              console.log(`   📝 Processing: "${article.title.substring(0, 50)}..."`);
              
              const newsItem = new AgriNews({
                title: article.title,
                content: article.description || article.content || '',
                source: {
                  name: article.source.name || 'NewsAPI',
                  url: article.url,
                  type: 'news'
                },
                imageUrl: article.urlToImage || '',
                category: 'general',
                publishDate: new Date(article.publishedAt),
                active: true,
                relevantStates: [],
                relevantCrops: [],
                priority: 'medium',
                tags: []
              });
              
              await newsItem.save();
              savedCount++;
              sources.newsapi++;
              fetchedItems.push({ source: article.source.name || 'NewsAPI', title: article.title });
              console.log(`   ✅ Saved: "${article.title.substring(0, 50)}..."`);
            } else if (existingNews) {
              console.log(`   ⏭️  Skipped (already exists): "${article.title.substring(0, 50)}..."`);
            }
          }
        } else {
          console.log(`   ⚠️  NewsAPI returned status: ${data.status}, message: ${data.message || 'N/A'}`);
        }
      } catch (newsApiError) {
        console.error(`   ❌ Error fetching from NewsAPI:`, newsApiError.response?.data || newsApiError.message);
        errors.push({ source: 'NewsAPI', type: 'API', error: newsApiError.message });
      }
    } else {
      console.log(`\n⚠️  NewsAPI key not configured - skipping NewsAPI fetch`);
    }
    
    // 3. If no news was saved, save sample news
    if (savedCount === 0) {
      console.log('\n📝 No news fetched from external sources, saving sample news...');
      const sampleNews = getSampleNews();
      
      for (const newsData of sampleNews) {
        const existingNews = await AgriNews.findOne({ title: newsData.title });
        if (!existingNews) {
          const newsItem = new AgriNews(newsData);
          await newsItem.save();
          savedCount++;
          sources.sample++;
        }
      }
    }
    
    // Get current database stats
    const totalCount = await AgriNews.countDocuments({});
    const activeCount = await AgriNews.countDocuments({ active: true });
    const sampleCount = await AgriNews.countDocuments({ 'source.name': { $in: ['Ministry of Agriculture', 'Agricultural Extension Services', 'Department of Agriculture', 'APEDA News', 'e-NAM Platform'] } });
    const rssCount = await AgriNews.countDocuments({ 'source.name': { $in: ['AgriFarming', 'India.gov Agriculture', 'PIB Agriculture'] } });
    const newsApiCount = await AgriNews.countDocuments({ 'source.name': { $nin: ['Ministry of Agriculture', 'Agricultural Extension Services', 'Department of Agriculture', 'APEDA News', 'e-NAM Platform', 'AgriFarming', 'India.gov Agriculture', 'PIB Agriculture'] } });
    
    console.log(`\n✅ Refresh complete! Summary:`);
    console.log(`   📊 Total saved: ${savedCount}`);
    console.log(`   📡 RSS: ${sources.rss}`);
    console.log(`   🌐 NewsAPI: ${sources.newsapi}`);
    console.log(`   📝 Sample: ${sources.sample}`);
    console.log(`   ❌ Errors: ${errors.length}`);
    
    res.json({
      success: true,
      message: `Refreshed news database. Saved ${savedCount} new articles.`,
      savedCount,
      sources,
      fetchedItems: fetchedItems.slice(0, 20),
      errors: errors.length > 0 ? errors : undefined,
      newsAPIConfigured: !!NEWS_API_KEY,
      databaseStats: {
        total: totalCount,
        active: activeCount,
        sample: sampleCount,
        rss: rssCount,
        newsApi: newsApiCount
      }
    });
  } catch (error) {
    console.error('Error refreshing all news:', error);
    res.status(500).json({ error: 'Failed to refresh news', message: error.message });
  }
});

// Debug endpoint - Check what's in database (must be before /:newsId)
router.get('/debug/stats', async (req, res) => {
  try {
    const totalCount = await AgriNews.countDocuments({});
    const activeCount = await AgriNews.countDocuments({ active: true });
    const sampleCount = await AgriNews.countDocuments({ 'source.name': { $in: ['Ministry of Agriculture', 'Agricultural Extension Services', 'Department of Agriculture', 'APEDA News', 'e-NAM Platform'] } });
    const rssCount = await AgriNews.countDocuments({ 'source.name': { $in: ['AgriFarming', 'India.gov Agriculture', 'PIB Agriculture'] } });
    const newsApiCount = await AgriNews.countDocuments({ 'source.name': { $nin: ['Ministry of Agriculture', 'Agricultural Extension Services', 'Department of Agriculture', 'APEDA News', 'e-NAM Platform', 'AgriFarming', 'India.gov Agriculture', 'PIB Agriculture'] } });
    
    const latestNews = await AgriNews.find({ active: true })
      .sort({ createdAt: -1 })
      .limit(10)
      .select('title source.name category publishDate createdAt');
    
    const sources = await AgriNews.distinct('source.name');
    
    res.json({
      success: true,
      stats: {
        total: totalCount,
        active: activeCount,
        sample: sampleCount,
        rss: rssCount,
        newsApi: newsApiCount
      },
      sources: sources,
      latestNews: latestNews.map(n => ({
        title: n.title,
        source: n.source?.name,
        category: n.category,
        publishDate: n.publishDate,
        createdAt: n.createdAt
      }))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Also add debug info to refresh-all response

// Comprehensive refresh from ALL sources (RSS + NewsAPI) - POST endpoint
router.post('/admin/refresh-all', async (req, res) => {
  try {
    let savedCount = 0;
    const sources = { rss: 0, newsapi: 0, sample: 0 };
    const errors = [];
    const fetchedItems = [];
    
    console.log('🔄 Starting comprehensive news refresh...');
    
    // 1. Fetch from RSS feeds
    for (const feed of RSS_FEEDS) {
      try {
        console.log(`\n📡 [RSS] Fetching from ${feed.name}: ${feed.url}`);
        const parsedFeed = await rssParser.parseURL(feed.url);
        
        if (parsedFeed && parsedFeed.items) {
          console.log(`   ✅ Received ${parsedFeed.items.length} items from ${feed.name}`);
          
          for (const item of parsedFeed.items.slice(0, 5)) {
            const sourceUrl = item.link || item.guid || `${feed.name}-${Date.now()}`;
            const existingNews = await AgriNews.findOne({ 'source.url': sourceUrl });
            
            if (!existingNews && item.title) {
              console.log(`   📝 Processing: "${item.title.substring(0, 50)}..."`);
              
              const newsItem = new AgriNews({
                title: item.title,
                content: item.contentSnippet || item.content || item.description || '',
                source: {
                  name: feed.name,
                  url: sourceUrl,
                  type: feed.category === 'government' ? 'official' : 'news'
                },
                imageUrl: item.enclosure?.url || item.image?.url || '',
                category: feed.category === 'government' ? 'government' : 'general',
                publishDate: new Date(item.pubDate || item.isoDate || Date.now()),
                active: true,
                relevantStates: [],
                relevantCrops: [],
                priority: 'medium',
                tags: []
              });
              
              await newsItem.save();
              savedCount++;
              sources.rss++;
              fetchedItems.push({ source: feed.name, title: item.title });
              console.log(`   ✅ Saved: "${item.title.substring(0, 50)}..."`);
            } else if (existingNews) {
              console.log(`   ⏭️  Skipped (already exists): "${item.title.substring(0, 50)}..."`);
            }
          }
        } else {
          console.log(`   ⚠️  No items received from ${feed.name}`);
        }
      } catch (feedError) {
        console.error(`   ❌ Error fetching RSS from ${feed.name}:`, feedError.message);
        errors.push({ source: feed.name, type: 'RSS', error: feedError.message });
      }
    }
    
    // 2. Fetch from NewsAPI if available
    if (NEWS_API_KEY) {
      try {
        console.log(`\n📡 [NewsAPI] Fetching agriculture news...`);
        const url = `https://newsapi.org/v2/everything?q=agriculture OR farming OR crops OR farmers&language=en&sortBy=publishedAt&pageSize=20&apiKey=${NEWS_API_KEY}`;
        const response = await axios.get(url);
        const data = response.data;
        
        console.log(`   📊 NewsAPI response status: ${data.status}`);
        
        if (data.status === 'ok' && data.articles) {
          console.log(`   ✅ Received ${data.articles.length} articles from NewsAPI`);
          
          for (const article of data.articles.slice(0, 10)) {
            const existingNews = await AgriNews.findOne({ 'source.url': article.url });
            
            if (!existingNews && article.title) {
              console.log(`   📝 Processing: "${article.title.substring(0, 50)}..."`);
              
              const newsItem = new AgriNews({
                title: article.title,
                content: article.description || article.content || '',
                source: {
                  name: article.source.name || 'NewsAPI',
                  url: article.url,
                  type: 'news'
                },
                imageUrl: article.urlToImage || '',
                category: 'general',
                publishDate: new Date(article.publishedAt),
                active: true,
                relevantStates: [],
                relevantCrops: [],
                priority: 'medium',
                tags: []
              });
              
              await newsItem.save();
              savedCount++;
              sources.newsapi++;
              fetchedItems.push({ source: article.source.name || 'NewsAPI', title: article.title });
              console.log(`   ✅ Saved: "${article.title.substring(0, 50)}..."`);
            } else if (existingNews) {
              console.log(`   ⏭️  Skipped (already exists): "${article.title.substring(0, 50)}..."`);
            }
          }
        } else {
          console.log(`   ⚠️  NewsAPI returned status: ${data.status}, message: ${data.message || 'N/A'}`);
        }
      } catch (newsApiError) {
        console.error(`   ❌ Error fetching from NewsAPI:`, newsApiError.response?.data || newsApiError.message);
        errors.push({ source: 'NewsAPI', type: 'API', error: newsApiError.message });
      }
    } else {
      console.log(`\n⚠️  NewsAPI key not configured - skipping NewsAPI fetch`);
    }
    
    // 3. If no news was saved, save sample news
    if (savedCount === 0) {
      console.log('No news fetched from external sources, saving sample news...');
      const sampleNews = getSampleNews();
      
      for (const newsData of sampleNews) {
        const existingNews = await AgriNews.findOne({ title: newsData.title });
        if (!existingNews) {
          const newsItem = new AgriNews(newsData);
          await newsItem.save();
          savedCount++;
          sources.sample++;
        }
      }
    }
    
    console.log(`\n✅ Refresh complete! Summary:`);
    console.log(`   📊 Total saved: ${savedCount}`);
    console.log(`   📡 RSS: ${sources.rss}`);
    console.log(`   🌐 NewsAPI: ${sources.newsapi}`);
    console.log(`   📝 Sample: ${sources.sample}`);
    console.log(`   ❌ Errors: ${errors.length}`);
    
    // Get current database stats
    const totalCount = await AgriNews.countDocuments({});
    const activeCount = await AgriNews.countDocuments({ active: true });
    const sampleCount = await AgriNews.countDocuments({ 'source.name': { $in: ['Ministry of Agriculture', 'Agricultural Extension Services', 'Department of Agriculture', 'APEDA News', 'e-NAM Platform'] } });
    const rssCount = await AgriNews.countDocuments({ 'source.name': { $in: ['AgriFarming', 'India.gov Agriculture', 'PIB Agriculture'] } });
    const newsApiCount = await AgriNews.countDocuments({ 'source.name': { $nin: ['Ministry of Agriculture', 'Agricultural Extension Services', 'Department of Agriculture', 'APEDA News', 'e-NAM Platform', 'AgriFarming', 'India.gov Agriculture', 'PIB Agriculture'] } });
    
    res.json({
      success: true,
      message: `Refreshed news database. Saved ${savedCount} new articles.`,
      savedCount,
      sources,
      fetchedItems: fetchedItems.slice(0, 20), // Show first 20 items
      errors: errors.length > 0 ? errors : undefined,
      newsAPIConfigured: !!NEWS_API_KEY,
      databaseStats: {
        total: totalCount,
        active: activeCount,
        sample: sampleCount,
        rss: rssCount,
        newsApi: newsApiCount
      }
    });
  } catch (error) {
    console.error('Error refreshing all news:', error);
    res.status(500).json({ error: 'Failed to refresh news', message: error.message });
  }
});

// Refresh and save news to database (RSS only)
router.post('/admin/refresh-news', async (req, res) => {
  try {
    let savedCount = 0;
    const allFetchedNews = [];
    const errors = [];
    
    // Fetch from RSS feeds
    for (const feed of RSS_FEEDS) {
      try {
        console.log(`Fetching RSS from ${feed.name}: ${feed.url}`);
        const parsedFeed = await rssParser.parseURL(feed.url);
        
        if (parsedFeed && parsedFeed.items) {
          for (const item of parsedFeed.items.slice(0, 5)) { // Save latest 5 from each feed
            const sourceUrl = item.link || item.guid || `${feed.name}-${Date.now()}`;
            const existingNews = await AgriNews.findOne({ 'source.url': sourceUrl });
            
            if (!existingNews && item.title) {
              const newsItem = new AgriNews({
                title: item.title || 'Untitled',
                content: item.contentSnippet || item.content || item.description || '',
                source: {
                  name: feed.name,
                  url: sourceUrl,
                  type: feed.category === 'government' ? 'official' : 'news'
                },
                imageUrl: item.enclosure?.url || item.image?.url || '',
                category: feed.category === 'government' ? 'government' : 'general',
                publishDate: new Date(item.pubDate || item.isoDate || Date.now()),
                active: true,
                relevantStates: [],
                relevantCrops: [],
                priority: 'medium',
                tags: []
              });
              
              await newsItem.save();
              savedCount++;
              allFetchedNews.push(newsItem);
            }
          }
          console.log(`✅ Processed ${parsedFeed.items.length} items from ${feed.name}`);
        }
      } catch (feedError) {
        console.error(`Error fetching RSS from ${feed.name}:`, feedError.message);
        errors.push({ feed: feed.name, error: feedError.message });
      }
    }
    
    // If no RSS news was saved, save sample news
    if (savedCount === 0) {
      console.log('No RSS news fetched, saving sample news...');
      const sampleNews = getSampleNews();
      
      for (const newsData of sampleNews) {
        const existingNews = await AgriNews.findOne({ title: newsData.title });
        if (!existingNews) {
          const newsItem = new AgriNews(newsData);
          await newsItem.save();
          savedCount++;
        }
      }
    }
    
    res.json({
      success: true,
      message: `Refreshed news database. Saved ${savedCount} new articles.`,
      savedCount,
      totalFetched: allFetchedNews.length,
      errors: errors.length > 0 ? errors : undefined,
      note: savedCount > 0 && allFetchedNews.length === 0 ? 'Sample news added as RSS feeds were unavailable' : undefined
    });
  } catch (error) {
    console.error('Error refreshing news:', error);
    res.status(500).json({ error: 'Failed to refresh news', message: error.message });
  }
});

// Get personalized news feed for user (auth optional - falls back to public feed)
router.get('/feed', async (req, res, next) => {
  // Try to authenticate, but don't fail if token is expired
  let user = null;
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (token) {
      const jwt = require('jsonwebtoken');
      const User = require('../models/User');
      const decoded = jwt.verify(token, process.env.JWT_SECRET || "farmai_secret");
      user = await User.findById(decoded.id);
    }
  } catch (err) {
    // Token expired or invalid - continue without user (public feed)
    console.log('Auth failed, using public feed:', err.message);
  }
  
  try {
    const state = user?.state;
    const crops = user?.crops;
    const { page = 1, limit = 20, category } = req.query;
    
    // Check if database has any news, if not, auto-populate synchronously
    const newsCount = await AgriNews.countDocuments({ active: true });
    if (newsCount === 0) {
      console.log('No news in database, auto-populating sample news...');
      try {
        // Quick sample news insertion
        const sampleNews = getSampleNews();
        const savedNews = [];
        for (const newsData of sampleNews) {
          const existing = await AgriNews.findOne({ title: newsData.title });
          if (!existing) {
            const newsItem = new AgriNews(newsData);
            await newsItem.save();
            savedNews.push(newsItem);
          }
        }
        console.log(`✅ Auto-populated ${savedNews.length} sample news articles`);
      } catch (err) {
        console.error('Error auto-populating:', err);
      }
    }
    
    const query = {
      active: true,
      $or: [
        { expiryDate: { $exists: false } },
        { expiryDate: { $gte: new Date() } }
      ]
    };
    
    // Filter by category if provided
    if (category && category !== 'all') {
      query.category = category;
    }
    
    // Prioritize news relevant to user's state and crops
    const allNews = await AgriNews.find(query)
      .sort({ priority: -1, publishDate: -1 })
      .limit(100); // Get more than needed for filtering
    
    // Score and sort news by relevance
    const scoredNews = allNews.map(news => {
      let relevanceScore = 0;
      
      // Higher score for news matching user's state
      if (state && (news.relevantStates.length === 0 || news.relevantStates.includes(state))) {
        relevanceScore += 10;
      }
      
      // Higher score for news matching user's crops
      if (crops && crops.length > 0) {
        const matchingCrops = news.relevantCrops.filter(crop => crops.includes(crop));
        relevanceScore += matchingCrops.length * 5;
      }
      
      // Priority boost
      if (news.priority === 'critical') relevanceScore += 20;
      else if (news.priority === 'high') relevanceScore += 10;
      else if (news.priority === 'medium') relevanceScore += 5;
      
      // Recency boost (newer = higher score)
      const daysSincePublish = (new Date() - news.publishDate) / (1000 * 60 * 60 * 24);
      if (daysSincePublish < 1) relevanceScore += 15;
      else if (daysSincePublish < 3) relevanceScore += 10;
      else if (daysSincePublish < 7) relevanceScore += 5;
      
      return { ...news.toObject(), relevanceScore };
    });
    
    // Sort by relevance and apply pagination
    scoredNews.sort((a, b) => b.relevanceScore - a.relevanceScore);
    
    const startIndex = (page - 1) * limit;
    const paginatedNews = scoredNews.slice(startIndex, startIndex + parseInt(limit));
    
    res.json({
      success: true,
      news: paginatedNews,
      totalPages: Math.ceil(scoredNews.length / limit),
      currentPage: parseInt(page),
      totalNews: scoredNews.length
    });
  } catch (error) {
    console.error('Error fetching news feed:', error);
    res.status(500).json({ error: 'Failed to fetch news feed', message: error.message });
  }
});

// Get all news with filters (public)
router.get('/all', async (req, res) => {
  try {
    // Check if database has any news, if not, auto-populate
    const newsCount = await AgriNews.countDocuments({ active: true });
    if (newsCount === 0) {
      console.log('No news in database, auto-populating sample news...');
      try {
        const sampleNews = getSampleNews();
        for (const newsData of sampleNews) {
          const existing = await AgriNews.findOne({ title: newsData.title });
          if (!existing) {
            await new AgriNews(newsData).save();
          }
        }
        console.log('✅ Auto-populated sample news');
      } catch (err) {
        console.error('Error auto-populating:', err);
      }
    }
    
    const { category, state, crop, priority, page = 1, limit = 20 } = req.query;
    
    const query = {
      active: true,
      $or: [
        { expiryDate: { $exists: false } },
        { expiryDate: { $gte: new Date() } }
      ]
    };
    
    if (category && category !== 'all') query.category = category;
    if (priority) query.priority = priority;
    if (state) query.$or = [{ relevantStates: state }, { relevantStates: { $size: 0 } }];
    if (crop) query.$or = [{ relevantCrops: crop }, { relevantCrops: { $size: 0 } }];
    
    const news = await AgriNews.find(query)
      .sort({ priority: -1, publishDate: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const count = await AgriNews.countDocuments(query);
    
    res.json({
      success: true,
      news,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
      totalNews: count
    });
  } catch (error) {
    console.error('Error fetching news:', error);
    res.status(500).json({ error: 'Failed to fetch news', message: error.message });
  }
});

// Get trending news (most viewed/liked in last 7 days) - MUST be before /:newsId
router.get('/trending', async (req, res) => {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const trendingNews = await AgriNews.find({
      active: true,
      publishDate: { $gte: sevenDaysAgo }
    })
    .sort({ views: -1, likes: -1 })
    .limit(10);
    
    res.json({ success: true, news: trendingNews });
  } catch (error) {
    console.error('Error fetching trending news:', error);
    res.status(500).json({ error: 'Failed to fetch trending news' });
  }
});

// Get news categories
router.get('/meta/categories', async (req, res) => {
  try {
    const categories = await AgriNews.distinct('category');
    const states = await AgriNews.distinct('relevantStates');
    const crops = await AgriNews.distinct('relevantCrops');
    
    res.json({
      success: true,
      categories,
      states: states.filter(s => s),
      crops: crops.filter(c => c)
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// Get news by ID - MUST be last among GET routes
router.get('/:newsId', async (req, res) => {
  try {
    const news = await AgriNews.findById(req.params.newsId);
    
    if (!news) {
      return res.status(404).json({ error: 'News not found' });
    }
    
    // Increment views
    news.views += 1;
    await news.save();
    
    // Log activity (optional - only if user is authenticated)
    const userId = await getUserIdFromRequest(req);
    if (userId) {
      await logActivity(userId, {
        activityType: 'agri-news',
        title: `News Read - ${news.title}`,
        description: `Read agriculture news: ${news.title.substring(0, 100)}${news.title.length > 100 ? '...' : ''}`,
        status: 'viewed',
        result: 'News article viewed',
        relatedId: news._id,
        relatedModel: 'AgriNews',
        metadata: { category: news.category, source: news.source?.name }
      });
    }
    
    res.json({ success: true, news });
  } catch (error) {
    console.error('Error fetching news:', error);
    res.status(500).json({ error: 'Failed to fetch news' });
  }
});

// Like/unlike news
router.post('/:newsId/like', auth, async (req, res) => {
  try {
    const news = await AgriNews.findById(req.params.newsId);
    
    if (!news) {
      return res.status(404).json({ error: 'News not found' });
    }
    
    const userId = req.user.userId;
    const likeIndex = news.likes.indexOf(userId);
    
    if (likeIndex > -1) {
      news.likes.splice(likeIndex, 1);
    } else {
      news.likes.push(userId);
    }
    
    await news.save();
    
    res.json({
      success: true,
      liked: likeIndex === -1,
      likeCount: news.likes.length
    });
  } catch (error) {
    console.error('Error liking news:', error);
    res.status(500).json({ error: 'Failed to like news' });
  }
});

// Admin: Create news
router.post('/admin/create', async (req, res) => {
  try {
    const news = new AgriNews(req.body);
    await news.save();
    
    res.json({
      success: true,
      message: 'News created successfully',
      news
    });
  } catch (error) {
    console.error('Error creating news:', error);
    res.status(500).json({ error: 'Failed to create news' });
  }
});

// Admin: Update news
router.put('/admin/:newsId', async (req, res) => {
  try {
    const news = await AgriNews.findByIdAndUpdate(
      req.params.newsId,
      req.body,
      { new: true }
    );
    
    if (!news) {
      return res.status(404).json({ error: 'News not found' });
    }
    
    res.json({
      success: true,
      message: 'News updated successfully',
      news
    });
  } catch (error) {
    console.error('Error updating news:', error);
    res.status(500).json({ error: 'Failed to update news' });
  }
});

// Admin: Delete news
router.delete('/admin/:newsId', async (req, res) => {
  try {
    const news = await AgriNews.findByIdAndUpdate(
      req.params.newsId,
      { active: false },
      { new: true }
    );
    
    if (!news) {
      return res.status(404).json({ error: 'News not found' });
    }
    
    res.json({ success: true, message: 'News deactivated successfully' });
  } catch (error) {
    console.error('Error deleting news:', error);
    res.status(500).json({ error: 'Failed to delete news' });
  }
});

module.exports = router;

