const axios = require('axios');
const xml2js = require('xml2js');
const TelegramBot = require('node-telegram-bot-api');
const moment = require('moment-timezone'); 
const { decode } = require('html-entities');

// Telegram Bot Token
const botToken = process.env.TELEGRAM_BOT_TOKEN;
const chatId = process.env.TELEGRAM_CHAT_ID;
const bot = new TelegramBot(botToken, { polling: true });

// console.log('botToken---' + botToken)
// console.log('chatId---' + chatId)
// 获取并解析 XML 数据
async function fetchAndParseXML() {
    try {
        const response = await axios.get('https://www.v2ex.com/feed/tab/deals.xml');
        const result = await xml2js.parseStringPromise(response.data);
        return result.feed.entry;
    } catch (error) {
        console.error('Error fetching or parsing XML:', error);
        return [];
    }
}

// 筛选最近5分钟的帖子
function filterRecentPosts(posts) {
    const nowInShanghai = moment().tz('Asia/Shanghai');
    const fiveMinutesAgo = nowInShanghai.subtract(20, 'minutes').toDate();
    return posts.filter(post => {
        const postDate = new Date(post.published[0]);
        return postDate >= fiveMinutesAgo;
    });
}

// 推送消息到 Telegram
async function pushToTelegram(posts) {
    if (posts.length === 0) {
        console.log('No recent posts to push.');
        return;
    }
    posts.forEach(async post => {
        try {
            const decodedContent = decode(post.content[0]._); // 解码 HTML 实体
            // console.log('decodedContent--' + decodedContent)
            const message = `
                <b>Title:</b> ${post.title[0]}
                <br><b>Link:</b> <a href="${post.link[0].$.href}">${post.link[0].$.href}</a>
                <br><b>Date:</b> ${post.published[0]}
            `;
            await bot.sendMessage(chatId, message, { parse_mode: 'HTML' });
            console.log('Message sent successfully:', message);
        } catch (err) {
            console.error('Error sending message:', err);
        }
        
    });
}

// 定时任务，每5分钟执行一次
const main = async () => {
    try {
        const posts = await fetchAndParseXML();
        const recentPosts = filterRecentPosts(posts);
        // console.log('recentPosts--' + JSON.stringify(recentPosts));
        if (recentPosts) {
            pushToTelegram(recentPosts);
        }
        await bot.sendMessage(chatId, "message");
        console.log('Excute Finished.');
    } catch (error) {
        console.error('Error:', error);
    } finally {
        // 确保脚本在执行完所有操作后正常退出
        process.exit(0);
    }
};

// 调用主函数
main();
