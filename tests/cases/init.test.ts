import passport from 'passport'

import { initAuth } from '../../src'
import { UserRepository } from '../mocks/repositories/userRepository'
import { TokenRepository } from '../mocks/repositories/tokenRepository'

describe('Initialization', () => {
	it('no passport', () => {
		initAuth(passport, {
			userRepository: new UserRepository(),
			refreshTokenRepository: TokenRepository.getInstance()
		})
	})
})
