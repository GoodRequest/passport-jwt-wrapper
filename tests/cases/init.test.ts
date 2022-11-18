import passport from 'passport'

import { initAuth } from '../../src'
import { UserRepository } from '../mocks/userRepository'
import { TokenRepository } from '../mocks/tokenRepository'

describe('Initialization', () => {
	it('no passport', () => {
		initAuth(passport, {
			userRepository: new UserRepository(),
			refreshTokenRepository: TokenRepository.getInstance()
		})
	})
})
