# Slack Channel Metadata Scraper

##### Latest change: v3.3.0:
- added a channel\_metadata object which stores the aggregate of all user\_metadata in that scrape
- **see new shape of data below for breaking change**
- improved internal language and comments for better readability

### This is a tool that captures Slack channel metadata of all users / bot users in a selected timeframe

### If you would like to help improve this package visit the [Github repo](https://github.com/the-vampiire/slackMetadataScraper)

## **No qualitative message data is read or captured** - only quantitative metadata identifiable by the user's Slack user ID

# Usage
### Parameters 
#### Required
- `<channelID>`: Slack channel ID to query for message history

- `<oAuthToken>`: Slack oAuth token issued to your app / bot for the Slack team
    - you must also allow the permissions scope "channels.history"

#### Optional
- `[start]`: beginning timestamp to query message history
    - use most recent metaData.timestamp for this parameter during daily queries (more detail below)

- `[end]`: ending timestamp to query message history - default to current time

- `[count]`: number of messages to return in the query
    - default / maximum: 1000 messages

### Note: if no start / end are passed then the entire message history (up to 1000 messages) will be scanned for metadata

### How to use

- All you need to supply is an oAuthToken (with the `channels.history` permission scope set in Slack under oAuth&permissions -> Scopes) from Slack and a valid Slack channel ID of the channel you want to scrape.
- **Returns a promise**

### Sample Usage
```
const scraper = require('slackmetascraper');

scraper('SLACK_CHANNEL_ID', 'SLACK_TEAM_OAUTH_TOKEN')
.then(output => console.log(output))
.catch(error => console.error(error));

```

# Sample Outputs

### metaData object returned

#### Note: the `timestamp` property is the Slack ts (timestamp) value of the most recent message in the current query
- all timestamps are non-inclusive meaning if you pass a starting timestamp you will get metadata for all messages _after_ the message that corresponds to that timestamp

#### This timestamp can be used for daily scans as a starting time for the next query (to prevent overlap of data)

```
{ timestamp: '1516440825.000067',
  users_metadata: [ 
     { user_id: 'U81UE6STB',
       pinned_item: 1,
       messages: 8,
       me_message: 1,
       file_metadata: [Array],
       file_share: 2,
       file_comment: 1,
       reactions: 1,
       thread_comments: 1,
       threads: 1 },
     { user_id: 'U83GHURRD', messages: 1 },
     { user_id: 'U81UE2589', messages: 1 } 
  ],

  channel_metadata:
   { channel_id: 'C88FDG3EV',
     pinned_item: 1,
     messages: 10,
     me_message: 1,
     file_metadata: [ [Object], [Object] ],
     file_share: 2,
     file_comment: 1,
     reactions: 1,
     thread_comments: 1,
     threads: 1 } }
```

### metadata `file_metadata` array
- any code that is shared (as a Slack code snippet) will have its line of code stored as `lines` and language stored as `type`

```
[ { type: 'jpg', is_starred: true, num_stars: 1 },
  { type: 'javascript', lines: 1, comments_count: 1 } ]
```
