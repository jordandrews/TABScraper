var testindex = 0;
var linkIndex = -1;
var payindex = 0;
var loadInProgress = false; //This is set to true when a page is still loading
var isBetting = false;
var raceLinks;
var loginInterval;
var payInterval;
/*********SETTINGS*********************/
var webPage = require('webpage');
var page = webPage.create();
//page.settings.userAgent = 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/44.0.2403.157 Safari/537.36';
page.settings.javascriptEnabled = true;
page.settings.loadImages = false; //Script is much faster with this field set to false
phantom.cookiesEnabled = true;
phantom.javascriptEnabled = true;
/*********SETTINGS END*****************/

console.log('All settings loaded, start with execution');
page.onConsoleMessage = function(msg) {
  console.log("CONSOLE: " + msg);
};
/**********RACE LINK RETRIEVAL***********************/
function retrieveAllRaces() {
  console.log("retrieving all races");
  page.open("https://www.tab.com.au/racing/meetings/today/R", function(status) {});
  setTimeout(function() {
    raceLinks = page.evaluate(function() {
      var raceHrefs = [];
      var races = document.querySelectorAll('a.race-wrapper:not(.resulted)');
      for (var i = 0; i < races.length; i++) {
        var raceStartTime = races[i].getElementsByClassName('race-start-time')[0].innerHTML;
        if (parseInt(raceStartTime.substring(0,2)) < 20){ //get in between like 10 and 20.
        raceHrefs.push(races[i].getAttribute("href"));
        }
      }
      return raceHrefs;
    });
    console.log(raceLinks.length);
    loginInterval = setInterval(executeLoginRequestsStepByStep, 3000);
  }, 10000);
}
/**********END RACE LINK RETRIEVAL***********************/

/**********DEFINE LOGIN STEPS ***********************/
var loginSteps = [

  //Step 1 - Open TAB home page
  function() {
    console.log('Step 1 - Open TAB home page');
    page.open("https://tab.com.au", function(status) {});
  },
  //Step 2 - Open the sign-in form.
  function() {
    console.log('Step 2 - Click on the Sign in button');
    page.evaluate(function() {
      document.getElementsByClassName("functional login-section-link")[0].click();
    });
  },
  //Step 3 - Populate and submit the login form - PUT USERNAME AND PASS HERE
  function() {
    console.log('Step 3 - Populate and submit the login form');
    page.evaluate(function() {
      angular.element(document.getElementsByName("account_id")[1]).triggerHandler('change');
      document.getElementsByName("account_id")[1].value = "USERNAME";
      angular.element(document.getElementsByName("account_id")[1]).triggerHandler('change');
      angular.element(document.getElementsByName("account_password")[0]).triggerHandler('change');
      document.getElementsByName("account_password")[0].value = "PASSWORD";
      angular.element(document.getElementsByName("account_password")[0]).triggerHandler('change');
      document.getElementsByName("remember_me")[0].checked = true;
      document.getElementsByName("account_id")[1].focus();
      document.getElementsByName("account_id")[1].select();
    });
  },
  //step 4 - get valid update and then submit via click.
  function() {
    page.sendEvent('keypress', page.event.key.Tab, null, null, 0); //send tab event to update $.valid
    var submitCount = page.evaluate(function() {
      var loginForm = document.getElementsByName("loginForm")[0];
      var formButtons = loginForm.getElementsByTagName("button");
      var submitButton;
      for (var i = 0; i < formButtons.length; i++) {
        if (formButtons[i].getAttribute("type") == "submit") {
          submitButton = formButtons[i];
        }
      }
      submitButton.click();
    });
  },
  //Step 4 -We're in.
  function() {
    var result = page.evaluate(function() {});
    page.render('tabloggedin.jpg');
  },
];
/**********END LOGIN STEPS***********************/

/**********DEFINE PAY STEPS ***********************/
function betOnNextRace() {
  linkIndex++;
  if (linkIndex >= raceLinks.length) {
    phantom.exit();
  }
  payInterval = setInterval(executePayRequestsStepByStep, 3000);
}

var paySteps = [
    //Step 1 - Open right href
    function() {
      isBetting = false;
      console.log('Step 1 - READY TO PAY');
      page.open("https://tab.com.au" + raceLinks[linkIndex], function(status) {});
    },
    //Step 2 - click correct row
    function() {
      console.log('check rows - click if valid');
      isBetting = page.evaluate(function() {
            var raceResultsWrapper = document.getElementsByClassName('race-results-wrapper')[0];
            var runnerRows = raceResultsWrapper.querySelectorAll('.row:not(.scratched)');
            for (var i = 0; i < runnerRows.length; i++) {
              var barrierNumWithBrackets = runnerRows[i].getElementsByClassName('barrier')[0];
              if (barrierNumWithBrackets) {
                var barrier = barrierNumWithBrackets.innerHTML.replace('(', '').replace(')', '').trim();
                if (barrier == "6") {
                  var priceButton = runnerRows[i].getElementsByClassName('win-cell')[1];
                  var price = priceButton.getElementsByTagName('span')[0].innerHTML;//MAKE SURE IS RIGHT
                  if (parseInt(price) > 8 && parseInt(price) < 16) {
                    //BET ON IT!!
                    priceButton.click();
                    document.getElementsByClassName('toggle-visible-button button-as-handle')[0].click();
                    return true;
                    }
                  }
                }
              }
              return false;
            });
             console.log("FOUND A MATCH: " + isBetting);
        },
        // //Step 3 -
        function() {
          console.log('Step 3 - fill out payment form ');
          if (isBetting) {
            page.evaluate(function() {
              var winInput = document.getElementsByClassName('bet-card-body')[0].getElementsByClassName('bet-card-info')[0].getElementsByTagName('input')[0];
              winInput.value = 1;
              angular.element(winInput).triggerHandler('change');
              winInput.focus();
              winInput.select();
            });
          }
        },
        //step 4 - get valid update and then submit via click.
        function() {
          page.sendEvent('keypress', page.event.key.Tab, null, null, 0);
          console.log('step 4 -submit payment form');
          if (isBetting) {
            page.evaluate(function() {
              var something = document.getElementsByClassName('submit-bet-button')[0];
              something.click();
            });
          }
        },
        //Step 4 -We're in.
        function() {
          console.log('last part of submit');
          //page.render("betpagefilled3.jpg");
          if (isBetting) {
            page.evaluate(function() {
              document.getElementsByClassName('toggle-visible-button button-as-handle')[0].click();
            });
          }
        },
        function() {
          if (isBetting) {
            page.evaluate(function() {
              document.getElementsByClassName('bet-summary-menu')[0].getElementsByClassName('common-button')[2].click();
            });
            //console.log('WOULD HAVE BET RIGHT HERE');
            page.render("betpageindex" + linkIndex + ".jpg");
          }
        },
        function() {
          if (isBetting) {
            console.log("bet complete");
            //page.render("betpagefilled5.jpg");
          }
        }
    ];
    /**********END PAY STEPS***********************/

    //code to check all horse races - and if any horses match criteria then bet $1 on them
    retrieveAllRaces();

    function executeLoginRequestsStepByStep() {
      if (loadInProgress == false && typeof loginSteps[testindex] == "function") {
        //console.log("step " + (testindex + 1));
        loginSteps[testindex]();
        testindex++;
      }
      if (typeof loginSteps[testindex] != "function") {
        console.log("login complete!");
        clearInterval(loginInterval);
        betOnNextRace();
      }
    }

    function executePayRequestsStepByStep() {
      if (loadInProgress == false && typeof paySteps[payindex] == "function") {
        paySteps[payindex]();
        payindex++;
      }
      if (typeof paySteps[payindex] != "function") {
        payindex = 0;
        clearInterval(payInterval);
        console.log("race index " + linkIndex + " complete!");
        betOnNextRace();
      }
    }

    /**
     * These listeners are very important in order to phantom work properly. Using these listeners, we control loadInProgress marker which controls, weather a page is fully loaded.
     * Without this, we will get content of the page, even a page is not fully loaded.
     */
    page.onLoadStarted = function() {
      loadInProgress = true;
      //console.log('Loading started');
    };
    page.onLoadFinished = function() {
      loadInProgress = false;
      //console.log('Loading finished');
    };
