# Authentication Library
Developed and used by the GoodRequest s.r.o

## Installation 
`npm i --save @goodrequest/auth`

## Initialization:
```typescript
import { initAuth } from './index'
import * as passport from 'passport'

initAuth(passport, userRepository, tokenRepository)
```
where 
- userRepository:
	```typescript
	export interface IUserRepository<T extends ID> {
		getUserById: (id: T) => Promise<IUser | null>
		getUserByEmail: (email: string) => Promise<IUser | null>
	}
	```
 
- tokenRepository:
	```typescript
	export interface IUserTokenRepository<T extends number | string> {
		// refresh tokens
		createRefreshTokenID: () => Promise<T>
		saveRefreshToken: (id: T, familyID: T, token: string) => Promise<any>
		isRefreshTokenValid: (id: T, familyID: T) => Promise<boolean>
		getRefreshToken: (id: T, familyID: T) => Promise<string | undefined>
		invalidateRefreshToken: (id: T, familyID: T) => Promise<void>
		invalidateRefreshTokenFamily: (familyID: T) => Promise<void>
		// access tokens
		saveAccessToken?: (id: T, familyID: T, token: string) => Promise<any>
		invalidateAccessToken?:  (id: T, familyID: T) => Promise<void>
		invalidateAccessTokenFamily?: (familyID: T) => Promise<void>
	}
	```
 ---
## Login Usage
### Login / refresh tokens / reset password
```typescript
import { LoginMiddleware, refreshTokenEndpoint, resetPasswordEndpoint, resetPasswordMiddleware } from '@goodrequest/jwt-auth'

router.post('/login', LoginMiddleware, postLogin.workflow)
router.post('/refresh-token', refreshTokenEndpoint)
router.post('/reset-password-request', postResetPasswordRequest.workflow)
router.post('/reset-password', resetPasswordMiddleware, resetPasswordEndpoint)
```
#### User specified methods
- `postlogin.workflow`: user creation is not in the scope of this library
- `postResetPassowrd.workflow`: Reset password email should be sent from this endpoint
### Authentication Guard
[`AuthGuard`](./src/middlewares/AuthGuard.ts) is middleware which checks if the request includes valid `access_token` based on jwt extractor specified in the config.

### ENV variables
Library read from config using [config package](https://www.npmjs.com/package/config).
Config needs to have properties specified in [IPassportConfig interface](./src/types/config.ts).

| ENV variable | Development | Production | Note																					                  |
|--------------|-------------|------------|--------------------------------------------|
| JWT_SECRET   | required    | required   | development/test/production															 |


## API
### Endpoints
Express endpoints (`(req, res, next)`). Typically creates entities (e.g. users)
- `refreshTokenEndpoint`:
- `resetPasswordEndpoint`: 

### Middlewares
Similar to endpoints, but calls `next()` function.
- [`loginMiddleware`](./src/middlewares/loginMiddleware.ts): helper function calling `passport.authenticate`. Should be used before used specified login endpoint
- [`resetPasswordMiddleware`](./src/middlewares/resetPasswordMiddleware.ts): just a helper middleware for the 
- [`AuthGuard`](./src/middlewares/AuthGuard.ts): see [Authentication Guard](#Authentication-Guard)

### Functions
Function used in project specific middlewares, or endpoints.
- [`getLoginTokens(userID: ID, familyID?: ID)`](src/functions/getLoginTokens.ts): used in the login endpoint and in refresh token endpoint
- [`getPasswordResetToken(email: string)`](src/functions/getPasswordResetToken.ts): used in the reset password endpoint. Token created by this function should be send to the user (probably by email)

## TODO:
- `repository.getByID`: id is `string` | `number`
