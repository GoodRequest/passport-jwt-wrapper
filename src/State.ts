import { PassportStatic } from 'passport'
import { ID, IUserRepository, IRefreshTokenRepository, IInvitationTokenRepository, IPasswordResetTokenRepository } from './types/interfaces'

// eslint-disable-next-line import/prefer-default-export
export class State {
	static passport: PassportStatic
	static userRepository: IUserRepository<ID>
	static refreshTokenRepository: IRefreshTokenRepository<ID, ID>
	static invitationTokenRepository?: IInvitationTokenRepository<ID>
	static passwordResetTokenRepository?: IPasswordResetTokenRepository<ID>
}
