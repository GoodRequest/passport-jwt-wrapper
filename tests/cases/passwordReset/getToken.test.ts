import express from 'express'
import passport from 'passport'
import { expect } from 'chai'

import { getUser, seedUsers } from '../../helpers'
import { initAuth, PasswordReset } from '../../../src'

import { UserRepository } from '../../mocks/repositories/userRepository'
import { PasswordResetTokenRepository } from '../../mocks/repositories/passwordResetTokenRepository'
import { RefreshTokenRepository } from '../../mocks/repositories/refreshTokenRepository'
// import { LoginUser, LoginUserProperty, loginUsers } from '../../seeds/users'

/*
function percentage(count: number, base: number): string {
	return `${((count / base) * 100).toFixed(2)}%`
}

function getNonExistingUser(): LoginUser {
	const user = loginUsers.getNegativeUser([LoginUserProperty.NON_EXISTING])
	if (!user) {
		throw new Error('no negative user')
	}

	return user
}
 */

function declareTests() {
	it('Non existing email', async () => {
		const result = await PasswordReset.getToken('nonexisting@email.com')

		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
		expect(result).to.be.undefined
	})

	it('Valid email', async () => {
		const user = getUser()
		const result = await PasswordReset.getToken(user.email)

		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
		expect(result).to.exist
	})
}

describe('Password reset: getToken method', () => {
	const userRepo = new UserRepository()
	const passwordResetTokenRepo = new PasswordResetTokenRepository()
	const app = express()

	before(async () => {
		await seedUsers(userRepo)

		// init authentication library
		initAuth(passport, {
			userRepository: userRepo,
			refreshTokenRepository: RefreshTokenRepository.getInstance(),
			passwordResetTokenRepository: passwordResetTokenRepo
		})

		app.use(express.urlencoded({ extended: true }))
		app.use(express.json())
	})

	declareTests()
})

describe('Password reset: getToken method without password reset token repository', () => {
	const userRepo = new UserRepository()
	const app = express()

	before(async () => {
		await seedUsers(userRepo)

		// init authentication library
		initAuth(passport, {
			userRepository: userRepo,
			refreshTokenRepository: RefreshTokenRepository.getInstance()
		})

		app.use(express.urlencoded({ extended: true }))
		app.use(express.json())
	})

	declareTests()
})

// Tests are not passing just yet (mainly on the GH actions)
// NOTE: issue link: https://github.com/Slonik923/passport-jwt-wrapper/issues/6
/*
function declareTimingAttack() {
	it('Timing attack', async () => {
		// test variables
		let iterations = 10000
		const allowedAverageDifference = 0.2 // 20%

		const invalidTimes: number[] = []
		const validTimes: number[] = []

		// do not measure first x times, since they are slow due to the JIT compilation
		// eslint-disable-next-line no-plusplus
		for (let i = 0; i < iterations; i++) {
			const user = getUser()
			const nonExistingUser = getNonExistingUser()

			// eslint-disable-next-line no-await-in-loop
			await PasswordReset.getToken(user.email)
			// eslint-disable-next-line no-await-in-loop
			await PasswordReset.getToken(nonExistingUser.email)
		}

		const movingSize = 50
		const movingTime: number[] = Array(movingSize) // last 100 execution times

		let validTime = 0
		let invalidTime = 0

		const suggestedValid: number[] = []
		const suggestedInvalid: number[] = []

		// NOTE: need to test just a small number of iterations, since compiler is too smart
		// when running 1000 times, last iterations are 5x times faster than average ...
		iterations /= 10
		// eslint-disable-next-line no-plusplus
		for (let i = 0; i < iterations; i++) {
			const nonExistingUser = getNonExistingUser()

			let startTime = performance.now()
			// eslint-disable-next-line no-await-in-loop
			await PasswordReset.getToken(nonExistingUser.email)
			let endTime = performance.now()
			let time = endTime - startTime

			// increment invalidTime
			invalidTime += time

			// add to moving time
			if (movingTime.length === movingSize) {
				movingTime.shift()
			}
			movingTime.push(time)

			// calculate moving average from moving time
			let avg = movingTime.reduce((prev, next) => prev + next, 0) / movingTime.length
			if (time < avg * (1 - allowedAverageDifference)) {
				suggestedInvalid.push(time)
				// console.log(`[invalid] smaller than avg: ${time.toFixed(4)}ms (${avg.toFixed(4)})`)
			}
			if (time > avg * (1 + allowedAverageDifference)) {
				suggestedValid.push(time)
				// console.log(`[invalid] bigger than avg: ${time.toFixed(4)}ms (${avg.toFixed(4)})`)
			}

			const user = getUser()

			startTime = performance.now()
			// eslint-disable-next-line no-await-in-loop
			await PasswordReset.getToken(user.email)
			endTime = performance.now()
			time = endTime - startTime

			// increment validTime
			validTime += time

			// add to moving time
			if (movingTime.length === movingSize) {
				movingTime.shift()
			}
			movingTime.push(time)

			// calculate moving average from moving time
			avg = movingTime.reduce((prev, next) => prev + next, 0) / movingTime.length
			if (time < avg * (1 - allowedAverageDifference)) {
				suggestedInvalid.push(time)
				// console.log(`[valid] smaller than avg: ${time.toFixed(4)}ms (${avg.toFixed(4)})`)
			}
			if (time > avg * (1 + allowedAverageDifference)) {
				suggestedValid.push(time)
				// console.log(`[valid] bigger than avg: ${time.toFixed(4)}ms (${avg.toFixed(4)})`)
			}
		}

		const invalidAvg = invalidTime / iterations
		const validAvg = validTime / iterations
		const all = [...invalidTimes, ...validTimes]
		const avg = (invalidTime + validTime) / (iterations * 2)

		console.log(`average execution time: ${avg.toFixed(4)}ms`)
		console.log(`average invalid execution time: ${invalidAvg.toFixed(4)}ms`)
		console.log(`average valid execution time: ${validAvg.toFixed(4)}ms`)

		// difference between valid average and invalid average should be less than 10%
		expect(validAvg - invalidAvg).to.lt(avg * allowedAverageDifference)

		// guess which values could be valid and invalid
		all.forEach((val) => {
			if (val > avg * (1 + allowedAverageDifference)) {
				suggestedValid.push(val)
			} else if (val < avg * (1 - allowedAverageDifference)) {
				suggestedInvalid.push(val)
			}
		})

		// NOTE: times * 2, since each execution we tested both valid and invalid value

		console.log('suggested valid', suggestedValid.length, percentage(suggestedValid.length, iterations))
		console.log('suggested invalid', suggestedInvalid.length, percentage(suggestedInvalid.length, iterations))
		console.log(
			'suggested total',
			suggestedInvalid.length + suggestedValid.length,
			percentage(suggestedInvalid.length + suggestedValid.length, iterations * 2)
		)

		// no more 30% executions should be identifiable (their execution time differs from average by more, than allowed difference)
		expect(suggestedValid.length).to.lt(iterations * 2 * 0.3)
		expect(suggestedInvalid.length).to.lt(iterations * 2 * 0.3)
		expect(suggestedValid.length + suggestedInvalid.length).to.lt(iterations * 2 * 0.3)

		// filter wrongly suggested values
		const guessedValid = suggestedValid.filter((val) => validTimes.indexOf(val) > 0)
		const guessedInvalid = suggestedInvalid.filter((val) => invalidTimes.indexOf(val) > 0)

		console.log('guessed valid:', guessedValid.length, percentage(guessedValid.length, iterations))
		console.log('guessed invalid:', guessedInvalid.length, percentage(guessedInvalid.length, iterations))
		console.log('guessed total', guessedInvalid.length + guessedValid.length, percentage(guessedInvalid.length + guessedValid.length, iterations * 2))

		// no more than 10 % of the guessed executions should actually be true
		expect(guessedValid.length).to.lt(iterations * 2 * 0.1)
		expect(guessedInvalid.length).to.lt(iterations * 2 * 0.1)
		// no more than 15% of the combined guessed executions should actually be true
		expect(guessedValid.length + guessedInvalid.length).to.lt(iterations * 2 * 0.15)
	})
}

describe('Password reset: getToken time with passwordResetRepository', () => {
	const userRepo = new UserRepository()
	const passwordResetTokenRepo = new PasswordResetTokenRepository()
	const app = express()

	before(async () => {
		await seedUsers(userRepo)

		// init authentication library
		initAuth(passport, {
			userRepository: userRepo,
			refreshTokenRepository: TokenRepository.getInstance(),
			passwordResetTokenRepository: passwordResetTokenRepo
		})

		app.use(express.urlencoded({ extended: true }))
		app.use(express.json())
	})

	declareTimingAttack()
})

describe('Password reset: getToken time w/o passwordResetRepository', () => {
	const userRepo = new UserRepository()
	const app = express()

	before(async () => {
		await seedUsers(userRepo)

		// init authentication library
		initAuth(passport, {
			userRepository: userRepo,
			refreshTokenRepository: TokenRepository.getInstance()
		})

		app.use(express.urlencoded({ extended: true }))
		app.use(express.json())
	})

	declareTimingAttack()
})
*/
