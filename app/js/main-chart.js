require.config({
   paths: {
      'jquery': 'lib/vendor/jquery',
      'underscore': 'lib/vendor/underscore',
      'backbone': 'lib/vendor/backbone',
      'publisher': 'lib/vendor/publisher',
      'moment': 'lib/vendor/moment'
   }
});
require([
   'jquery',
   'lib/utils',
   'src/events',
   'src/series',
   'src/controllers/chart',
   'src/controllers/timerange',
   'src/controllers/seriesSelector',
   'src/controllers/eventList',
   'src/controllers/eventCollectionSelector',
   'src/controllers/eventController',
], function($, Utils, Events, SeriesList, Chart, RangeSelector, SeriesSelector, EventList, EventSourceSelector, EventController) {
   var series, events, tweets, chart, rangeSelector, seriesSelector, eventList, eventSourceSelector, tweetList;
   
   today = new Date();
   yesterday = Utils.offsetDate(today, -1, true);
         
   timerange = {
      from: yesterday,
      to: today
   };
   
   series = new SeriesList([], { timerange: timerange });
   events = events = new Events({ timerange: timerange });

   rangeSelector = new RangeSelector({ el: $('#rangeSelector-container'), timerange: timerange });
   
   chart = new Chart({
      legend: $('#legend-container'),
      el: $('#chart-container'),
      series: series,
      events: events
   });
   seriesSelector = new SeriesSelector({ 
      trigger: $('#legend-container'), 
      el: $('#seriesSelector-container'),
      series: series
   });
   
   eventController = new EventController({
      el: $('#eventController-container'),
      list: { el: $('#eventList-container'), events: events },
      selector: {
         trigger: $('#event-source-trigger'),
         el: $('#eventSourceSelector-container'),
         events: events
      },
      editor: { 
         el: $('#eventEditor-container'),
         timerange: timerange
      }
   });
   eventController.setListState();
   
   series.load();
   events.load();
   
   chart.render();
});