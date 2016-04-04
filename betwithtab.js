var phantom = require('phantom');
var assert = require('assert');

var testUrl = "https://www.tab.com.au/";

betWithTab();

function betWithTab(){
  phantom.create(function(ph){
    ph.cookiesEnabled = true;
    ph.createPage(function(page) {
      //page.settings.userAgent = 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/44.0.2403.157 Safari/537.36';
      page.open(testUrl, function(status) {
        setTimeout(function() {
          page.includeJs("http://ajax.googleapis.com/ajax/libs/jquery/1.6.1/jquery.min.js", function() {
            page.evaluate(function() {
              $(".functional.login-section-link").click();
              setTimeout(function(){
                $("input[name='account_id']").val("USERNAME");
                $("input[name='account_password']").val("PASSWORD");
                              $("form[name='loginForm']").submit();
              }, 2000);
              return $("form[name='loginForm']").length;
            }, function(result){
              console.log(result);
              setTimeout(function(){
                page.evaluate(function(){
                  return document.getElementsByClassName('icon-user').length;
                }, function(result){
                  console.log(result);
                });
              }, 5000);
            });
            //ph.exit()
          });
        }, 5000);
      });
    });
  }, {
    dnodeOpts: {
      weak: false
  }
});
}
