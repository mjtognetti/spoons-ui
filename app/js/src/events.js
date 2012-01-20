define([
   'underscore',
   'backbone',
   'publisher',
   'lib/utils',
   'src/constants',
   'src/mixins'
], function(_, Backbone, publisher, Utils, constants, mixin) {
var Event, EventCollection, Events, 
    urls = constants.urls, channels = constants.channels;

Event = Backbone.Model.extend({
   channel: 'events:event',
   defaults: {
      type: 'monitor',
      annotation: ''
   },
   url: function() {
      var path = urls.root + urls.events + '/' + this.get('source');
      if (this.id) {
         path += ( '/' + this.id );
      }
      return path;
   },
   report: function() {
      this.save({
         from: this.get('from').getTime() / 1000,
         to: this.get('to').getTime() / 1000
      }, {
         success: _.bind(this.saveSuccess, this),
         error: _.bind(this.saveFailure, this)
      });
   },
   edit: function() {
      this.report();
   },
   saveSuccess: function() {
      this.revertDates();
      publisher.publish(this.channel + channels.saveSucceeded, this);
   },
   saveFailure: function() {
      this.revertDates()
      publisher.publish(this.channel + channels.saveFailed, this);
   },
   revertDates: function() {
      this.set({
         from: new Date(this.get('from') * 1000),
         to: new Date(this.get('to') * 1000)
      });
   }
});

EventCollection = Backbone.Collection.extend({
   model: Event,
   channel: 'events:collection',
   url: function() {
      return urls.root + urls.events + '/' + this.source;
   },
   initialize: function(models, options) {
      options = options || {};
      this.id = this.source = options.source || 'no-source';
      this.sourceDisplayName = Utils.generateDisplayName(this.source);
      this.active = options.active || false;
      this.timerange = options.timerange;
      
      publisher.subscribe('rangeSelector' + channels.timerangeUpdated, this.updateTimerange, this);
   },
   getRequestData: function() {
      return {
         from: this.timerange.from / 1000,
         to: this.timerange.to / 1000
      };
   },
   parse: function(response) {
      return _.map(response, function(jsonEvent) {
         jsonEvent.from = new Date(jsonEvent.start * 1000);
         jsonEvent.to = new Date(jsonEvent.end * 1000);
         return new Event(jsonEvent);
      });
   }
});
mixin(EventCollection.prototype, mixin.isActivateable, mixin.isTimerangeDependant, mixin.isLoadable);

Events = Backbone.Model.extend({
   channel: 'events',
   url: urls.root + urls.events,
   initialize: function(options) {
      publisher.subscribe('events:collection' + channels.activated, this.loadItem, this);
      publisher.subscribe('events:collection' + channels.timerangeUpdated, this.loadItem, this);
      publisher.subscribe('events:collection' + channels.loadSucceeded, this.endLoadingItem, this);
      publisher.subscribe('events:collection' + channels.loadFailed, this.endLoadingItem, this);
      
      publisher.subscribe('events:event' + channels.saveSucceeded, this.eventSaved, this);
      
      this.timerange = options.timerange;
      this.collections = [];
   },
   // Reload the 'reported' collection if an event is saved (created, edited, or reported) to the server.
   // All modified events are stored in the 'reported' collection, and new one might have been added
   // with the save. If the collection isn't active there's no need to reload.
   eventSaved: function() {
      // Find the 'reported' collection.
      var reported = _.detect(this.collections, function(collection) {
         return collection.source == 'reported';
      });
      // Load it (this will only load the collection if it is active).
      if (reported) this.loadItem(reported);
   },
   // Load a collection.
   loadItem: function(item) {
      // If the collection is currently active, load it.
      if (item.active) this.beginLoadingItem(item);
   },
   // Handle a collection load failure.
   handleLoadFailure: function() {
      alert('failure loading event sources!');
   },
   // Parse the response from the server for the initial load.
   // Create event collections from the response.
   parse: function(response) {
      // For each <string> source in the response create a collection.
      // Store the collection in a collections array property.
      this.collections = _.map(response, function(source) {
         return new EventCollection([], { source: source, timerange: this.timerange });
      }, this);
   }
});
mixin(Events.prototype, mixin.isTimerangeDependant, mixin.isLoadable, mixin.hasLoadableItems);

Events.Event = Event;

return Events;
});