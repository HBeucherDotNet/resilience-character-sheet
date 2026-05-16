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

export function createHashStateSync({ excludedRootSelector = '#sort-dialog' } = {}) {
	const isPersistedHashField = createPersistedHashFieldPredicate(excludedRootSelector);
	let isRestoringState = false;

	function getCheckedInputs() {
		return Array.from(document.querySelectorAll('input[type="checkbox"]'))
			.filter(input => input.checked && isPersistedHashField(input))
			.map(input => input.id);
	}

	function getChoiceInputs() {
		return Array.from(document.querySelectorAll('input[type="checkbox"]')).filter(isPersistedHashField);
	}

	function getTextStateFields() {
		return Array.from(document.querySelectorAll('input[type="text"], textarea')).filter(isPersistedHashField);
	}

	function getTextStateValues() {
		const values = {};
		getTextStateFields()
			.filter(field => field.value !== '')
			.forEach(field => {
				values[field.id] = field.value;
			});
		return values;
	}

	function setCheckedInputs(ids) {
		const selectedIds = new Set(ids);
		document.querySelectorAll('input[type="checkbox"]').forEach(input => {
			input.checked = false;
		});

		document.querySelectorAll('input[type="checkbox"]').forEach(input => {
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
		const encoded = HashCodec.encode({
			checkedIds: getCheckedInputs(),
			textValues: getTextStateValues(),
			allChoiceIds: getChoiceInputs().map(input => input.id)
		});
		const newUrl = `${window.location.pathname}${window.location.search}#${encoded}`;
		history.replaceState(null, '', newUrl);
	}

	function bindAutoHashSync() {
		document.querySelectorAll('input[type="checkbox"]').forEach(input => {
			input.addEventListener('change', updateHashFromState);
		});

		const debouncedUpdateHash = debounce(updateHashFromState, 1000);
		document.querySelectorAll('input[type="text"], textarea').forEach(field => {
			field.addEventListener('input', debouncedUpdateHash);
			field.addEventListener('change', updateHashFromState);
		});
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
		isRestoringState = false;
	}

	return {
		bindAutoHashSync,
		restoreStateFromHash
	};
}