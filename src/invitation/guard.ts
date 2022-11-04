import { State } from '../State'
import { PASSPORT_NAME } from '../utils/enums'

export function guard() {
	return State.passport.authenticate(PASSPORT_NAME.JWT_INVITATION)
}
