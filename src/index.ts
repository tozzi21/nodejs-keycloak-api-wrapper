import http, {
  IncomingHttpHeaders,
  RequestOptions as HttpRequestOptions,
} from 'http';
import https, { RequestOptions as HttpsRequestOptions } from 'https';

function req(
  isHttps: boolean,
  options: HttpRequestOptions | HttpsRequestOptions | string | URL,
  obj = {}
) {
  return new Promise((resolve, reject) => {
    const protocolModule = isHttps ? https : http;
    const req = protocolModule.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk.toString()));
      res.on('error', reject);
      res.on('end', () => {
        const { statusCode = 0 } = res;
        if (statusCode >= 200 && statusCode <= 299) {
          resolve({ statusCode: statusCode, headers: res.headers, body });
        } else {
          reject({
            description:
              'Request failed. status: ' + res.statusCode + ', body: ' + body,
            statusCode: res.statusCode,
            body: body,
          });
        }
      });
    });
    if (obj !== undefined) {
      req.write(obj);
    }
    req.on('error', reject);
    req.end();
  });
}

type RealmConfigs = {
  hostname: string;
  isHttps: boolean;
  realm: string;
  port: string;
  clientId: string;
  clientSecret: string;
};

class RealmAPI {
  private hostname: string;
  private isHttps: boolean;
  private realm: string;
  private port: string;
  private clientId: string;
  private clientSecret: string;

  constructor(config: RealmConfigs) {
    this.isHttps = config.isHttps;
    this.hostname = config.hostname;
    this.port = config.port;
    this.clientId = config.clientId;
    this.clientSecret = config.clientSecret;
    this.realm = config.realm;
  }

  prepareRequestOption(method: string, path: string, accessToken = '') {
    const headers: IncomingHttpHeaders = {};
    const options = {
      method,
      hostname: this.hostname,
      port: this.port,
      path: '/realms/' + this.realm + '/' + path,
      headers,
    };

    if (accessToken !== '') {
      options.headers.Authorization = 'Bearer ' + accessToken;
    }

    return options;
  }

  renewAccessToken() {
    const template = this.prepareRequestOption(
      'POST',
      'protocol/openid-connect/token'
    );
    template.headers = {
      'Content-Type': 'application/x-www-form-urlencoded',
    };

    return req(
      this.isHttps,
      template,
      new URLSearchParams({
        client_id: this.clientId,
        grant_type: 'client_credentials',
        client_secret: this.clientSecret,
        scope: 'openid',
      }).toString()
    ).then(function (resp: any) {
      return JSON.parse(resp.body);
    });
  }

  registerNewUser(userData: any, realmAccessToken: string) {
    const template = this.prepareRequestOption('POST', 'users');
    template.path = '/admin' + template.path;
    template.headers = {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + realmAccessToken,
    };

    return req(this.isHttps, template, JSON.stringify(userData));
  }

  renewUserAccessToken(refreshToken: string) {
    const template = this.prepareRequestOption(
      'POST',
      'protocol/openid-connect/token'
    );
    template.headers = {
      'Content-Type': 'application/x-www-form-urlencoded',
    };

    return req(
      this.isHttps,
      template,
      new URLSearchParams({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }).toString()
    ).then(function (resp: any) {
      return JSON.parse(resp.body);
    });
  }

  logInUser(userName: string, password: string, otp = '') {
    const template = this.prepareRequestOption(
      'POST',
      'protocol/openid-connect/token'
    );
    template.headers = {
      'Content-Type': 'application/x-www-form-urlencoded',
    };

    return req(
      this.isHttps,
      template,
      new URLSearchParams({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        grant_type: 'password',
        scope: 'openid',
        username: userName,
        password: password,
        otp: otp,
      }).toString()
    ).then(function (resp: any) {
      return JSON.parse(resp.body);
    });
  }

  lookUpUsername(userName: string, realmAccessToken: string) {
    const template = this.prepareRequestOption(
      'GET',
      'users?username=' + userName + '&exact=true'
    );
    template.path = '/admin' + template.path;
    template.headers = {
      Authorization: 'Bearer ' + realmAccessToken,
    };

    return req(this.isHttps, template).then(function (resp: any) {
      const users = JSON.parse(resp.body);
      if (users.length === 0) {
        return Promise.reject({
          description: 'user not found',
          statusCode: 404,
        });
      }
      return users[0];
    });
  }

  resetPassword(userId: string, newPassword: string, realmAccessToken: string) {
    const template = this.prepareRequestOption(
      'PUT',
      'users/' + userId + '/reset-password'
    );
    template.path = '/admin' + template.path;
    template.headers = {
      Authorization: 'Bearer ' + realmAccessToken,
      'Content-Type': 'application/json',
    };

    const payload = {
      type: 'password',
      value: newPassword,
    };

    return req(this.isHttps, template, JSON.stringify(payload));
  }

  getUser(userId: string, realmAccessToken: string) {
    const template = this.prepareRequestOption('GET', 'users/' + userId);
    template.path = '/admin' + template.path;
    template.headers = {
      Authorization: 'Bearer ' + realmAccessToken,
    };

    return req(this.isHttps, template).then(function (resp: any) {
      return JSON.parse(resp.body);
    });
  }

  updateUser(
    userId: string,
    attributesToUpdate: any,
    realmAccessToken: string
  ) {
    const template = this.prepareRequestOption('PUT', 'users/' + userId);
    template.path = '/admin' + template.path;
    template.headers = {
      Authorization: 'Bearer ' + realmAccessToken,
      'Content-Type': 'application/json',
    };

    const isHttps = this.isHttps;

    this.getUser(userId, realmAccessToken)
      .then(function (userProfile) {
        return userProfile.attributes;
      })
      .then(function (existingAttributes) {
        return {
          ...existingAttributes,
          ...attributesToUpdate,
        };
      })
      .then(function (updatedAttributes) {
        return req(
          isHttps,
          template,
          JSON.stringify({
            attributes: updatedAttributes,
          })
        );
      });
  }

  generateTOTPDetails(userId: string, realmAccessToken: string) {
    const template = this.prepareRequestOption(
      'GET',
      'two_factor_auth/manage-2fa/' + userId + '/generate-2fa'
    );
    template.headers = {
      Authorization: 'Bearer ' + realmAccessToken,
    };
    return req(this.isHttps, template).then(function (resp: any) {
      return JSON.parse(resp.body);
    });
  }

  submitTOTPDetails(
    userId: string,
    deviceName: string,
    encodedTotpSecret: string,
    totpInitialCode: string,
    overwrite: boolean,
    realmAccessToken: string
  ) {
    const template = this.prepareRequestOption(
      'POST',
      'two_factor_auth/manage-2fa/' + userId + '/submit-2fa'
    );
    template.headers = {
      Authorization: 'Bearer ' + realmAccessToken,
      'Content-Type': 'application/json',
    };
    return req(
      this.isHttps,
      template,
      JSON.stringify({
        deviceName: deviceName,
        encodedTotpSecret: encodedTotpSecret,
        totpInitialCode: totpInitialCode,
        overwrite: overwrite,
      })
    );
  }

  verifyTotpCode(
    userId: string,
    totpCode: string,
    deviceName: string,
    realmAccessToken: string
  ) {
    const template = this.prepareRequestOption(
      'POST',
      'two_factor_auth/manage-2fa/' + userId + '/validate-2fa-code'
    );
    template.headers = {
      Authorization: 'Bearer ' + realmAccessToken,
      'Content-Type': 'application/json',
    };
    return req(
      this.isHttps,
      template,
      JSON.stringify({
        deviceName: deviceName,
        totpCode: totpCode,
      })
    );
  }
}

export default RealmAPI;
