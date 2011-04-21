(function(window, $, undefined) {
	window.MyAnswersSideBar = (function() {
		var MyAnswersSideBar = {
				// public variables here
			},
			// private variables here
			$sideBar = $('#MyAnswersSideBar'),
			$stack = $('#stackLayout'),
			// TODO: detect appropriate width dynamically
			width = 180;
		MyAnswersSideBar.isEnoughRoom = function() {
			if ((width * 4) > $(window).width()) {
				return false;
			}
			return true;
		};
		MyAnswersSideBar.show = function() {
			if (!$sideBar.hasClass('hidden')) { return; }
			if (!this.isEnoughRoom()) { return; }
			MyAnswers.dispatch.add(function() {
				$sideBar.removeClass('hidden');
				$stack.css({
					'width': $stack.width() - width,
					'margin-left': width
				});
			});
		};
		MyAnswersSideBar.hide = function() {
			MyAnswers.dispatch.add(function() {
				$sideBar.addClass('hidden');
				$stack.css({
					'width': '100%',
					'margin-left': 0
				});
			});
		};
		MyAnswersSideBar.populate = function(level) {
			var display = currentConfig.sideBarDisplay || 'text only',
				order, list, type, currentItem,
				$listBox = $('<ul />'),
				$sideBar = $('#MyAnswersSideBar'),
				onMasterCategoryClick = function(event) { showCategoriesView($(this).data('id')); },
				onCategoryClick = function(event) { showKeywordListView($(this).data('id'), $(this).data('masterCategory')); },
				onKeywordClick = function(event) { gotoNextScreen($(this).data('id'), $(this).data('category'), $(this).data('masterCategory')); },
				onHyperlinkClick = function(event) { window.location.assign($(this).data('hyperlink')); },
				hook = {
						interactions: function($item) {
							var id = $item.attr('data-id');
							if (siteVars.config['i' + id].pertinent.type === 'hyperlink' && siteVars.config['i' + id].pertinent.hyperlink) {
								$item.attr('data-hyperlink', list[order[o]].hyperlink);
								$item.bind('click', onHyperlinkClick);
							} else {
								$item.bind('click', onKeywordClick);
							}
						},
						categories: function($item) {
							var id = $item.attr('data-id');
							if (siteVars.map['c' + id].length === 1) {
								$item.attr('data-category', id);
								$item.attr('data-id', siteVars.map['c' + id][0]);
								hook.interactions($item);
							} else if (siteVars.map['c' + id].length > 0) {
								$item.bind('click', onCategoryClick);
							}
						},
						masterCategories: function($item) {
							var id = $item.attr('data-id');
							if (siteVars.map['m' + id].length === 1) {
								$item.attr('data-masterCategory', id);
								$item.attr('data-id', siteVars.map['m' + id][0]);
								hook.categories($item);
							} else if (siteVars.map['m' + id].length > 0) {
								$item.bind('click', onMasterCategoryClick);
							}
						}
				},
				o, oLength,
				name, $item, $label, $description,
				category, columns, $images,
				itemConfig;
			if (!this.isEnoughRoom()) { return; }
			if ($sideBar.data('level') === level) {
				MyAnswers.dispatch.add(function() {
					$sideBar.find('.selected').removeClass('selected');
					switch (level) {
						case 'masterCategories':
							$sideBar.find('[data-id=' + currentMasterCategory + ']').addClass('selected');
							break;
						case 'categories':
							$sideBar.find('[data-id=' + currentCategory + ']').addClass('selected');
							break;
						case 'interactions':
							$sideBar.find('[data-id=' + currentInteraction + ']').addClass('selected');
							break;
					}
				});
				return;
			}
			$sideBar.data('level', level);
			emptyDOMelement($sideBar[0]);
			$listBox.appendTo($sideBar);
			switch (level) {
				case 'masterCategories':
					order = siteVars.map.masterCategories;
					list = order;
					type = 'm';
					currentItem = currentMasterCategory;
					break;
				case 'categories':
					order = siteVars.map.categories;
					list = siteVars.map['m' + currentMasterCategory] || order;
					type = 'c';
					currentItem = currentCategory;
					break;
				case 'interactions':
					order = siteVars.map.interactions;
					list = siteVars.map['c' + currentCategory] || order;
					type = 'i';
					currentItem = currentInteraction;
					break;
			}
			oLength = order.length;
			MyAnswers.dispatch.add(function() {
				for (o = 0; o < oLength; o++) {
					itemConfig = siteVars.config[type + order[o]];
					if (typeof itemConfig !== 'undefined' && $.inArray(order[o], list) !== -1 && itemConfig.pertinent.display === 'show') {
						name = itemConfig.pertinent.displayName || itemConfig.pertinent.name;
						$item = $('<li />');
						$item.text(name);
						if (order[o] == currentItem) {
							$item.addClass('selected');
						}
						$listBox.append($item);
						$item.attr('data-id', order[o]);
						hook[level]($item);
					}
				}
				if ($listBox.children().size() > 0) {
					MyAnswersSideBar.show();
				} else {
					MyAnswersSideBar.hide();
				}
			});
		};
		MyAnswersSideBar.update = function() {
			var config = siteVars.config['a' + siteVars.id].pertinent;
			if (hasMasterCategories && currentMasterCategory) {
				this.populate('masterCategories');
			} else if (hasCategories && currentCategory) {
				this.populate('categories');
			} else if (hasInteractions && currentCategory) {
				this.populate('interactions');
			} else {
				this.hide();
			}
		};
		$sideBar.css('width', width);
		return MyAnswersSideBar;
	}());
}(this, this.jQuery));
