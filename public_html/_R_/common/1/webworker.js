importScripts('browser-compat.js', 'ajaxslt-0.8.1-r61.js');

/*
 * message = {
 *	fn: 'processXSLT' | 'log'
 * };
 */
var console = { };
console.log = function(string)
{
	var message = {};
	message.fn = 'log';
	message.string = string;
	postMessage(message);
}

function signalWorkBegun()
{
	postMessage({fn: 'workBegun'});
}

function signalWorkFinished()
{
	postMessage({fn: 'workComplete'});
}

onmessage = function(event) {
	console.log('WebWorker: worker received command: ' + event.data.fn);
	switch (event.data.fn)
	{
		case 'processXSLT':
			var xslNode = xmlParse(event.data.xsl);
			var xmlNode = xmlParse(event.data.xml);
			var html = xsltProcess(xmlNode, xslNode);
			postMessage({fn: 'processXSLT', html: html, target: event.data.target});
			break;
	}
}
