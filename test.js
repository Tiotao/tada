const configs = require('./configs');
const MongoClient = require('mongodb').MongoClient;
const ObjectId = require('mongodb').ObjectId;
const utils = require('./utils/scrape-utils');
const nodeUtil = require('util');

const Twitter = require('twitter');
const TwitterClient = new Twitter({
    consumer_key: configs.TWITTER_CONSUMER_KEY,
    consumer_secret: configs.TWITTER_CONSUMER_SECRET,
    bearer_token: configs.TWITTER_BEARER_TOKEN
});

const TwitterGet = nodeUtil.promisify(TwitterClient.get.bind(TwitterClient));
const parallel = require('async-await-parallel');

const since_id = 925788157089599500;

async function grabLatestTweets() {
    let ret;

    function formatTweet(tweet) {
        let formatted_tweet = {};
        formatted_tweet = {
            content: {
                text: tweet.text,
            },
            source: "twitter",
            media_type: "text",
            search_ref: [{
                keyword: 'battlefront',
                type: 'recent',
            }],
            entities: {
                urls: tweet.entities.urls.reduce((memo, curr)=>{
                    memo.push(curr.expanded_url);
                    return memo
                }, []),
                videos: []
        
            },
            local_id: tweet.id_str,
            author: tweet.user.screen_name,
            timestamp: new Date(tweet.created_at).getTime() / 1000
        }

        for (let i = 0; i < formatted_tweet.entities.urls.length; i++) {
            const regExp = /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
            const match = formatted_tweet.entities.urls[i].match(regExp);
            if (match && match[2].length == 11) {
                formatted_tweet.entities.videos.push({
                    id: match[2],
                    source: "youtube"
                })
            }
        }

        return formatted_tweet;
    }

    try {
        ret = await TwitterGet('search/tweets', {
            q: 'battlefront',
            result_type: 'recent',
            count: 10,
            // since_id: since_id,
            include_entities: true
        });
    } catch (error) {
        ret = []
        console.log(error);
    }

    return ret.statuses.map(formatTweet);
}

async function updateYouTubeLatestMention(tweets) {

    const db = await MongoClient.connect(configs.DB_URL);
    let video_collection = db.collection(configs.VIDEO_COLLECTION);

    function tweetWithVideos(tweet) {
        return tweet.entities.videos.length > 0;
    }

    function videoMentions(mentions, tweet) {
        let videos = tweet.entities.videos;
        for (let i = 0; i < videos.length; i++) {
            mentions.push({
                id: videos[i].id,
                timestamp: tweet.timestamp,
                source: "twitter",
                source_id: tweet.local_id,
            })
        }
        return mentions
    }

    function updateLastMention(mention) {
        return async () => {
            ret = await video_collection.findOneAndUpdate({
                "local_id": mention.id
            }, {
                $set: {
                    "stats": {
                        "last_mention": {
                            "timestamp": mention.timestamp,
                            'source': mention.source,
                            "source_id": mention.source_id
                        }
                    }
                }
            })
            console.log(ret);
            return ret;
        }
    }
    
    const mentions = tweets.filter(tweetWithVideos).reduce(videoMentions, []);
    console.log(mentions);
    let promises = mentions.map(updateLastMention);

    await parallel(promises, 100);

}

async function tweets() {
    const tweets = await grabLatestTweets();
    updateYouTubeLatestMention(tweets);
}

tweets();

// async function cacheLabels() {
//     const db = await MongoClient.connect(configs.DB_URL);
//     let video_collection = db.collection(configs.VIDEO_COLLECTION);

//     const data = await video_collection.aggregate(
//         [
//             {
//                 $project: {
//                     _id: 0,
//                     local_id: 1
//                 }
//             }
//         ]
//     ).toArray();
   
//     console.log(data);
   
//     db.close();
// }

// cacheLabels();
