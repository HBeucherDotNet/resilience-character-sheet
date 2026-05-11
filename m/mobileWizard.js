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
	if (groupElement.querySelector('.mobile-step-detail')) return;

	const detailPanel = document.createElement('aside');
	detailPanel.className = 'mobile-step-detail step-text';
	detailPanel.setAttribute('aria-live', 'polite');
	groupElement.appendChild(detailPanel);

	const observer = new MutationObserver(mutations => {
		const hasExternalMutation = mutations.some(mutation => !mutation.target.closest('.mobile-step-detail'));
		if (!hasExternalMutation) return;
		renderDetail();
	});

	function renderDetail() {
		observer.disconnect();
		refreshGroupDetail(groupElement);
		observer.observe(groupElement, { childList: true, subtree: true });
	}

	groupElement.addEventListener('change', event => {
		if (!(event.target instanceof HTMLInputElement)) return;
		if (!event.target.closest('.option')) return;
		renderDetail();
	});
	observer.observe(groupElement, { childList: true, subtree: true });

	renderDetail();
}

function setupSteps() {
	const builder = document.getElementById('character-builder');
	if (!builder) return;

	const sections = Array.from(builder.querySelectorAll(':scope > section'));
	const morphologyGroupConfig = [
		{ id: 'armement-group', label: 'Morphologies - Armement' },
		{ id: 'cuirasse-group', label: 'Morphologies - Cuirasse' },
		{ id: 'mains-group', label: 'Morphologies - Mains' },
		{ id: 'peau-group', label: 'Morphologies - Peau' }
	];

	const steps = sections.flatMap(section => {
		const heading = section.querySelector('h2')?.textContent?.trim() || 'Etape';
		const isMorphologySection = heading === 'Morphologies';

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

	sections.forEach(section => {
		section.classList.add('mobile-step');
		section.querySelectorAll('.flex-group').forEach(group => {
			setupGroup(group);
		});
	});

	const nav = document.getElementById('mobile-step-nav');
	const prevButton = document.getElementById('mobile-step-prev');
	const nextButton = document.getElementById('mobile-step-next');
	const title = document.getElementById('mobile-step-title');

	if (!nav || !prevButton || !nextButton || !title) return;

	let currentStepIndex = 0;

	function setMorphologyGroupVisibility(activeStep) {
		const morphologySection = sections.find(section => section.querySelector('h2')?.textContent?.trim() === 'Morphologies');
		if (!morphologySection) return;

		const groups = morphologyGroupConfig
			.map(config => morphologySection.querySelector(`#${config.id}`))
			.filter(Boolean);

		groups.forEach(group => {
			const isActiveGroup = activeStep?.morphologyGroup === group;
			group.style.setProperty('display', isActiveGroup ? 'flex' : 'none', 'important');
		});
	}

	function renderStep() {
		const activeStep = steps[currentStepIndex];

		sections.forEach(section => {
			section.classList.remove('mobile-step-active');
		});

		steps.forEach((step, index) => {
			const isActive = index === currentStepIndex;
			if (!isActive) return;
			step.section.classList.add('mobile-step-active');
		});

		setMorphologyGroupVisibility(activeStep);

		title.textContent = activeStep?.title || 'Etape';
		prevButton.disabled = currentStepIndex === 0;
		nextButton.disabled = currentStepIndex === steps.length - 1;
		window.scrollTo({ top: 0, behavior: 'smooth' });
	}

	prevButton.addEventListener('click', () => {
		if (currentStepIndex === 0) return;
		currentStepIndex -= 1;
		renderStep();
	});

	nextButton.addEventListener('click', () => {
		if (currentStepIndex >= steps.length - 1) return;
		currentStepIndex += 1;
		renderStep();
	});

	renderStep();
}

setupSteps();
