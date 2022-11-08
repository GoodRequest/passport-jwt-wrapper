# JWT Authentication Library
Authentication Library developed and used by the GoodRequest s.r.o.
It is based on the [express](https://expressjs.com/) framework for Node.js runtime using JWTs.
This library should take of the user authentication, it is divided into [modules](#modules):
- Login
- Securing endpoints
- Logout
- Logout from everywhere
- Refresh token rotation
- Reset password
- User invitation

## Installation
`npm i --save @goodrequest/auth`

## Initialization:
```typescript
import { initAuth } from './index'
import * as passport from 'passport'

initAuth(passport, {
		userRepository,
		refreshTokenRepository,
		invitationTokenRepository?,
		passwordResetTokenRepository?
	}
)
```

`invitationTokenRepository` is used for saving and checking validity of invitation tokens.
This means, that invitations can be cancelled.

`passwordResetTokenRepository` is similarly used to save and check the validity of password reset tokens.
This can be used to cancel password reset.

---

## Usage
### Login / Logout / Refresh Tokens / Reset Password
```typescript
import { Login, RefreshToken, PasswordReset, Logout, ApiAuth } from '@goodrequest/jwt-auth'

import * as postLogin from './post.login'
import * as postResetPasswordRequest from './post.resetPasswordRequest'
import schemaMiddleware from '../../../middlewares/schemaMiddleware'
const router = Router()

router.post('/login',
	schemaMiddleware(postLogin.requestSchema),
	Login.guard,
	postLogin.workflow)

router.post('/logout',
	ApiAuth.guard(),
	schemaMiddleware(Logout.requestSchema),
	Logout.endpoint)

router.post('/refresh-token',
	schemaMiddleware(RefreshToken.requestSchema),
	RefreshToken.endpoint)

router.post('/reset-password-request',
	schemaMiddleware(postResetPasswordRequest.requestSchema()),
	postResetPasswordRequest.workflow)

router.post('/reset-password',
	schemaMiddleware(PasswordReset.requestSchema),
	PasswordReset.guard,
	PasswordReset.endpoint)
```

#### Methods that needs to be implemented separately
- `postlogin.workflow` (and `postLogin.requestSchema`): user creation is not in the scope of this library
- `postResetPasswordRequest.workflow` (and `postResetPasswordRequest.requestSchema`): Reset password email should be sent from this endpoint


### Authentication Guard
[`AuthGuard`](src/apiAuth/guard.ts) is middleware which checks if the request includes valid `access_token` based on jwt extractor specified in the config.
It needs to be used as function call: `AuthGuard()`, since it uses passport which is provided after this guard is imported to your project.

### Config
[Config interface](src/types/config.ts) (`IPassportConfig`) is also exported from this library and needs to be present in your project config.
Example:
```
passport: {
	local: {
		usernameField: 'email',
		passwordField: 'password',
		session: false,
	},
	jwt: {
		secretOrKey: process.env.JWT_SECRET,
		api: {
			exp: '15m',
			jwtFromRequest: ExtractJwt.fromExtractors(
				[ExtractJwt.fromAuthHeaderAsBearerToken(), ExtractJwt.fromUrlQueryParameter('t')]),
			refresh: {
				exp: '4h',
			}
		},
		passwordReset: {
			exp: '4h',
			jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
		},
		invitation: {
			jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
			exp: '30d',
		}
	}
},
```

#### ENV variables
Library read from config using [config package](https://www.npmjs.com/package/config).
Config needs to have properties specified in [IPassportConfig interface](./src/types/config.ts).

| ENV variable | Development | Production | Note																					                  |
|--------------|-------------|------------|--------------------------------------------|
| JWT_SECRET   | required    | required   | development/test/production															 |


## Modules
This library is divided into modules:
#### Login
Used for logging in users - exchanging user credential for access and refresh tokens.
Exports can be found [here](src/login/index.ts).
#### RefreshToken
Refresh tokens have longer validity tha access tokens and can be exchanged for new access and refresh token.
Refresh tokens are used just once ([refresh token rotation](https://auth0.com/docs/secure/tokens/refresh-tokens/refresh-token-rotation)).
Exports can be found [here](src/refreshToken/index.ts).
#### ApiAuth
Module for securing endpoint. Guard is used to verify that request contains valid access token.
Exports can be found [here](src/apiAuth/index.ts).
#### Logout
Endpoint for logging users out. This invalidates whole token family - one user session.
Exports can be found [here](src/logout/index.ts).
#### LogoutEverywhere
Endpoint for logging user out from every device (every session).
Exports can be found [here](src/logoutEverywhere/index.ts).
#### Invitation
Module used for managing invitation tokens.
User invitation is typically done by sending emails, which is not part of this library, so the endpoint needs to be implemented separately.
Exports can be found [here](src/invitation/index.ts).
#### PasswordReset
Module for resetting user passwords. Similarly to invitation, this is done by sending emails, so the endpoint needs to be implemented separately.
Exports can be found [here](src/passwordReset/index.ts).

## How does it work (Security perspective)
Each token types has different payload, expiration and [audience](src/utils/enums.ts).
#### Token types
- Access Token:
	- Short expiration time (15m)
    - Stateless - not stored on the server
    - Cannot be invalidated
    - No need to access storage for every secure call to the API
    - payload: `{uid, rid, fid} // userID, refreshTokenID, familyID`
- Refresh Token
	- Longer expiration time (hours)
    - Stored on the server
    - Can be invalidated
    - Used just once ([refresh token rotation](https://auth0.com/docs/secure/tokens/refresh-tokens/refresh-token-rotation))
	- payload: `{uid, fid, jti} // userID, familyID, JWTID`
- Invitation Token
	- Longer expiration time (hours)
    - Can be stored on the server (if the `invitationTokenRepository` is provided to the `init` function)
    - If stored can be invalidated
    - payload: `{ uid } // userID`
- Password Reset Token
	- Longer expiration time (hours)
	- Can be stored on the server (if the `passwordResetTokenRepository` is provided to the `init` function)
	- If stored can be invalidated
	- payload: `{ uid } // userID`

#### Token family
Access and refresh tokens includes `familyID`.
This is used to identify login flow.
New `familyID` is given every time, user logs in (enter credentials), which means it identifies user session (from login to logout / expiration).
This ID is also passed to every subsequent refresh token.

It is needed for implementing refresh token rotation, but it is also useful for differentiating sessions.
When user (attacker) tries to use the same refresh token (RT1) second time, each refresh token issued based on RT1 needs to be invalidated.
This means every refresh token from the same token family.

## Philosophy
This library should be used in all GR products, so it needs to be highly **customizable**.
Customization is achieved by a combination of technics.

#### Repositories
Library needs access to users and user tokens, but the these are stored different for every project, so to archive compatibility repository pattern is used.
When the library is initialized it needs repositories for creating / getting / invalidating user tokens (JWTs) and for getting users.

#### Helper functions
Another way to achieve for greater adaptability is to export helper functions which are used internally on each level.
These helper functions can be used to create custom middlewares or endpoints.

#### Architecture
Each of the modules exports its parts:
- `getToken[s]`: Helper function for getting tokens (access, refresh, invitation, password reset).
- `guard`: [Passport.js](https://www.passportjs.org/) authenticate function. Used as middleware to secure endpoints.
- `strategy`: [Passport.js](https://www.passportjs.org/) strategy.
- `strategyVerifyFunction`: Helper function used in the strategy.
- `workflow`: Main function for every endpoint. Can be used to write custom endpoint / middleware.
- `endpoint`: Whole express endpoint.
- `requestSchema`: [Joi](https://joi.dev/) request schema. Should be for schema validation for given endpoint.
- `resposneSchema`: [Joi](https://joi.dev/) response schema. Can be used for documentation.

## API
### Endpoints
Express endpoints (`(req, res, next)`). They return object, typically JWTs.
- [`Logout.endoint`](./src/logout/endpoint.ts): Returns just the message. Internally invalidates refresh token family.
- [`LogoutEverywhere.endpoint`](src/logoutEverywhere/endpoint.ts): Returns just the message. Internally invalidates all users refresh tokens.
- [`PasswordReset.endpoint`](src/passwordReset/endpoint.ts):
- [`RefreshToken.endpoint`](src/refreshToken/endpoint.ts):

### Worfklow
Internal function used by endpoint.
- [`Logout.workflow`](./src/logout/workflow.ts):
- [`LogoutEverywhere.workflow`](src/logoutEverywhere/workflow.ts):
- [`PasswordReset.workflow`](src/passwordReset/workflow.ts):
- [`RefreshToken.workflow`](src/refreshToken/workflow.ts):

### Guards
[express](https://expressjs.com/) middlewares (calls `next` function):
- [`Login.guard`](src/login/guard.ts): helper function calling `passport.authenticate`. Should be used before used specified login endpoint
- [`ResetPassword.guard`](src/passwordReset/guard.ts): just a helper middleware for the
- [`ApiAuth.guard`](src/apiAuth/guard.ts): see [Authentication Guard](#Authentication-Guard)

### Functions
Function used in project specific middlewares, or endpoints.
- [`Login.getTokens(userID: string | number, familyID?: string | number)`](src/login/getTokens.ts): Used in the login endpoint and in refresh token endpoint.
- [`PasswordReset.getToken(email: string)`](src/passwordReset/getToken.ts): Used in the reset password endpoint. Token created by this function should be sent to the user (probably by email)
- [`Invitation.getToken(userID: string | number)`](src/invitation/getToken.ts): Should be user in the user invitation endpoint. Returns token with given userID.

### Schemas
Every module which exports endpoint also exports [Joi](https://joi.dev/)  `requestSchema` and `responseSchema`

### Other
This library also exports helper functions, enums and types. All exports can be found in the [index.ts](src/index.ts).


## TODO:
- `repository.getByID`: id is `string` | `number`
