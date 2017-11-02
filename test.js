const configs = require('./configs');
const google = require('googleapis');

const YouTubeClient = google.youtube({
    version: 'v3',
    auth: configs.YOUTUBE_API_KEY
 });
 
 
 YouTubeClient.search.list({
     part: 'snippet',
     q: 'your search query'
   }, function (err, data) {
     if (err) {
       console.error('Error: ' + err);
     }
     if (data) {
       console.log(data)
     }
   });

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
