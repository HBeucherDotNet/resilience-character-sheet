function buildDetailContent(optionElement) {
	const detail = document.createElement('div');
	detail.className = 'mobile-step-detail-content';

	Array.from(optionElement.childNodes).forEach(node => {
		const clone = node.cloneNode(true);
		if (clone instanceof Element) {
			clone.querySelectorAll('input').forEach(input => input.remove());
			clone.querySelectorAll('button').forEach(button => button.remove());
			if (clone.matches('button')) return;
		}
		detail.appendChild(clone);
	});

	return detail;
}

function findSelectedOption(groupElement) {
	const selectedInput = groupElement.querySelector('.option input:checked');
	if (selectedInput) {
		return selectedInput.closest('.option');
	}
	return groupElement.querySelector('.option');
}

function refreshGroupDetail(groupElement) {
	const detailPanel = groupElement.querySelector('.mobile-step-detail');
	if (!detailPanel) return;

	const options = Array.from(groupElement.querySelectorAll('.option'));
	if (options.length === 0) {
		detailPanel.textContent = 'Aucune option disponible pour le moment.';
		return;
	}

	const selectedOption = findSelectedOption(groupElement);

	detailPanel.replaceChildren(buildDetailContent(selectedOption));
}

function setupGroup(groupElement) {
	let detailPanel = groupElement.querySelector('.mobile-step-detail');
	if (!detailPanel) {
		detailPanel = document.createElement('aside');
		detailPanel.className = 'mobile-step-detail step-text';
		detailPanel.setAttribute('aria-live', 'polite');
		groupElement.appendChild(detailPanel);
	}

	let isActive = false;
	let isObserving = false;

	const observer = new MutationObserver(mutations => {
		if (!isActive) return;
		const hasExternalMutation = mutations.some(mutation => !mutation.target.closest('.mobile-step-detail'));
		if (!hasExternalMutation) return;
		renderDetail();
	});

	function startObserver() {
		if (isObserving) return;
		observer.observe(groupElement, { childList: true, subtree: true });
		isObserving = true;
	}

	function stopObserver() {
		if (!isObserving) return;
		observer.disconnect();
		isObserving = false;
	}

	function renderDetail() {
		const shouldResume = isObserving;
		if (shouldResume) stopObserver();
		refreshGroupDetail(groupElement);
		if (shouldResume) startObserver();
	}

	groupElement.addEventListener('change', event => {
		if (!isActive) return;
		if (!(event.target instanceof HTMLInputElement)) return;
		if (!event.target.closest('.option')) return;
		renderDetail();
	});

	return {
		setActive(nextActive) {
			if (isActive === nextActive) return;
			isActive = nextActive;

			if (isActive) {
				startObserver();
				renderDetail();
				return;
			}

			stopObserver();
		}
	};
}

function setupSteps() {
	const builder = document.getElementById('character-builder');
	if (!builder) return;

	const sections = Array.from(builder.querySelectorAll(':scope > section'));
	const visibleSections = sections.filter(section => section.id !== 'ameliorations-section');
	const morphologySection = builder.querySelector('#morphologies-section');
	const personalitySection = builder.querySelector('#personnalite-section');
	const morphologyGroupConfig = [
		{ id: 'armement-group', label: 'Morphologies - Armement' },
		{ id: 'cuirasse-group', label: 'Morphologies - Cuirasse' },
		{ id: 'mains-group', label: 'Morphologies - Mains' },
		{ id: 'peau-group', label: 'Morphologies - Peau' }
	];
	const morphologyGroups = morphologyGroupConfig
		.map(config => morphologySection?.querySelector(`#${config.id}`))
		.filter(Boolean);

	const steps = visibleSections.flatMap(section => {
		const heading = section.querySelector('h2')?.textContent?.trim() || 'Etape';
		const isMorphologySection = section === morphologySection;

		if (!isMorphologySection) {
			return [{ section, title: heading }];
		}

		const morphologySteps = morphologyGroupConfig
			.map(config => {
				const group = section.querySelector(`#${config.id}`);
				if (!group) return null;
				return {
					section,
					title: config.label,
					morphologyGroup: group
				};
			})
			.filter(Boolean);

		return morphologySteps.length > 0 ? morphologySteps : [{ section, title: heading }];
	});

	if (steps.length === 0) return;
	const groupControllers = new Map();

	visibleSections.forEach(section => {
		section.classList.add('mobile-step');
		section.querySelectorAll('.flex-group').forEach(group => {
			const controller = setupGroup(group);
			if (controller) {
				groupControllers.set(group, controller);
			}
		});
	});

	const nav = document.getElementById('mobile-step-nav');
	const prevButton = document.getElementById('mobile-step-prev');
	const nextButton = document.getElementById('mobile-step-next');
	const title = document.getElementById('mobile-step-title');
	const headerMenu = document.querySelector('.mobile-header-menu');
	const returnToFormButton = document.getElementById('return-to-form-btn');
	const toggleViewModeButton = document.getElementById('toggle-view-mode-btn');
	const openSortDialogButton = document.getElementById('open-sort-dialog-btn');
	const shareViewLinkButton = document.getElementById('share-view-link-btn');

	if (!nav || !prevButton || !nextButton || !title) return;

	let currentStepIndex = 0;
	const defaultNextLabel = nextButton.textContent || '►►';

	function closeHeaderMenu() {
		if (!(headerMenu instanceof HTMLDetailsElement)) return;
		headerMenu.open = false;
	}

	function isReadOnlyViewModeEnabled() {
		return document.body.classList.contains('view-mode');
	}

	function isSheetModeEnabled() {
		return document.body.classList.contains('mobile-sheet-mode') || isReadOnlyViewModeEnabled();
	}

	function syncSheetModeUi() {
		const hasEditableSheetMode = document.body.classList.contains('mobile-sheet-mode');
		const isReadOnlyViewMode = isReadOnlyViewModeEnabled();
		const shouldShowSheet = hasEditableSheetMode || isReadOnlyViewMode;
		document.body.classList.toggle('mobile-sheet-mode', shouldShowSheet);

		if (returnToFormButton) {
			returnToFormButton.hidden = !hasEditableSheetMode || isReadOnlyViewMode;
			returnToFormButton.setAttribute('aria-pressed', String(hasEditableSheetMode));
		}

		if (shareViewLinkButton) {
			shareViewLinkButton.hidden = shouldShowSheet;
		}
	}

	function exitCharacterSheetView() {
		if (!document.body.classList.contains('mobile-sheet-mode') || isReadOnlyViewModeEnabled()) return;
		document.body.classList.remove('mobile-sheet-mode');
		syncSheetModeUi();
		closeHeaderMenu();
		renderStep();
	}

	function isPersonalityStep(step) {
		return step?.section === personalitySection;
	}

	function openCharacterSheetView() {
		if (isSheetModeEnabled()) return;

		groupControllers.forEach(controller => {
			controller.setActive(false);
		});

		document.body.classList.add('mobile-sheet-mode');
		syncSheetModeUi();
		closeHeaderMenu();

		window.requestAnimationFrame(() => {
			document.getElementById('fiche-personnage')?.scrollIntoView({ block: 'start' });
		});
	}

	function setMorphologyGroupVisibility(activeStep) {
		if (!morphologySection) return;

		morphologyGroups.forEach(group => {
			const isActiveGroup = activeStep?.morphologyGroup === group;
			group.style.setProperty('display', isActiveGroup ? 'flex' : 'none', 'important');
		});
	}

	function syncActiveGroupObservers(activeStep) {
		const activeGroups = new Set();

		if (activeStep?.morphologyGroup) {
			activeGroups.add(activeStep.morphologyGroup);
		} else {
			activeStep?.section?.querySelectorAll('.flex-group').forEach(group => {
				activeGroups.add(group);
			});
		}

		groupControllers.forEach((controller, group) => {
			controller.setActive(activeGroups.has(group));
		});
	}

	function renderStep() {
		const activeStep = steps[currentStepIndex];
		const isLastStep = currentStepIndex === steps.length - 1;
		const isPersonalityActive = isPersonalityStep(activeStep);

		visibleSections.forEach(section => {
			section.classList.remove('mobile-step-active');
		});

		steps.forEach((step, index) => {
			const isActive = index === currentStepIndex;
			if (!isActive) return;
			step.section.classList.add('mobile-step-active');
		});

		setMorphologyGroupVisibility(activeStep);
		syncActiveGroupObservers(activeStep);

		title.textContent = activeStep?.title || 'Etape';
		prevButton.disabled = currentStepIndex === 0;
		nextButton.textContent = isPersonalityActive ? 'Voir la fiche' : defaultNextLabel;
		nextButton.disabled = isLastStep && !isPersonalityActive;
		window.scrollTo({ top: 0, behavior: 'smooth' });
	}

	prevButton.addEventListener('click', () => {
		if (currentStepIndex === 0) return;
		currentStepIndex -= 1;
		renderStep();
	});

	returnToFormButton?.addEventListener('click', () => {
		exitCharacterSheetView();
	});

	toggleViewModeButton?.addEventListener('click', () => {
		closeHeaderMenu();
	}, true);

	document.addEventListener('viewmodechange', event => {
		syncSheetModeUi();
		closeHeaderMenu();

		if (event.detail?.isViewMode) {
			window.requestAnimationFrame(() => {
				document.getElementById('fiche-personnage')?.scrollIntoView({ block: 'start' });
			});
			return;
		}

		renderStep();
	});

	shareViewLinkButton?.addEventListener('click', () => {
		closeHeaderMenu();
	});

	openSortDialogButton?.addEventListener('click', () => {
		closeHeaderMenu();
	});

	nextButton.addEventListener('click', () => {
		const activeStep = steps[currentStepIndex];
		if (isPersonalityStep(activeStep)) {
			openCharacterSheetView();
			return;
		}

		if (currentStepIndex >= steps.length - 1) return;
		currentStepIndex += 1;
		renderStep();
	});

	syncSheetModeUi();
	renderStep();
}

setupSteps();
