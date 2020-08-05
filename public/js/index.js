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

$(document).ready(function() {
	$("#prof_search_button").click(function() {
		var full_name = document.getElementById("prof_search_textbox").value;
		var name_arr = full_name.split(" ");
	
		$.get("searchprofessors?fname=" + name_arr[0] + "&lname=" + name_arr[1], function(data, status) {
			if(status == "success") {
				if(data.found) {
					window.location.href = "professorreviews?id=" + data.id;
				}
				else
				{
					alert("the professor you searched for is not in the database, please refine your search");
				}
			}
			else {
				alert("search request caused an error on the server!");
			}
		});
	});
});
