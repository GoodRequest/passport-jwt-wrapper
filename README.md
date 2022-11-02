# Authentication Library
Developed and used by the GoodRequest s.r.o

## Installation 
`npm i --save @goodrequest/auth`

## Usage
### 1. Initialization:
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
### 2. Usage

```typescript
import { LoginMiddleware, refreshTokenEndpoint, resetPasswordEndpoint, resetPasswordMiddleware } from '@goodrequest/jwt-auth'

router.post('/login', LoginMiddleware, postLogin.workflow)
router.post('/refresh-token', refreshTokenEndpoint)
router.post('/reset-password-request', postResetPasswordRequest.workflow)
router.post('/reset-password', resetPasswordMiddleware, resetPasswordEndpoint)
```

### ENV variables
Library read from config using [config package](https://www.npmjs.com/package/config).
Config needs to have properties specified in [IPassportConfig interface](./src/types/config.ts).

| ENV variable | Development | Production | Note																					                  |
|--------------|-------------|------------|--------------------------------------------|
| JWT_SECRET   | required    | required   | development/test/production															 |


### Endpoints
Express endpoints (`(req, res, next)`). Typically creates entities (e.g. users)
- `refreshTokenEndpoint`:
- `resetPasswordEndpoint`:

### Middlewares
Similar to endpoints, but calls `next()` function.


## TODO:
- `repository.getByID`: id is `string` | `number`
