define([
   'jquery',
   'underscore',
   'backbone',
   'publisher',
   'src/constants',
   'src/controllers/eventList',
   'src/controllers/eventCollectionSelector',
   'src/controllers/eventEditor'
], function($, _, Backbone, publisher, constants, EventList, EventSelector, EventEditor) {
   var EventController, channels = constants.channels;
   
   
   EventController = Backbone.View.extend({
      channel: 'eventController',
      template: _.template($('#event-controller-template').html()),
      events: {
         'click #event-selector-trigger': 'triggerSelector',
         'click #event-report-trigger': 'triggerReport'
      },
      initialize: function(options) {
         this.list = new EventList(options.list);
         this.selector = new EventSelector(options.selector);
         this.editor = new EventEditor(options.editor);
         
         publisher.subscribe('eventList:event:request:report', this.openEditor, this);
         publisher.subscribe('eventList:event:request:edit', this.openEditor, this);
      },
      triggerSelector: function(){},
      triggerReport: function(){},
      setListState: function() {
         listState.call(this);
         this.list.activate();
         this.render();
      },
      setSelectorState: function() {
         selectorState.call(this);
         this.selector.activate();
         this.render();
      },
      setEditorState: function(event) {
         editorState.call(this);
         this.editor.activate(event);
         this.render();
      },
      render: function() {
         var context = this.getTemplateContext();
         $(this.el).html(this.template(context));
         this.delegateEvents();
         return this;
      },
      openEditor: function(event) {
         this.list.deactivate();
         this.setEditorState(event);
      }
   });
   
   var listState = (function() {
      function triggerSelector() {
         this.list.deactivate();
         this.setSelectorState();
      };
      function triggerReport() {
         this.list.deactivate();
         this.setEditorState();
      };
      function getTemplateContext() {
         return {
            selector: {
               msg: 'add/remove event sources',
               classes: ''
            },
            report: {
               msg: 'report event',
               classes: ''
            }
         };
      };
      
      return function() {
         this.triggerSelector = triggerSelector;
         this.triggerReport = triggerReport;
         this.getTemplateContext = getTemplateContext;
      };
   })();

   var selectorState = (function() {
      function triggerSelector() {
         this.selector.deactivate();
         this.setListState();
      };
      function triggerReport() {
         this.selector.deactivate();
         this.setEditorState();
      };
      function getTemplateContext() {
         return {
            selector: {
               msg: 'close selector',
               classes: ''
            },
            report: {
               msg: 'report event',
               classes: ''
            }
         };
      };
      
      return function() {
         this.triggerSelector = triggerSelector;
         this.triggerReport = triggerReport;
         this.getTemplateContext = getTemplateContext;
      };
   })();
   
   var editorState = (function() {
      function triggerSelector() {
         this.editor.cancel();
         this.editor.deactivate();
         this.unsubscribe();
         this.setListState();
      };
      function triggerReport() {
         this.editor.save();
      };
      function saveSuccess() {
         this.unsubscribe();
         this.editor.deactivate();
         this.setListState();
      };
      function saveFailure() {
         alert('Failed to save changes!');
      };
      function unsubscribe() {
         this.successSubscription.detach();
         this.failureSubscription.detach();
         
         this.successSubscription = undefined;
         this.failureSubscription = undefined;
         this.unsubscribe = undefined;
      };
      function getTemplateContext() {
         return {
            selector: {
               msg: 'cancel',
               classes: 'editor'
            },
            report: {
               msg: 'save',
               classes: 'editor'
            }
         };
      };
      
      return function() {
         this.triggerSelector = triggerSelector;
         this.triggerReport = triggerReport;
         this.getTemplateContext = getTemplateContext;
         this.unsubscribe = unsubscribe;
         
         this.successSubscription = publisher.subscribe('events:event' + channels.saveSucceeded, saveSuccess, this);
         this.failureSubscription = publisher.subscribe('events:event' + channels.saveFailed, saveFailure, this);
      };
   })();
   
   return EventController;
});