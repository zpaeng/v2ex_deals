const axios = require('axios');
const xml2js = require('xml2js');
const TelegramBot = require('node-telegram-bot-api');

// Telegram Bot Token
const botToken = process.env.TELEGRAM_BOT_TOKEN;
const chatId = process.env.TELEGRAM_CHAT_ID;
const bot = new TelegramBot(botToken, { polling: true });

// 获取并解析 XML 数据
async function fetchAndParseXML() {
    try {
        const response = await axios.get('https://www.v2ex.com/feed/tab/deals.xml');
        const result = await xml2js.parseStringPromise(response.data);
        console.log('----' + result);
        return result.rss.channel[0].item;
    } catch (error) {
        console.error('Error fetching or parsing XML:', error);
        return [];
    }
}

// 筛选最近5分钟的帖子
function filterRecentPosts(posts) {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    return posts.filter(post => {
        const postDate = new Date(post.pubDate[0]);
        return postDate >= fiveMinutesAgo;
    });
}

// 推送消息到 Telegram
function pushToTelegram(posts) {
    if (posts.length === 0) {
        console.log('No recent posts to push.');
        return;
    }

    posts.forEach(post => {
        const message = `Title: ${post.title[0]}\nLink: ${post.link[0]}\nDate: ${post.pubDate[0]}`;
        bot.sendMessage(chatId, message);
    });
}

// 定时任务，每5分钟执行一次
const main = async () => {
    console.log('Fetching and processing posts...');
    const posts = await fetchAndParseXML();
    const recentPosts = filterRecentPosts(posts);
    console.log(recentPosts);
    pushToTelegram(recentPosts);
};

// 调用主函数
main();
