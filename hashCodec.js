function encodeUnicodeToBase64Url(value) {
	const bytes = new TextEncoder().encode(value);
	let binary = '';
	bytes.forEach(byte => {
		binary += String.fromCharCode(byte);
	});
	return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function decodeBase64UrlToUnicode(value) {
	const base64 = value.replace(/-/g, '+').replace(/_/g, '/');
	const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
	const binary = atob(padded);
	const bytes = new Uint8Array(binary.length);
	for (let i = 0; i < binary.length; i++) {
		bytes[i] = binary.charCodeAt(i);
	}
	return new TextDecoder().decode(bytes);
}

function base36ToBigInt(value) {
	let result = 0n;
	for (const char of value.toLowerCase()) {
		const digit = parseInt(char, 36);
		if (Number.isNaN(digit) || digit < 0 || digit > 35) {
			throw new Error('Invalid base36 value');
		}
		result = result * 36n + BigInt(digit);
	}
	return result;
}

export const HashCodec = {
	version: 'v1',

	encode(state) {
		const checkedSet = new Set(state.checkedIds ?? []);
		const allChoiceIds = state.allChoiceIds ?? [];
		let bitset = 0n;
		allChoiceIds.forEach((inputId, index) => {
			if (checkedSet.has(inputId)) {
				bitset |= 1n << BigInt(index);
			}
		});

		const textStateJson = JSON.stringify(state.textValues ?? {});
		const textStateEncoded = encodeUnicodeToBase64Url(textStateJson);
		return `${this.version}.${bitset.toString(36)}.${textStateEncoded}`;
	},

	decode(hash, options = {}) {
		if (!hash || !hash.startsWith(`${this.version}.`)) return null;
		const parts = hash.split('.');
		if (parts.length !== 3) return null;

		const bitsetPayload = parts[1];
		const textPayload = parts[2];
		let bitset;
		try {
			bitset = base36ToBigInt(bitsetPayload);
		} catch {
			return null;
		}

		const allChoiceIds = options.allChoiceIds ?? [];
		const checkedIds = allChoiceIds.filter((_, index) => ((bitset >> BigInt(index)) & 1n) === 1n);

		let textValues = {};
		if (textPayload) {
			try {
				const json = decodeBase64UrlToUnicode(textPayload);
				const parsed = JSON.parse(json);
				if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
					textValues = parsed;
				}
			} catch {
				return null;
			}
		}

		return {
			checkedIds,
			textValues
		};
	}
};
