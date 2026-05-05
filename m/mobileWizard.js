function getOptionTitle(optionElement) {
	const label = optionElement.querySelector('.option-label label');
	return label ? label.textContent.trim() : 'Option';
}

function buildDetailContent(optionElement) {
	const detail = document.createElement('div');
	detail.className = 'mobile-step-detail-content';

	const title = document.createElement('h3');
	title.className = 'mobile-step-detail-heading';
	title.textContent = getOptionTitle(optionElement);
	detail.appendChild(title);

	const desc = optionElement.querySelector('.desc');
	if (desc) {
		const clone = desc.cloneNode(true);
		const longText = clone.querySelector('.long');
		const shortText = clone.querySelector('.short');

		if (longText) {
			longText.style.display = 'inline';
			if (shortText) shortText.style.display = 'none';
		}

		detail.appendChild(clone);
	}

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
	options.forEach(option => {
		option.classList.toggle('mobile-step-option-active', option === selectedOption);
	});

	detailPanel.replaceChildren(buildDetailContent(selectedOption));
}

function setupGroup(groupElement) {
	if (groupElement.querySelector('.mobile-step-detail')) return;

	const detailPanel = document.createElement('aside');
	detailPanel.className = 'mobile-step-detail';
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

	groupElement.addEventListener('click', event => {
		const option = event.target instanceof Element ? event.target.closest('.option') : null;
		if (!option) return;

		const input = option.querySelector('input');
		if (!input) return;

		// The main builder script applies checkbox exclusivity rules; this just updates the panel promptly.
		queueMicrotask(renderDetail);
	});
	observer.observe(groupElement, { childList: true, subtree: true });

	renderDetail();
}

function setupSteps() {
	const builder = document.getElementById('character-builder');
	if (!builder) return;

	const steps = Array.from(builder.querySelectorAll(':scope > section'));
	if (steps.length === 0) return;

	steps.forEach(step => {
		step.classList.add('mobile-step');
		const group = step.querySelector('.flex-group');
		if (group) {
			setupGroup(group);
		}
	});

	const nav = document.getElementById('mobile-step-nav');
	const prevButton = document.getElementById('mobile-step-prev');
	const nextButton = document.getElementById('mobile-step-next');
	const title = document.getElementById('mobile-step-title');

	if (!nav || !prevButton || !nextButton || !title) return;

	let currentStepIndex = 0;

	function renderStep() {
		steps.forEach((step, index) => {
			const isActive = index === currentStepIndex;
			step.classList.toggle('mobile-step-active', isActive);
			step.style.setProperty('display', isActive ? 'block' : 'none', 'important');
		});

		const heading = steps[currentStepIndex]?.querySelector('h2')?.textContent?.trim() || 'Etape';
		title.textContent = heading;
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
