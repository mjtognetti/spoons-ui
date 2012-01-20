define([
   'jquery',
   'underscore',
   'backbone',
   'publisher',
   'lib/utils',
   'src/constants'
], function($, _, Backbone, publisher, Utils, constants) {
var EventCollectionSelector, channels = constants.channels;

EventCollectionSelector = Backbone.View.extend({
   channel: 'eventCollectionSelector',
   collectionTemplate: $('#event-collection-template'),
   events: { 'click .source': 'toggleCollectionActivation' },
   initialize: function(options){
      this.active = false;
      this.trigger = options.trigger;
      this.events = options.events;
      
      publisher.subscribe('events' + channels.loadStarted, this.loading, this);
      publisher.subscribe('events' + channels.loadSucceeded, this.loaded, this);
      publisher.subscribe('events' + channels.loadFailed, this.loaded, this);
   },
   toggleActivation: function(){
      this.active ? this.deactivate() : this.activate();
   },
   activate: function(){
      this.active = true;
      this.render();
      $(this.el).removeClass('display-none');
      publisher.publish(this.channel + channels.activated);
   },
   deactivate: function(){
      this.active = false;
      $(this.el).addClass('display-none');
      publisher.publish(this.channel + channels.deactivated);
   },
   loading: function() {
      this.loading = true;
      if (this.active) this.render();
   },
   loaded: function() {
      this.loading = false;
      if (this.active) this.render();
   },
   toggleCollectionActivation: function(e){
      var targetElement, source, eventCollection;
      
      targetElement = $(e.target);
      source = targetElement.attr('data-source');
      eventCollection = _.detect(this.events.collections, function(collection) {
         return collection.source == source;
      });
      
      eventCollection.active ? 
         this.deactivateCollection(eventCollection, targetElement) :
         this.activateCollection(eventCollection, targetElement);
   },
   activateCollection: function(collection, el) {
      el.addClass('active');
      collection.activate();
   },
   deactivateCollection: function(collection, el) {
      el.removeClass('active');
      collection.deactivate();
   },
   render: function(){
      $(this.el).empty();
      if (this.loading) {
         this.renderLoadingIndicator();
      }
      else {
         this.renderCollections();
      }
      
      return this;
   },
   renderLoadingIndicator: function() {
      Utils.showLoadingIndicator($(this.el), 'loading');
   },
   renderCollections: function() {
      var collectionElements;
      collectionElements = _.map(this.events.collections, this.renderCollection, this);
      $().append.apply($(this.el), collectionElements);
   },
   renderCollection: function(collection) {
      var context;
      context = {
         classes: collection.active ? 'source active' : 'source',
         displayName: collection.sourceDisplayName,
         source: collection.source 
      };
      return Utils.renderTemplate(this.collectionTemplate, context);
   }
});

return EventCollectionSelector;
});