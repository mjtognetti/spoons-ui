define([
   'underscore',
   'backbone',
   'publisher',
   'lib/utils',
   'src/mixins',
   'src/constants',
], function(_, Backbone, publisher, Utils, mixins, constants) {
var Series, SeriesCollection, channels = constants.channels;

Series = Backbone.Model.extend({
   channel: 'series:single',
   initialize: function(attributes, options){
      publisher.subscribe('rangeSelector' + channels.timerangeUpdated, this.updateTimerange, this);
      
      this.timerange = options.timerange;
      this.active = options.active || false;
      this.set({ displayName: Utils.generateDisplayName(this.get('name')) });

      // HOTFIX for ambigous series names when attribute is needed for identification.
      // TODO clean this up
      if (this.get('hasIdentifyingAttribute')) {
         this.set({
            displayName: this.get('displayName') + ' ' + this.get('attribute')
         });
      }
   },
   getRequestData: function() {
      return {
         from: this.timerange.from.getTime() / 1000,
         to: this.timerange.to.getTime() / 1000,
         units: 'ms',
         lang: 'en',
         js: true //temp
      };
   },
   handleLoadSuccess: function(response) {
      this.data = response;
   },
   // No-op parse to prevent data response being set as attributes of the series model.
   parse: function() {},
   // Override the default url behavior, using the series group and name as its identifier
   url: function() {
      var collection, group, series, attribute;
      
      // Retrieve the various url components.
      collection = this.collection.url;
      group = this.get('group');
      series = this.get('name');
      attribute = this.get('attribute');
      
      // Assemble the components into the complete url and return.
      return collection + '/' + encodeURIComponent(group) + '/' + encodeURIComponent(series) + '/' + encodeURIComponent(attribute);
   }
});   
mixins(Series.prototype, mixins.isActivateable, mixins.isTimerangeDependant, mixins.isLoadable);


SeriesCollection = Backbone.Collection.extend({
   model: Series,
   channel: 'series',
   url: constants.urls.root + constants.urls.series,
   
   loadingCount: 0,
   errors: [],
   
   initialize: function(models, options) {
      publisher.subscribe('series:single' + channels.activated, this.loadItem, this);
      publisher.subscribe('series:single' + channels.timerangeUpdated, this.loadItem, this);
      publisher.subscribe('series:single' + channels.loadSucceeded, this.endLoadingItem, this);
      publisher.subscribe('series:single' + channels.loadFailed, this.endLoadingItem, this);
      
      this.initialTimerange = options.timerange;
   },
   loadItem: function(item) {
      if (item.active) this.beginLoadingItem(item);
   },
   getRequestData: function() {
      return {
         members: true,
         attributes: true
      };
   },
   parse: function(groups) {
      var models = [], timerange = this.initialTimerange;
      
      _.each(groups, function(group) {
         var groupName, attributes, hasIdentifyingAttribute;
         groupName = group.name;
         attributes = group.attributes;
         hasIdentifyingAttribute = (attributes.length > 1);
         
         _.each(group.members, function(member) {
            var memberName = member.name;
            
            _.each(attributes, function(attribute) {
               models.push(new Series({
                  group: groupName,
                  name: memberName,
                  attribute: attribute.name,
                  hasIdentifyingAttribute: hasIdentifyingAttribute
               }, {
                  timerange: timerange
               }));
            });
         });
      });

      return models;
   }   
});
mixins(SeriesCollection.prototype, mixins.isLoadable, mixins.hasLoadableItems);

return SeriesCollection;
});
