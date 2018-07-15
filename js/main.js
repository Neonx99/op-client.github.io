
function wb_form_validateForm(formId, values, errors) {
	var form = $("input[name='wb_form_id'][value='" + formId + "']").parent();
	if (!form || form.length === 0 || !errors) return;
	
	form.find("input[name],textarea[name]").css({backgroundColor: ""});
	
	if (errors.required) {
		for (var i = 0; i < errors.required.length; i++) {
			var name = errors.required[i];
			var elem = form.find("input[name='" + name + "'],textarea[name='" + name + "'],select[name='" + name + "']");
			elem.css({backgroundColor: "#ff8c8c"});
		}
	}
	
	if (Object.keys(errors).length) {
		for (var k in values) {
			var elem = form.find("input[name='" + k + "'],textarea[name='" + k + "'],select[name='" + k + "']");
			elem.val(values[k]);
		}
	}
}

$(function() {
	var comboBoxes = $('.wb-combobox-controll');
	if (comboBoxes.length) {
		comboBoxes.each(function() {
			var thisCombo = $(this);
			var clickFunc = function() {
				var w = thisCombo.find('input').outerWidth();
				var mw = (menu = thisCombo.find('.dropdown-menu')).width();
				var ew = thisCombo.parent().outerWidth();
				if (mw < ew) menu.width(ew);
				menu.css({ marginLeft: (-w) + 'px' });
				thisCombo.find('.btn-group').toggleClass('open');
			};
			$(this).find('input').bind('click', clickFunc);
			$(this).find('.dropdown-toggle').bind('click', clickFunc);
		});
		
		$(document).bind('click', function(e) {
			var t = $(e.target);
			if (!t.is('.wb-combobox-controll')) {
				t = t.parents('.wb-combobox-controll');
				$.each($('.wb-combobox-controll'), function() {
					if (t.get(0) !== $(this).get(0)) {
						$(this).find('.btn-group').removeClass('open');
					}
				});
			}
		});
	}
	if (currLang) {
		$('.lang-selector').each(function() {
			var thisElem = $(this);
			var type = thisElem.attr('data-type');
			if (type === 'flags') {
				thisElem.find('a[data-lang="' + currLang + '"]').addClass('active');
			} else if (type === 'select') {
				var actLi = thisElem.find('li[data-lang="' + currLang + '"]');
				actLi.addClass('active');
				thisElem.find('input').val(actLi.find('a').html());
			}
		});
	}
	$('.btn-group.dropdown').each(function() {
		var ddh = $(this).height();
		var ddm = $(this).children('.dropdown-menu');
		ddm.addClass('open');
		var ddmh = ddm.height();
		ddm.removeClass('open');
		var ddt = $(this).offset().top;
		var dh = $(document).height();
		if (ddt + ddh + ddmh + 2 >= dh) {
			$(this).removeClass('dropdown').addClass('dropup');
		}
	});

	var closeMenus = function(ignoreMenu) {
		$('.wb-menu').each(function() {
			if( this == ignoreMenu )
				return;
			$(this).find('.over').removeClass('over over-out');
		});
	};

	$('body').on('touchstart', function(e) {
		var ignoreMenu = $(e.target).closest('.wb-menu');
		ignoreMenu = ignoreMenu.length ? ignoreMenu.get(0) : null;
		closeMenus(ignoreMenu);
	});

	$('.wb-menu').each(function() {
		var $menuContainer = $(this);
		var $menu = $menuContainer.children('ul');
		var ignoreHover = null;
		var isLanding = $menu.is('.menu-landing');
		var selectMenuItem = function($elem) {
			$elem.addClass('over');
			var $parent = $elem;
			while( $parent.length > 0 && $parent.is('li') ) {
				$parent.removeClass('over-out');
				$parent = $parent.parent().parent();
			}
			if( $menuContainer.is('.collapse-expanded') ) {
				$menu.find('.open-left').removeClass('open-left');
			}
			else {
				var $submenu = $elem.children('ul');
				if( $submenu.length ) {
					$parent = $elem.parent();
					if( $menu.is('.vmenu') && $parent.is('.open-left') ) {
						$submenu.addClass('open-left');
					}
					else {
						$submenu.removeClass('open-left');
						var ww = $(window).width();
						var w = $submenu.outerWidth(true);
						if( $submenu.offset().left + w >= ww )
							$submenu.addClass('open-left');
					}
					if( $submenu.offset().left < 0 )
						$submenu.removeClass('open-left');
				}
			}
		};
		var closeMenu = function() {
			$menu.find('li.over').addClass('over-out');
			setTimeout(function() {
				$menu.find('li.over-out').removeClass('over over-out');
			}, 10);
		};
		$menu
			.on('mouseover', 'li', function(e) {
				if( ignoreHover )
					return;
				selectMenuItem($(this));
			})
			.on('mouseout', 'li', function(e) {
				if( ignoreHover )
					return;
				closeMenu();
			})
			.on('touchstart', 'a', function(e) {
				var $elem = $(this).parent();
				var isOver = $elem.is('.over') || ($menuContainer.is('.collapse-expanded') && $elem.is('.active'));

				if( ignoreHover )
					clearTimeout(ignoreHover);
				ignoreHover = setTimeout(function() {ignoreHover = null;}, 2000);

				closeMenus($menuContainer.get(0));
				closeMenu();
				selectMenuItem($elem);

				if( isOver || $elem.children('ul').length == 0 ) {
					if( isLanding )
						e.stopImmediatePropagation();
				}
				else {
					e.stopImmediatePropagation();
					e.preventDefault();
				}
			})
		;
	});

	$('.wb-menu-mobile').each(function() {
		var isOpen = false;
		var elem = $(this);
		var btn = elem.children('.btn-collapser').eq(0);
		var isLanding = elem.children('.menu-landing').length;

		var onResize = function() {
			var ul = elem.children('ul');
			ul.css('max-height', ($(window).scrollTop() - ul.offset().top + $(window).height() - 20) + 'px');
		};

		btn.on('click', function() {
			if (elem.hasClass('collapse-expanded')) {
				isOpen = false;
				elem.removeClass('collapse-expanded');
			} else {
				isOpen = true;
				elem.addClass('collapse-expanded');
				if( isLanding )
					onResize();
			}
		});
		if( isLanding ) {
			$(window).on('resize', onResize);
			elem.find('li').on('click', function() {
				isOpen = false;
				elem.removeClass('collapse-expanded');
			});
		}
		/*
		elem.find('ul').each(function() {
			var ul = $(this);
			if (ul.parent('li').length > 0) {
				ul.parent('li').eq(0).children('a').on('click', function() {
					if (!isOpen) return true;
					if (ul.css('display') !== 'block') ul.css({display: 'block'}); else ul.css({display: ''});
					return false;
				});
			}
		});
		*/
	});

	if ($('.menu-landing').length) {
		var scrolled = false;
		var activateMenuItem = function(item) {
			item.closest('.wb-menu').find('li.active').removeClass('active');
			while( item.length > 0 && item.is('li') ) {
				item.addClass('active');
				item = item.parent().parent();
			}
		};
		var switchLandingPage = function(alias, ln, scroll) {
			ln = ln || currLang;
			var href = ln ? ln + '/#' + alias : '#' + alias;
			var anchor = $('.wb_page_anchor[name="' + alias + '"]');
			if (anchor.length) {
				if (scroll) {
					anchor.attr('name', '');
					setTimeout(function() {
						anchor.attr('name', alias);
					}, 10);
					scrolled = true;
					var jqf = (('wbPreview' in window) && window.wbPreview && window.parent) ? window.parent.$ : $;
					jqf('html, body').animate({ scrollTop: anchor.offset().top + 'px' }, 540, function() {
						scrolled = false;
					});
				}
			}
			var item = $('.menu-landing li a[href="' + href + '"]').parent();
			if (item.length) {
				activateMenuItem(item);
			}
		};
		$('.menu-landing li a').on('click', function() {
			var href = $(this).attr('href'), parts = href.split('#'),
				ln = parts[0] ? parts[0].replace(/\/$/, '') : null,
				alias = parts[1];
				
			if (/^(?:http|https):\/\//.test(href)) return true;
			switchLandingPage(alias, ln, true);
		});
		$(window).on('hashchange', function() {
			var link = $('.menu-landing li a[href="' + location.hash + '"]');
			if (link.length) {
				var item = link.parent();
				activateMenuItem(item);
			}
		});
		$(window).bind('scroll', function() {
			if (scrolled) return false;
			var anchors = $('.wb_page_anchor');
			$(anchors.get().reverse()).each(function() {
				if ($(this).offset().top <= $(window).scrollTop()) {
					var alias = $(this).attr('name');
					switchLandingPage(alias);
					return false;
				}
			});
		});
		$(window).trigger('hashchange');
	}
	
	$(document).on('mousedown', '.ecwid a', function() {
		var href = $(this).attr('href');
		if (href && href.indexOf('#!') === 0) {
			var url = decodeURIComponent(location.pathname) + href;
			$(this).attr('href', url);
		}
	});

	var applyAutoHeight = function(selector, getElementsCallback, getShapesCallback) {
		$(selector).each(function() {
			var currentTop = null;
			var expectedShapes = null;
			var maxHeight = {};
			var forcedHeight = {};
			var elemCount = {};
			var $elements = getElementsCallback($(this));
			var hasErrors = false;
			$elements.each(function() {
				var i;
				var $elem = $(this);
				var shapes = $elem.data('shapes');
				if( !shapes ) {
					var $shapes = getShapesCallback($elem);
					if( $shapes.length == 0 || (expectedShapes !== null && expectedShapes != $shapes.length) ) {
						hasErrors = true;
						return false;
					}
					shapes = [];
					for( i = 0; i < $shapes.length; i++ ) {
						var $shape = $($shapes.get(0));
						shapes[i] = {
							isMap: $shape.is('.wb-map'),
							elem: $shape
						};
					}
					$elem.data('shapes', shapes);
				}
				expectedShapes = shapes.length;
				for( i = expectedShapes - 1; i >= 0; i-- ) {
					if( !shapes[i].isMap )
						shapes[i].elem.css('height', '');
				}
				var top = Math.round($elem.offset().top / 5);
				if( top !== currentTop )
					$elem.css('clear', 'left'); // This is needed to fit more elements on same y position.
				currentTop = Math.round($elem.offset().top / 5);
				$elem.data('aht', currentTop);
				if( !maxHeight.hasOwnProperty(currentTop) ) {
					maxHeight[currentTop] = [];
					for( i = 0; i < expectedShapes; i++ )
						maxHeight[currentTop][i] = 0;
					forcedHeight[currentTop] = false;
					elemCount[currentTop] = 0;
				}
				if( !forcedHeight[currentTop] ) {
					for( i = expectedShapes - 1; i >= 0; i-- ) {
						if( shapes[i].isMap ) {
							maxHeight[currentTop][i] = shapes[i].elem.outerHeight();
							forcedHeight[currentTop] = true; // map element height has top priority
							break;
						}
						else
							maxHeight[currentTop][i] = Math.max(maxHeight[currentTop][i], shapes[i].elem.outerHeight());
					}
				}
				elemCount[currentTop]++;
			});
			if( hasErrors )
				return;
			$elements.each(function() {
				var $elem = $(this);
				var shapes = $elem.data('shapes');
				var aht = $elem.data('aht');
				$elem.css('clear', '');
				if( elemCount[aht] < 2 )
					return;
				for( var i = expectedShapes - 1; i >= 0; i-- )
					if( !shapes[i].isMap )
						shapes[i].elem.css('height', maxHeight[aht][i]);
			});
		});
	};

	var recalcAutoHeightColumns = function() {
		applyAutoHeight('.auto-height', function($cont) {
			return $cont.children('.wb-cs-col');
		}, function($elem) {
			return $elem.children();
		});

		applyAutoHeight('.auto-height2', function($cont) {
			return $cont.children('.wb-cs-col');
		}, function($elem) {
			return $elem.children('.wb-cs-row').children('.wb-cs-col').children('.wb_element_shape');
		});
	};
	
	$(window).on('resize', recalcAutoHeightColumns);
	recalcAutoHeightColumns();
	
	var updatePositionFixed = function() {
		$('#wb_bgs_cont > div, body, .wb_sbg').each(function() {
			if ($(this).css('background-image') && $(this).css('background-attachment') === 'fixed') {
				$(this).css({'background-attachment': 'scroll'});
			}
		});
	};
	if (/iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream) {
		updatePositionFixed();
	}
});