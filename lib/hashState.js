import { HashCodec } from '../hashCodec.js';

function debounce(fn, delay) {
	let timer;
	return (...args) => {
		clearTimeout(timer);
		timer = setTimeout(() => fn(...args), delay);
	};
}

function createPersistedHashFieldPredicate(excludedRootSelector) {
	return field => Boolean(field?.id) && !field.closest(excludedRootSelector);
}

function createPersistedHashChoicePredicate(isPersistedHashField) {
	return field => isPersistedHashField(field) && !field.closest('.fiche-bloc-item');
}

export function createHashStateSync({
	excludedRootSelector = '#sort-dialog',
	getHashState = () => ({ checkedIds: [], textValues: {} }),
	onStateRestored = null
} = {}) {
	const isPersistedHashField = createPersistedHashFieldPredicate(excludedRootSelector);
	const isPersistedHashChoice = createPersistedHashChoicePredicate(isPersistedHashField);
	let isRestoringState = false;

	function getChoiceInputs() {
		return Array.from(document.querySelectorAll('input[type="checkbox"]')).filter(isPersistedHashChoice);
	}

	function getTextStateFields() {
		return Array.from(document.querySelectorAll('input[type="text"], textarea')).filter(isPersistedHashField);
	}

	function setCheckedInputs(ids) {
		const selectedIds = new Set(ids);
		getChoiceInputs().forEach(input => {
			input.checked = false;
		});

		getChoiceInputs().forEach(input => {
			if (selectedIds.has(input.id)) {
				input.checked = true;
				input.dispatchEvent(new Event('change', { bubbles: true }));
			}
		});
	}

	function setTextStateValues(values) {
		const fields = getTextStateFields();
		fields.forEach(field => {
			field.value = '';
		});

		fields.forEach(field => {
			if (Object.prototype.hasOwnProperty.call(values, field.id)) {
				field.value = String(values[field.id] ?? '');
				field.dispatchEvent(new Event('input', { bubbles: true }));
				field.dispatchEvent(new Event('change', { bubbles: true }));
			}
		});
	}

	function updateHashFromState() {
		if (isRestoringState) return;
		const state = getHashState() ?? {};
		const encoded = HashCodec.encode({
			checkedIds: state.checkedIds ?? [],
			textValues: state.textValues ?? {},
			allChoiceIds: getChoiceInputs().map(input => input.id)
		});

		const newUrl = `${window.location.pathname}${window.location.search}#${encoded}`;
		history.replaceState(null, '', newUrl);
	}

	function restoreStateFromHash() {
		const hash = window.location.hash.replace(/^#/, '');
		if (!hash) return;
		const state = HashCodec.decode(hash, {
			allChoiceIds: getChoiceInputs().map(input => input.id)
		});
		if (!state) return;

		isRestoringState = true;
		setCheckedInputs(state.checkedIds);
		setTextStateValues(state.textValues);
		if (typeof onStateRestored === 'function') {
			onStateRestored(state);
		}
		isRestoringState = false;
	}

	return {
		updateHashFromState,
		restoreStateFromHash
	};
}