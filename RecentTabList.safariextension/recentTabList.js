var recentList = []; // recently closed tabs

safari.application.addEventListener("popover", popoverHandler, true); // when opening popover
safari.extension.settings.addEventListener("change", settingChanged, false); // when settings are changed

// when a tab is closed, save it
safari.application.addEventListener("close", function(event) {
	if (safari.extension.settings.trackPrivateBrowsing || !safari.application.privateBrowsing.enabled) { // don't track if private browsing and setting enabled
			var closedTab = event.target;
			var index = closedTab.browserWindow === undefined ? 1 : closedTab.browserWindow.tabs.indexOf(closedTab); // to prevent an error if it's the last tab in a window
			new TabRef(closedTab.title, closedTab.url, index);
	} 
}, true);

// update filter on text changes
$("#filter").keyup(function() {
	updateFilter();
});

// clear the current filter
$("#clearFilter").on("click", function(event) {
	$("#filter").val("");
	updateFilter();
});

// handle settings changes
function settingChanged(event) {
	if (event.key == "maxRecent") {
		if (recentList.length > safari.extension.settings.maxRecent) {
			recentList = recentList.slice(0, safari.extension.settings.maxRecent);
			for (var i = recentList.length - 1; i <= safari.extension.settings.maxRecent; i--) {
				removeTab(recentList[i]);
			}
		}
	}
	
	if (event.key == "openTabsFirst") {
		updateSectionOrder();
	}
}

function updateSectionOrder() {
		if (safari.extension.settings.openTabsFirst) {
			$("#openGroup").insertBefore("#recentGroup");
			$("#split").insertAfter("#openGroup");
		} else {
			$("#recentGroup").insertBefore("#openGroup").addClass("firstGroup");
			$("#split").insertAfter("#recentGroup");
		}
}

// filter displayed tabs based on text in URL / title
function updateFilter() {
	var filterText = $("#filter").val().toLowerCase();
	$("li").each(function() {
		if ($(this).attr("title").toLowerCase().indexOf(filterText) >= 0) {
			$(this).show();
		} else {
			$(this).hide();
		}
	});
	updateSize();
}

// Set the height and width of the popover
function updateSize() {
	safari.extension.popovers[0].width = $("body").width() + 16;
	safari.extension.popovers[0].height = $("body").height() + 16;
}

// Create a reference to the recently closed tab
function TabRef(title, url, index) {
	this.title = title;
	this.url = url;
	this.index = index;
	if (url === undefined || url.length <= 0) {
		delete this; // might be a new tab page or something else, no URL so just bail. 
	} else {
		var th = this;
		this.listItem = $("<li class='tab' title='" + this.title + "\x0A" + this.url + "'><span>" + truncate(this.title, 60) + "</span></li>");

		// Delete button!
		var deleteButton = $("<img src='close.svg' title='Remove from history' class='delete'></img>").appendTo(this.listItem);
		deleteButton.on("click", function(event) {
			event.stopPropagation();
			th.listItem.remove();
		});
		
		$("#recentSection").prepend(this.listItem);
		this.listItem.on("click", function(event) {
			openRecent(th);
		});
		addToRecent(this);
	}
}

// put an open tab in the list
function OpenTab(newTab) {
	this.tab = newTab;
	var th = this;
	this.listItem = $("<li class='tab' title='" + this.tab.title + "\x0A" + this.tab.url + "'><span>" + truncate(this.tab.title, 60) + "</span></li>");
	$("#openSection").append(this.listItem);
	this.listItem.on("click", function(event) {
		th.tab.browserWindow.activate();
		th.tab.activate();
		safari.extension.popovers[0].hide();
	});
/*
	got rid of this because it's a pay service now. Keeping the code around in case there's a good way to bring it back later
	
	if (safari.extension.settings.showFavIcon == true) {
		var urlParts = this.tab.url.split('/');
		var protocol = urlParts[0];
		var domain = urlParts[2];
		$(this.listItem).prepend("<img class='favIcon' src='http://g.etfv.co/" + protocol + "//" + domain + "?defaulticon=lightpng'>")
	}
*/
	// Close button!
	var closeButton = $("<img src='close.svg' title='Close tab' class='close'></img>").appendTo(this.listItem);
	closeButton.on("click", function(event) {
		event.stopPropagation();
		th.tab.close();
		th.listItem.remove();
	});
	th.tab.addEventListener("navigate", function(event) {
		$(th.listItem).attr("title", th.tab.title + "\x0A" + th.tab.url);
		$(th.listItem).find("span").text(truncate(th.tab.title, 60));
	}, true);
}

// Enforces maximum length of the list
function addToRecent(tabRef) {
	recentList.unshift(tabRef);
	if (recentList.length > safari.extension.settings.maxRecent) {
		removeTab(recentList.pop());
	}
}

// Open a new tab using info from the old one. Just delete the old one. New one will be a different tab.
function openRecent(tabRef) {
	recentList = recentList.slice(recentList.indexOf(tabRef), 1);
	var newTab = safari.application.activeBrowserWindow.openTab(safari.extension.settings.whereTabs, tabRef.index);
	newTab.url = tabRef.url;
	removeTab(tabRef);
	populateOpenTabs();
}

// Remove from DOM, update size, delete for good measure
function removeTab(tabRef) {
	tabRef.listItem.remove();
	updateSize();
	delete tabRef;
}

// On popovers 
function popoverHandler(event) {
	if (event.target.identifier !== "com.nickvdp.tablist.popover") return;
	populateOpenTabs();
	updateFilter();
}

// show the open tabs
function populateOpenTabs() {
	updateSectionOrder();
	
	$("#openSection").html("");
	if (safari.extension.settings.showOpenTabs == true) {		
		var openTabs = getAllTabs();
		for (var i in openTabs) {
			new OpenTab(openTabs[i]);
		}
		$("#openHeader").show();
		$("#split").show();
	} else {
		$("#openHeader").hide();
		$("#split").hide();
	}
	updateSize();
}

// Loop through open windows, get all tabs
function getAllTabs() {
	var starter = [];
	for (var x in safari.application.browserWindows) {
		$.merge(starter, safari.application.browserWindows[x].tabs);
	}
	return starter;
}

// Returns a center truncated string
function truncate(origString, maxLength) {
	if (typeof origString == 'undefined') {
		return "New Tab Page";
	}
	if (origString.length <= (maxLength + 3)) {
		return origString;
	}
	return origString.substr(0, maxLength / 2) + "..." + origString.substr(origString.length - maxLength / 2, maxLength / 2);
}