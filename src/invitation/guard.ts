import { State } from '../State'
import { PASSPORT_NAME } from '../utils/enums'

export default () => {
	State.getInstance().passport.authenticate(PASSPORT_NAME.JWT_INVITATION)
}
