# Slack Channel Metadata Scraper

##### Latest change: v0.2.0: fixed an issue where if no messages are found for the given timeframe the tool would crash. will now return "No messages to scan" instead of crashing. the count parameter has been moved to the last position in the function - if no count is passed then the default and Slack maximum of 1000 messages will be called for that query

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
- `[start]`: beginning timestamp to query message history
    - use most recent metaData.latest for this parameter during daily queries

- `[end]`: ending timestamp to query message history - default to current time

- `[count]`: number of messages to return in the query
    - default / maximum: 1000 messages

### Note: if no start / end are passed then the entire message history (up to 1000 messages) will be scanned for metadata

### How to use

- All you need to supply is an oAuthToken (with the `channels.history` permission scope) from Slack and a valid Slack channel ID of the channel you want to scrape.


# Sample Outputs

### metaData object returned

#### Note: the `timestamp` property is the Slack ts (timestamp) value of the most recent message in the current query
- all timestamps are non-inclusive meaning if you pass a starting timestamp you will get metadata for all messages _after_ the message that corresponds to that timestamp

#### This timestamp can be used for daily scans as a starting time for the next query (to prevent overlap of data)

```
{ timestamp: '1505255831.000078',
  userMetaData: 
   [ { user: 'U6XDNVDPF',
       file_comment: 1,
       fileMetadata: [Array],
       file_share: 1,
       messages: 2,
       thread_comments: 8,
       threads: 2,
       reactions: 1,
       num_stars: 1 },
     { user: 'B6Y7F2Y0M', threads: 1, thread_replies: 3, bot: true } ] }
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