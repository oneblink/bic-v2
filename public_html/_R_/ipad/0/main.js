var keywords = ["Loading..."];
var descriptions = ["Please wait..."];
var keywordAttributes = null;
var helpText = null;
var keywordArgumentsHtml = null;
var categories = null;
var currentCategory = "";
var currentKeywordNumber = 0;
var httpAnswerRequest = false;
var httpBlingRequest = false;
var disconnectedDataStore = new Array();
var row1;
var row2;
var answerSpaceCategories = true;
var answerSpaceOneKeyword = false;

var hasMasterCategories = false;
var hasVisualCategories = false;

var masterCategories = null;
var currentMasterCategory = "";

var leftListStyle = null;
var textonlyLeftList = "";

var webappCache = window.applicationCache;

if (localStorage.getItem("_answerSpace") != answerSpace) {
  console.log("answerSpace(1) changed - clearing local storage");
  //alert("answerSpace(1) changed - clearing local storage");
  localStorage.clear();
}
if (!answerSpace || answerSpace == "<?=$_REQUEST['answerSpace']?>")
{
   answerSpace = 'blink';
   localStorage.setItem("_answerSpace", answerSpace);
} 
console.log("main(1): ");

console.log("main(2): ");
//window.addEventListener("load", loaded, false);
webappCache.addEventListener("updateready", updateCache, false);
webappCache.addEventListener("error", errorCache, false);

try {
    if (!window.openDatabase) {
        alert('Unable to create disconnected mode databases');
    } else {
        //var shortName = 'mydatabase';
        var version = '1.0';
        var displayName = 'myAnswers AnswerSpace: ' + answerSpace;
        var maxSize = 65536; // in bytes
        var db = openDatabase(answerSpace, version, displayName, maxSize);
 
        // You should have a database instance in db.
	// Create the required tables if the don't exist
	db.transaction(
	   function (transaction) {
	   /* Creat table to hold persistent data for Answer Space accesses. */
	   transaction.executeSql('CREATE TABLE IF NOT EXISTS answerSpaceData(id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT, answerParm TEXT UNIQUE ON CONFLICT REPLACE NOT NULL, answerParmValue TEXT NOT NULL);', 
				  [], 
				  function (transaction, results) {
				  }, 
				  function (transaction, error) {
				    alert('Database transaction error(1):  ' + error.message + ' (Code ' + error.code +')');
				    return true;
				  }
				  );
	   });

    }
} catch(e) {
    // Error handling code goes here.
    if (e == 2) {
        // Version number mismatch.
        alert("Invalid myAnswers database version.");
    } else {
        alert("Unknown error " + e + ".");
    }
//    return;
}
//
// Reload disconnected mode data store from database
//
db.transaction(
	       function (transaction) {
		 transaction.executeSql("SELECT answerparm, answerParmValue FROM answerSpaceData;",
					[],
					function (transaction, resultSet) {
					  var i;
					  if (resultSet.rows.length > 0) {
					    for (i = 0; i < resultSet.rows.length; i++) {
					      disconnectedDataStore[resultSet.rows.item(i)['answerParm']] = resultSet.rows.item(i)['answerParmValue']; 
					    }
					    return true;
					  } else {
					    return false;
					  }
					}, 
					function (transaction, error) {
					  alert('Database transaction error(3):  ' + error.message + ' (Code ' + error.code +')');
					  return false;
					}
					);
	       });

dumpLocalStorage();

function setAnswerSpaceItem(key, value) {
  console.log("setAnswerSpaceItem(): " + key + ", " + value.substring(0,20) + "...");
  disconnectedDataStore[key] = value;
  //
  // Persist data across application restarts
  //
  db.transaction(
     function (transaction) {
       transaction.executeSql('INSERT INTO answerSpaceData (answerParm, answerParmValue) VALUES ( ?, ? );',
			      [key, value],
			      function (transaction, resultSet) {
				if (!resultSet.rowsAffected) {
				  alert("REPLACE no rows affected");
				}
			      }, 
			      function (transaction, error) {
				alert('Database transaction error(2):  ' + error.message + ' (Code ' + error.code +')');
				return true;
			      }
			      );
     });
}

function getAnswerSpaceItem(key) {
  return disconnectedDataStore[key];
}

function removeAnswerSpaceItem(key) {
  db.transaction(
     function (transaction) {
       transaction.executeSql("DELETE FROM answerSpaceData WHERE answerParm = '" + key + "';",
			      [],
			      function (transaction, resultSet) {
				if (!resultSet.rowsAffected) {
				  alert("DELETE no rows affected");
				}
			      }, 
			      function (transaction, error) {
				alert('Database transaction error(2):  ' + error.message + ' (Code ' + error.code +')');
				return true;
			      }
			      );
     });
  delete disconnectedDataStore[key];
}
 
function parseKeywordData() {
  console.log("currentCategory(1): " + currentCategory + " _currentCategory: " + getAnswerSpaceItem("_currentCategory"));
  if (!getAnswerSpaceItem(currentCategory + "_rawKeywordData"))
    return;
  var keywordDataArray = getAnswerSpaceItem(currentCategory + "_rawKeywordData").split("&");
  
  console.log("-: " + getAnswerSpaceItem(currentCategory + "_rawKeywordData"));
  answerSpaceOneKeyword = keywordDataArray.length == 2;
  keywords = new Array(keywordDataArray.length - 1);
  descriptions = new Array(keywordDataArray.length - 1);
  helpText = new Array(keywordDataArray.length - 1);
  keywordArgumentsHtml = new Array(keywordDataArray.length - 1);
  for (var i = 1; i < keywordDataArray.length; i++) 
  {
	 keywordAttributes = decodeURIComponent(keywordDataArray[i]).split("&");
	 keywords[i-1] = decodeURIComponent(keywordAttributes[0]);
	 descriptions[i-1] = decodeURIComponent(keywordAttributes[1]);
	 helpText[i-1] = decodeURIComponent(keywordAttributes[2]);
	 keywordArgumentsHtml[i-1] = decodeURIComponent(keywordAttributes[3]);
  }
}

function getKeywordList(category) {
  if (!navigator.onLine) {
	 console.log("Network not connected(1)...");
  }

  $('#mainLabel').html(category);
  currentCategory = category;
  setAnswerSpaceItem("_currentCategory", currentCategory);
  //alert($('#leftContent .selected').attr('title'));
  //$('#leftContent .selected').removeClass('selected');
  $('#leftContent li[title=' + category + ']').addClass('selected');
  
  var keywordsUrl = "util/GetKeywords.php";
  var requestData = "answerSpace=" + localStorage.getItem("_answerSpace");
  requestData += "&category=" + encodeURIComponent(category);
  console.log("GetKeywords transaction: " + keywordsUrl + "?" + requestData);
  $.ajax({
	 type: 'GET',
	 cache: "false",
	 url: keywordsUrl,
	 data: requestData,
	 success: function(data, textstatus, xmlhttprequest) { // readystate == 4 && status == 200
		if (data && data != "ERROR")
		{
		  setAnswerSpaceItem(currentCategory + "_rawKeywordData", data);
		}
		else
		{
		  keywords = ['Empty category'];
		  descriptions = ["No available keywords in this category"];
		}
	 },
	 error: function(xmlhttprequest, textstatus, error) { // readystate == 4 && status != 200
		keywords = ["Network Unreachable"];
		descriptions = ["Please retry when you are in network coverage"];
	 },
	 complete: function(xmlhttprequest, textstatus) { // readystate == 4
		console.log("GetKeywords transaction complete: " + textstatus);
		parseKeywordData();
		if (answerSpaceOneKeyword) {
		  showKeywordView(0);
		} else {
		  populateKeywordList();
		  showKeywordListView();
		}
	 },
	 timeout: 5 * 1000 // 5 seconds
  });
}
	
  // produce the HTML for the list and insert it into the document element with id listID
function populateKeywordList() {
  $('#keywordList').empty();
  for (r in keywords)
  {
	 var rowHTML = "<a href=\"javascript:gotoNextScreen(" + r + ")\"><li id='listrow" + r + "'>";
	 rowHTML += "<div id='listrow" + r + "label' class='keywordLabel'>" + keywords[r] + "</div>";
	 rowHTML += "<div class='nextArrow'></div>";
	 rowHTML += "<div id='listrow" + r + "desc' class='keywordDescription'>" + descriptions[r] + "</div>";
	 rowHTML += "</li></a>";
	 $('#keywordList').append(rowHTML);
	 $("#listrow" + r).css("background-color", r % 2 ? row2 : row1);
  }
}

function updateCache()
{
  console.log("updateCache: " + webappCache.status);
  if (webappCache.status != window.applicationCache.IDLE) {
    webappCache.swapCache();
    console.log("Cache has been updated due to a change found in the manifest");
  } else {
    webappCache.update();
    console.log("Cache update requested");
  }
}
function errorCache()
{
  console.log("errorCache: " + webappCache.status);
  console.log("You're either offline or something has gone horribly wrong.");
}

function parseOptions(options) {
  var result = "listview";
  if (options != "ERROR" && options != "NO_CATEGORIES")
  {
	 var optionsComponents = options.split("&");
	 answerSpaceCategories = true;
	 result = optionsComponents[0];
	 leftListStyle = optionsComponents[2];
	 var categoryContent = decodeURIComponent(optionsComponents[1]);
	 textonlyLeftList = optionsComponents[3] ? decodeURIComponent(optionsComponents[3]) : categoryContent;
	 console.log("parseOptions(): " + result + ", " + categoryContent + ", " + leftListStyle);
	 switch (result) {
		case 'masterview':
		  $('#categoriesView').html(categoryContent);
		  hasMasterCategories = true;
		  break;
		case "visualview":
		  $('#categoriesView').html(categoryContent);
		  hasVisualCategories = true;
		  break;
		case "listview":
		  $('#leftContent').html(categoryContent);
		  $('#leftLabel').html('Categories');
		  currentCategory = $('#leftContent .selected').attr('title');
		  setAnswerSpaceItem("_currentCategory", currentCategory);
		  break;
	 }
	 answerSpaceCategories = true;
  }
  else // is "ERRORS"
  {
	 options = '<option class="apple-hidden" value="Error">Error</option>';
	 console.log("GetCategories(1d): " + options); 
	 $("#leftContent").html(options);
	 answerSpaceCategories = false;
  }
  setAnswerSpaceItem("_options", options);
  return result;
}
 
// Function: loaded()
// Called by Window's load event when the web application is ready to start
//
function loaded(row1String, row2String)
{
  var timer = null;
  var requestActive = false;
  row1 = (row1String === '') ? 'white' : row1String;
  row2 = (row2String === '') ? 'white' : row2String;

  console.log("loaded(1): ");

  switch(webappCache.status)
  {
	 case 0:
		console.log("Cache status: Uncached");
		break;
	 case 1:
		console.log("Cache status: Idle");
		break;
	 case 2:
		console.log("Cache status: Checking");
		break;
	 case 3:
		console.log("Cache status: Downloading");
		break;
	 case 4:
		console.log("Cache status: Updateready");
		break;
	 case 5:
		console.log("Cache status: Obsolete");
		break;
  }

  console.log("loaded(4a): ");
  if (!navigator.onLine) {
	 //alert("Network not connected(2)...");
	 console.log("Network not connected(2)...");
	 //return;
  }

  if (answerSpaceOneKeyword) {
	 showKeywordView(0);
  }
  getCategories();
}

// called from body element when device is rotated
// updates the viewport tag with the correct width
function updateOrientation()
{
  var isPortrait = true;
  switch(window.orientation)
  {
	 case 0:
		isPortrait = true;
		break;
	 case -90:
		isPortrait = false;
		break;
	 case 90:
		isPortrait = false;
		break;
	 case 180:
		isPortrait = true;
		break;
  }
  metatags = document.getElementsByTagName("meta");
  for (i in metatags)
  {
	 var name = metatags[i].getAttribute("name");
	 var content = metatags[i].getAttribute("content");
	 if (metatags[i].getAttribute("name") == "viewport")
	 {
		var viewportstring
		if (isPortrait)
		{
		  viewportstring = metatags[i].getAttribute("content").replace("width=device-height", "width=device-width");
		}
		else
		{
		  viewportstring = metatags[i].getAttribute("content").replace("width=device-width", "width=device-height");
		}
		metatags[i].setAttribute("content", viewportstring);
	 }
  }
}

function getCategories(masterCategory)
{
  startInProgressAnimation();
  var categoriesUrl = "util/GetCategories.php"
  var requestData = "answerSpace=" + localStorage.getItem("_answerSpace");
  if (hasMasterCategories && masterCategory)
  {
	 requestData += "&master_category=" + masterCategory;
  }
  console.log("GetCategories transaction: " + categoriesUrl + "?" + requestData);
  $.ajax({
	 type: 'GET',
	 cache: "false",
	 url: categoriesUrl,
	 data: requestData,
	 error: function(xmlhttprequest, textstatus, error) { // readystate == 4 && status != 200
		if (textstatus == "timeout")
		{
		  console.log("GetCategories timed out: " + textstatus); 
		  parseOptions(getAnswerSpaceItem("_options"));
		}
	 },
	 complete: function(xmlhttprequest, textstatus) { // readystate == 4
	   console.log("GetCategories transaction complete: " + textstatus);
		stopInProgressAnimation();
		if (xmlhttprequest.status == 200 || xmlhttprequest == 500)
		{
		  if (httpAnswerRequest.status == 500)
		  {
			 console.log("GetCategories detected internal error in GetAnswer");
		  }
		  else
		  {
			 var categoriesType = parseOptions(xmlhttprequest.responseText);
			 switch(categoriesType)
			 {
				case 'masterview':
				  hasMasterCategories = true;
				  showMasterCategoriesView();
				  break;
				case 'visualview':
				  hasVisualCategories = true;
				  showCategoriesView();
				  break;
				case 'listview':
				  currentCategory = $('#leftContent .selected').attr('title');
				  setAnswerSpaceItem("_currentCategory", currentCategory);
				  console.log("GetCategories using: " + currentCategory);
				  getKeywordList(currentCategory);
				  break;
			 }
			 if ($('#startUp:visible'))
			 {
				$('#startUp').hide();
				$('#content').show();
			 }
		  }
		}
	 },
	 timeout: 5 * 1000 // 5 seconds
  });
}

function showMasterCategoriesView()
{
  console.log('showMasterCategoriesView()');
  prepareMasterCategoriesViewForDevice();
  $("#mainLabel").html('Master Categories');
  setCurrentView('masterCategoriesView', false);
}

function goBackToMasterCategoriesView()
{
  console.log('goBackToMasterCategoriesView()');
  prepareMasterCategoriesViewForDevice();
  $("#mainLabel").html('Master Categories');
  setCurrentView('masterCategoriesView', true);
}

function showCategoriesView(masterCategory)
{
  console.log('showCategoriesView(): ' + masterCategory);
  prepareCategoriesViewForDevice();
  $("#mainLabel").html(hasMasterCategories ? currentMasterCategory : 'Categories');
  setCurrentView('categoriesView', false);
}

function goBackToCategoriesView()
{
  console.log('goBackToCategoriesView()');
  prepareCategoriesViewForDevice();
  $("#mainLabel").html(hasMasterCategories ? currentMasterCategory : 'Categories');
  setCurrentView('categoriesView', true);
}

function getAnswer(event)
{
  showAnswerView(currentKeywordNumber);
}

function dumpLocalStorage() {
  var numElements = localStorage.length;
  var i;
  var key;
  for (i = 0; i < numElements; i++) {
    key = localStorage.key(i);
    console.log("dumpLocalStorage: key = " + key + "; value = " + localStorage.getItem(key) + ";");
  }
}

function showAnswerView(rowIndex)
{
  prepareAnswerViewForDevice();
  currentKeywordNumber = rowIndex;
  
  var answerUrl = 'util/GetAnswer.php';
  var requestData = createParamsAndArgs(rowIndex);
  $.ajax({
	 type: 'GET',
	 url: answerUrl,
	 data: requestData,
	 beforeSend: function(xmlhttprequest) {
		console.log("GetAnswer transaction: " + answerUrl + "?" + requestData);
		httpAnswerRequest = xmlhttprequest;
		startInProgressAnimation();
		setSubmitCachedFormButton('pendingFormButton');
		$('#innerAnswerBox').html("Waiting...");
		$('#mainLabel').html(keywords[rowIndex]);
	 },
	 error: function(xmlhttprequest, textstatus, error) { // readystate == 4 && status != 200
		console.log("GetAnswer failed with error type: " + textstatus);
		if (textstatus == "timeout")
		{
		  answerItem = getAnswerSpaceItem(getAnswerSpaceItem("_currentCategory") + "___" + rowIndex);
		  $('innerAnswerBox').html(answerItem == undefined ? "No result available" : answerItem);
		}
	 },
	 complete: function(xmlhttprequest, textstatus) { // readystate == 4
		console.log("GetAnswer transaction complete: " + textstatus);
		if (xmlhttprequest.status == 200 || xmlhttprequest.status == 500)
		{
		  var html =  httpAnswerRequest.responseText;
		  setAnswerSpaceItem(getAnswerSpaceItem("_currentCategory") + "___" + rowIndex, html);
		  $('#innerAnswerBox').html(html);
		  setSubmitCachedFormButton('pendingFormButton');
		}
		stopInProgressAnimation();
		setupForms();
		setupParts();
	   setCurrentView("answerView", false, true);
	 },
	 timeout: 30 * 1000 // 30 seconds
  });
}

function gotoNextScreen(rowIndex)
{
  console.log("gotoNextScreen(" + rowIndex + ")");
  if (!keywordArgumentsHtml[rowIndex])
  {
	 showAnswerView(rowIndex);
  }
  else
  {
	 showKeywordView(rowIndex);
  }
}

function showSecondLevelAnswerView(keyword, arg0)
{
  prepareSecondLevelAnswerViewForDevice();
  
  var answerUrl = 'util/GetAnswer.php'
  var requestData = 'answerSpace=' + localStorage.getItem("_answerSpace") + "&keyword=" + keyword + '&args=' + arg0.replace(/&/g, "|^^|s|");
  $.ajax({
	 type: 'GET',
	 url: answerUrl,
	 data: requestData,
	 beforeSend: function(xmlhttprequest) {
		console.log("GetAnswer2 transaction:" + answerUrl + "?" + requestData);
		httpAnswerRequest = xmlhttprequest;
		setSubmitCachedFormButton('pendingFormButton');
		$('#innerAnswerBox1').html("Waiting...");
		startInProgressAnimation();
	 },
	 error: function(xmlhttprequest, textstatus, error) { // readystate == 4 && status != 200
		console.log("GetAnswer2 failed with error type: " + textstatus);
	 },
	 complete: function(xmlhttprequest, textstatus) { // readystate == 4
		console.log("GetAnswer2 transaction complete: " + textstatus);
		if (xmlhttprequest.status == 200 || xmlhttprequest.status == 500)
		{
		  var html =  httpAnswerRequest.responseText;
        $('#innerAnswerBox1').html(html);
		}
		stopInProgressAnimation();
	 }
  });
    
  setCurrentView('answerView2', false, true);   
}

function showKeywordView(rowIndex) 
{
  currentKeywordNumber = rowIndex;
  prepareKeywordViewForDevice(answerSpaceOneKeyword, helpText[rowIndex]);
  setSubmitCachedFormButton('pendingFormButton');
  $('#argsBox').html(keywordArgumentsHtml[rowIndex]);
  if (descriptions[rowIndex]) {
	 $('#descriptionTextBox').html(descriptions[rowIndex]);
	 $('#descriptionBox').css("visibility", "visible");
  } else {
	 $('#descriptionBox').css("visibility", "hidden");
  }
  setCurrentView('keywordView', false, true);
}

function showKeywordListView()
{
  prepareKeywordListViewForDevice();
  $('#mainLabel').html(currentCategory);
  setCurrentView('keywordListView', false);
}

function goBackToKeywordListView(event)
{
  console.log('goBackToKeywordListView()');
  if (answerSpaceOneKeyword) {
	 console.log('goBackToKeywordListView(): only 1 keyword');
	 showKeywordView(0);
	 return;
  }
  if (hasMasterCategories && currentMasterCategory == '')
  {
	 console.log('goBackToKeywordListView(): no master category selected');
	 goBackToMasterCategoriesView();
	 return
  }
  if (hasVisualCategories && currentCategory == '')
  {
	 console.log('goBackToKeywordListView(): no category selected');
	 goBackToCategoriesView(hasMasterCategories ? currentCategory : '');
	 return;
  }
  prepareKeywordListViewForDevice();
  setSubmitCachedFormButton('pendingFormButton');
  $('#mainLabel').html(currentCategory);
  setCurrentView('keywordListView', true);
}

function createParamsAndArgs(rowIndex)
{
  var returnValue = "answerSpace=" + localStorage.getItem("_answerSpace") + "&keyword=" + keywords[rowIndex];
  var args = "";
  var argElements = $('#argsBox').find('input, textarea, select');
  argElements.each(function(index, element) {
	 if (argElements.size() == 1 && this.value)
	 {
		returnValue += "&args=" + encodeURIComponent(this.value);
	 }
	 else if (this.type && (this.type.toLowerCase() == "radio" || this.type.toLowerCase() == "checkbox") && !this.checked)
	 {
		// do nothing for unchecked radio or checkbox
	 }
	 else if (this.name)
	 {
		args += "&" + this.name + "=" + (this.value ? encodeURIComponent(this.value) : "");
	 }
	 else if (this.id)
	 {
		args += "&args[" + this.id.match(/\d+/g) + "]=" + (this.value ? encodeURIComponent(this.value) : "");
	 }
  });
  if (args)
  {
	 // make sure arguments start from 0 and proceed with no gaps
/*	 var argsToDefrag = argElements.size();
	 var targetArg = 0;
	 while (argsToDefrag > 0)
	 {
		if (!args.search("args[" + targetArg + "]="))
		{
		  var sourceArg = targetArg + 1;
		  while (!args.search("args[" + targetArg + "]="))
		  {
			 sourceArg++;
		  }
		  args.replace("args[" + targetArg + "]=", "args[" + sourceArg + "]=")
		}
		targetArg++;
		argsToDefrag--;
	 } */
	 returnValue += encodeURI(args);
  }
  return returnValue;
}


function showHelpView(event)
{
  prepareHelpViewForDevice();
  $('#mainHeading').html(keywords[currentKeywordNumber]); //**** Here ****
  var helpContents = helpText[currentKeywordNumber] ? helpText[currentKeywordNumber] : "Sorry, no help is available.";
  $('#helpBox').html(helpContents);
  setCurrentView('helpView', false, true); 
}

function showLoginView(event)
{
  prepareLoginViewForDevice();
  $('#mainHeading').html("Login");
  var loginUrl = '../../../login/index_iphone.php'
  $.ajax({
	 type: 'GET',
	 cache: "false",
	 url: loginUrl,
	 beforeSend: function(xmlhttprequest) {
		console.log("iPhoneLogin transaction: " + loginUrl);
		httpBlingRequest = xmlhttprequest;
	 },
	 success: function(data, textstatus, xmlhttprequest) { // readystate == 4 && status == 200
	   console.log("iPhoneLogin transaction successful");
		$('#loginBox').html(data);
		setCurrentView('loginView', false, true); 
	 },
	 error: function(xmlhttprequest, textstatus, error) { // readystate == 4 && status != 200
		console.log("iPhoneLogin failed with error type: " + textstatus);
		alert("Error getting bling." + xmlhttprequest.responseText);
	 },
	 complete: function(xmlhttprequest, textstatus) { // readystate == 4
		console.log("iPhoneLogin transaction complete: " + textstatus);
	 }
	 // timeout: 20 * 1000
  });
    //****
    // Todo: Timout GET in case network goes away and display appropriate alert box
    //****
}

function updateLoginBar(){
  var loginUrl = "util/GetLogin.php";
  $.ajax({
	 type: 'GET',
	 cache: "false",
	 url: loginUrl,
	 beforeSend: function(xmlhttprequest) {
		console.log("GetLogin transaction: " + loginUrl);
		httpBlingRequest = xmlhttprequest;
		startInProgressAnimation();
	 },
	 success: function(data, textstatus, xmlhttprequest) { // readystate == 4 && status == 200
	   console.log("GetLogin transaction successful");
		$('#loginBar').html(httpLoginBarRequest.responseText);
	 },
	 error: function(xmlhttprequest, textstatus, error) { // readystate == 4 && status != 200
		console.log("GetLogin failed with error type: " + textstatus);
		alert("Error getting bling." + xmlhttprequest.responseText);
	 },
	 complete: function(xmlhttprequest, textstatus) { // readystate == 4
		console.log("GetLogin transaction complete: " + textstatus);
		stopInProgressAnimation();
		if (xmlhttprequest.responseText == "")
		{
		  $('#loginBar').css('display', 'none');
		  $('#loginButton').css('display', 'block');
		}
		else
		{
		  $('#loginButton').css('display', 'none');
		  $('#loginBar').css('display', 'block');
		}
	 }
  });
}

function submitLogin()
{
  var loginUrl = '../../../login/index_iphone.php'
  var requestData = "action=login&mobile_number=" + document.getElementById('mobile_number').value + "&password=" + document.getElementById('password').value;
  $.ajax({
	 type: 'GET',
	 cache: "false",
	 url: loginUrl,
	 data: requestData,
	 beforeSend: function(xmlhttprequest) {
		console.log("iPhoneLogin transaction: " + loginUrl + "?" + requestData);
		httpBlingRequest = xmlhttprequest;
		startInProgressAnimation();
	 },
	 success: function(data, textstatus, xmlhttprequest) { // readystate == 4 && status == 200
		$('#loginBox').html(data);
		setCurrentView('loginView', false, true); 
	 },
	 error: function(xmlhttprequest, textstatus, error) { // readystate == 4 && status != 200
		alert("Error getting bling." + xmlhttprequest.responseText);
	 },
	 complete: function(xmlhttprequest, textstatus) { // readystate == 4
		console.log("iPhoneLogin transaction complete: " + textstatus);
		stopInProgressAnimation();
      updateLoginBar();
      refreshKeywords();
	 }
  });
}

function submitLogout()
{
  var loginUrl = '../../../login/index_iphone.php'
  var requestData = 'action=logout';
  $.ajax({
	 type: 'GET',
	 cache: "false",
	 url: loginUrl,
	 data: requestData,
	 beforeSend: function(xmlhttprequest) {
		console.log("iPhoneLogin transaction:" + loginUrl + "?" + requestData);
		httpBlingRequest = xmlhttprequest;
	 },
	 success: function(data, textstatus, xmlhttprequest) { // readystate == 4 && status == 200
		$('#loginBox').html(data);
		setCurrentView('loginView', false, true); 
	 },
	 error: function(xmlhttprequest, textstatus, error) { // readystate == 4 && status != 200
		alert("Error getting bling." + xmlhttprequest.responseText);
	 },
	 complete: function(xmlhttprequest, textstatus) { // readystate == 4
		console.log("iPhoneLogin transaction complete: " + textstatus);
      updateLoginBar();
      refreshKeywords();
	 }
  });
}


function refreshKeywords(event)
{
    console.log("currentCategory(4): " + currentCategory);
    currentCategory = $('#leftContent .selected').first().attr('title');
    setAnswerSpaceItem("_currentCategory", currentCategory);
    console.log("currentCategory(5): " + currentCategory);
    //keywordController.setRowData();
    console.log("currentCategory(6): " + currentCategory);
}

function goBackToTopLevelAnswerView(event)
{
  console.log('goBackToTopLevelAnswerView()');
  setCurrentView('answerView', true, true);
}

var newKeyword = "";
function passLocation(keyword) {
   // Get location no more than 10 minutes old. 600000 ms = 10 minutes.
   newKeyword = keyword;
   //alert("hi");
   navigator.geolocation.getCurrentPosition(showLocation, showError, {enableHighAccuracy:true,maximumAge:600000});
}

function showError(error) {
   alert(error.code + ' ' + error.message);
}

function showLocation(position) {
   showSecondLevelAnswerView(newKeyword, position.coords.latitude + ',' + position.coords.longitude);
}

function showLocationX(position) {
   alert('<p>Latitude: ' + position.coords.latitude + '</p>' 
   + '<p>Longitude: ' + position.coords.longitude + '</p>' 
   + '<p>Accuracy: ' + position.coords.accuracy + '</p>' 
   + '<p>Altitude: ' + position.coords.altitude + '</p>' 
   + '<p>Altitude accuracy: ' + position.coords.altitudeAccuracy + '</p>' 
   + '<p>Speed: ' + position.coords.speed + '</p>' 
   + '<p>Heading: ' + position.coords.heading + '</p>');
}

function submitForm() {
  var str = '';
  /* $('form').first().find('input,textarea,select').each(function(index, element) {
	 if (this.type && (this.type.toLowerCase() == "radio" || this.type.toLowerCase() == "checkbox") && !this.checked)
	 {
		// do nothing for unchecked radio or checkbox
	 }
	 else if (this.name)
	 {
		str += "&" + this.name + "=" + (this.value ? this.value : "");
	 }
  });
  str = str.substring(1); */
  var str = $('form').first().find('input, textarea, select').serialize();
  console.log("submitForm(2): " + document.forms[0].action);
  queuePendingFormData(str, document.forms[0].action, document.forms[0].method.toLowerCase(), Math.uuid());
  submitFormWithRetry();
}

function queuePendingFormData(str, arrayAsString, method, uuid) {
  if (getAnswerSpaceItem("_pendingFormDataString")) {
    setAnswerSpaceItem("_pendingFormDataString", getAnswerSpaceItem("_pendingFormDataString") + ":" + str);
    setAnswerSpaceItem("_pendingFormDataArrayAsString", getAnswerSpaceItem("_pendingFormDataArrayAsString") + ":" + encodeURIComponent(arrayAsString));
    setAnswerSpaceItem("_pendingFormMethod", getAnswerSpaceItem("_pendingFormMethod") + ":" + encodeURIComponent(method));
    setAnswerSpaceItem("_pendingFormUUID", getAnswerSpaceItem("_pendingFormUUID") + ":" + encodeURIComponent(uuid));
  } else {
    setAnswerSpaceItem("_pendingFormDataString", str);
    setAnswerSpaceItem("_pendingFormDataArrayAsString", encodeURIComponent(arrayAsString));
    setAnswerSpaceItem("_pendingFormMethod", encodeURIComponent(method));
    setAnswerSpaceItem("_pendingFormUUID", encodeURIComponent(uuid));
  }
}

function headPendingFormData() {
  if (countPendingFormData() == 0) {
    return ["", ""];
  }
  var q1 = getAnswerSpaceItem("_pendingFormDataString").split(":");
  var q2 = getAnswerSpaceItem("_pendingFormDataArrayAsString").split(":");
  var q3 = getAnswerSpaceItem("_pendingFormMethod").split(":");
  var q4 = getAnswerSpaceItem("_pendingFormUUID").split(":");
  console.log('headPendingFormData():');
  console.log("q1[0] => " + q1[0]);
  console.log("q2[0] => " + q2[0]);
  console.log("q3[0] => " + q3[0]);
  console.log("q4[0] => " + q4[0]);
  return [q1[0], decodeURIComponent(q2[0]), decodeURIComponent(q3[0]), decodeURIComponent(q4[0])];
}

function delHeadPendingFormData() {
  var count;
  if ((count = countPendingFormData()) == 0) {
    console.log("delHeadPendingFormData: count 0, returning");
    return;
  }
  if (count == 1) {
    console.log("*** Emptying Form Queue");
    removeFormRetryData();
    return;
  }
  console.log("_pendingFormDataString => " + getAnswerSpaceItem("_pendingFormDataString"));
  console.log("_pendingFormDataArrayAsString => " + getAnswerSpaceItem("_pendingFormDataArrayAsString"));
  setAnswerSpaceItem("_pendingFormDataString", 
		     getAnswerSpaceItem("_pendingFormDataString").substring(getAnswerSpaceItem("_pendingFormDataString").indexOf(":") + 1));
  setAnswerSpaceItem("_pendingFormDataArrayAsString", 
		     getAnswerSpaceItem("_pendingFormDataArrayAsString").substring(getAnswerSpaceItem("_pendingFormDataArrayAsString").indexOf(":") + 1));
  console.log("_pendingFormDataString => " + getAnswerSpaceItem("_pendingFormDataString"));
  console.log("_pendingFormDataArrayAsString => " + getAnswerSpaceItem("_pendingFormDataArrayAsString"));
}

function countPendingFormData() {
  if (getAnswerSpaceItem("_pendingFormDataString")) {
    var q1 = getAnswerSpaceItem("_pendingFormDataString").split(":");
    console.log("countPendingFormData: q1.length = " + q1.length + ";");
    console.log("countPendingFormData: q1[0] = " + q1[0] + ";");
    console.log("countPendingFormData: q1[1] = " + q1[1] + ";");
    return q1.length;
  } else {
    return 0;
  }
}

function processCachedFormData() {
  if (checkFormRetryData()) {
    if (confirm("Submit pending form data \nfrom previous forms?\nNote: Subsequent forms will continue to pend\nuntil you empty the pending list.")) {
      submitFormWithRetry();
    } else {
      if (confirm("Delete pending form data\nfrom previous forms?")) {
		  removeFormRetryData();
      }
    }
  }
}

function setSubmitCachedFormButton(formButton) {
  var queueCount = countPendingFormData();
  if (formButton.substr(0,1) != "#")
	 formButton = "#" + formButton;
  if (queueCount != 0) {
    console.log("setSubmitCachedFormButton: Cached items");
    $(formButton).button("option", "label", "(" + queueCount + ")");
    $(formButton).button("option", "disabled", "false");
	 $(formButton).removeAttr("disabled");
  } else {
    console.log("setSubmitCachedFormButton: NO Cached items");
    $(formButton).button("option", "label", "Ok");
    $(formButton).button("option", "disabled", "true");
	 $(formButton).attr("disabled", "true");
  }
}

function removeFormRetryData() {
    removeAnswerSpaceItem("_pendingFormDataString");  
    removeAnswerSpaceItem("_pendingFormDataArrayAsString");  
    removeAnswerSpaceItem("_pendingFormMethod");  
    removeAnswerSpaceItem("_pendingFormUUID");  
    setSubmitCachedFormButton('pendingFormButton');
    setSubmitCachedFormButton('pendingFormButton');
    setSubmitCachedFormButton('pendingFormButton');
    console.log("removeFormRetryData: Clearing local storage"); 
}

function checkFormRetryData() {
    console.log("_pendingFormDataString: " + getAnswerSpaceItem("_pendingFormDataString"));
    console.log("_pendingFormDataArrayAsString: " + getAnswerSpaceItem("_pendingFormDataArrayAsString"));
    return (getAnswerSpaceItem("_pendingFormDataString"));
}

function submitFormWithRetry() {    
  var str;
  var arr;
  var method;
  var uuid;
  var timer;
  var localKeyword;

  if (checkFormRetryData()) {
	 console.log("submitFormWithRetry(1a): ");
	 var qx = headPendingFormData();
	 console.log("qx[0] => " + qx[0]);
	 console.log("qx[1] => " + qx[1]);
	 console.log("qx[2] => " + qx[2]);
	 console.log("qx[3] => " + qx[3]);
	 str = qx[0];
	 arr = qx[1].split("/");
	 method = qx[2];
	 uuid = qx[3];
  } else {
	 console.log("submitFormWithRetry(1b): ");
	 return;
  }

  var answerUrl = 'util/GetAnswer.php?';
  if (arr[0] == "..") {
	 answerUrl += "answerSpace=" + localStorage.getItem("_answerSpace") + "&keyword=" + arr[1] + "&" + arr[2].substring(1);
	 localKeyword = arr[1];
  } else {
	 answerUrl += "answerSpace=" + arr[1] + "&keyword=" + arr[2];
	 localKeyword = arr[2];
  }

  if (method == "get")
  {
	 $.ajax({
		type: 'GET',
		cache: "false",
		url: answerUrl,
		data: "?" + str,
		beforeSend: function(xmlhttprequest) {
		  console.log("GetAnswer transaction: " + keywordsUrl + "?" + requestData);
		  httpAnswerRequest = xmlhttprequest;
		  startInProgressAnimation();
		},
		error: function(xmlhttprequest, textstatus, error) { // readystate == 4 && status != 200
		  if (textstatus == "timeout")
		  {
			 alert("Form data not submitted, retry when you are in coverage");
			 goBackToKeywordListView();
		  }
		},
		complete: function(xmlhttprequest, textstatus) { // readystate == 4
		  console.log("GetAnswer transaction complete: " + textstatus);
		  if (xmlhttprequest.status == 200 || xmlhttprequest.status == 500)
		  {
			 delHeadPendingFormData();
			 $('#innerAnswerBox').html(httpAnswerRequest.responseText);
			 setSubmitCachedFormButton('pendingFormButton');
			 setCurrentView('answerView', false, true);
		  }
		  stopInProgressAnimation();
		},
		timeout: 60 * 1000 // 60 seconds
	 });
  }
  else
  {	 
	 console.log("GetAnswer transaction: " + answerUrl + " data: " + str);
	 startInProgressAnimation();
	 $.ajax({
		type: "POST",
		url: answerUrl,
		data: str,
		success: function(data, textstatus, xmlhttprequest) { // readystate == 4 && status == 200
		  console.log("GetAnswer transaction successful");
		  httpAnswerRequest = xmlhttprequest;
		  delHeadPendingFormData();
		  $('#innerAnswerBox').html(httpAnswerRequest.responseText);
		  stopInProgressAnimation();
		  setSubmitCachedFormButton('pendingFormButton');
		  setCurrentView('answerView', false, true);
		},
		timeout: 60 * 1000 // 60 seconds
	 });
  }
}
