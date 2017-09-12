
// ---------------- PARAMETERS --------------- //
// <channelID>: Slack channel ID to query for message history
// <oAuthToken>: Slack oAuth token issued to your app / bot for the Slack team
    // you must also allow the permissions scope "channels.history"
// [count]: number of messages to return in the query - default 100 / max 1000 messages
// [start]: beginning timestamp to query message history
    // use most recent metaData.timestamp for this parameter during daily queries
// [end]: ending timestamp to query message history - default to current time


const request = require('request');

function metadataScraper(channelID, oAuthToken, count, start, end){

    let url = `https://slack.com/api/channels.history?token=${oAuthToken}&channel=${channelID}`;

// append optional parameters to the query string
    if(count) url += `&count=${count}`;
    if(start) url += `&oldest=${start}`;
    if(end) url += `&latest=${end}`;

    return new Promise((resolve, reject) => {
        request.post({url}, (error, response, body) => {
            body = JSON.parse(body);
            if(error) reject (error)
            else if(body.ok) resolve(parseMessages(body.messages));
            else reject('unhandled request failure');
        });
    });
}

function parseMessages(messages){
    let userMetaData = [];

    messages.forEach( message => {

        let metaDataIndex;
    // user's metadata doesn't exist --> build their data object
        if(!userMetaData.some( (data, index) => { 
            if(data.user === message.user || 
                data.user === message.bot_id || 
                (message.comment && data.user === message.comment.user) 
            ){
            // if the user's metadata object is found then set the index for use in the else block
                metaDataIndex = index;
                return true 
            }  
        })) {
        // parse any available submetadata to build the user's metadata object
            let user;
            if(message.comment) user = message.comment.user;
            else user = message.bot_id || (message.comment && message.comment.user) || message.user ;
            userMetaData.push(parseSubMetadata(message, {user}));
        }

    // user's metadata exists --> modify their data object using metaDataIndex
        else userMetaData[metaDataIndex] = parseSubMetadata(message, userMetaData[metaDataIndex]);   
    });

    const metaData = {
    // set the timestamp field to be the latest message in this query
        // Slack returns messages from latest to oldest
        timestamp: messages[0].ts,
        userMetaData
    }

    return metaData;
}

function parseSubMetadata(message, data){
    const newMetadata = data;

    if(message.subtype) {
        // capture file metadata
         if(message.subtype === 'file_share') {
            if(!newMetadata.fileMetadata) newMetadata.fileMetadata = [];
            newMetadata.fileMetadata.push(parseFileMetadata(message.file));
        }

        if(['reply_broadcast', 'thread_broadcast', 'channel_join', 'bot_message'].includes(message.subtype)){
            switch(message.subtype){
                case 'reply_broadcast':
                    if(!newMetadata.thread_comments) newMetadata.thread_comments = 1;
                    else newMetadata.thread_comments += 1;
                    break;
                case 'thread_broadcast':
                    break;
                case 'bot_message':
                // capture metadata of bot threads
                    if (message.thread_ts) {
                        if(!newMetadata.threads) newMetadata.threads = 1;
                        else newMetadata.threads += 1;

                        message.replies.forEach((reply) => {
                            if(reply.user !== message.bot_id){
                                if(!newMetadata.thread_replies) newMetadata.thread_replies = 1;
                                else newMetadata.thread_replies +=1;
                            }
                        });
                    }
                    break;
                case 'channel_join':
                    break;
                default:
            }
        } else {
            if(!newMetadata[message.subtype]) newMetadata[message.subtype] = 1;
            else newMetadata[message.subtype]++;
        }   
    }

// capture message threads data
    if (message.thread_ts) {
        if(!message.root && !message.attachments){
        // capture thread replies on a user's thread
            if(message.replies){
                if(!newMetadata.threads) newMetadata.threads = 1;
                else newMetadata.threads += 1;

                message.replies.forEach((reply) => {
                    if(reply.user !== message.user){
                        if(!newMetadata.thread_replies) newMetadata.thread_replies = 1;
                        else newMetadata.thread_replies += 1;
                    }
                });
            } else {
            // capture user comments on threads
                if(!newMetadata.thread_comments) newMetadata.thread_comments = 1;
                else newMetadata.thread_comments += 1;
            }
        }
    }

// capture reactions
    if(message.reactions){
        if(!newMetadata.reactions) newMetadata.reactions = 0;
        message.reactions.forEach( reaction => newMetadata.reactions += reaction.count);
    }

// capture single stars
    if (message.is_starred) {
        if(!newMetadata.num_stars) newMetadata.num_stars = 1;
        else newMetadata.num_stars += 1
    }

// capture multiple stars
    if (message.num_stars) {
        if (!newMetadata.num_stars) newMetadata.num_stars = message.num_stars;
        else newMetadata.num_stars += message.num_stars;
    }

// capture plain text message (only contains type, user, text, and ts properties)
    if (Object.keys(message).length === 4) {
        if(!newMetadata.messages) newMetadata.messages = 1;
        else newMetadata.messages += 1;
    }  

// if the user is a bot then give it a bot boolean property for identification downstream
    if(message.bot_id) newMetadata.bot = true;

    return newMetadata;
}

function parseFileMetadata(file){
    const fileMetaData = {
        type: file.filetype,
        lines: file.lines
    };

    if(file.reactions){
        fileMetaData.reactions = 0;
        file.reactions.forEach( reaction => fileMetaData.reactions += reaction.count);
    }

    if(file.comments_count) fileMetaData.comments_count = file.comments_count;

    if(file.num_stars) fileMetaData.num_stars = file.stars;

    return fileMetaData;
}

module.exports = metadataScraper;

