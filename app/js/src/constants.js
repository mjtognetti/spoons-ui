define({
urls: {
   root: '../../api',
   series: '/timeseries',
   events: '/events',
   tweets: '/tweets'
},

channels: {
   activated: ':activated',
   deactivated: ':deactivated',
   timerangeUpdated: ':timerange:updated',
   loadStarted: ':load:started',
   loadSucceeded: ':load:succeeded',
   loadFailed: ':load:failed',
   loadCancelled: ':load:cancelled',
   loadItemsStarted: ':items:load:started',
   loadItemsSucceeded: ':items:load:succeeded',
   loadItemsFailed: ':items:load:failed',
   initStarted: ':init:started',
   initSucceeded: ':init:succeeded',
   initFailed: ':init:failed',
   reportRequested: ':request:report',
   editRequested: ':request:edit',
   rangeSelected: ':range:selected',
   rangeUnselected: ':range:unselected',
   saveSucceeded: ':save:succeeded',
   saveFailed: ':saved:failed'
},

publishers: {
   timerangeSelector: 'timerangeSelector',
   seriesSelector: 'seriesSelector',
   eventCollectionSelector: 'eventCollectionSelector',
   chart: 'chart',
   series: 'series',
   eventList: 'eventList',
   events: 'events',
   tweetList: 'tweetList',
   tweets: 'tweets'
},

//jQuery datePicker date formatting strings.
dateFormats: {
   numeric: 'm/d/yy',
   textual: 'MM d, yy'
}
   
});