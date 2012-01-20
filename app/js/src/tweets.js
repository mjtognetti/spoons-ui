define([
   'underscore',
   'backbone',
   'publisher',
   'src/constants',
], function(_, Backbone, publisher, constants) {
var Tweets;

Tweets = Backbone.Collection.extend({

   url: constants.urls.root + constants.urls.tweets,
   limit: 500,
   
   initialize: function(models, options) {
      // Listen for changes in core timerange and update accordingly.
      publisher.subscribe('rangeSelector' + constants.channels.timerangeUpdated, this.updateTimerange, this);
      publisher.subscribe('chart:range:selected', this.fetchTweets, this);
      publisher.subscribe('chart:range:unselected', this.fetchTweets, this);
      
      this.timerange = options.timerange;
   },
   
   // Update the tweet collections timerange.
   updateTimerange: function(timerange) {
      // Store the timerange.
      this.timerange = timerange;
      // Fetch new tweets.
      this.fetchTweets();
   },

   fetchTweets: function(timerange) {
      var success, error, data = {};
      
      timerange = timerange || this.timerange;
      
      success = function(collection, response) {
         publisher.publish('tweets:load:succeeded', collection, response);
      };
      
      error = function(collection, response) {
         publisher.publish('tweets:load:failed', collection, response);
      };
      
      // Prepare the 'data' object.
      // 'from' and 'to' must be converted from jacvascript time 
      // (milliseconds since epoch) to standard time (seconds since epoch).
      data.from = timerange.from / 1000;
      data.to = timerange.to / 1000;
      data.limit = this.limit;
      
      // Publish a loading event, notifying any listeners.
      publisher.publish('tweets:load:started', this);
      
      // Fetch the tweets, passing 'data'.
      this.fetch({
         data: data,
         success: success,
         error: error
      });
   },
});

return Tweets;

});