## Keycloak API Library

## Exported Class

## RealmAPI

### Constructor
```javascript
let api = new RealmAPI({
    isHttps: false, // Whether the protocol is https or http
    hostname: "localhost", //domain on which keycloak is hosted
    port: "8080", // port
    clientId: "test", // client id of the client with permission to manage users and 2fa
    clientSecret: "secret", // secret of client
    realm: 'Test' // Realm of the client and users
});
```

### Methods expected

#### renewAccessToken()
Descriptions: Request/Renews access token of the client.
Return value:
```javascript
let resp = {
  access_token: '<access token string>', // Client access token
  expires_in: 300, // expiry time of access token
  refresh_expires_in: 0, // refresh token expiry, will be non zero if refresh token is enabled on keycloak end.
  token_type: 'Bearer',
  id_token: '<id token string>', // Client ID token (not used in this library)
  scope: 'openid email profile' // scope of the ID token
}
```

#### registerNewUser(userData, realmAccessToken)
Description: Registers new user in KeyCloak
Parameters:
```javascript
let userData = {
    "username": choosenUsername,
    "attributes": {
        "a": ["b"],
        "e": ['f'],
        "k": ["l"]
    },
    email: userEmail,
    firstName: userFirstName,
    lastName: userLastName,
    enabled: true // Pass true to enable user login 
};
let realmAccessToken = "<client access token>";
```

Return value: 
Return value is raw response object with empty value
```javascript
 let resp = {
  statusCode: 201,
  headers: {
    'referrer-policy': 'no-referrer',
    'x-frame-options': 'SAMEORIGIN',
    'strict-transport-security': 'max-age=31536000; includeSubDomains',
    'x-content-type-options': 'nosniff',
    'x-xss-protection': '1; mode=block',
    location: 'http://localhost:8080/admin/realms/Test/users/def932e1-97bf-4edc-962c-927d51a90150',
    connection: 'close',
    'content-length': '0'
  },
  body: ''
}
```

#### logInUser(userName, password, otp)
Description: Log in user and receive access token and optionally refresh token
Parameters: 
```javascript
let userName = choosenUsername;
let password = userPassword;
let otp = userOtp; // Optional, only need to pass if user has configured totp
```

From the return value, `refresh_token` need to be persisted in the user session, so that it can be used to periodically refresh user's session.

Return value: 
```javascript
let resp = {
    access_token: '<user access token>',
    expires_in: 300, // expiry time of user access token
    refresh_expires_in: 1800, // expiry time of refresh token
    refresh_token: '<refresh token>', // refresh token which can be used to renew user's access
    token_type: 'Bearer',
    id_token: '<id token>', // id token of the user (this is what given to vault to get the vault token
    'not-before-policy': 0,
    session_state: '094bf921-ff21-451b-89c7-e95eb403282f',
    scope: 'openid email profile'
}
```

#### renewUserAccessToken(refreshToken)
Description: Renew user access token using refresh token

```javascript
let refreshToken = userSessionRefreshToken; // Refresh token we got from earlier login or renewal of user's access token
```

From the return value, `refresh_token` need to overwrite earlier `refresh_token` (The one we used to make this call) in the user session because earlier refresh token becomes invalid after successful call.

Return value: 
```javascript
let resp = {
    access_token: '<user access token>',
    expires_in: 300, // expiry time of user access token
    refresh_expires_in: 1800, // expiry time of refresh token
    refresh_token: '<refresh token>', // refresh token which can be used to renew user's access
    token_type: 'Bearer',
    id_token: '<id token>', // id token of the user (this is what given to vault to get the vault token
    'not-before-policy': 0,
    session_state: '094bf921-ff21-451b-89c7-e95eb403282f',
    scope: 'openid email profile'
}
```


#### lookUpUsername(userName, realmAccessToken)
Description: Lookup user details from user name
Parameters:
```javascript
let userName = userName; // Username of the user
let realmAccessToken = "<client access token>";
```

Return value:
```javascript
let resp = {
    id: 'def932e1-97bf-4edc-962c-927d51a90150', // User id
    createdTimestamp: 1656049715879, // User creation time stamp
    username: '<username>',
    enabled: false, // whether or not user user is enabled
    totp: false, // Flag indicating whether totp is configured for this user
    emailVerified: false, // Flag indicating whether or not email is verified
    firstName: 'firstName',
    lastName: 'lastName',
    email: 'email@email.com',
    attributes: { a: [ 'b' ], k: [ 'l' ], e: [ 'f' ] }, // Arbitrary user attributes
    disableableCredentialTypes: [],
    requiredActions: [],
    notBefore: 0,
    access: {
        manageGroupMembership: true,
        view: true,
        mapRoles: true,
        impersonate: false,
        manage: true
    }
}
```

#### resetPassword(userId, newPassword, realmAccessToken)
Description: Reset user password
Parameters: 
```javascript
let userId = "<user id>"; // user id of user (this is different than username)
let newPassword = "<new password choosen by user>";
let realmAccessToken = "<client access token>";
```

Return value: 
```javascript
 let resp = {
  statusCode: 204,
  headers: {
    'referrer-policy': 'no-referrer',
    'x-frame-options': 'SAMEORIGIN',
    'strict-transport-security': 'max-age=31536000; includeSubDomains',
    'x-xss-protection': '1; mode=block',
    'x-content-type-options': 'nosniff',
    connection: 'close'
  },
  body: ''
}
```

#### getUser(userId, realmAccessToken)
Description: Gets the user details from keycloak
Parameters:
```javascript
let userId = "<user id>"; // user id of user (this is different than username)
let realmAccessToken = "<client access token>";
```

Return value: 
```javascript
let resp = {
    id: 'def932e1-97bf-4edc-962c-927d51a90150', // User id
    createdTimestamp: 1656049715879, // User creation time stamp
    username: '<username>',
    enabled: false, // whether or not user user is enabled
    totp: false, // Flag indicating whether totp is configured for this user
    emailVerified: false, // Flag indicating whether or not email is verified
    firstName: 'firstName',
    lastName: 'lastName',
    email: 'email@email.com',
    attributes: { a: [ 'b' ], k: [ 'l' ], e: [ 'f' ] }, // Arbitrary user attributes
    disableableCredentialTypes: [],
    requiredActions: [],
    notBefore: 0,
    access: {
        manageGroupMembership: true,
        view: true,
        mapRoles: true,
        impersonate: false,
        manage: true
    }
}
```

#### updateUser(userId, attributesToUpdate, realmAccessToken)
Description: Update user details in KeyCloak
Parameters:
```javascript
let userId = "<user id>"; // user id of user (this is different than username)
let attributesToUpdate = {
    "a": "y",
    "c": "d"
};
let realmAccessToken = "<client access token>";
```

Here, `attributesToUpdate` will merge with existing attribute of the user.

Return value:
```javascript
let resp = {
    id: 'def932e1-97bf-4edc-962c-927d51a90150', // User id
    createdTimestamp: 1656049715879, // User creation time stamp
    username: '<username>',
    enabled: false, // whether or not user user is enabled
    totp: false, // Flag indicating whether totp is configured for this user
    emailVerified: false, // Flag indicating whether or not email is verified
    firstName: 'firstName',
    lastName: 'lastName',
    email: 'email@email.com',
    attributes: { a: [ 'y' ], k: [ 'l' ], e: [ 'f' ], c: [ 'd' ] }, // Arbitrary user attributes
    disableableCredentialTypes: [],
    requiredActions: [],
    notBefore: 0,
    access: {
        manageGroupMembership: true,
        view: true,
        mapRoles: true,
        impersonate: false,
        manage: true
    }
}
```

#### generateTOTPDetails(userId, realmAccessToken)
Description: Generates Totp details for the user
Parameters:
```javascript
let userId = "<user id>"; // user id of user (this is different than username)
let realmAccessToken = "<client access token>";
```

Here, `encodedTotpSecret` refers to the secret key that can be displayed as text to the user which can be then copied and pasted into any Totp application.
`totpSecretQRCode` encodes the same secret in the QR code image. 

Return value:
```javascript
let resp = {
    encodedTotpSecret: 'N5TWK6RVNQ4U2M2XJBUG2ULKHFBFGVLJ', // Encoded Totp secret, which can be displayed to the user as text
    totpSecretQRCode: '<base 64 encoded image which contains totp qr code>'
};
```

#### submitTOTPDetails(userId, deviceName, encodedTotpSecret, totpInitialCode, overwrite, realmAccessToken)
Description: Submits totp details of the user, on success Totp will be enabled for the user with the device. 
Parameters: 
```javascript
let userId = "<user id>"; // user id of user (this is different than username)
let deviceName = "<device name>"; // a unique device name for the user (it is safe to use constant value in case you do not need different configuration per device)
let encodedTotpSecret = "N5TWK6RVNQ4U2M2XJBUG2ULKHFBFGVLJ"; // Encoded totp secret returned in the generateTOTPDetails call
let totpInitialCode = "123456"; // 6 digit initial code from the authenticator app after user has configured it
let overwrite = true; // a boolean indicating whether or not to overwrite totp for particular device. Take special care here so user cannot turn on/off totp at will.
let realmAccessToken = "<client access token>";
```

Return value: 
```javascript
let resp = {
    statusCode: 204,
    headers: {
        'referrer-policy': 'no-referrer',
        'x-frame-options': 'SAMEORIGIN',
        'strict-transport-security': 'max-age=31536000; includeSubDomains',
        'x-xss-protection': '1; mode=block',
        'x-content-type-options': 'nosniff',
        connection: 'close'
    },
    body: ''
};
```

#### verifyTotpCode(userId, totpCode, deviceName, realmAccessToken)
Description: Verifies totp code of user
Parameters: 
```javascript
let userId = "<user id>"; // user id of user (this is different than username)
let totpCode = "123456"; // 6 digit code from the authenticator app
let deviceName = "<device name>"; // a unique device name for the user (it is safe to use constant value in case you do not need different configuration per device)
let realmAccessToken = "<client access token>";
```

Return value: 
```javascript
let resp =  {
    statusCode: 204,
    headers: {
        'referrer-policy': 'no-referrer',
        'x-frame-options': 'SAMEORIGIN',
        'strict-transport-security': 'max-age=31536000; includeSubDomains',
        'x-xss-protection': '1; mode=block',
        'x-content-type-options': 'nosniff',
        connection: 'close'
    },
    body: ''
};
```


