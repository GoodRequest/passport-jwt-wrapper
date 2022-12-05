import { State } from '../State'
import { PASSPORT_NAME } from '../utils/enums'

/**
 * Middleware for securing registration endpoint.
 * Usage: `router.post('/confirm', Invitation.guard(), postLogin.endpoint)`
 * Needs to be a function, since passport is provided after import
 */
export default () => {
	return State.getInstance().passport.authenticate(PASSPORT_NAME.JWT_INVITATION, { session: false })
}
