// stores the rating of the review currently begin edited/created
var create_review_rating = 0;

// calls the ajax post request to the create review route
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

// adds event listeners
$(document).ready(function() {

	// check to see if user is logged in, if yes update interface
	if(sessionStorage.getItem("session_key") != null) {
		$("#logincreate").css("display", "none");
		$("#logged_in_user").text(sessionStorage.getItem("user"));
		$("#logout").css("display", "block");
		$("#home_create_review").text("Create Review");
		$("#home_create_review").attr("href", "createreview");
	}

	// show/hide dropdowns based on type of review being created
	$("#radio_school").click(function(){
		$(this).parent().find("#create_review_school_name").css("display", "block");
		$(this).parent().find("#create_review_prof_name").css("display", "none");
	});

	// show/hide dropdowns based on type of review being created
	$("#radio_prof").click(function(){
		$(this).parent().find("#create_review_school_name").css("display", "none");
		$(this).parent().find("#create_review_prof_name").css("display", "block");
	});

	// submit search on enter button pressed
	$("#prof_search_textbox").keypress(function(e) {
		if(e.keyCode == 13) {
			$("#prof_search_button").click();
		}
	});
	
	// submit search on enter button pressed
	$("#school_search_textbox").keypress(function(e) {
		if(e.keyCode == 13) {
			$("#school_search_button").click();
		}
	});

	// submit login on enter button pressed
	$("#login_lname").keypress(function(e) {
		if(e.keyCode == 13) {
			$("#submit_login").click();
		}
	});

	// search professors on prof search button clicked
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

	// search schools on school search button clicked
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

	// updates star button icons and internal rating counter when clicked
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

	// submits a review async when submit button clicked
	$("#submit_review").click(function() {
		var review_type;
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
			create_review(review_type, $("#create_review_prof_name").val(), create_review_rating, $("#create_review_justification").val());
		}
		else
		{
			create_review(review_type, $("#create_review_school_name").val(), create_review_rating, $("#create_review_justification").val());
		}
	});

	// submits a login request when login button clicked
	$("#submit_login").click(function() {
		var fname = $("#login_fname").val();
		var lname = $("#login_lname").val();
		fname = fname[0].toUpperCase() + fname.slice(1);
		lname = lname[0].toUpperCase() + lname.slice(1);

		$.get("loginrequest?fname=" + fname + "&lname=" + lname, function(data, status) {
			if(status == "success") {
				if(data.success) {
					sessionStorage.setItem("session_key", data.session_key);
					sessionStorage.setItem("user", data.user);
					sessionStorage.setItem("id", data.id);
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

	// clears session vars when logout clicked
	$("#logout_button").click(function() {
		sessionStorage.removeItem("session_key");
		sessionStorage.removeItem("user");
		sessionStorage.removeItem("id");
		window.location.href = "/";
	});

	// sends create account post request when create account button clicked
	$("#createaccountbutton").click(function() {
		var data = {
			fname: $(this).parent().find("#createaccfname").val(),
			lname: $(this).parent().find("#createacclname").val(),
			bio: $(this).parent().find("#createaccbio").val(),
			pic: $(this).parent().find("#createaccpic").val()
		};

		$.post("createaccount",data,function(data, status){
			if (status=="success"){
				sessionStorage.setItem("session_key", data.session_key);
				sessionStorage.setItem("user", data.user);
				sessionStorage.setItem("id", data.id);
				window.location.href="/";
			}
			else {
				alert("Account not created, an error occured");
			}
		});

	});

	// sends create prof post request when create prof button clicked
	$("#create_prof_submit").click(function() {
		var data = {
			fname: $(this).parent().find("#create_prof_fname").val(),
			lname: $(this).parent().find("#create_prof_lname").val(),
			pic: $(this).parent().find("#create_prof_pic").val(),
			school: $(this).parent().find("#create_prof_school").val(),
			world: $(this).parent().find("#create_prof_world").val(),
			new_world: $(this).parent().find("#newworldtext").val()
		};	

		$.post("createprofessor", data, function(data, status) {
			if (status == "success")
			{
				window.location.href = "/professorreviews?id=" + data.id;
			}
			else
			{
				alert("professor not created, an error occured");
			}
		
		});
	});

	// shows/hides the new world text box on create prof page
	$("#create_prof_world").change(function() {
		if($(this).val() == "new") {
			$(this).parent().find("#newworldtext").css("display", "inline");
		}
		else {
			$(this).parent().find("#newworldtext").css("display", "none");
		}
	});

	// sends create prof post request when create prof button clicked
	$("#create_school_submit").click(function() {
		var data = {
			name: $(this).parent().find("#create_school_name").val(),
			pic: $(this).parent().find("#create_school_pic").val(),
			world: $(this).parent().find("#create_school_world").val(),
			new_world: $(this).parent().find("#newworldtext").val()
		};	

		$.post("createschool", data, function(data, status) {
			if (status == "success")
			{
				window.location.href = "/schoolreviews?id=" + data.id;
			}
			else
			{
				alert("school not created, an error occured");
			}
		
		});
	});

	// shows/hides the new world text box on create school page
	$("#create_school_world").change(function() {
		if($(this).val() == "new") {
			$(this).parent().find("#newworldtext").css("display", "inline");
		}
		else {
			$(this).parent().find("#newworldtext").css("display", "none");
		}
	});

	// shows the modify review interface when modify review button clicked
	$(".modify_review_button").each(function() {
		var tile = $(this).parent().parent();
		var name = tile.find(".review_header").find(".review_name").text();
		var id = $(this).parent().find("#review_id").text();
		var uid = $(this).parent().find("#user_id").text();
		if(uid == sessionStorage.getItem("id")) {
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
						button.css("display", "block");
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
