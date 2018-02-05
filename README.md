# Slack Channel Metadata

## v2.0
- now builds metadata for private channels!
  - _must set the permission scope `groups.history`_
- improved JSDoc definition
- improved error handling
- added option to include bot users in channel metadata aggregate (defaults to false - ignore bot users)
- **breaking change** refactored to accept an `options` object

### `options` object
- @property {string} `start`
  - Slack timestamp [ts] of the message to begin the scrape from ** non-inclusive **
- @property {string} `end`
  - Slack timestamp of the last message to scan. Default: most recent message
- @property {number} `count`
  - number of messages to collect within the start-end range. Default/max: 1000
- @property {boolean} `private_channel`
  - private channel. must have groups.history permission scope to scrape a private channel. defaults to false (public)
- @property {boolean} include_bot
  - option to include bot users in channel metadata aggregate. defaults to false (ignore bots)

## What is Slack-Metadata?
### A tool that scans and aggregates Slack channel metadata of all users and bot users in a selected timeframe. See the shape of the metadata at the end of this document for more informationx. 
### If you would like to help improve this package visit the [Github repo](https://github.com/the-vampiire/slackMetadataScraper)

### **No qualitative message data is read or captured** - only quantitative metadata identifiable by the user's Slack user ID

# Usage
### Parameters 
#### Required
- `<channel, string>`: Slack channel ID to query for message history
- `<token, string>`: Slack oAuth token issued to your app / bot for the Slack team
    - you must also allow the permissions scope "channels.history"

#### `options` object
- @property {string} `start`
  - Slack timestamp [ts] of the message to begin the scrape from ** non-inclusive **
- @property {string} `end`
  - Slack timestamp of the last message to scan. Default: most recent message
- @property {number} `count`
  - number of messages to collect within the start-end range. Default/max: 1000
- @property {boolean} `private_channel`
  - private channel. must have groups.history permission scope to scrape a private channel. defaults to false (public)
- @property {boolean} include_bot
  - option to include bot users in channel metadata aggregate. defaults to false (ignore bots)

#### Notes
- the start and end strings **must be the custom Slack timestamp format returned in any previous metadata scan**
- if no start / end are passed then the entire message history (up to 1000 messages) will be scanned for metadata 

### How to use

- All you need to supply is an oAuthToken (with the `channels.history` permission scope set in Slack under oAuth&permissions -> Scopes) from Slack and a valid Slack channel ID of the channel you want to scrape.
- **Returns a promise**
- resolves a `metadata object` [shape detailed below] on success 
- resolves `null` on failure if there are no messages within that channel and start/end/count range to scan

### Sample Usage
```
const slackMetadata = require('slack-metadata');

 const options = {
  start: '1516440825.000067'
  end: '1516840825.000432'
  count: 500,
  private_channel: true,
};

slackMetadata('slack_channel_id', 'slack_team_oauth_token', options)
  .then(metadata => db.store(metadata))
  .catch(error => console.error(error));
```

### Sample Outputs

#### Note: the `timestamp` property is the Slack ts (timestamp) value of the most recent message in the current query
- all timestamps are non-inclusive meaning if you pass a starting timestamp you will get metadata for all messages _after_ the message that corresponds to that timestamp
- The `timestamp` can be used for repeated scans by passing it as the `start` argument. This will collect metadata that never overlaps with previous scans.

### `metadata` object
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

### `file_metadata`
- any code that is shared (as a Slack code snippet) will have its lines of code stored as `lines` and language stored as `type`

```
[ { type: 'jpg', is_starred: true, num_stars: 1 },
  { type: 'javascript', lines: 1, comments_count: 1 } ]
```
