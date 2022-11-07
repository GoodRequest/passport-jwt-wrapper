import { State } from '../State'
import { PASSPORT_NAME } from '../utils/enums'

export default () => {
	if (!State.invitationTokenRepository) {
		throw new Error("'invitationTokenRepository' not provided.")
	}

	return State.passport.authenticate(PASSPORT_NAME.JWT_INVITATION)
}
