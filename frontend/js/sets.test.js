import { Sets } from "./sets";

let sets

beforeEach(() => {
    sets = Sets()
})

test('Add set', () => {
    sets.add('set 1')
    sets.add('set 2')
    const setNames = sets.getSets()
    expect(setNames.length).toBe(2)
    expect(setNames.includes('set 1')).toBeTruthy()
    expect(setNames.includes('set 2')).toBeTruthy()
})

test('Remove set', () => {
    sets.add('set 1')
    sets.remove('set 1')
    expect(sets.getSets().length).toBe(0)
})