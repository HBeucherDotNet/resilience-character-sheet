import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const hashCodecSource = readFileSync(new URL('./hashCodec.js', import.meta.url), 'utf8');
const hashCodecDataUrl = `data:text/javascript;base64,${Buffer.from(hashCodecSource).toString('base64')}`;
const { HashCodec } = await import(hashCodecDataUrl);

test('HashCodec encode/decode roundtrip with checkboxes and text values', () => {
	const allChoiceIds = ['a', 'b', 'c', 'd'];
	const encoded = HashCodec.encode({
		checkedIds: ['b', 'd'],
		textValues: {
			ficheNom: 'Aster',
			notes: 'Ligne 1\nLigne 2'
		},
		allChoiceIds
	});

	assert.match(encoded, /^v1\.[0-9a-z]+\.[A-Za-z0-9_-]*$/);

	const decoded = HashCodec.decode(encoded, { allChoiceIds });
	assert.deepEqual(decoded, {
		checkedIds: ['b', 'd'],
		textValues: {
			ficheNom: 'Aster',
			notes: 'Ligne 1\nLigne 2'
		}
	});
});

test('HashCodec decode returns null for invalid version', () => {
	const decoded = HashCodec.decode('v9.abc.def', {
		allChoiceIds: ['a', 'b']
	});
	assert.equal(decoded, null);
});

test('HashCodec decode returns null for malformed payload', () => {
	const decoded = HashCodec.decode('v1.abc.not-valid-base64!', {
		allChoiceIds: ['a', 'b']
	});
	assert.equal(decoded, null);
});

test('HashCodec ignores checked IDs not present in allChoiceIds', () => {
	const encoded = HashCodec.encode({
		checkedIds: ['ghost', 'b'],
		textValues: {},
		allChoiceIds: ['a', 'b', 'c']
	});
	const decoded = HashCodec.decode(encoded, {
		allChoiceIds: ['a', 'b', 'c']
	});
	assert.deepEqual(decoded?.checkedIds, ['b']);
});
