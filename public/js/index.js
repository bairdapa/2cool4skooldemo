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

function create_review(type, id, rating, just)
{
	var data = {
		review_type: type,
		target_id: id,
		review_rating: rating,
		justification: just
	}
		
	$.post("createreview", data, function(data, status) {
		if(status == "success") {
			alert("created review successfully");
			window.location.href = "/";
		}
		else {
			alert("something went wrong!");
		}
	});
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

	$("#submit_review").click(function() {
		var review_type;
		var review_target_id = -1;
		var $selected = $('input[name="review_type"]:checked');
		if($selected.legnth == 0) {
			alert("please select either professor or school for your review type");
			return;
		}
		else {
			review_type = $selected.val();
		}

		if(review_type == "prof")
		{
			var full_name = $("#create_review_textbox").val();
			var name_arr = full_name.split(" ");

			$.get("searchprofessors?fname=" + name_arr[0] + "&lname=" + name_arr[1], function(data, status) {
				if(status == "success") {
					if(data.found) {
						review_target_id = data.id;
						create_review(review_type, review_target_id, create_review_rating, $("#create_review_justification").val());
					}
					else
					{
						alert("the professor you tried to create a review for is not in the database");
					}
				}
				else {
					alert("create review request caused an error on the server!");
				}
			});
		}
		else
		{
			var name = $("#create_review_textbox").val();

			$.get("searchschools?schoolname=" + name, function(data, status) {
				if(status == "success") {
					if(data.found) {
						review_target_id = data.id;
						create_review(review_type, review_target_id, create_review_rating, $("#create_review_justification").val());
					}
					else
					{
						alert("the school you tried to create a review for is not in the database");
					}
				}
				else {
					alert("create review request caused an error on the server!");
				}
			});
		}
	});


	$("#submit_login").click(function() {
		var fname = $("#login_fname").val();
		var lname = $("#login_lname").val();

		$.get("loginrequest?fname=" + fname + "&lname=" + lname, function(data, status) {
			if(status == "success") {
				if(data.success) {
					alert("logged in\nname: " + data.user + "\nsess: " + data.session_key);
					// todo add session storage
				}
				else {
					alert("not logged in, something went wrong");
				}
			}
			else {
				alert("not logged in, something went wrong");
			}
		});
	});

});
