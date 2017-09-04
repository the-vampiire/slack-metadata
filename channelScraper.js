
// ---------------- PARAMETERS --------------- //
// <channelID>: Slack channel ID to query for message history
// [count]: number of messages to return in the query - default 100 messages
// [start]: beginning timestamp to query message history
    // use most recent metaData.latest for this parameter during daily queries
// [end]: ending timestamp to query message history - default to current time


const request = require('request');

function getChannelHistory(channelID, oAuthtoken, count, start, end){

    let url = `https://slack.com/api/channels.history?token=${oAuthToken}&channel=${channelID}`;

// append optional parameters to the query string
    if(count) url += `&count=${count}`;
    if(start) url += `&oldest=${start}`;
    if(end) url += `$latest=${end}`;

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
            userMetaData.push(parseSubMetadata(message, {user}, true));
        }

    // user's metadata exists --> modify their data object using metaDataIndex
        else userMetaData[metaDataIndex] = parseSubMetadata(message, userMetaData[metaDataIndex], false);   
    });

    const metaData = {
    // set the latest field to be the timestamp of the last message in this query
// DOUBLE CHECK THIS "LATEST" LINE'S LOGIC
        latest: messages[messages.length-1].ts,
        userMetaData
    }

    return metaData;
}

// <creation>: a boolean that indicates whether the parseSubMetadata function is being called during
// metadata creation or modification. separates the respective logic while making shared logic
// accessible to both modes
function parseSubMetadata(message, newMetadata, creation){

    if(message.subtype) {
        if(creation) newMetadata[message.subtype] = 1;
        else {
            if(newMetadata[message.subtype]) newMetadata[message.subtype]++;
            else newMetadata[message.subtype] = 1;
        }

    // capture file metadata
        if(message.subtype === 'file_share') {
            if(!newMetadata.fileMetadata) newMetadata.fileMetadata = [];
            newMetadata.fileMetadata.push(parseFileMetadata(message.file));
        }
        
    };

// capture reactions
    if(message.reactions){
        if(!newMetadata.reactions) newMetadata.reactions = 0;
        message.reactions.forEach( reaction => newMetadata.reactions += reaction.count);
    }

// capture stars
    if(message.is_starred) newMetadata.num_stars = 1;
    if(message.num_stars) newMetadata.num_stars = message.num_stars;

// if the user is a bot then give it a bot boolean property for identification downstream
    if(message.bot_id) newMetadata.bot = true;

// if no submetadata is available for the message then it defaults to a plain text message count
    else {
        if(creation) newMetadata.message = 1;
        else newMetadata.message++;
    }

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

    if(file.num_stars) fileMetaData.num_stars = file.num_stars;

    return fileMetaData;
}

module.exports = getChannelHistory;