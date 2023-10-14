import { Words } from "./words";

let words

function hit(word, k) {
    for (let i = 0; i < k; i++) {
        words.hit(word)
    }
}

// All milestones have 4 steps
function testMilestone(word, fromScore, milestone) {
    hit(word, fromScore)
    expect(words.getScore(word)).toBe(fromScore)
    expect(words.currentMilestone(word)).toBe(milestone)
    expect(words.getExperience(word)).toBe(0)
    expect(words.willLevelUp(word)).toBeFalsy()
    words.hit(word)
    expect(words.getScore(word)).toBe(fromScore + 1)
    expect(words.currentMilestone(word)).toBe(milestone)
    expect(words.getExperience(word)).toBe(0.25)
    expect(words.willLevelUp(word)).toBeFalsy()
    words.hit(word)
    expect(words.getScore(word)).toBe(fromScore + 2)
    expect(words.currentMilestone(word)).toBe(milestone)
    expect(words.getExperience(word)).toBe(0.5)
    expect(words.willLevelUp(word)).toBeFalsy()
    words.hit(word)
    expect(words.getScore(word)).toBe(fromScore + 3)
    expect(words.currentMilestone(word)).toBe(milestone)
    expect(words.getExperience(word)).toBe(0.75)
    expect(words.willLevelUp(word)).toBeTruthy()
    words.hit(word)
    expect(words.getScore(word)).toBe(fromScore + 4)
    expect(words.currentMilestone(word)).not.toBe(milestone)
    expect(words.getExperience(word)).toBe(0)
    expect(words.willLevelUp(word)).toBeFalsy()
}

function testMiss(word, fromScore, toScore, toMilestone) {
    hit(word, fromScore)
    words.miss(word)
    expect(words.getScore(word)).toBe(toScore)
    expect(words.currentMilestone(word)).toBe(toMilestone)
    expect(words.getExperience(word)).toBe(0)
    expect(words.willLevelUp(word)).toBeFalsy()
}

beforeEach(() => {
    words = Words()
})

test('Quartz score', () => {
    testMilestone('Hund', 0, 0)
})

test('Amethyst score', () => {
    testMilestone('Hund', 4, 1)
})

test('Emerald score', () => {
    testMilestone('Hund', 8, 2)
})

test('Sapphire score', () => {
    testMilestone('Hund', 12, 3)
})

test('Diamond score', () => {
    hit('Hund', 16)
    expect(words.getScore('Hund')).toBe(16)
    expect(words.currentMilestone('Hund')).toBe(4)
    expect(words.getExperience('Hund')).toBe(0)
    expect(words.willLevelUp('Hund')).toBeFalsy()
})

test('miss', () => {
    testMiss('word 01', 0, 0, 0)
    testMiss('word 02', 1, 0, 0)
    testMiss('word 03', 2, 0, 0)
    testMiss('word 04', 3, 0, 0)

    testMiss('word 11', 4, 0, 0)
    testMiss('word 12', 5, 0, 0)
    testMiss('word 13', 6, 0, 0)
    testMiss('word 14', 7, 0, 0)

    testMiss('word 21', 8, 4, 1)
    testMiss('word 22', 9, 4, 1)
    testMiss('word 23', 10, 4, 1)
    testMiss('word 24', 11, 4, 1)

    testMiss('word 31', 12, 8, 2)
    testMiss('word 32', 13, 8, 2)
    testMiss('word 33', 14, 8, 2)
    testMiss('word 34', 15, 8, 2)

    testMiss('word 41', 16, 12, 3)
})