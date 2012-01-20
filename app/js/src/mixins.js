define([
   'underscore',
   'publisher',
   'src/constants'
], function(_, publisher, constants) {
var curry, exports, channels = constants.channels;

curry = function() {
   var args, fn;
   args = [].slice.call(arguments, 0);
   fn = args.shift();
   return function() {
      fn.apply(this, args.concat([].slice.call(arguments, 0)));
   };
};

exports = function() {
   var args, obj;
   
   args = _.toArray(arguments);
   obj = args.shift();
   
   _.each(args, function(mixin) {
      mixin.call(obj);
   });
};

// Safe for all objects.
// Will store an activate attribute if object is a Backbone model.
exports.isActivateable = (function(){
   function activate() {
      //if (_.isFunction(this.set)) {
      //   this.set({ active: true });
      //} else {
         this.active = true;
      //}
      publisher.publish(this.channel + channels.activated, this);
   };
   
   function deactivate() {
      //if (_.isFunction(this.set)) {
      //   this.set({ active: false });
      //} else {
         this.active = false;
      //}
      publisher.publish(this.channel + channels.deactivated, this);
   };
   
   return function() {
      this.activate = activate;
      this.deactivate = deactivate;
   }
})();

// Safe for all objects.
exports.isTimerangeDependant = (function() {
   function updateTimerange(timerange) {
      this.timerange = timerange;
      publisher.publish(this.channel + channels.timerangeUpdated, this);
   };
   
   return function(){
      this.updateTimerange = updateTimerange;
   }
})();

// If not a Backbone Model or Collection must implement a fetch function.
// Implementing may have the following functions:
//    getRequestData() - returns any data to be sent with the xhr request.
//    handleLoadSuccess() - do any extra work needed after a succesfull load. If implementing object is a 
//                          Backbone model or collection this is called AFTER parse().
//    handleLoadFailure() - do any extra work needed after a failed load. Can return an error msg.
//    handleLoadCancel() - do any extra work needed after a cancelled load. Can return a cancel msg.
exports.isLoadable = (function() {
   function load(){
      var data;
      
      if (this.loading) this.cancelLoad();
      this.loading = true;
      
      data = _.isFunction(this.getRequestData) ? this.getRequestData() : {};

      this.fetch({
         data: data,
         success: _.bind(this.loadSuccess, this),
         error: _.bind(this.loadFailure, this)
      });
      
      publisher.publish(this.channel + channels.loadStarted, this);
   };
   function loadSuccess(self, response){
      if (this.loading) {
         this.loading = false;
         if (_.isFunction(this.handleLoadSuccess)) {
            this.handleLoadSuccess(response);
         }
         //console.log(this.channel + channels.loadSucceeded);
         publisher.publish(this.channel + channels.loadSucceeded, self, response);
      }
   };
   function loadFailure(self, response){
      var msg = 'failed';
      if (this.loading) {
         this.loading = false;
         
         msg = _.isFunction(this.handleLoadFailure) ?
               this.handleLoadFailure() :
               'failed';

         publisher.publish(this.channel + channels.loadFailed, self, msg || 'failed', response);
      }
   };
   function cancelLoad() {
      var msg;
      if (this.loading) {
         this.loading = false;
         
         msg = _.isFunction(this.handleLoadCancel) ? 
               this.handleLoadCancel() : 
               'cancelled';
            
         publisher.publish(this.channel + channels.loadCancelled, this, msg || 'cancelled');
      }
   };
   
   return function() {
      this.loading = false;
      
      this.load = load;
      this.loadSuccess = loadSuccess;
      this.loadFailure = loadFailure;
      this.cancelLoad = cancelLoad;
   }
})();

// Safe for all objects.
exports.hasLoadableItems = (function() {
   function beginLoadingItem(item) {
      this.loadCounter++;
      if (this.loadCounter == 1) {
         this.loadingErrors = [];
         publisher.publish(this.channel + channels.loadItemsStarted, this);
      }
      item.load();
   };
   
   function cancelLoadingItem(item, msg) {
      this.endLoadingItem(item, msg);
   };
   
   function endLoadingItem(item, error) {
      this.loadCounter--;
      if (error) this.loadingErrors.push(error); 
      if (this.loadCounter == 0) {
         _.isEmpty(this.loadingErrors) ? this.loadItemsFailure() : this.loadItemsSuccess();
      }
   };
   
   function loadItemsSuccess() {
      //console.log(this.channel + channels.loadItemsSucceeded);
      publisher.publish(this.channel + channels.loadItemsSucceeded, this);
   };
   
   function loadItemsFailure() {
      //console.log(this.channel + channels.loadFailed);
      publisher.publish(this.channel + channels.loadItemsFailed, this, loadingErrors);
   };
   
   function checkLoadingStatus() {
      return loadingCount;
   };
   
   return function() {
      this.loadCounter = 0;
      this.loadingErrors = [];
      
      this.beginLoadingItem = beginLoadingItem;
      this.endLoadingItem = endLoadingItem;
      this.cancelLoadingItem = cancelLoadingItem;
      this.loadItemsSuccess = loadItemsSuccess;
      this.loadItemsFailure = loadItemsFailure;
      this.checkLoadingStatus = checkLoadingStatus;
   };
})();

return exports;

});