define([
   'jquery',
   'underscore',
   'backbone',
   'publisher',
   'lib/utils',
   'src/constants',
], function($, _, Backbone, publisher, Utils, constants) {
var Event, EventList,
    channels = constants.channels, 
    dateFormats = constants.dateFormats;

Event = Backbone.View.extend({
   channel: 'eventList:event',
   template: _.template($('#event-template').html()),
   events: {
      'click .action': 'reportOrEdit'
   },
   initialize: function(){
      this.id = Event.id++;
   },
   render: function(){
      var context, event = this.model;
      
      context = {
         id: this.id,
         from: Utils.formatDate(event.get('from'), 'numeric'),
         to: Utils.formatDate(event.get('to'), 'numeric'),
         type: event.get('type'),
         source: Utils.generateDisplayName(event.get('source')),
         annotation: event.get('annotation'),
         action: (event.get('source') == 'reported' ? 'edit' : 'report')
      };

      this.el = $(this.template(context));
      this.delegateEvents();
      
      return this;
   },
   reportOrEdit: function() {
      this.model.get('source') == 'reported' ? this.edit() : this.report();
   },
   report: function() {
      publisher.publish(this.channel + channels.reportRequested, this.model);
   },
   edit: function() {
      publisher.publish(this.channel + channels.editRequested, this.model);
   }
}, {
   id: 0
});
/*
 * EventList
 * View for events within the current timerange.
 */
EventList = Backbone.View.extend({
   channel: 'eventList',
   eventTemplate: $('#event-template'),
   initialize: function(options) {
      publisher.subscribe('events' + channels.loadItemsStarted, this.loadStart, this);
      publisher.subscribe('events' + channels.loadItemsSucceeded, this.loadSuccess, this);
      publisher.subscribe('events' + channels.loadItemsFailed, this.loadFail, this);
      
      this.events = options.events;
      this.eventList = [];
   },
   activate: function() {
      this.active = true;
      this.render();
      $(this.el).removeClass('display-none');
      publisher.publish(this.channel + constants.channels.activated);
   },
   deactivate: function() {
      this.active = false;
      $(this.el).addClass('display-none');
      publisher.publish(this.channel + constants.channels.deactivated);
   },
   loadStart: function() {
      this.loading = true;
      if (this.active) this.render();
   },
   loadSuccess: function() {
      this.loading = false;
      if (this.active) this.render();
   },
   loadFail: function() {
      this.loading = false;
      if (this.active) this.render();
      alert('failed to load events!');
   },
   render: function() {
      $(this.el).empty();
      this.loading ? this.renderLoading() : this.renderList();
      return this;
   },
   renderLoading: function() {
      Utils.showLoadingIndicator(this.el, 'loading');
   },
   renderList: function() {
      var activeCollection, eventList;
   
      activeCollections = _.select(this.events.collections, function(collection) {
         return collection.active;
      });

      eventList = this.combineCollections(activeCollections);
      
      eventList.length ? 
         this.renderEventList(eventList) :
         this.renderEmptyList( !activeCollections.length ?
            "No Event Sources Selected"  :
            "No Events"
         );
   },
   combineCollections: function(collections) {
      var modelArrays = [], combinedList = [];
      
      _.each(collections, function(collection) {
         modelArrays.push(collection.models);
      });
      
      combinedList = Array.prototype.concat.apply([], modelArrays);
      return combinedList;
   },
   renderEmptyList: function(msg) {
      $(this.el).html('<div class="empty">' + msg + '</div>');
   },
   renderEventList: function(events) {
      var sortedEvents, eventElements, list;

      $(this.el).append('<ul class="eventList">');
      
      sortedEvents = _.sortBy(events, function(event) { return event.get('from') });      
      this.eventList = _.map(sortedEvents, this.renderEvent, this);
   },
   renderEvent: function(event) {
      var view;
      
      view = new Event({ model: event });
      
      this.$('ul').append(view.render().el);
      
      return view;
   }
});

return EventList;
});