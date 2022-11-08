import { State } from '../State'
import { PASSPORT_NAME } from '../utils/enums'

/**
 * Need to be a function, since passport is provided after import
 */
export default () => {
	return State.passport.authenticate(PASSPORT_NAME.JWT_API, { session: false })
}
