define([
   'order!jquery',
   'underscore',
   'backbone',
   'publisher',
   'lib/utils',
   'src/constants',
   'src/events',
   'order!js/lib/vendor/jquery-ui.js',
   'order!js/lib/vendor/jquery.timePicker.js'
], function($, _, Backbone, publisher, Utils, constants, Events) {
var Editor, channels = constants.channels, dateFormats = constants.dateFormats;

Editor = Backbone.View.extend({
   channel: 'eventEditor',
   
   template: _.template($('#event-editor-template').html()),
   
   events:{
      'click .type': 'selectType',
      'blur #editor-from-date': 'updateEventRangeFromPickers',
      'blue #editor-from-time': 'updateEventRangeFromPickers',
      'blur #editor-to-date': 'updateEventRangeFromPickers',
      'blue #editor-to-time': 'updateEventRangeFromPickers',
      
   },
   
   initialize: function(options){
      this.active = false;
      this.timerange = timerange;
      this.selectionRange = null;
      
      publisher.subscribe('events:event' + channels.saveSucceeded, this.saveSuccess, this);
      publisher.subscribe('events:event' + channels.saveFailed, this.saveFailure, this);
      
      publisher.subscribe('rangeSelector' + channels.timerangeUpdated, this.updateTimerange, this);
      publisher.subscribe('chart' + channels.rangeSelected, this.setSelectionRange, this);
      publisher.subscribe('chart' + channels.rangeUnselected, this.unsetSelectionRange, this);
   },
   
   updateTimerange: function(timerange) {
      this.timerange = timerange;
   },
   
   setSelectionRange: function(range) {
      this.selectionRange = range;
      if (this.active) {
         this.updateEventRangeFromSelection(this.selectionRange);
      }
   },
   
   unsetSelectionRange: function() {
      this.selectionRange = null;
   },
   
   activate: function(event){
      this.active = true;
      this.setModeAndModel(event);
      this.render();
      $(this.el).removeClass('display-none');
      publisher.publish(this.channel + channels.activated);
   },
   
   deactivate: function(){
      this.active = false;
      this.destroyDateTimePickers();
      $(this.el).addClass('display-none');
      publisher.publish(this.channel + channels.deactivated)
   },
   
   setModeAndModel: function(event) {
      if (!event) {
         this.reportNewEvent();
      }
      else if (event.get('type') == 'monitor') { //event.get('source') != 'reported'
         this.reportMonitorEvent(event);
      }
      else {
         this.editEvent(event);
      }
   },

   reportNewEvent: function() {
      var from, to;
      
      from = this.selectionRange ? new Date(+this.selectionRange.from) : new Date(+this.timerange.from);
      to = this.selectionRange ? new Date(+this.selectionRange.to) : new Date(+this.timerange.to);
      
      this.model = new Events.Event({ from: from, to: to, source: 'reported' });
      this.report = true;
   },
   
   reportMonitorEvent: function(event) {
      this.model = new Events.Event({
         from: new Date(event.get('from').getTime()),
         to: new Date(event.get('to').getTime()),
         source: 'reported'
      });
      this.report = true;
   },
   
   editEvent: function(event) {
      this.model = event;
      this.report = false;
   },
   
   updateEventRangeFromSelection: function(range) {
      var from, to;
      
      this.updateEventRange(range);
      
      // Clone dates
      from = new Date(this.model.get('from').getTime());
      to = new Date(this.model.get('to').getTime());
      this.updateDateTimePickers(from, to);    
   },
   
   updateEventRangeFromPickers: function() {
      var inputs, fromDateString, toDateString, fromTime, toTime, from, to;
      
      inputs = this.getDateTimeInputs();

      // Retrieve the date strings from the input fields.
      fromDateString = inputs.from.date.val();
      toDateString   = inputs.to.date.val();
      
      // Parse date objects from the date strings.
      from = new Date(fromDateString);
      to = new Date(toDateString);
      
      // Retrieve date objects containing the time information from timepickers.
      fromTime = $.timePicker(inputs.from.time).getTime();
      toTime = $.timePicker(inputs.to.time).getTime();
      
      // Set the correct time on the 'from' and 'to' dates.
      from.setHours(fromTime.getHours(), fromTime.getMinutes());
      to.setHours(toTime.getHours(), toTime.getMinutes());
      
      this.updateEventRange({ from: from, to: to });
   },
   
   updateEventRange: function(range) {
      var from, to;
      
      from = new Date(+range.from);
      to = new Date(+range.to);
      
      this.model.set({
         from: from,
         to: to
      });
   },
   
   render: function() { 
      var from, to, inputs;
      
      $(this.el).html(this.template({
         annotation: this.model.get('annotation'),
         id: this.model.id || 'none'
      }));
            
      inputs = this.getDateTimeInputs();
      this.initializeDateTimePicker(inputs.from.date, inputs.from.time);
      this.initializeDateTimePicker(inputs.to.date, inputs.to.time);
      
      // Dates MUST be cloned!
      from = new Date(this.model.get('from').getTime());      
      to = new Date(this.model.get('to').getTime());
      
      this.updateDateTimePickers(from, to);
      
      
      if (!this.report) this.$('.' + this.model.get('type')).addClass('selected');
      
      return this;
   },
   
   selectType: function(event) {
      var previousType, newType;
      
      previousType = this.$('.type.selected');
      newType = $(event.target);
      
      if (previousType) previousType.removeClass('selected');      
      newType = $(event.target).addClass('selected');
      
      this.model.set({ type: newType.attr('data-type') });
   },
   
   setAnnotation: function() {
      var textarea = this.$('textarea');
      this.model.set({ annotation: textarea.val() });
   },
   
   getDateTimeInputs: function() {
      fromDateInput = this.$('#editor-from-date');
      fromTimeInput = this.$('#editor-from-time');

      toDateInput = this.$('#editor-to-date');
      toTimeInput = this.$('#editor-to-time');
      
      return {
         from: {
            date: fromDateInput,
            time: fromTimeInput
         },
         to: {
            date: toDateInput,
            time: toTimeInput
         }
      };    
   },
   
   initializeDateTimePicker: function(dateInput, timeInput) {
      dateInput.datepicker({ dateFormat: dateFormats.numeric });
      timeInput.timePicker({ show24Hours: false, step: 15 });
   },
   
   updateDateTimePickers: function(from, to) {
      var inputs = this.getDateTimeInputs();
      this.updateDateTimePicker(inputs.from.date, inputs.from.time, from);
      this.updateDateTimePicker(inputs.to.date, inputs.to.time, to);
   },
   
   updateDateTimePicker: function(dateInput, timeInput, date) {
      dateInput.datepicker('setDate', date);
      $.timePicker(timeInput).setTime(date);
   },
   
   destroyDateTimePickers: function() {
      this.$('#editor-from-date').datepicker('destroy');
      this.$('#editor-to-date').datepicker('destroy');
   },
   
   cancel: function() {
   },
   
   save: function() {
      var valid;
      
      this.updateEventFromForm();
      
      valid = this.validate();
      
      if (valid) {
         if (this.report) this.model.report();
         else this.model.edit();
      }
   },
   
   updateEventFromForm: function() {
      this.setAnnotation();
      this.updateEventRangeFromPickers();
      // type handles automatically
   },
   
   validate: function() {
      var errors = [];
      
      if (this.model.get('type') == 'monitor') {
         errors.push('Must select an event type.');
      }
      if (+this.model.get('to') <= +this.model.get('from')) {
         errors.push('Invalid timerange.');
      }
      
      if (errors.length) {
         alert(errors.join('\n'));
      }
      return !errors.length;
   },
   
   saveSuccess: function(){},
   saveFailure: function(){}
      
   
});

return Editor;
});