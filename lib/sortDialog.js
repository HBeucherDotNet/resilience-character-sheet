export function createSortDialogController({ getState, symbols, sorts, normalizePlaceholderToken, resolveScoreStep }) {
	const sortManagedInputIds = new Set(['sort-graines', 'sort-aire-effet', 'sort-portee', 'sort-puissance', 'sort-duree']);
	let sortGrainesUtilisees = 0;
	let handleScoreStep = null;
	let openSortDialog = null;

	function bindSortDialog() {
		const dialog = document.getElementById('sort-dialog');
		const openButton = document.getElementById('open-sort-dialog-btn');
		const form = dialog?.querySelector('form');
		const scoreInputs = form ? Array.from(form.querySelectorAll('.amelioration-score-input')) : [];
		const talentSelect = document.getElementById('sort-talent-select');
		const talentEffectsList = document.getElementById('sort-talent-effets');
		const aireEffetInput = document.getElementById('sort-aire-effet');
		const porteeInput = document.getElementById('sort-portee');
		const puissanceInput = document.getElementById('sort-puissance');
		const dureeInput = document.getElementById('sort-duree');
		const grainesInput = document.getElementById('sort-graines');
		const grainesIndicator = document.getElementById('sort-graines-indicator');
		const aireEffetIndicator = document.getElementById('sort-aire-effet-indicator');
		const porteeIndicator = document.getElementById('sort-portee-indicator');
		const puissanceIndicator = document.getElementById('sort-puissance-indicator');
		const dureeIndicator = document.getElementById('sort-duree-indicator');
		const sortDialogButtons = form ? Array.from(form.querySelectorAll('.amelioration-score-btn')) : [];

		if (!dialog || !openButton || !form) return;

		const sortParameterConfigs = [
			{ input: aireEffetInput, indicator: aireEffetIndicator },
			{ input: porteeInput, indicator: porteeIndicator },
			{ input: puissanceInput, indicator: puissanceIndicator },
			{ input: dureeInput, indicator: dureeIndicator }
		].filter(config => config.input);
		let isSyncingSortDialog = false;

		function buildTalentOptionLabel(talentCheckbox) {
			const { categoryLabel, actionLabel } = getTalentContextLabels(talentCheckbox);
			const category = categoryLabel || '';
			const action = actionLabel || '';

			if (!category && !action) return '';
			if (!category) return action;
			if (!action) return category;
			return `${category} - ${action}`;
		}

		function getSortInputValue(input) {
			const value = Number.parseInt(input?.value ?? '0', 10);
			return Number.isFinite(value) ? Math.max(0, value) : 0;
		}

		function getSortBaseValue(input) {
			const value = Number.parseInt(input?.dataset.sortBase ?? input?.defaultValue ?? '0', 10);
			return Number.isFinite(value) ? Math.max(0, value) : 0;
		}

		function getSortSouffleValue() {
			const value = Number.parseInt(String(getState()?.ficheSouffle ?? '0'), 10);
			return Number.isFinite(value) ? Math.max(0, value) : 0;
		}

		function getSeedsUsedByInput(input, souffleValue = getSortSouffleValue()) {
			if (!input || souffleValue <= 0) return 0;

			const delta = getSortInputValue(input) - getSortBaseValue(input);
			if (delta <= 0) return 0;

			return Math.ceil(delta / souffleValue);
		}

		function getTalentContextLabels(talentCheckbox) {
			const domainCard = talentCheckbox.closest('.magie-domaine-card');
			if (domainCard) {
				return {
					categoryLabel: domainCard.querySelector('.magie-domaine-name')?.textContent?.trim() || '',
					actionLabel: talentCheckbox.closest('label')?.querySelector('.magie-talent-label')?.textContent?.trim() || ''
				};
			}

			const rowElement = talentCheckbox.closest('tr');
			const firstCellLabel = rowElement?.querySelector('td:first-child label');
			return {
				categoryLabel: firstCellLabel?.textContent?.trim() || '',
				actionLabel: talentCheckbox.parentElement?.textContent?.trim() || ''
			};
		}

		function getGrainesSelectionnees() {
			return getSortInputValue(grainesInput);
		}

		function getMinAllowedValueForInput(input) {
			if (!input) return 0;
			if (input === grainesInput) return Math.max(0, updateSortGrainesUsed());
			return getSortBaseValue(input);
		}

		function updateSortGrainesUsed() {
			sortGrainesUtilisees = sortParameterConfigs.reduce(
				(total, config) => total + getSeedsUsedByInput(config.input),
				0
			);

			return sortGrainesUtilisees;
		}

		function getRemainingSeedsForInput(input) {
			const usedByOthers = sortParameterConfigs.reduce((total, config) => {
				if (config.input === input) return total;
				return total + getSeedsUsedByInput(config.input);
			}, 0);

			return Math.max(0, getGrainesSelectionnees() - usedByOthers);
		}

		function getMaxAllowedValueForInput(input) {
			if (input === grainesInput) return Number.POSITIVE_INFINITY;

			const souffleValue = getSortSouffleValue();
			const baseValue = getSortBaseValue(input);
			if (souffleValue <= 0) return baseValue;

			return baseValue + getRemainingSeedsForInput(input) * souffleValue;
		}

		function renderIndicatorSymbols(indicator, symbol, count) {
			if (!indicator) return;

			indicator.replaceChildren();
			if (!symbol || count <= 0) return;

			const fragment = document.createDocumentFragment();
			for (let index = 0; index < count; index += 1) {
				const seed = document.createElement('span');
				seed.className = 'sort-dialog-row-indicator-seed';
				seed.textContent = symbol;
				fragment.appendChild(seed);
			}

			indicator.appendChild(fragment);
		}

		function updateSortDialogButtonStates() {
			sortDialogButtons.forEach(button => {
				const targetId = button.dataset.scoreTarget;
				const input = targetId ? document.getElementById(targetId) : null;
				if (!input || !sortManagedInputIds.has(targetId)) {
					button.disabled = false;
					return;
				}

				const step = resolveScoreStep(button.dataset.scoreStep ?? '0');
				const currentValue = getSortInputValue(input);
				const minValue = getMinAllowedValueForInput(input);
				const maxValue = getMaxAllowedValueForInput(input);

				let isDisabled = step === 0;
				if (!isDisabled && step < 0) {
					isDisabled = currentValue <= minValue;
				}
				if (!isDisabled && step > 0) {
					isDisabled = currentValue >= maxValue;
				}

				button.disabled = isDisabled;
			});
		}

		function renderSortDialogIndicators() {
			const selectedCount = getGrainesSelectionnees();
			const saisonKey = getState()?.saison?.value ?? '';
			const symbol = symbols[saisonKey] ?? '';
			updateSortGrainesUsed();
			const remainingSeeds = Math.max(0, selectedCount - sortGrainesUtilisees);

			if (grainesIndicator) {
				renderIndicatorSymbols(grainesIndicator, symbol, remainingSeeds);
				grainesIndicator.dataset.usedSeeds = String(sortGrainesUtilisees);
				grainesIndicator.dataset.remainingSeeds = String(remainingSeeds);
				grainesIndicator.title = `${remainingSeeds} restante${remainingSeeds > 1 ? 's' : ''} • ${sortGrainesUtilisees}/${selectedCount} utilisees`;
			}

			sortParameterConfigs.forEach(config => {
				if (!config.indicator) return;
				const usedSeeds = getSeedsUsedByInput(config.input);
				renderIndicatorSymbols(config.indicator, symbol, usedSeeds);
				config.indicator.title = `${usedSeeds} graine${usedSeeds > 1 ? 's' : ''} utilisee${usedSeeds > 1 ? 's' : ''}`;
			});

			updateSortDialogButtonStates();
		}

		function normalizeSortDialogInput(changedInput = null) {
			if (isSyncingSortDialog) return;
			isSyncingSortDialog = true;

			if (changedInput === grainesInput && grainesInput) {
				const normalizedGraines = Math.max(updateSortGrainesUsed(), getSortInputValue(grainesInput));
				if (String(normalizedGraines) !== grainesInput.value) {
					grainesInput.value = String(normalizedGraines);
				}
			}

			const changedConfig = sortParameterConfigs.find(config => config.input === changedInput);
			if (changedConfig) {
				const normalizedValue = Math.max(
					getMinAllowedValueForInput(changedConfig.input),
					Math.min(getSortInputValue(changedConfig.input), getMaxAllowedValueForInput(changedConfig.input))
				);
				if (String(normalizedValue) !== changedConfig.input.value) {
					changedConfig.input.value = String(normalizedValue);
				}
			}

			renderSortDialogIndicators();
			isSyncingSortDialog = false;
		}

		function getTalentSortKeys(talentCheckbox) {
			const { categoryLabel, actionLabel } = getTalentContextLabels(talentCheckbox);
			const categoryKey = normalizePlaceholderToken(categoryLabel);
			const actionKey = normalizePlaceholderToken(actionLabel);

			return { categoryKey, actionKey };
		}

		function renderTalentEffects() {
			if (!talentEffectsList) return;

			talentEffectsList.innerHTML = '';

			const selectedOption = talentSelect?.selectedOptions?.[0];
			const categoryKey = selectedOption?.dataset.sortCategory ?? '';
			const actionKey = selectedOption?.dataset.sortAction ?? '';
			const effects = sorts?.[categoryKey]?.[actionKey] ?? [];

			if (!categoryKey || !actionKey || effects.length === 0) {
				const item = document.createElement('li');
				item.textContent = 'Aucun effet défini pour ce talent.';
				talentEffectsList.appendChild(item);
				return;
			}

			effects.forEach(effect => {
				const item = document.createElement('li');
				item.textContent = effect;
				talentEffectsList.appendChild(item);
			});
		}

		function setSortDialogDefaultScores() {
			const state = getState();
			const defaults = [
				[aireEffetInput, state?.ficheHiver],
				[porteeInput, state?.fichePrintemps],
				[puissanceInput, state?.ficheEte],
				[dureeInput, state?.ficheAutomne]
			];

			defaults.forEach(([input, value]) => {
				if (!input) return;

				const normalizedValue = String(value ?? '0');
				input.dataset.sortBase = normalizedValue;
				input.defaultValue = normalizedValue;
				input.value = normalizedValue;
				input.dispatchEvent(new Event('input', { bubbles: true }));
				input.dispatchEvent(new Event('change', { bubbles: true }));
			});

			normalizeSortDialogInput();
			renderSortDialogIndicators();
		}

		function populateTalentSelect() {
			populateTalentSelectForTalent();
		}

		function populateTalentSelectForTalent(preselectedTalentId = '') {
			if (!talentSelect) return;

			talentSelect.innerHTML = '';
			const checkedTalents = Array.from(document.querySelectorAll('input.talent:checked'));

			if (checkedTalents.length === 0) {
				const option = document.createElement('option');
				option.value = '';
				option.textContent = 'Aucun talent coché';
				option.selected = true;
				talentSelect.appendChild(option);
				talentSelect.disabled = true;
				renderTalentEffects();
				return;
			}

			talentSelect.disabled = false;
			checkedTalents.forEach(checkbox => {
				const { categoryKey, actionKey } = getTalentSortKeys(checkbox);
				const option = document.createElement('option');
				option.value = checkbox.id;
				option.textContent = buildTalentOptionLabel(checkbox);
				option.dataset.sortCategory = categoryKey;
				option.dataset.sortAction = actionKey;
				talentSelect.appendChild(option);
			});

			if (preselectedTalentId) {
				talentSelect.value = preselectedTalentId;
			}

			renderTalentEffects();
		}

		function openDialog({ talentId = '' } = {}) {
			if (dialog.open) return;

			setSortDialogDefaultScores();
			populateTalentSelectForTalent(talentId);

			if (typeof dialog.showModal === 'function') {
				handleScoreStep = (targetId, input, step) => {
					if (!sortManagedInputIds.has(targetId)) return false;

					const currentValue = getSortInputValue(input);
					const minValue = getMinAllowedValueForInput(input);
					const maxValue = getMaxAllowedValueForInput(input);
					let nextValue = currentValue + step;

					if (step > 0) {
						nextValue = Math.min(nextValue, maxValue);
					}
					nextValue = Math.max(minValue, nextValue);

					if (nextValue === currentValue) {
						renderSortDialogIndicators();
						return true;
					}

					input.value = String(nextValue);
					input.dispatchEvent(new Event('input', { bubbles: true }));
					input.dispatchEvent(new Event('change', { bubbles: true }));
					return true;
				};

				dialog.showModal();
				return;
			}

			dialog.setAttribute('open', 'open');
		}

		openSortDialog = openDialog;

		openButton.addEventListener('click', () => {
			openDialog();
		});

		dialog.addEventListener('click', event => {
			if (event.target !== dialog) return;

			if (typeof dialog.close === 'function') {
				dialog.close('dismiss');
			} else {
				dialog.removeAttribute('open');
			}
		});

		talentSelect?.addEventListener('change', renderTalentEffects);
		grainesInput?.addEventListener('input', () => normalizeSortDialogInput(grainesInput));
		grainesInput?.addEventListener('change', () => normalizeSortDialogInput(grainesInput));
		sortParameterConfigs.forEach(config => {
			config.input.addEventListener('input', () => normalizeSortDialogInput(config.input));
			config.input.addEventListener('change', () => normalizeSortDialogInput(config.input));
		});

		form.addEventListener('reset', () => {
			window.requestAnimationFrame(() => {
				setSortDialogDefaultScores();
				scoreInputs.forEach(input => {
					input.dispatchEvent(new Event('input', { bubbles: true }));
					input.dispatchEvent(new Event('change', { bubbles: true }));
				});
				renderTalentEffects();
				renderSortDialogIndicators();
			});
		});

		dialog.addEventListener('close', () => {
			handleScoreStep = null;
		});
	}

	return {
		bindSortDialog,
		openSortDialog(options = {}) {
			openSortDialog?.(options);
		},
		handleScoreStep(targetId, input, step) {
			return handleScoreStep?.(targetId, input, step) ?? false;
		}
	};
}