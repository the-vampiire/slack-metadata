# Slack Channel Metadata Scraper

### This is a tool that captures Slack channel metadata of all users / bot users in a selected timeframe

### If you would like to help improve this package email me at vampiirecodes gmail com or visit the [Github repo](https://github.com/the-vampiire/slackMetadataScraper)

## **No qualitative message data is read or captured** - only quantitative metadata identifiable by the user's Slack user ID

# Usage
### Parameters 
#### Required
- `<channelID>`: Slack channel ID to query for message history

- `<oAuthToken>`: Slack oAuth token issued to your app / bot for the Slack team
    - you must also allow the permissions scope "channels.history"

#### Optional
- `[count]`: number of messages to return in the query
    - default: 100 messages
    - maximum: 1000 messages

- `[start]`: beginning timestamp to query message history
    - use most recent metaData.latest for this parameter during daily queries

- `[end]`: ending timestamp to query message history - default to current time

### Note: if no start / end are passed then the entire message history (up to 1000 messages) will be scanned for metadata

### How to use

- All you need to supply is an oAuthToken (with the `channels.history` permission scope) from Slack and a valid Slack channel ID of the channel you want to scrape.


# Sample Outputs

### metaData object returned

#### Note: the "latest" property is the Slack ts (timestamp) value of the last message scanned in the metadata query

#### This timestamp can be used for daily scans as a starting time for the next query (to prevent overlap of data)

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