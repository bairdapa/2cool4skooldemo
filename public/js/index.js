var create_review_rating = 0;

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

	$("#school_search_button").click(function() {
		var name = document.getElementById("school_search_textbox").value;
	
		$.get("searchschools?schoolname=" + name, function(data, status) {
			if(status == "success") {
				if(data.found) {
					window.location.href = "schoolreviews?id=" + data.id;
				}
				else
				{
					alert("the school you searched for is not in the database, please refine your search");
				}
			}
			else {
				alert("search request caused an error on the server!");
			}
		});
	});

	$("#create_review_1star").click(function() {
		if(create_review_rating != 1) {
			$("#create_review_1star").html("★");
			create_review_rating = 1;
		}
		else {
			$("#create_review_1star").html("☆");
			create_review_rating = 0;
		}
		$("#create_review_2star").html("☆");
		$("#create_review_3star").html("☆");
		$("#create_review_4star").html("☆");
		$("#create_review_5star").html("☆");
	});

	$("#create_review_2star").click(function() {
		$("#create_review_1star").html("★");
		if(create_review_rating != 2) {
			$("#create_review_2star").html("★");
			create_review_rating = 2;
		}
		else {
			$("#create_review_2star").html("☆");
			create_review_rating = 1;
		}
		$("#create_review_3star").html("☆");
		$("#create_review_4star").html("☆");
		$("#create_review_5star").html("☆");
	});

	$("#create_review_3star").click(function() {
		$("#create_review_1star").html("★");
		$("#create_review_2star").html("★");
		if(create_review_rating != 3) {
			$("#create_review_3star").html("★");
			create_review_rating = 3;
		}
		else {
			$("#create_review_3star").html("☆");
			create_review_rating = 2;
		}
		$("#create_review_4star").html("☆");
		$("#create_review_5star").html("☆");
	});
	
	$("#create_review_4star").click(function() {
		$("#create_review_1star").html("★");
		$("#create_review_2star").html("★");
		$("#create_review_3star").html("★");
		if(create_review_rating != 4) {
			$("#create_review_4star").html("★");
			create_review_rating = 4;
		}
		else {
			$("#create_review_4star").html("☆");
			create_review_rating = 3;
		}
		$("#create_review_5star").html("☆");
	});
	
	$("#create_review_5star").click(function() {
		$("#create_review_1star").html("★");
		$("#create_review_2star").html("★");
		$("#create_review_3star").html("★");
		$("#create_review_4star").html("★");
		if(create_review_rating != 5) {
			$("#create_review_5star").html("★");
			create_review_rating = 5;
		}
		else {
			$("#create_review_5star").html("☆");
			create_review_rating = 4;
		}
	});


});
