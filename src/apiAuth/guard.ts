import { State } from '../State'
import { PASSPORT_NAME } from '../utils/enums'

/**
 * Use as middleware before authenticated endpoint
 * Needs to be a function, since passport is provided after import
 * Usage: `router.use('/endpoint', ApiAuth.guard(), ..., endpoint)`
 */
export default () => {
	return State.getInstance().passport.authenticate(PASSPORT_NAME.JWT_API, { session: false })
}
