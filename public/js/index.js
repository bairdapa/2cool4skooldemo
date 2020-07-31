function fillSearch(elem_id) {
	vars = getUrlVars();
	document.getElementById(elem_id).value = vars["profsearch"];
}


function getUrlVars() {
	var vars = {};
	var parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m,key,value) {
		vars[key] = value;
	});
	return vars;
}

