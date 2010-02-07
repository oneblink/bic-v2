var keywords = ["Loading..."];
var descriptions = ["Please wait..."];
var keywordAttributes = null;
var helpText = null;
var keywordArgumentsHtml = null;
var categories = null;
var currentCategory = "";
var currentKeywordNumber = 0;
var httpCategoriesRequest = false;
var httpAnswerRequest = false;
var httpBlingRequest = false;

if (!answerSpace || answerSpace == "<?=$_REQUEST['answerSpace']?>")
{
   answerSpace = 'blink';
}

// This object implements the dataSource methods for the keyword list.
var keywordController = {
	
	// Sample data for the content of the list. 
	// Your application may also fetch this data remotely via XMLHttpRequest.
	_rowData: keywords,
    
    setRowData: function() {
       var httpRequest = new XMLHttpRequest();
       var url = "../iPhoneUtil/GetKeywords.php?answerSpace=" + answerSpace;
       //alert(url);
       if (currentCategory)
       {
         url += "&category=" + encodeURIComponent(currentCategory);
       }

       httpRequest.open('GET', url, true);
       httpRequest.setRequestHeader("Cache-Control", "no-cache");

       httpRequest.onreadystatechange = function(evt) {
          /* readyState 4 indicates the transaction is complete; status 200 indicates "OK" */
          if (httpRequest.readyState == 4) 
          {
            if (httpRequest.status == 200)
            {
                var rawKeywordData =  httpRequest.responseText;
                if (rawKeywordData && rawKeywordData != "ERROR") 
                {
                  var keywordDataArray = rawKeywordData.split("|||");
                  keywords = new Array(keywordDataArray.length - 1);
                  descriptions = new Array(keywordDataArray.length - 1);
                  helpText = new Array(keywordDataArray.length - 1);
                  keywordArgumentsHtml = new Array(keywordDataArray.length - 1);
                  for (var i = 1; i < keywordDataArray.length; i++) 
                  {
                    keywordAttributes = keywordDataArray[i].split("###");
                    keywords[i-1] = keywordAttributes[0];
                    descriptions[i-1] = keywordAttributes[1];
                    helpText[i-1] = keywordAttributes[2];
                    keywordArgumentsHtml[i-1] = keywordAttributes[3];
                  }               
                }
                else
                {
                   //alert("Request for keywords failed.");
                   keywords = [];
                   descriptions = ["No available keywords in this category"];
                }
                keywordController._rowData = keywords;

            }
            else
            {
               alert("Request for keywords failed. " + httpRequest.responseText);
               keywords = ["ERROR"];
               descriptions = ["No keywords found"];
            }
			document.getElementById('list').object.reloadData();
			document.getElementById('startUp').style.display = 'none';
			document.getElementById('content').style.display = 'block';
          }
       }; 
       httpRequest.send(); 
    },
	
	// The List calls this method to find out how many rows should be in the list.
	numberOfRows: function() {
		return this._rowData.length;
	},
	
	// The List calls this method once for every row.
	prepareRow: function(rowElement, rowIndex, templateElements) {
		// templateElements contains references to all elements that have an id in the template row.
		// Ex: set the value of an element with id="keywordLabel".
		if (templateElements.keywordLabel) {
			templateElements.keywordLabel.innerHTML = this._rowData[rowIndex];
            templateElements.keywordDescription.innerHTML = descriptions[rowIndex];
		}

		// Assign a click event handler for the row.
		rowElement.onclick = function(event) {
            currentKeywordNumber = rowIndex;
			gotoNextScreen(rowIndex);
		};
	}
};

 
// Function: load()
// Called by HTML body element's onload event when the web application is ready to start
//
function load()
{
    dashcode.setupParts();
    
    // Get and set-up the keywords list
    keywordController.setRowData();
    
    // Get and set-up the categories
    httpCategoriesRequest = new XMLHttpRequest();
    var url = "../iPhoneUtil/GetCategories.php?answerSpace=" + answerSpace;
    httpCategoriesRequest.open('GET', url, true);
    httpCategoriesRequest.setRequestHeader("Cache-Control", "no-cache");
    httpCategoriesRequest.onreadystatechange = function(evt) {
      /* readyState 4 indicates the transaction is complete; status 200 indicates "OK" */
      if (httpCategoriesRequest.readyState == 4 && (httpCategoriesRequest.status == 200 || httpCategoriesRequest.status == 500)) 
      {
        if (httpAnswerRequest.status == 500)
        {
  			document.getElementById("columnLayout1").style.display = 'none';
        }
        else
        {
            var options =  httpCategoriesRequest.responseText;
            if (options != "ERROR")
            {
            	if (options != "NO_CATEGORIES")
               	{
               	  document.getElementById("categoriesMenu").innerHTML = options;
               	}
               	else
               	{
  		  document.getElementById("columnLayout1").style.display = 'none';
               	}
            }
            else
            {
               options = '<option class="apple-hidden" value="Error">Error</option>';
               document.getElementById("categoriesMenu").innerHTML = options;
            }
        }
      }
    };
    httpCategoriesRequest.send();
    
    // Set the "bling' (banner image etc.)
    httpBlingRequest = new XMLHttpRequest();
    url = "../iPhoneUtil/GetBling.php?answerSpace=" + answerSpace;
    httpBlingRequest.open('GET', url, true);
    httpBlingRequest.setRequestHeader("Cache-Control", "no-cache");
    httpBlingRequest.onreadystatechange = function(evt) {
      /* readyState 4 indicates the transaction is complete; status 200 indicates "OK" */
      if (httpBlingRequest.readyState == 4 && (httpBlingRequest.status == 200 || httpBlingRequest.status == 500)) 
      {
        if (httpBlingRequest.status == 500)
        {
            alert("Error getting bling." + httpBlingRequest.responseText);
        }
        else
        {
            var blingData =  httpBlingRequest.responseText;
            if (blingData != "ERROR")
            {
               var blingArray = blingData.split("|||");
               var logoFileName = blingArray[0];
               if (logoFileName)
               {
                 document.getElementById('bannerImage').src = logoFileName;
                 //document.getElementById('bannerImage').src = '../' + 'images/1/BlinkAnswerSpace1.jpg';
               }
               var welcomeMessage = blingArray[1];
               if (welcomeMessage)
               {
                 document.getElementById('welcomeMsgArea').style.display = 'block';
                 document.getElementById('welcomeMessage').innerHTML = welcomeMessage;
               }
               
               var backgroundColor = blingArray[2];
               if (backgroundColor)
               {
                 document.getElementById('keywordView').style.backgroundColor = backgroundColor;
                 document.getElementById('helpView').style.backgroundColor = backgroundColor;
                 document.getElementById('answerView').style.backgroundColor = backgroundColor;
               }
               
               var login = blingArray[7];
               if (login)
               {
                 document.getElementById('loginBar').innerHTML = login;
               }
            }
            else
            {
               alert("Error getting bling.");
            }
        }
      }
    };
    httpBlingRequest.send();
}


function gotoNextScreen(rowIndex)
{
    if (!keywordArgumentsHtml[rowIndex])
    {
        showAnswerView(rowIndex);
    }
    else
    {
        showKeywordView(rowIndex);
    }
}


function getAnswer(event)
{
    showAnswerView(currentKeywordNumber);
}

function showAnswerView(rowIndex)
{
    document.getElementById('keywordHeading').innerHTML = keywords[rowIndex];
    document.getElementById('innerAnswerBox').innerHTML = "Waiting...";
    var indicatorImage = document.getElementById('activityIndicator2');
    if (indicatorImage.style.visibility == 'hidden')
    {
        indicatorImage.style.visibility = 'visible';
    }
    
    // Get and set-up the answer
    httpAnswerRequest = new XMLHttpRequest();
    var url = '../iPhoneUtil/GetAnswer.php?' + createParamsAndArgs(rowIndex);
    httpAnswerRequest.open('GET', url, true);
    httpAnswerRequest.onreadystatechange = function(evt) {
      /* readyState 4 indicates the transaction is complete; status 200 indicates "OK" */
      if (httpAnswerRequest.readyState == 4 && (httpAnswerRequest.status == 200 || httpAnswerRequest.status == 500)) 
      {
        var html =  httpAnswerRequest.responseText;
        document.getElementById('innerAnswerBox').innerHTML = html;
        document.getElementById('activityIndicator2').style.visibility = 'hidden';
      }
    };
    httpAnswerRequest.send();
    
    var stackLayout = document.getElementById('stackLayout').object;
    stackLayout.setCurrentView('answerView', false, true);
  
}


function gotoNextScreen(rowIndex)
{
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
    document.getElementById('keywordHeading1').innerHTML = keyword;
    document.getElementById('innerAnswerBox1').innerHTML = "Waiting...";
    var indicatorImage = document.getElementById('activityIndicator1');
    if (indicatorImage.style.visibility == 'hidden')
    {
        indicatorImage.style.visibility = 'visible';
    }
    
    // Get and set-up the answer
    httpAnswerRequest = new XMLHttpRequest();
    var url = '../iPhoneUtil/GetAnswer.php?answerSpace=' + answerSpace + "&keyword=" + keyword + '&args=' + arg0.replace(/&/g, "|^^|s|");
    httpAnswerRequest.open('GET', url, true);
    httpAnswerRequest.onreadystatechange = function(evt) {
      /* readyState 4 indicates the transaction is complete; status 200 indicates "OK" */
      if (httpAnswerRequest.readyState == 4 && (httpAnswerRequest.status == 200 || httpAnswerRequest.status == 500)) 
      {
        var html =  httpAnswerRequest.responseText;
        document.getElementById('innerAnswerBox1').innerHTML = html;
        document.getElementById('activityIndicator1').style.visibility = 'hidden';
      }
    };
    httpAnswerRequest.send();
    
    var stackLayout = document.getElementById('stackLayout').object;
    stackLayout.setCurrentView('answerView2', false, true);   
}

function showKeywordView(rowIndex) 
{
    document.getElementById('keywordHeading2').innerHTML = keywords[rowIndex];
    document.getElementById('argsBox').innerHTML = keywordArgumentsHtml[rowIndex];
    document.getElementById('descriptionTextBox').innerHTML = descriptions[rowIndex];
    var stackLayout = document.getElementById('stackLayout').object;
    stackLayout.setCurrentView('keywordView', false, true);
}

function goBackToKeywordListView(event)
{
    //document.getElementById('list').object.setSelectionIndexes(new Array(keywords.length), true);
    var stackLayout = document.getElementById('stackLayout').object;
    stackLayout.setCurrentView('keywordListView', true, true);
}

function createParamsAndArgs(rowIndex)
{
    var returnValue = "answerSpace=" + answerSpace + "&keyword=" + keywords[rowIndex];
    
    var quit = false;
    var failures = 0;
    var allowedFailues = 2;
    var args = "";
    var flag = 0;
    for (var i = 0; !quit; i++)
    {
       var inputElement = document.getElementById("arg" + i);
       if (inputElement)
       {
         if (flag) 
         {
           args += '|||^^^|';
         }
         args += inputElement.value;
         flag = 1;
       }
       else
       {
         failures++;
         if(failures>allowedFailues) {
            quit = true;
         }
       }       
    }
    
    if (args)
    {
       returnValue += '&args=' + args;
    }
    return returnValue;
}

function showHelpView(event)
{
    document.getElementById('keywordHeading3').innerHTML = keywords[currentKeywordNumber];
    
    var helpContents = "Sorry, no help is available.";
    if (helpText[currentKeywordNumber])
    {
        helpContents = helpContents;
    }
    
    document.getElementById('helpBox').innerHTML = helpContents;
    
    var stackLayout = document.getElementById('stackLayout').object;
    stackLayout.setCurrentView('helpView', false, true); 
}

function showLoginView(event)
{
    document.getElementById('keywordHeading4').innerHTML = "Login";
   
    httpBlingRequest = new XMLHttpRequest();
    url = "../login/index_iphone.php";
    httpBlingRequest.open('GET', url, true);
    httpBlingRequest.setRequestHeader("Cache-Control", "no-cache");
    httpBlingRequest.onreadystatechange = function(evt) {
      /* readyState 4 indicates the transaction is complete; status 200 indicates "OK" */
      if (httpBlingRequest.readyState == 4 && (httpBlingRequest.status == 200 || httpBlingRequest.status == 500)) 
      {
        if (httpBlingRequest.status == 500)
        {
            alert("Error getting bling." + httpBlingRequest.responseText);
        }
        else
        {
            //var blingData =  httpBlingRequest.responseText;
            
            var helpContents = httpBlingRequest.responseText;
            
            document.getElementById('loginBox').innerHTML = helpContents;
            
            var stackLayout = document.getElementById('stackLayout').object;
            stackLayout.setCurrentView('loginView', false, true); 
        }
      }
    };
    httpBlingRequest.send();
}
function updateLoginBar(){

    httpLoginBarRequest = new XMLHttpRequest();
    var url = "../iPhoneUtil/GetLogin.php";
    //alert(url);
    httpLoginBarRequest.open('GET', url, true);
    httpLoginBarRequest.setRequestHeader("Cache-Control", "no-cache");
    httpLoginBarRequest.onreadystatechange = function(evt) {
      /* readyState 4 indicates the transaction is complete; status 200 indicates "OK" */
      if (httpLoginBarRequest.readyState == 4 && (httpLoginBarRequest.status == 200 || httpLoginBarRequest.status == 500)) 
      {
        if (httpLoginBarRequest.status == 500)
        {
            alert("Error getting bling." + httpLoginBarRequest.responseText);
        }
        else
        {
            //var blingData =  httpBlingRequest.responseText;
            document.getElementById('loginBar').innerHTML = httpLoginBarRequest.responseText;
        }
      }
    };
    httpLoginBarRequest.send();   
   
}


function submitLogin()
{
    //alert(document.getElementById('mobile_number').value + document.getElementById('password').value);
    
    httpBlingRequest = new XMLHttpRequest();
    var url = "../login/index_iphone.php?action=login&mobile_number=" + document.getElementById('mobile_number').value + "&password=" + document.getElementById('password').value;
    //alert(url);
    httpBlingRequest.open('GET', url, true);
    httpBlingRequest.setRequestHeader("Cache-Control", "no-cache");
    httpBlingRequest.onreadystatechange = function(evt) {
      /* readyState 4 indicates the transaction is complete; status 200 indicates "OK" */
      if (httpBlingRequest.readyState == 4 && (httpBlingRequest.status == 200 || httpBlingRequest.status == 500)) 
      {
        if (httpBlingRequest.status == 500)
        {
            alert("Error getting bling." + httpBlingRequest.responseText);
        }
        else
        {
            //var blingData =  httpBlingRequest.responseText;
            
            var helpContents = httpBlingRequest.responseText;
            if (helpText[currentKeywordNumber])
            {
                helpContents = helpContents;
            }
            
            document.getElementById('loginBox').innerHTML = helpContents;
            
            var stackLayout = document.getElementById('stackLayout').object;
            stackLayout.setCurrentView('loginView', false, true); 
        }
      }
      updateLoginBar();
      refreshKeywords();
    };
    httpBlingRequest.send();
}

function submitLogout()
{
    //alert(document.getElementById('mobile_number').value + document.getElementById('password').value);
    
    httpBlingRequest = new XMLHttpRequest();
    var url = "../login/index_iphone.php?action=logout";
    //alert(url);
    httpBlingRequest.open('GET', url, true);
    httpBlingRequest.setRequestHeader("Cache-Control", "no-cache");
    httpBlingRequest.onreadystatechange = function(evt) {
      /* readyState 4 indicates the transaction is complete; status 200 indicates "OK" */
      if (httpBlingRequest.readyState == 4 && (httpBlingRequest.status == 200 || httpBlingRequest.status == 500)) 
      {
        if (httpBlingRequest.status == 500)
        {
            alert("Error getting bling." + httpBlingRequest.responseText);
        }
        else
        {
            //var blingData =  httpBlingRequest.responseText;
            
            var helpContents = httpBlingRequest.responseText;
            if (helpText[currentKeywordNumber])
            {
                helpContents = helpContents;
            }
            
            document.getElementById('loginBox').innerHTML = helpContents;
            
            var stackLayout = document.getElementById('stackLayout').object;
            stackLayout.setCurrentView('loginView', false, true); 
        }
      }
      updateLoginBar();
      refreshKeywords();
    };
    httpBlingRequest.send();
}


function refreshKeywords(event)
{
    currentCategory = categoriesMenu.options[categoriesMenu.selectedIndex].value;
    keywordController.setRowData();
}


function goBackToTopLevelAnswerView(event)
{
    var stackLayout = document.getElementById('stackLayout').object;
    stackLayout.setCurrentView('answerView', true, true);
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
   //alert('HI!');
   
   /*
    document.getElementById('keywordHeading').innerHTML = keywords[rowIndex];
    document.getElementById('innerAnswerBox').innerHTML = "Waiting...";
    var indicatorImage = document.getElementById('activityIndicator2');
    if (indicatorImage.style.visibility == 'hidden')
    {
        indicatorImage.style.visibility = 'visible';
    }
   */
    
   var num = document.forms[0].elements.length;
   var str = '';
   for (var i=0; i<num; i++) {
        
      if(document.forms[0].elements[i].name){
       
       //alert(document.forms[0].elements[i].type.toLowerCase());
         if(document.forms[0].elements[i].type.toLowerCase()=="radio" && document.forms[0].elements[i].checked==false) {
            //alert(document.forms[0].elements[i].checked);
         }
        else {
           
           str += "&" + document.forms[0].elements[i].name + "=" + document.forms[0].elements[i].value;
        }
      
      }
        
   }
   str = str.substring(1);
   var arr = document.forms[0].action.split("/");

    
    // Get and set-up the answer
    httpAnswerRequest = new XMLHttpRequest();
    var url = '../iPhoneUtil/GetAnswer.php?' + "answerSpace=" + arr[1] + "&keyword=" + arr[2];
    //alert(url);
    
    if(document.forms[0].method.toLowerCase()=="get") {
      
      url += "?" + str;
      httpAnswerRequest.open('GET', url + str, true);
      
    }
    else {
      
      httpAnswerRequest.open('POST', url, true);
      
    }
    httpAnswerRequest.onreadystatechange = function(evt) {
      /* readyState 4 indicates the transaction is complete; status 200 indicates "OK" */
      if (httpAnswerRequest.readyState == 4 && (httpAnswerRequest.status == 200 || httpAnswerRequest.status == 500)) 
      {
        var html =  httpAnswerRequest.responseText;
        document.getElementById('innerAnswerBox').innerHTML = html;
        document.getElementById('activityIndicator2').style.visibility = 'hidden';
         
         var stackLayout = document.getElementById('stackLayout').object;
         stackLayout.setCurrentView('answerView', false, true);
         document.getElementById('keywordHeading').innerHTML = arr[2];
      }
    };
    
    if(document.forms[0].method.toLowerCase()=="get") {
      
      httpAnswerRequest.send();
      
    }
    else {
      
      httpAnswerRequest.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
      httpAnswerRequest.send(str);
      
    }
   
}
