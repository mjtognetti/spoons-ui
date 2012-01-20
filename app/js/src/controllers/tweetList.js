define([
   'jquery',
   'underscore',
   'backbone',
   'publisher',
   'lib/utils'
], function($, _, Backbone, publisher, Utils) {
   
   var TweetList = Backbone.View.extend({
      
      // Initialize a tweet list.
      initialize: function() {
         // Bind to tweet collection events.
         publisher.subscribe('tweets:load:started', this.loadingTweets, this);
         publisher.subscribe('tweets:load:succeeded', this.tweetsLoaded, this);
         publisher.subscribe('tweets:load:failed', this.tweetsLoaded, this);
      },
      
      // Called when the tweet collection is loading more tweets.
      loadingTweets: function() {
         // Display a loading indicator.
         Utils.showLoadingIndicator(this.el, 'loading');
      },
      
      // Called when the tweet collection has finished loading new tweets.
      tweetsLoaded: function(tweets) {
         // Hide any active loading indicators.
         Utils.hideLoadingIndicator(this.el, 'loading');
         // Render the tweet list.
         this.render(tweets);
      },
      
      // Render the tweet list, listing the tweets.
      // TODO: handle empty state (if 'tweets' is empty or undefined).
      render: function(tweets) {
         var list, templateResource;
         
         // Create an empty list to hold the tweets.
         list = $('<ul id="tweetList">');
         
         // Store a reference to the tweet template resource.
         templateResource = $('#tweet-template');
         
         // For each tweet, render the template and append to the list.
         tweets.each(function(tweet) {
            var context, date;
            
            date = new Date( tweet.get('time') * 1000 );
            // Define the 'context' object, passing tweet text and time published.
            // Format the published time before passing.
            context = {
               text: tweet.get('text'),
               date: Utils.formatDate(date, 'textual')
            };
            // Render the template and append to list.
            list.append(Utils.renderTemplate(templateResource, context));
         });
         
         // Replace 'el' content with newly rendered list.
         $(this.el).html(list);
         
         // Return this for chaining.
         return this;         
      }
   });
   
   return TweetList;
});