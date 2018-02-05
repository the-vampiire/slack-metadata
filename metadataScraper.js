const axios = require('axios');
const querystring = require('querystring');

/**
 * @param {string} channel -> Slack channel ID to scrape for metadata
 * @param {string} token -> Slack team OAuth token [with channels.history permission]
 * @type {options} options - options object
 * @property {string} start - Slack timestamp [ts] of the message to begin the scrape from ** non-inclusive **
 * @property {string} end - Slack timestamp of the last message to scan. Default: most recent message
 * @property {number} count - number of messages to collect within the start-end range. Default/max: 1000
 * @property {boolean} private_channel - private channel. must have groups.history permission scope to scrape a private channel. defaults to false (public)
 * @property {boolean} include_bot - boolean option to include bot users in channel metadata aggregate. defaults to false (ignore bots)
 * @return {PromiseLike} - Promise that resolves a metadata object { timestamp, channel_metadata, users_metadata }
 * @description Scrapes a Slack channel and collects the quantitative metadata into user and channel (users aggregate) metadata objects. 
 * Does not view / collect any text or qualitative data. 
 * 
 * ---- RETURNS A PROMISE ----
 * @example - copy and paste to start your scrape
 * 
 * const scrape = require('slack-metadata');
 * 
 * const options = {
 *  start: '1516440825.000067' // slack ts message property [proprietary]
 *  end: '1516840825.000432'
 *  count: 500,
 *  private_channel: false,
 * };
 * 
 * scrape('slack_channel_id', 'slack_team_oauth_token', options)
 *   .then(console.log) // logs the metadata output
 *   .catch(error => console.error(`Slack Metrics error\n${error}`));
 * 
 * @author Vampiire
 */

async function slackMetadata(
  channel,
  token,
  { start, end, count, private_channel, include_bot },
) {
  // private Slack channel IDs begin with 'G', public begin with 'C'
  const url = private_channel ? 
  'https://slack.com/api/groups.history' : 'https://slack.com/api/channels.history';

  if (!private_channel && channel[0] === 'G') {
    console.error(
      'Private [group] channel detected.\
      Check your options object and set the "private" property to\
      true if you meant to scrape a private channel.\
      Check that you have the permission scope "groups.history" set for your token.'
    );
  }

  const request = { token, channel };
  if (start) request.oldest = start;
  if (end) request.latest = end;
  request.count = count || 1000;

  try {
    const { data } = await axios.post(url, querystring.stringify(request));
    if (!data.ok) {
      console.error(data);
      return data.error;
    } else if (!!data.messages.length) {
      const metadata = { timestamp: data.messages[0].ts };
      metadata.users_metadata = parseMessages(data.messages);
      metadata.channel_metadata = { channel_id: channel };
      
      // populate channel_metadata [aggregrate of metadata from all users in the scrape]
      if (metadata.users_metadata) metadata.users_metadata.forEach((user_metadata) => {
        if (!include_bot && user_metadata.bot) return; // ignore bot user metadata in aggregate by default
        Object.keys(user_metadata).forEach((metric) => {
          // ignore user_id and bot fields
          if (['user_id', 'bot'].includes(metric)) return;
          if (!metadata.channel_metadata[metric]) metadata.channel_metadata[metric] = user_metadata[metric];
          else metadata.channel_metadata[metric] += user_metadata[metric];
        })
      });
      return metadata;
    } else {
      console.error(`
Slack Metadata: No messages to scan.
Returned null for the following channel and parameters:

  channel_id: ${channel}
  start: ${start}
  end: ${end}
  count: ${count}
  public: ${public}
      `);
      return null;
    }
  } catch (error) {
    console.error(new Error(error));
    return null;
  } 
}

function parseFileMetadata(file){
  const file_metadata = {
    type: file.filetype,
  };

  // if the filetype is a code snippet capture the lines of code
  if (file.lines) file_metadata.lines = file.lines;

  if(file.reactions){
    file_metadata.reactions = 0;
    file.reactions.forEach( reaction => file_metadata.reactions += reaction.count);
  }

  if(file.comments_count) file_metadata.comments_count = file.comments_count;

  if(file.num_stars) {
    file_metadata.is_starred = true;
    file_metadata.num_stars = file.num_stars;
  }

  return file_metadata;
}

function parseSubMetadata(message, data){
    const newMetadata = data;
  
    if(message.subtype) {
      // capture file metadata
       if(message.subtype === 'file_share') {
        if(!newMetadata.file_metadata) newMetadata.file_metadata = [];
        newMetadata.file_metadata.push(parseFileMetadata(message.file));
      }
  
      // filters non-quantitative subtypes and handles those of value
      if(['reply_broadcast', 'thread_broadcast', 'channel_join', 'group_join', 'bot_message'].includes(message.subtype)){
        switch(message.subtype){
          case 'reply_broadcast':
            if(!newMetadata.thread_comments) newMetadata.thread_comments = 1;
            else newMetadata.thread_comments += 1;
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
  
  // captures a comment being "starred" (saved for later in Slack)
    if (message.is_starred) {
      if(!newMetadata.is_starred) newMetadata.is_starred = true;
    }
  
  // capture the number of times the message has been starred by other users
    if (message.num_stars) {
      if (!newMetadata.num_stars) newMetadata.num_stars = message.num_stars;
      else newMetadata.num_stars += message.num_stars;
    }
  
  // capture original channel messages (prevent duplicates from thread-broadcasted messages )
    if (message.subtype !== 'thread_broadcast') {
      if(!newMetadata.messages) newMetadata.messages = 1;
      else newMetadata.messages += 1;
    }  
  
  // if the user is a bot then give it a bot boolean property for identification downstream
    if(message.bot_id) newMetadata.bot = true;
  
    return newMetadata;
  }

function parseMessages(messages){
  const users_metadata = [];
  if (messages[0]) {
    messages.forEach( message => {
      let user_index;
      // walk users_metadata array looking for existing user metadata
        // if it exists set the user_index to that index and return true (to exit the loop in the some method)
        // if it does not exist then create create a new user in the users_metadata array
      if(!users_metadata.some((data, index) => { 
        if(
          data.user_id === message.user || 
          data.user_id === message.bot_id || 
          (message.comment && data.user_id === message.comment.user) 
        ){
        // if the user's metadata object is found then set the index for use in the else block
          user_index = index;
          return true 
        }  
      })) {
        // build a new user's metadata object
        let user;
        if(message.comment) user = message.comment.user;
        else user = message.bot_id || (message.comment && message.comment.user) || message.user;
        users_metadata.push(parseSubMetadata(message, { user_id: user }));
      }

      // user's metadata exists --> modify their data object using user_index
      else users_metadata[user_index] = parseSubMetadata(message, users_metadata[user_index]);   
    });
    return users_metadata;
  } else return false;
}

module.exports = slackMetadata;