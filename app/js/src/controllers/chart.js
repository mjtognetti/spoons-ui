define([
   'order!jquery',
   'underscore',
   'backbone',
   'publisher',
   'lib/utils',
   'src/constants',
   'order!js/lib/vendor/jquery.flot.js',
   'order!js/lib/vendor/jquery.flot.resize.js',
   'order!js/lib/vendor/jquery.flot.selection.js'
], function ($, _, Backbone, publisher, Utils, constants){
var Chart, channels = constants.channels;
/*
 * Chart
 * Displays a graph of timeseries data.
 * Uses Flot Charts <url here> for charting.
 *
 * TODO:
 * -Should the chart redraw automatically when series are activated/deactivated?
 *  It results in response updates if the amount of data is small and draw time
 *  is short, but extended draw times lock up the UI. Determine based on data size?
 * -Extract event colors from GraphView, make accessible by event list and graph view.
 */
Chart = Backbone.View.extend({
   channel: 'chart',

   // Colors for plotted series.
   colors: [
      '#E41A1C',
      '#377EB8',
      '#4DAF4A',
      '#984EA3',
      '#FF7F00',
      '#FFFF33',
      '#A65628',
      '#F781BF'
   ],
   
   // Colors for event ranges.
   eventColors: {
      media: '#C2FFBF', // light green
      outage: '#FFBFBF', // light red
      poutage: '#E9A4FF', // light purple
      hole: '#CCCCCC', // grey
      monitor: '#BFFFFF', // light blue
      unknown: '#FFB90F' // light yellow
   },
   
   // Initialize a GraphView.
   initialize: function(options){      
      // Set default values for 'enabled'.
      this.active = true;
      this.loading = 0;
      this.legendContainer = options.legend;
      this.series = options.series;
      this.events = options.events;
      
      publisher.subscribe('seriesSelector' + channels.activated, this.deactivate, this);
      publisher.subscribe('seriesSelector' + channels.deactivated, this.activate, this);
      
      // Bind to series events for de/activation, data fetching, and data fetched.
      publisher.subscribe('series:single' + channels.activated, this.addSeries, this);
      publisher.subscribe('series:single' + channels.deactivated, this.removeSeries, this);
      publisher.subscribe('series' + channels.loadItemsStarted, this.renderLoadingIndicator, this);
      publisher.subscribe('series' + channels.loadItemsSucceeded, this.renderSeries, this);
      publisher.subscribe('series' + channels.loadItemsFailed, this.renderSeries, this);
      
      // Bind to the events collection to listen for 'reset' events (new events loaded).
      publisher.subscribe('events' + channels.loadItemsStarted, this.renderLoadingIndicator, this);
      publisher.subscribe('events' + channels.loadItemsSucceeded, this.renderEvents, this);
      publisher.subscribe('events' + channels.loadItemsFailed, this.renderEvents, this);
      publisher.subscribe('events:collection' + channels.deactivated, this.render, this);
      
      this.initializePlot();
   },
   
   // Initialize a flot plot.
   initializePlot: function() {
      var el, tickFormatter, plotOptions;
      
      el = $(this.el);
      
      // Define the tickFormatter function.
      // Formates xaxis tick labels into local date strings.
      tickFormatter = function(val, axis) {
         return Utils.formatDate(new Date(val), 'textual-short');
      };    
      
      // Define the plot options hash.
      plotOptions = {
         // Legend options.
         legend: {
            // Remove the border around legend colors by making it transparent.
            labelBoxBorderColor: 'transparent',
            // Render the legend into the legend container.
            container: this.legendContainer
         },
         // X axis options.
         xaxis: {
            // Rendering timeseries so set mode to 'time'.
            mode: 'time',
            // Place the x axis below the chart.
            position: 'bottom',
            tickLength: 5,
            tickFormatter: tickFormatter
         },
         // Grid options.
         grid: {
            // Remove the border around the chart to reduce visual noise.
            borderWidth: 0,
            markings: _.bind(this.generateEventMarkings, this)
         },
         // Hooks (callbacks).
         hooks: {
            // Draw hooks are triggered after the chart is drawn.
            // Add the chartDrawn callback to the drawn hooks list.
            draw: [_.bind(this.chartDrawn, this)]
         },
         selection: {
            mode: 'x'
         }
      };
   
      // Instantiate and render the chart.
      this.plot = $.plot(el, [], plotOptions);
  
      // Bind plot event listeners
      el.bind('plotselected', _.bind(this.plotSelected, this));
      el.bind('plotunselected', _.bind(this.plotUnselected, this));
   },
   
   // Enable the chart, meaning the chart is visible and should display
   // necessary loading indicators.
   activate: function() {
      // Set 'enabled' flag to true.
      this.active = true;
      $(this.el).removeClass('display-none');
      // If series are still loading display a loading indicator.
      if (this.loading) this.showLoadingIndicator();
      // Else nothing is loading or drawing, so render the chart.
      else this.render();
      
      publisher.publish(this.channel + channels.activated, this);
   },
   
   // Disable the chart.
   // The chart is no longer visible and any loading or drawing indicators
   // should be hidden.
   deactivate: function() {
      // Set 'enabled' flag to false.
      this.active = false;
      $(this.el).addClass('display-none');
      // Hide any loading or drawing indicators.
      this.hideLoadingIndicator();
      
      publisher.publish(this.channel + channels.deactivated, this);
   },
   
   addSeries: function(series) {
      this.setSeriesColor(series);
      this.setSeriesOrder(series);
   },
   
   removeSeries: function(series) {
      this.unsetSeriesColor(series);
      this.unsetSeriesOrder(series);
      this.setSeriesData(this.series);
      this.render();
   },
   
   setSeriesColor: function(series) {
      series.set({ color: this.colors.shift() });
   },
   
   unsetSeriesColor: function(series) {
      this.colors.unshift(series.get('color'));
      series.unset('color');
   },
   
   setSeriesOrder: function(series) {
      series.set({ plotOrder: (new Date()) });
   },
   
   unsetSeriesOrder: function(series) {
      series.unset('plotOrder');
   },
   
   setSeriesData: function(series) {
      var activeSeries, seriesLoading, plotSeries, options;
      
      // Get all active series.
      activeSeries = series.select(function(series){ return series.active });
      // Convert to plot series format.
      plotSeries = this.convertSeriesToPlotSeries(activeSeries);
      // Sort by plot order.
      plotSeries = _.sortBy(plotSeries, function(series){ return series.order });
     
      // Set the new chart data. Chart SHOULD be redrawn after this.
      this.plot.setData(plotSeries);
   },
   
   convertSeriesToPlotSeries: function(series) {
      var plotSeries, convert;
      
      convert = function(series) {
         return {
            label: series.get('displayName'),
            color: series.get('color'),
            order: series.get('plotOrder'),
            data: series.data
         };
      };
      
      plotSeries = _.map(series, convert);
      
      // Return plot series.
      return plotSeries;
   },
   
   generateEventMarkings: function() {
      var eventColors = this.eventColors;

      function isActive(collection) {
         return collection.active;
      };
      function getMarkingsFromCollection(collection) {
         return collection.map(convertEventToMarking);
      };
      function convertEventToMarking(event) {
         return {
            xaxis: { from: +event.get('from'), to: +event.get('to') },
            color: eventColors[event.get('type')] || eventColors.unknown
         };
      };
      
      return _(this.events.collections).chain().
         select(isActive).
         map(getMarkingsFromCollection).
         flatten().
         value();
   },
   
   renderLoadingIndicator: function() {
      this.loading++;
      if (this.active) this.showLoadingIndicator();
   },
   
   renderSeries: function() {
      this.loading--;
      this.setSeriesData(this.series);
      this.render();
   },
   
   renderEvents: function() {
      this.loading--;
      this.render();
   },
   
   render: function() {
      if (this.active && !this.loading) {
         this.showLoadingIndicator();
         // Clear any selections of the chart, setup the grid, and draw.
         this.plot.clearSelection();
         this.plot.setupGrid();
         this.plot.draw();
      }
      
      // Return this for chaining.
      return this;
   },
   
   // Called when the chart has finished drawing.
   // Used to hide the drawing indicator overlay.
   chartDrawn: function() {
      // Hide the drawing indicator overlay.
      this.hideLoadingIndicator();
   },
   
   //TODO: should plotSelected and plotUnselected tweet handler be in the tweetList intead
   // of here?
   // Handler for when a range is selected on the chart via click-and-drag.
   // Updates tweet collection timerange to match the selection range.
   plotSelected: function(event, range) {
      publisher.publish('chart:range:selected', range.xaxis);
   },
   
   // Handler for when a plot/chart selection is unselected.
   // Updates the tweet collection timerange to match the core timerange.
   plotUnselected: function(event) {
      publisher.publish('chart:range:unselected');
   },
   
   // Display a loading indicator.
   // TODO: drawing indicator is currently useless.
   showLoadingIndicator: function() {
      // Only show a loading indicator if the chart is currently enabled.
      if (this.active) {
         // Call Utils.showLoadingIndicator to show the indicator.
         Utils.showLoadingIndicator(this.el, 'loading');
      }
   },
   
   // Remove the loading indicator.
   hideLoadingIndicator: function() {
      Utils.hideLoadingIndicator(this.el);
   }
});

return Chart;

});