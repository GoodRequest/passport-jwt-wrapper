import { PassportStatic } from 'passport'
import { ID, IUserRepository, IUserTokenRepository } from './types/interfaces'

export class State {
	static passport: PassportStatic
	static userRepository: IUserRepository<ID>
	static userTokenRepository: IUserTokenRepository<ID, ID>
}
