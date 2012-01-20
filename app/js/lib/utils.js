define([
   'jquery',
   'underscore',
   'moment'
], function($, _, moment){
   
   function generateDisplayName(name) {
      var pieces = name.split('_');
      if (pieces.length > 1) pieces.shift();
      return pieces.join(' ');
   };
   
   // Render an html template, either as pure html or an underscore template.
   // templateResource is the address of the template relative to index.html.
   // context is an optional parameter containing data to be used in template rendering.
   // If context is passed the template is considered an underscore template, otherwise pure html.
   function renderTemplate(templateResource, context) { 
      var success, error, template;
      
      // If the templateResource is a jQuery object the template is already in the dom.
      if (templateResource instanceof $) {
         // If 'context' was passed in render an undercore template, otherwise return
         // 'templateResource'.
         // TODO: Should 'templateResrouce' be cloned if 'context' isn't passed?
         return $(( context ? _.template(templateResource.html(), context) : templateResource.html() ));
      }
      
      // The success callback, called if the template is found.
      // Uses a closure to access 'template' and 'context'.
      success = function(data) {
         // If 'context' was passed as an argument, render the response as an underscore template,
         // otherwise store the pure html. Put the result in closure-available 'template'.
         template = ( context ? _.template(data, context) : data);
      };
      // The error callback, called if the template isn't found.
      // Uses a closure to access 'template'.
      error = function(data) {
         // Generate a default template explaining there was a problem.
         // TODO: This is not an adequate solution. Does not break gracefully.
         template = '<h1>Oops!</h1><span>We made a mistake somewhere, please email Matt at mjtognetti@gmail.com.</span>';
      };
      
      // Make an ajax request for the template using jQuery.
      // This is a synchronous request since this function is often used in view render functions.
      // 'dataType' is set to "html" to fix a bug on mobile safari browsers that interpret resources incorrectly.
      $.ajax(templateResource, {
         async: false,
         dataType: 'html',
         success: success,
         error: error
      });
      
      // Because the request was synchronous we know 'template' has a value.
      // Return the rendered template as a jQuery node
      return $(template);
   };
   
   // Returns a date object set to the current day at midnight, optionally passing an
   // integer to offset the date by i.e. -1 would be yesterday.
   //TODO: 'offset' functionality doesn't belong here, seperate out into own function.
   //function getCurrentDate({midnight: true}) {
   function today(offset) {
      // Get the current date.
      var today = new Date();
      // Set the time to midnight.
      today.setHours(0,0,0,0);
      // If 'offset' was passed in offset the date by 'offset' days.
      if (offset) today.setDate(today.getDate() + offset);
      // Return the date (which might not be today anymore).
      return today;
   };
   
   // Offset 'date' by 'offset' days. If 'clone' (boolean) is passed
   // clone the date and offset the clone instead of the original date.
   // Returns the offset date object.
   function offsetDate(date, offset, clone) {
      // Clone 'date' if 'clone' was passed.
      date = ( clone ? new Date(date.getTime()) : date);
      // Offset the date by 'offset' days.
      date.setDate(date.getDate() + offset);
      // Return the offset date, either the original or a clone.
      return date;
   };
   
   function formatDate(date, format) {
      return moment(date).format(dateFormats[format]);
   };
   
   function parseDate(dateString, format) {
      return moment(dateString, dateFormats[format]);
   };
   
   var dateFormats = {
      'textual': 'MMMM D YYYY, h:mma',
      'textual-short': 'MMM D YYYY, h:mma',
      'numeric': 'M/D/YYYY, h:mma'
   };
      
   // Safari knows how to stringify Dates into a JSON format, but stupidly
   // doesn't know how to parse them back.
   // Borrowed from https://gist.github.com/982725.
   // Not copying the license because its 30 times longer than the actual function.
   function parseJSONDate(a) {
      return ( a = /(\d+)-(\d+)-(\d+)T(\d+):(\d+):(\d+).(\d+)/.exec(a)),
             new Date( Date.UTC.apply(a[2]--, a.slice(1)) );
   };
   
   // Return true if valid date string, false otherwise.
   // Uses a 'stupid' check. If the Date object can parse it, claim its valid.
   function validateDateString(date) {
      // Date.parse returns the time in ms since epoch if the string is parsable.
      // Otherwise it returns "NaN", so use that as a validity check.
      return _.isNaN(Date.parse(date));
   };
   
   // Show a loading indicator over 'elem' displaying 'msg' text.
   // TODO: attach loading overlay to 'elem' parent? will hide scrollbars.
   function showLoadingIndicator(elem, msg) {
      var loadingOverlay;
      
      // Ensure 'elem' is a jQuery object.
      elem = $(elem);
      // Determine if a loadingOverlay is already being displayed over 'elem'.
      // If an overlay is already being displayed don't do anything else.
      loadingOverlay = $('.loadingOverlay', elem);
      // If there is no overlay add one.
      if (!loadingOverlay.length) {
         // Create the overlay, display 'msg' if defined.
         loadingOverlay = $('<div class="loadingOverlay"><span>' + (msg || "") + '</span></div>');
         // Account for any element scrolling.
         loadingOverlay.css('top', elem.scrollTop() + 'px' );
         // Append the overlay to 'elem'
         elem.append(loadingOverlay);
      }
   };
   
   // Hide any loading overlays displayed over 'elem'.
   function hideLoadingIndicator(elem) {
      var loadingOverlay;
      
      // Ensure 'elem' is a jQuery object.
      elem = $(elem);
      // Find any loading overlays active on 'elem'.
      loadingOverlay = $('.loadingOverlay', elem);
      // If there are any overlays remove them.
      if (loadingOverlay) loadingOverlay.remove();
   }
   
   // Return the utils object.
   return {
      generateDisplayName: generateDisplayName,
      renderTemplate: renderTemplate,
      today: today,
      offsetDate: offsetDate,
      formatDate: formatDate,
      parseDate: parseDate,
      showLoadingIndicator: showLoadingIndicator,
      hideLoadingIndicator: hideLoadingIndicator
   };
});
