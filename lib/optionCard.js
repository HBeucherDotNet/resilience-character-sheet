function appendDataset(target, dataset = {}) {
	Object.entries(dataset).forEach(([key, value]) => {
		if (value === undefined || value === null || value === '') return;
		target.dataset[key] = String(value);
	});
}

function appendDonContent(target, { donText = '', donHtml = '' }) {
	const donMarkup = donHtml || donText;
	if (!donMarkup) return;

	const separator = document.createElement('hr');
	separator.className = 'don-separateur';
	target.appendChild(separator);

	const donNode = document.createElement('span');
	donNode.className = 'don';
	if (donHtml) {
		donNode.innerHTML = donHtml;
	} else {
		donNode.textContent = donText;
	}
	target.appendChild(donNode);
}

export function createOptionDetailContent({
	shortText = '',
	shortHtml = '',
	longText = '',
	longHtml = '',
	descHtml = '',
	donText = '',
	donHtml = '',
	donPlacement = 'inside-desc',
	descClasses = []
}) {
	const detail = document.createElement('div');
	detail.className = 'mobile-step-detail-content';

	const desc = document.createElement('span');
	desc.className = ['desc', ...descClasses].filter(Boolean).join(' ');

	if (descHtml) {
		desc.innerHTML = descHtml;
	} else {
		const shortNode = document.createElement('span');
		shortNode.className = 'short';
		if (shortHtml) {
			shortNode.innerHTML = shortHtml;
		} else {
			shortNode.textContent = shortText;
		}
		desc.appendChild(shortNode);

		if (longText || longHtml) {
			const longNode = document.createElement('span');
			longNode.className = 'long';
			if (longHtml) {
				longNode.innerHTML = longHtml;
			} else {
				longNode.textContent = longText;
			}
			desc.appendChild(longNode);
		}
	}

	if (donPlacement === 'inside-desc') {
		appendDonContent(desc, { donText, donHtml });
	}

	detail.appendChild(desc);

	if (donPlacement === 'after-desc') {
		appendDonContent(detail, { donText, donHtml });
	}

	return detail;
}

export function createOptionCard({
	name,
	value,
	id,
	label,
	labelSuffixHtml = '',
	saison,
	dataset = {},
	shortText = '',
	shortHtml = '',
	longText = '',
	longHtml = '',
	descHtml = '',
	longHidden = false,
	donText = '',
	donHtml = '',
	donPlacement = 'inside-desc',
	descClasses = [],
	detailTargetSelector = '',
	showReadMoreButton = false,
	readMoreSvg = '',
	readMoreLabel = 'Lire plus',
	extraClasses = []
}) {
	const option = document.createElement('div');
	option.className = ['option', saison, ...extraClasses].filter(Boolean).join(' ');
	if (showReadMoreButton) {
		option.style.position = 'relative';
	}

	if (showReadMoreButton) {
		const button = document.createElement('button');
		button.type = 'button';
		button.className = 'lire-plus pictogram-btn';
		button.setAttribute('aria-label', readMoreLabel);
		button.innerHTML = readMoreSvg;
		option.appendChild(button);
	}

	const optionLabel = document.createElement('span');
	optionLabel.className = 'option-label';

	const input = document.createElement('input');
	input.type = 'checkbox';
	if (name) {
		input.name = name;
	}
	input.value = value;
	input.id = id;
	appendDataset(input, dataset);

	const labelElement = document.createElement('label');
	labelElement.setAttribute('for', id);
	labelElement.textContent = label;

	optionLabel.appendChild(input);
	optionLabel.appendChild(labelElement);
	if (labelSuffixHtml) {
		const suffix = document.createElement('span');
		suffix.innerHTML = labelSuffixHtml;
		optionLabel.append(...suffix.childNodes);
	}
	option.appendChild(optionLabel);

	const detailOptions = {
		shortText,
		shortHtml,
		longText,
		longHtml,
		descHtml,
		donText,
		donHtml,
		donPlacement,
		descClasses
	};

	const hasDetailContent = Boolean(descHtml || shortText || shortHtml || longText || longHtml || donText || donHtml);

	if (hasDetailContent) {
		option._buildDetailContent = () => createOptionDetailContent(detailOptions);
	}

	if (detailTargetSelector && hasDetailContent) {
		option._syncDetailTarget = () => {
			const scopedTarget = option.closest('.flex-group')?.querySelector(detailTargetSelector);
			const target = scopedTarget || document.querySelector(detailTargetSelector);
			if (!target) return;
			target.replaceChildren(option._buildDetailContent());
		};

		input.addEventListener('change', () => {
			if (!input.checked) return;
			option._syncDetailTarget();
		});

		return option;
	}

	const detailContent = option._buildDetailContent?.();
	const desc = detailContent?.querySelector('.desc') ?? document.createElement('span');

	if (longHidden) {
		desc.querySelectorAll('.long').forEach(longNode => {
			longNode.style.display = 'none';
		});
	}

	option.appendChild(desc);
	if (donPlacement === 'after-desc') {
		detailContent?.querySelectorAll('.don-separateur, .don').forEach(node => option.appendChild(node.cloneNode(true)));
	}

	return option;
}

export function renderOptionGroup(container, nodes) {
	if (!container) return;
	container.innerHTML = '';

	const fragment = document.createDocumentFragment();
	nodes.forEach(node => fragment.appendChild(node));
	container.appendChild(fragment);
}