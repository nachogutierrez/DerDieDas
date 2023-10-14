import { Words } from "./words";

let words

beforeEach(() => {
    words = Words()
})

test('No score', () => {
    expect(words.getScore('Hund')).toBe(0)
})

test('Score 1', () => {
    words.hit('Hund')
    expect(words.getScore('Hund')).toBe(1)
})