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
		justification: just,
		session_key: sessionStorage.getItem("session_key")
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
	if(sessionStorage.getItem("session_key") != null) {
		$("#logincreate").css("display", "none");
		$("#logged_in_user").text(sessionStorage.getItem("user"));
		$("#logout").css("display", "block");
		$("#home_create_review").text("Create Review");
		$("#home_create_review").attr("href", "createreview");
	}


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

	$(".create_review_star_button").each(function() {
		var i;
		for(var ind = 1; ind <= 5; ind++) {
			if($(this).attr('id') == "create_review_" + ind + "star") {
				i = ind;
				break;
			}
		}

		$(this).click(function() {
			for(var j = 1; j < i; j++) {
				$(this).parent().find("#create_review_" + j + "star").html("★");
			}

			if(create_review_rating != i) {
				$(this).parent().find("#create_review_" + i + "star").html("★");
				create_review_rating = i;
			}
			else {
				$(this).parent().find("#create_review_" + i + "star").html("☆");
				create_review_rating = i - 1;
			}

			for(var j = i+1; j <= 5; j++) {
				$(this).parent().find("#create_review_" + j + "star").html("☆");
			}
		});
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
					sessionStorage.setItem("session_key", data.session_key);
					sessionStorage.setItem("user", data.user);
					window.location.href = "/";
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

	$("#logout_button").click(function() {
		sessionStorage.removeItem("session_key");
		sessionStorage.removeItem("user");
		window.location.href = "/";
	});

	$(".modify_review_button").each(function() {
		var tile = $(this).parent().parent();
		var name = tile.find(".review_header").find(".review_name").text();
		if(name.toLowerCase() == sessionStorage.getItem("user").toLowerCase()) {
			var id = $(this).parent().find("#review_id").text();
			if($(this).attr('id') == "delete_review") {
				$(this).css("display", "block");
				$(this).click(function() {
					var session_key = sessionStorage.getItem("session_key"); 
					$.get("deletereview?session_key=" + session_key + "&id=" + id, function(data, status) {
						if(status == "success") {
							location.reload();
						}
						else {
							alert("unable to delete review");
						}
					});	
				});
			}
			else if($(this).attr('id') == "edit_review") {
				$(this).css("display", "block");
				$(this).click(function() {
					$(this).css("display", "none");
					$(this).parent().find("#submit_edit_review").css("display", "block");
					tile.find(".review_body").find("#edit_review_text").css("display", "block");
					tile.find(".review_body").find("#review_text").css("display", "none");
					create_review_rating = tile.find(".review_image").find("#review_rating").text();

					for(var i = 1; i <= 5; i++) {
						var button = tile.find(".review_header").find("#create_review_" + i + "star");
						button.css("display", "inline");
						if(i <= create_review_rating) {
							button.html("★");
						}
						else {
							button.html("☆");
						}
					}
					tile.find(".review_header").find(".review_rating").css("display", "none");
				});
			}
			else if($(this).attr('id') == "submit_edit_review") {
				$(this).click(function() {
					var data = {
						review_id: id,
						justification: tile.find(".review_body").find("#edit_review_text").val(),
						rating: create_review_rating,
						session_key: sessionStorage.getItem("session_key")
					};
					
					$.post("updatereview", data, function(data, status) {
						if(status == "success") {
							location.reload();
						}
						else {
							alert("something went wrong, unable to update review");
						}
					});
				});
			}
		}
	});
});
