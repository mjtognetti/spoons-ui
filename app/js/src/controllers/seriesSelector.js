define([
   'jquery',
   'underscore',
   'backbone',
   'publisher',
   'lib/utils',
   'src/constants'
], function($, _, Backbone, publisher, Utils, constants) {
var SeriesSelector, channels = constants.channels;

SeriesSelector = Backbone.View.extend({
   channel: 'seriesSelector',
   events: { 'click .member': 'toggleSeriesActivation' },
   groupTemplate: $('#series-group-template'),
   initialize: function(options){
      this.active = false;
      this.trigger = options.trigger;
      this.series = options.series;
      
      publisher.subscribe('series' + channels.loadStarted, this.loadStart, this);
      publisher.subscribe('series' + channels.loadSucceeded, this.loadSuccess, this);
      publisher.subscribe('series' + channels.loadFailed, this.loadFailure, this);
         
      $(this.trigger).on('click', _.bind(this.toggleActivation, this));
   },
   toggleActivation: function(){
      this.active ? this.deactivate() : this.activate();
   },
   activate: function(){
      this.active = true;
      this.render();
      $(this.el).removeClass('display-none');
      $(this.trigger).html('close selector');
      publisher.publish(this.channel + channels.activated);
   },
   deactivate: function(){
      this.active = false;
      $(this.el).addClass('display-none');
      if (!this.series.detect(function(series){ return series.active }))
         $(this.trigger).html('add/remove series');
      publisher.publish(this.channel + channels.deactivated);
   },
   loadStart: function(){
      this.loading = true;
      if (this.active) this.render();
   },
   loadSuccess: function(){
      this.loading = false;
      if (this.active) this.render();
   },
   loadFailure: function(){
      this.loading = false;
      if (this.active) this.render();
      alert('Error Loading Series');
   },
   toggleSeriesActivation: function(e){
      var targetElement, cid, series;
      
      targetElement = $(e.target);
      cid = targetElement.attr('data-cid');
      series = this.series.getByCid(cid);
      
      series.active ? this.deactivateSeries(series, targetElement) : this.activateSeries(series, targetElement);
   },
   activateSeries: function(series, el){
      el.addClass('active');
      series.activate();
   },
   deactivateSeries: function(series, el){
      el.removeClass('active');
      series.deactivate();
   },
   render: function(){
      $(this.el).empty();
      this.loading ? this.renderLoadingIndicator() : this.renderGroupings();
      return this;
   },
   renderLoadingIndicator: function(){
      Utils.showLoadingIndicator($(this.el), 'loading');
   },
   /*
    * Group series by group name,
    * For each of those groups, group the series within by series name.
    * If the series name groupings have more than one member render the grouping with the series' name as the
    * grouping's title and each series identified by its attribute.
    * If the series name grouping has only one member render the grouping with the group name as the grouping's tile
    * and each series identified by its name.
    */
   renderGroupings: function() {
      var groupingByGroup, groupingElements = [];
      // group all series by name
      groupingByGroup = this.series.groupBy(function(series){ return series.get('group') });
      
      // for each grouping
      _.each(groupingByGroup, function(grouping, groupName) {
      
         // if group has duplicate member names
         if (this.detectDuplicateMemberNames(grouping)) {
            // group members by name
            groupingsByName = _.groupBy(grouping, function(series){ return series.get('name'); });
            // for each name grouping 
            _.each(groupingsByName, function(grouping, name) {
               // render a grouping
               groupingElements.push(this.renderNameGrouping(grouping, name));
            }, this);
         }
         // else
         else {
            // render grouping
            groupingElements.push(this.renderGroupGrouping(grouping, groupName));
         }
      }, this);
      
      $().append.apply($(this.el), groupingElements);
   },
   detectDuplicateMemberNames: function(group) {
      var vals = {};
      return _.detect(group, function(member) {
         return vals[member.get('name')] || !(vals[member.get('name')] = true);
      });
   },
   renderGroupGrouping: function(grouping, groupName) {
      return this.renderGrouping(grouping, groupName, 'displayName');
   },
   renderNameGrouping: function(grouping, name) {
      return this.renderGrouping(grouping, name, 'attribute');
   },
   renderGrouping: function(grouping, title, seriesNameAttribute) {
      var context, members; 
      members = _.map(grouping, function(series) {
         return {
            classes: series.active ? 'member active' : 'member',
            cid: series.cid,
            name: series.get(seriesNameAttribute)
         };
      });
      context = {
         title: Utils.generateDisplayName(title),
         members: members
      };
      return Utils.renderTemplate(this.groupTemplate, context); 
   }
});

return SeriesSelector;

});