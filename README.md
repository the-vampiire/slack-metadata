# Slack Channel Metadata Scraper

### This is a tool that captures Slack channel metadata of all users / bot users in a selected timeframe

### **No qualitative message data is captured** - only quantitative metadata identifiable by the user's Slack user ID

# Usage
### Parameters 

- `<channelID>`: Slack channel ID to query for message history

- `<oAuthToken>`: Slack oAuth token issued to your app / bot for the Slack team
    - you must also allow the permissions scope "channels.history"

- `[count]`: number of messages to return in the query - default 100 messages

- `[start]`: beginning timestamp to query message history
    - use most recent metaData.latest for this parameter during daily queries

- `[end]`: ending timestamp to query message history - default to current time

### oAuthToken

- All you need to supply is an oAuthToken (with the `channels.history` permission scope) from Slack and a valid Slack channel ID of the channel you want to scrape.


# Sample Outputs

### metaData object returned
```
{ latest: '1504302811.000247',
userMetaData: [{ 
    user: 'U6XDNVDPF',
    file_comment: 4,
    message: 29,
    reactions: 5,
    num_stars: 1,
    file_share: 3,
    fileMetadata: [Array],
    channel_join: 1 },

    { user: 'B6Y6S64RL',
    bot_message: 16,
    reactions: 2,
    num_stars: 1,
    bot: true },

    { user: 'U6XBNKWSG', channel_join: 1, message: 1 },

    { user: 'U6X7P8VS7', channel_join: 1, message: 1 } 

]}
```

### metaData fileMetadata array

```
[ { type: 'markdown',
    lines: 4,
    reactions: 1,
    comments_count: 3,
    num_stars: 1 },
  { type: 'javascript',
    lines: 6,
    reactions: 2,
    comments_count: 5,
    num_stars: 1 },
  { type: 'javascript', lines: 1 } ]
```