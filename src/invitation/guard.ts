import { State } from '../State'
import { PASSPORT_NAME } from '../utils/enums'

export default () => {
	State.passport.authenticate(PASSPORT_NAME.JWT_INVITATION)
}
