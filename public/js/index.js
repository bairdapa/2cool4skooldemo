function fillSearch(id) {
	vars = getUrlVars();
	document.getElementById(id).value = vars[id];
}


function getUrlVars() {
	var vars = {};
	var parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m,key,value) {
		vars[key] = value;
	});
	return vars;
}


$("prof_search_button").click(function() {
	$.get("url", function(data, status) {
		alert("Data: " + data + "\nStatus: " + status);
	});
});
