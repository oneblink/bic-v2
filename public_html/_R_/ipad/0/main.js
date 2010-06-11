var currentCategory = "";
var currentKeywordNumber = 0;
var httpAnswerRequest = false;
var httpBlingRequest = false;
var disconnectedDataStore = new Array();
var row1;
var row2;
var answerSpaceOneKeyword = false;

var hasCategories = false;
var hasMasterCategories = false;
var hasVisualCategories = false;

var currentMasterCategory = "";
var textOnlyLeftList = false;

var siteConfig;

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
if (webappCache)
{
  webappCache.addEventListener("updateready", updateCache, false);
  webappCache.addEventListener("error", errorCache, false);
}

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
if (db && db.transaction)
{
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
}

dumpLocalStorage();

function setAnswerSpaceItem(key, value) {
  console.log("setAnswerSpaceItem(): " + key + ", " + value.substring(0,20) + "...");
  disconnectedDataStore[key] = value;
  //
  // Persist data across application restarts
  //
  if (db && db.transaction)
  {
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
 
// produce the HTML for the list and insert it into #keywordList
function populateKeywordList(category) {
	var keywordList = $('#keywordList');
  keywordList.empty();
	var order = hasCategories ? siteConfig.categories[category].keywords : siteConfig.keywords_order;
	var list = siteConfig.keywords;
	for (id in order)
  {
		var html = "<a href=\"javascript:gotoNextScreen('" + order[id] + "')\"><li style=\"background-color:" + (id % 2 ? row2 : row1) + ";\">";
		html += "<div class='keywordLabel'>" + list[order[id]].name + "</div>";
		html += "<div class='nextArrow'></div>";
		html += "<div class='keywordDescription'>" + list[order[id]].description + "</div>";
		html += "</li></a>";
		keywordList.append(html);
  }
}

// produce XHTML for the master categories view
function populateMasterCategories()
{
	var masterCategoriesView = $('#masterCategoriesView');
	masterCategoriesView.empty();
	var order = siteConfig.master_categories_order;
	var list = siteConfig.master_categories;
	for (id in order)
	{
		var categoryHTML = ""
		categoryHTML += "<a href=\"javascript:showCategoriesView('" + order[id] + "')\">";
		categoryHTML += "<img src=\"" + list[order[id]].image + "\" alt=\"" + list[order[id]].name + "\" title=\"" + order[id] + "\" />";
		categoryHTML += "</a>";
		masterCategoriesView.append(categoryHTML);
	}
	if (siteConfig.master_categories_config != 'auto')
	{
		var width;
		switch (siteConfig.master_categories_config)
		{
			case "1col":
				width = "90%";
				break;
			case "2col":
				width = "40%";
				break;
			case "3col":
				width = "30%";
				break;
			case "4col":
				width = "20%";
				break;
		}
		masterCategoriesView.find('img').width(width); 
	}
}

// produce XHTML for the visual categories view
function populateVisualCategories(masterCategory)
{
	var categoriesView = $('#categoriesView');
	categoriesView.empty();
	var order = hasMasterCategories ? siteConfig.master_categories[masterCategory].categories : siteConfig.categories_order;
	var list = siteConfig.categories;
	for (id in order)
	{
		var html = ""
		html += "<a href=\"javascript:showKeywordListView('" + order[id] + "')\">";
		html += "<img src=\"" + list[order[id]].image + "\" alt=\"" + list[order[id]].name + "\" title=\"" + order[id] + "\" />";
		html += "</a>";
		categoriesView.append(html);
	}
	if (siteConfig.categories_config != 'auto')
	{
		var width;
		switch (siteConfig.categories_config)
		{
			case "1col":
				width = "90%";
				break;
			case "2col":
				width = "40%";
				break;
			case "3col":
				width = "30%";
				break;
			case "4col":
				width = "20%";
				break;
		}
		categoriesView.find('a > img').width(width);
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

  if (webappCache)
  {
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
  getSiteConfig();
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

function getSiteConfig()
{
	startInProgressAnimation();
	var categoriesUrl = "util/GetSiteConfig.php?answerSpace=" + localStorage.getItem("_answerSpace");
	console.log("GetSiteConfig transaction: " + categoriesUrl);
	$.getJSON(categoriesUrl,
		function(data, textstatus) { // readystate == 4
			console.log("GetSiteConfig transaction complete: " + textstatus);
			console.log(data);
			if (textstatus != 'success') return;
			stopInProgressAnimation();
			switch (data[0])
			{
				case "ERROR":
					alert(data[1]);
					return;
					break;
				case "NO_UPDATES":
					return;
					break;
				default:
					siteConfig = data;
					hasMasterCategories = siteConfig.master_categories_config != 'no';
					hasVisualCategories = siteConfig.categories_config != 'yes';
					hasCategories = siteConfig.categories_config != 'no';
					textOnlyLeftList = siteConfig.categories_list === 'textonly';
					break;
			}
			if ($('#startUp:visible'))
			{
				if (hasMasterCategories)
				{
					populateMasterCategories();
					showMasterCategoriesView();
				}
				else if (hasVisualCategories)
				{
					populateVisualCategories(currentMasterCategory);
					showCategoriesView();
				}
				else if (hasCategories)
				{
					populateTextOnlyCategories();
					populateKeywordList(siteConfig.default_category);
					showKeywordListView();
				}
				else
				{
					populateKeywordList();
					showKeywordListView();
				}
				$('#startUp').hide();
				$('#content').show();
			}
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
	currentMasterCategory = masterCategory;
  prepareCategoriesViewForDevice();
	if (hasVisualCategories)
	{
		$("#mainLabel").html(hasMasterCategories ? siteConfig.master_categories[masterCategory].name : 'Categories');
		populateVisualCategories(masterCategory);
		setCurrentView('categoriesView', false);
	}
	else
	{
		populateTextOnlyCategories(masterCategory);
		populateKeywordList(siteConfig.default_category);
		showKeywordListView();
	}
}

function goBackToCategoriesView()
{
  console.log('goBackToCategoriesView()');
  prepareCategoriesViewForDevice();
  $("#mainLabel").html(hasMasterCategories ? siteConfig.master_categories[currentMasterCategory].name : 'Categories');
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

function showAnswerView(keywordID)
{
  prepareAnswerViewForDevice();
  currentKeywordNumber = keywordID;
	var keyword = siteConfig.keywords[keywordID];
  
  var answerUrl = 'util/GetAnswer.php';
  var requestData = createParamsAndArgs(keywordID);
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
		$('#mainLabel').html(keyword.name);
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
		  setAnswerSpaceItem(getAnswerSpaceItem("_currentCategory") + "___" + keywordID, html);
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

function gotoNextScreen(keywordID)
{
  console.log("gotoNextScreen(" + keywordID + ")");
  if (siteConfig.keywords[keywordID].input_config)
  {
		showKeywordView(keywordID);
  }
  else
  {
		showAnswerView(keywordID);
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

function showKeywordView(keywordID) 
{
	var keyword = siteConfig.keywords[keywordID];
  currentKeywordNumber = keywordID;
  prepareKeywordViewForDevice(answerSpaceOneKeyword, keyword.help);
  setSubmitCachedFormButton('pendingFormButton');
  $('#argsBox').html(keyword.input_config);
  if (keyword.description) {
	 $('#descriptionTextBox').html(keyword.description);
	 $('#descriptionBox').show();
  } else {
	 $('#descriptionBox').hide();
  }
  setCurrentView('keywordView', false, true);
}

function showKeywordListView(category)
{
	currentCategory = category;
	var mainLabel;
	if (hasCategories && category)
	{
		mainLabel = siteConfig.categories[category].name;
	}
	else if (hasMasterCategories && currentMasterCategory)
	{
		mainLabel = siteConfig.master_categories[currentMasterCategory].name;
	}
	else
	{
		mainLabel = "Keywords";
	}
	$('#mainLabel').html(mainLabel);
  prepareKeywordListViewForDevice(category);
	populateKeywordList(category);
  setCurrentView('keywordListView', false);
}

function goBackToHome()
{
	if (hasMasterCategories)
	{
		goBackToMasterCategoriesView();
	}
	else if (hasVisualCategories)
	{
		goBackToCategoriesView();
	}
	else
	{
		goBackToKeywordListView();
	}
}

function goBackToKeywordListView(event)
{
  console.log('goBackToKeywordListView()');
  if (answerSpaceOneKeyword) {
	 showKeywordView(0);
	 return;
  }
  if (hasMasterCategories && currentMasterCategory == '')
  {
	 goBackToMasterCategoriesView();
	 return
  }
  if (hasVisualCategories && currentCategory == '')
  {
	 goBackToCategoriesView(hasMasterCategories ? currentCategory : '');
	 return;
  }
  prepareKeywordListViewForDevice();
  setSubmitCachedFormButton('pendingFormButton');
	$('#mainLabel').html(hasCategories ? siteConfig.categories[currentCategory].name : 'All Keywords');
  setCurrentView('keywordListView', true);
}

function createParamsAndArgs(keywordID)
{
  var returnValue = "answerSpace=" + localStorage.getItem("_answerSpace") + "&keyword=" + encodeURIComponent(siteConfig.keywords[keywordID].name);
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
