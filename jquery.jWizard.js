/**
 * @name	jWizard Plugin
 * @author	Dominic Barnes
 * @desc	A wizard plugin that actually works with minimal configuration. (per jQuery's design philosophy)
 * @type	jQuery
 * @version	0.9.1b
 */
(function($){
	var jWizard = function(element, options) {
		var defaults = {
			startStep: 0,
			enableThemeRoller: false,
			hideTitle: false,
			validateSteps: false,
			debug: false,

			counter: {
				enable: false,
				type: 'count',
				excludeStart: false,
				hideStart: false,
				excludeFinish: false,
				hideFinish: false
			},

			/* Button Rules */
			hideCancelButton: false,
			finishButtonType: 'button',
			buttonText: {
				cancel: 'Cancel',
				previous: 'Previous',
				next: 'Next',
				finish: 'Finish'
			},

			/* Menu Rules */
			enableMenu: false,
			menuWidth: '10em',

			/* CSS Classes */
			cssClasses: {
				title: 'title',
				menu: {
					div: 'menu',
					active: 'active',
					current: 'current',
					inactive: 'inactive'
				},
				steps: {
					wrapper: 'stepwrapper',
					all: 'step'
				},
				counter: 'counter',
				buttons: {
					div: 'buttons',
					cancel: 'wizardButton',
					previous: 'wizardButton',
					next: 'wizardButton',
					finish: 'wizardButton'
				}
			},

			/* Events */
			events: {
				onCancel: function(e) { return true; },
				onFinish: function(e) { return true; }
			}
		};

		/* Assign our Default Parameters (override with anything the end-user supplies) */
		var options = $.extend(true, {}, defaults, options);

		var w = $(element);	// Create a reference to the wizard itself

		_log("Start init for:", element);

		var	selStepsAll = 'div.' + options.cssClasses.steps.all;

		w.changeStep = function(nextStep, isInit) {
			if (typeof nextStep === 'number')
			{
				_log("changeStep() called with a numeric index passed:", nextStep);

				if (nextStep < 0 || nextStep > (w.itemCount - 1))
				{
					alert('Index ' + nextStep + ' Out of Range');
					return false;
				}

				nextStep = w.find(selStepsAll + ':eq(' + nextStep + ')');
			}
			else if (typeof nextStep === 'object')
			{
				_log("changeStep() called with an object passed:", nextStep);

				if ( !nextStep.is(selStepsAll) )
				{
					alert('Supplied Element is NOT one of the Wizard Steps');
					return false;
				}
			}

			if (!isInit)
			{
				if (w.currentStep.triggerHandler('onDeactivate') === false)
				{
					_log("onDeactivate() returned false, cancelling changeStep()", w.currentStep, nextStep);
					return false;
				}
			}

			w.currentStep.hide();
			if (!options.hideTitle)	w.titleBox.text(nextStep.attr('title'));

			nextStep.show().triggerHandler('onActivate');

			w.currentStep = w.find(selStepsAll + ':visible');
			w.currentStepIndex = getCurrentStepIndex();

			buttons.update();
			if (options.enableMenu)	menu.update();
			if (options.counter.enable)	counter.update();

			_log("changeStep() complete", nextStep);
		};

		function _log() {
			if (options.debug)
			{
				window.console && console._log[console.firebug ? 'apply' : 'call'](console, "jWizard _log:", Array.prototype.slice.call(arguments));
			}
		}

		function getCurrentStepIndex() {
			var	returnIndex = 0,
				currentTitle = w.currentStep.attr('title');

			var x = 0;
			w.find(selStepsAll).each(function() {
				var thisTitle = $(this).attr('title');

				if (thisTitle === currentTitle)	returnIndex = x;

				x++;
			});


			if (returnIndex > w.actualCount)
				w.actualIndex = w.actualCount;
			else if (options.counter.excludeStart && returnIndex > 0)
				w.actualIndex = returnIndex - 1;
			else
				w.actualIndex = returnIndex;

			return returnIndex;
		};

		var menu = {
			build: function() {
				var	x = 0,
					tmpHtml = '<div id="jw-menuwrapper"><div id="jw-menu"><ol>';

				w.find(selStepsAll).each(function() {
					tmpHtml += '<li><a step="' + x + '">' + $(this).attr('title') + '</a></li>';
					x++;
				});
				tmpHtml += '</ol></div></div>';

				w.menuDiv = $(tmpHtml);
				w.find('#jw-stepwrapper').prepend(w.menuDiv).append('<div style="clear: both;"></div>');
				w.menuDiv.css({
					'width': options.menuWidth,
					'margin-right': '-' + options.menuWidth,
					'float': 'left'
				});
				w.find(selStepsAll).css('margin-left', options.menuWidth);

				w.find('li.' + options.cssClasses.menu.active).live('click', function() {
					w.changeStep(parseInt($(this).children('a').attr('step')));
				});
			},

			update: function() {
				var	menuItemIndex = 0,
					menuItemStatus = 'active';

				$('#jw-menu').find('a').each(function() {
					var	menuItem = $(this).parent(),
						menuItemAnchor = $(this);

					if ( menuItemAnchor.text() === w.currentStep.attr('title') )
						menuItemStatus = 'current';
					else if (menuItemStatus === 'current')
						menuItemStatus = 'inactive';

					menuItem.removeClass().addClass(menuItemStatus);

					if (menuItem.hasClass('active'))
						menuItemAnchor.attr('href', 'javascript:void(0);');
					else
						menuItemAnchor.removeAttr('href');

					if (options.enableThemeRoller)
					{
						if (menuItem.hasClass('active'))
							menuItem.addClass('ui-state-default');
						else if (menuItem.hasClass('current'))
							menuItem.addClass('ui-state-highlight');
						else
							menuItem.addClass('ui-state-disabled');
					}

					menuItemIndex++;
				});
			}
		};

		var counter = {
			build: function() {
				w.counterSpan = $('<span id="jw-counter" class="' + options.cssClasses.counter + '" />');
				w.buttonsDiv.prepend(w.counterSpan);

				w.actualIndex = w.currentStepIndex;
				w.actualCount = w.itemCount;

				if (options.counter.excludeStart)
					w.actualCount--;
				if (options.counter.excludeFinish)
					w.actualCount--;

				if (options.counter.excludeStart && w.actualIndex > 0)
					w.actualIndex++;
			},

			update: function() {
				if (options.counter.type === 'percentage')
					var text = Math.round((w.actualIndex / w.actualCount) * 100) + '% Complete';
				else
					var text = w.actualIndex + ' of ' + w.actualCount + ' Complete';

				w.counterSpan.text(text);

				if ( (options.counter.hideStart && w.currentStepIndex == 0)
					|| (options.counter.hideFinish && w.currentStepIndex == (w.itemCount -1)) )
					w.counterSpan.hide();
				else
					w.counterSpan.show();
			}
		};

		var buttons = {
			build: function() {
				w.buttonsDiv = $('<div id="jw-buttons" class="' + options.cssClasses.buttons.div + '"></div>');
				w.cancelButton = $('<button id="jw-btnCancel" type="button" class="' + options.cssClasses.buttons.cancel + '">' + options.buttonText.cancel + '</button>');
				w.previousButton = $('<button id="jw-btnPrevious" type="button" class="' + options.cssClasses.buttons.previous + '">' + options.buttonText.previous + '</button>');
				w.nextButton = $('<button id="jw-btnNext" type="button" class="' + options.cssClasses.buttons.next + '">' + options.buttonText.next + '</button>');
				w.finishButton = $('<button id="jw-btnFinish" type="' + options.finishButtonType + '" class="' + options.cssClasses.buttons.finish + '">' + options.buttonText.finish + '</button>');

				w.nextButton.click(function() {
					_log("Next Button Clicked");
					w.changeStep(w.currentStep.next(selStepsAll));
				});
				w.previousButton.click(function() {
					_log("Previous Button Clicked");
					w.changeStep(w.currentStep.prev(selStepsAll));
				});
				w.cancelButton.click(function() {
					_log("Cancel Button Clicked!");
					w.trigger('onCancel');
				});
				w.finishButton.click(function() {
					_log("Finish Button Clicked!");
					w.trigger('onFinish');
				});

				w.buttonsDiv.append(w.cancelButton).append(w.previousButton).append(w.nextButton).append(w.finishButton);
			},

			update: function() {
				var	currentId = w.currentStep.attr('id'),
					firstId = w.firstStep.attr('id'),
					lastId = w.lastStep.attr('id');

				switch (currentId)
				{
					case firstId:
						w.previousButton.hide();
						w.nextButton.show();
						w.finishButton.hide();
						break;

					case lastId:
						w.previousButton.show();
						w.nextButton.hide();
						w.finishButton.show();
						break;

					default:
						w.previousButton.show();
						w.nextButton.show();
						w.finishButton.hide();
						break;
				}
			}
		};

		w.bind('onFinish', options.events.onFinish);
		w.bind('onCancel', options.events.onCancel);

		buttons.build();

		var steps = w.children("div");
		_log("Steps found for wizard", steps);

		steps.addClass(options.cssClasses.steps.all).each(function(x) {
			$this = $(this);
			if ($this.attr('id') == '')
				$this.attr('id', 'step' + x);
		});

		if (options.validateSteps)
		{
			steps.bind('onDeactivate', function(e) {
				var isValid = true;
				$(this).find('input').each(function() {
					if ($(this).valid() == false)
						isValid = false;
				});
				return isValid;
			});
		}

		w.itemCount = steps.length;

		steps.hide();
		w.stepWrapperDiv = $('<div id="jw-stepwrapper"></div>');
		steps.wrapAll(w.stepWrapperDiv);

		w.firstStep = $(steps[0]);
		w.lastStep = $(steps[steps.length - 1]);
		w.currentStep = $(steps[options.startStep]);
		w.currentStepIndex = 0;

		if (options.hideCancelButton)	w.cancelButton.hide();

		if (!options.hideTitle)
		{
			w.titleBox = $('<h2 id="jw-title" class="' + options.cssClasses.title + '"></h2>');
			w.prepend(w.titleBox);
		}
		w.append(w.buttonsDiv);

		if (options.enableMenu)		menu.build();
		if (options.counter.enable)	counter.build();

		if (options.enableThemeRoller)
		{
			w.addClass('ui-widget');
			w.find('#jw-stepwrapper').addClass('ui-widget-content');
			w.buttonsDiv.addClass('ui-widget-content');
			w.buttonsDiv.find('button').addClass('ui-state-default');

			if (!options.hideTitle)
				w.titleBox.addClass('ui-widget-header');

			if (options.enableMenu)
				w.menuDiv.find('li.' + options.cssClasses.menu.active).addClass('ui-state-default');

			if (options.counter.enable)
				w.counterSpan.addClass('ui-widget-content');

			w.find('.ui-state-default')
				.live('mouseover',	function() { $(this).addClass('ui-state-hover'); } )
				.live('mouseout',	function() { $(this).removeClass('ui-state-hover'); } )
				.live('mousedown',	function() { $(this).addClass('ui-state-active'); } )
				.live('mouseup',	function() { $(this).removeClass('ui-state-active'); } );
		}

		w.changeStep(parseInt(options.startStep), true);

		return w;
	};

	$.fn.jWizard = function(options) {
		if (this.length <= 0)
			return this;
		else
		{
			return this.each(function() {
				var element = $(this);

				// Return early if this element already has a plugin instance
				if (element.data('jWizard'))	return;

				// pass options to plugin constructor
				var w = new jWizard(this, options);

				// Store plugin object in this element's data
				element.data('jWizard', w);
			});
		}
	};
})(jQuery);