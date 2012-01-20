({
   paths: {
      'jquery': 'lib/vendor/jquery',
      'underscore': 'lib/vendor/underscore',
      'backbone': 'lib/vendor/backbone',
      'publisher': 'lib/vendor/publisher',
      'moment': 'lib/vendor/moment'
   },
   appDir: '../app',
   baseUrl: 'js',
   dir: '../build',
   //optimize: 'none',
   modules: [
      {
         name: 'main'
      },
      {
         name: 'main-chart'
      }
   ]
})