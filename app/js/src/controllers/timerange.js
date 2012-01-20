define([
   'order!jquery',
   'underscore',
   'backbone',
   'publisher',
   'lib/utils',
   'src/constants',
   'order!js/lib/vendor/jquery-ui.js',
   'order!js/lib/vendor/jquery.timePicker.js'
], function($, _, Backbone, publisher, Utils, constants){
   //jQuery datePicker date formatting strings.
   var dateFormats = {
      numeric: 'm/d/yy',
      textual: 'MM d, yy'
   };

   var RangeSelector = Backbone.View.extend({
      channel: 'rangeSelector',
      /* A time range selector to determine the range for a chart.
       * Uses the jQuery UI Datepicker widget for easy datepicking.
       */
       
       events: {
         'click .refresh': 'refresh'
      },
      
      
      // Initialize the range selector.
      // Initialize the datepickers to the correct 'from' and 'to' values,
      // defaulting to yesterday and today if no values were passed in.
      initialize: function(options){
         var to, from, changed;

         // Dates MUST be cloned!
         to   = new Date(options.timerange.to.getTime());
         from = new Date(options.timerange.from.getTime());
         
         // Initialize the datepicker on the 'from' date input field.
         this.$('#from-date')
            .datepicker({ dateFormat: dateFormats.numeric })
            .datepicker('setDate', from);
         // Initialize the 'from' timepicker and set to 'from' time.
         this.$('#from-time').timePicker({ show24Hours: false, step: 15 });
         $.timePicker('#from-time').setTime(from);
         
         // Initialize the datepicker on the 'to' date input field.
         this.$('#to-date')
            .datepicker({ dateFormat: dateFormats.numeric })
            .datepicker('setDate', to); 
         // Initialize the 'to' timepicker, setting to 'to' time.
         this.$('#to-time').timePicker({ show24Hours: false, step: 15 });
         $.timePicker('#to-time').setTime(to);
      },
      
      // Render the range selector.
      // Currently a no-op since all range selector elements are included in the
      // chart page template. If that changes and templating is needed, use this function.
      render: function() {
      },
      
      refresh: function() {
         this.changeRange();
      },
      
      // Handle a change in the current range.
      changeRange: function() {
         var fromDateString, toDateString, fromTime, toTime, from, to, valid, options, timerange;

         // Retrieve the date strings from the input fields.
         fromDateString = $('#from-date').val();
         toDateString   = $('#to-date').val();
         
         // Parse date objects from the date strings.
         from = new Date(fromDateString);
         to = new Date(toDateString);
         
         // Retrieve date objects containing the time information from timepickers.
         fromTime = $.timePicker('#from-time').getTime();
         toTime = $.timePicker('#to-time').getTime();
         
         // Set the correct time on the 'from' and 'to' dates.
         from.setHours(fromTime.getHours(), fromTime.getMinutes());
         to.setHours(toTime.getHours(), toTime.getMinutes());
         
         // Validate the current range, ensuring 'from' and 'to' are both valid dates
         // and 'from' is not greater than 'to'.
         valid = this.validateRange(from, to);

         // If the range is valid update all the series.
         if (valid) {
         
            // Use an options hash to pass the changed value to all series objects.
            options = {};
            
            // Set the timerange on the options hash.
            options.timerange = { from: from, to: to };
            
            publisher.publish(this.channel + constants.channels.timerangeUpdated, options.timerange);
            
         }
         // Otherwise the user must be notified that they entered an invalid range.
         else {
            
            // Currently just log that something went wrong.
            // TODO: form input highlighting and modal notifications.
            //console.log('invalid!');   
            alert('invalid time range');
            
         }
      },
      
      // Validate the current range.
      // Ensure both 'from' and 'to' are valid date strings and that 'from' is less than 'to'.
      validateRange: function(from, to) {
         var fromValid, toValid, rangeValid, valid;
             
         // Validate 'from' and 'to' date strings.
         // TODO: Date validation needs to be implemented. Currently defaults to valid.
         fromValid = toValid = true;
         
         // Ensure 'from' is less than 'to'.
         rangeValid = +from < +to;
         
         // Return true if 'from' and 'to' are valid dates and 'from' is less than 'to',
         // otherwise false.
         return fromValid && toValid && rangeValid;
      }
   });
   return RangeSelector;
});