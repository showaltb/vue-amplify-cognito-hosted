# vue-amplify-cognito-hosted

This is a simple reference architecture to illustrate using [AWS
Amplify](https://docs.amplify.aws/lib/q/platform/js), Amazon Cognito, and Amazon
API Gateway with a Vue.js single page application to accomplish the following
goals:

* Sign in with a Cognito User Pool account with the Cognito Hosted UI.
* Retreive an access token with a custom scope and the user's cognito groups.
* Use an API Gateway using a Cognito user pool authorizer to validate the access
  key scope.
* Extract the user's cognito groups from the access token for further
  authorization in the API. This will allow different classes of users to have
  access to different resources.

The project uses a hand-built CloudFormation stack to provision a Cognito User
Pool, API, and Lambda handler to work with the Vue.js project running locally.

## Installation

Before installing, make sure you have the [AWS CLI](https://aws.amazon.com/cli/)
installed and configured.

Then create a `.env` file in the project root with the following contents:

    AWS_PROFILE=default
    AWS_REGION=us-east-1
    STACK_NAME=vue-amplify-cognito-hosted

Use a configured AWS CLI profile name and region of your choice. You can also
change the stack name if you wish.

Now, provision the AWS resources with

    npm run deploy

This will deploy the CloudFormation stack using the values from `.env` and will
create a `.env.local` file with settings needed by the Vue.js app.

## Starting the Application

First, install dependencies with

    npm install

Then start the Vue.js application with

    npm run serve

Open the application in your browser at http://localhost:8080/

## Creating a User Pool User

On the application page, under the "Amplify Auth Configuration" section, you'll
see the Cognito User Pool Id. Open the [Cognito
Console](https://console.aws.amazon.com/cognito/users/) and select your user
pool.

Click "Users and Groups" on the left and then "Create User".

Enter a username, temporary password, and email address. Leave the phone number
blank and mark the email as validated. (This will allow the user to recover a
lost password.) Don't send an invitation to the user. Click "Create user".

If you wish, you can add the user to the "admins" group by selecting the user
and clicking "Add to group".

## Testing the Application

On the application page, click "Sign In". This will redirect to the Cognito
Hosted UI. Sign in with the username and temporary password created above. You'll
be prompted to change the password.

Then you will be redirected back to the application and it will show that you
are signed in and will have details about the OAuth tokens returned from
Cognito.

The `GET /user`, `POST /user`, `GET /admin`, and `POST /admin` buttons will make
Ajax calls to the API. The full response object for each will be shown below the
buttons. Successful requests will have a green background and failed requests
will have a red background.

The requests have the following requirements:

* `GET /user` requires the access token to have the `test-api/read` scope.
* `POST /user` requires the acesss token to have the `test-api/write` scope.
* `GET /admin` requires the access token to have the `test-api/read` scope and
  that the user is a member of the `admins` group.
* `POST /admin` requires the access token to have the `test-api/write` scope and
  that the user is a member of the `admins` group.

You can test the group membership requirement by removing the `admins` group from
your user and trying the `GET /admin` request. You should see an error.

You can test the scope requirement by changing the requested scopes in the
Amplify Auth configuration in `main.js` (restart the application after chaning
this file).

## Deleting the AWS Resources

You can delete the AWS resources with

    npm run delete-stack

## How All This Works

### AWS Resources

The AWS resources are provisioned using CloudFormation. Everything is defined in
`aws/template.yml`. The following resources are provisioned:

#### UserPool

This is a Cognito User pool. Only administrators are allowed to create accounts
(no self sign-up), which would be appropriate for an "in house" private
application. Users can sign in with either username or email, and can use their
email to recover a lost password.

#### UserPoolDomain

This defines the domain name for the Hosted UI.

> Note: The value here is `vue-amplify-id-<ACCOUNT ID>`. If you deploy this
> template more than once in the same AWS account, you'll need to adjust this.

#### UserPoolResourceServer

A resource server acts as a namespace for custom OAuth scopes. Here we define a
resource server named "test-api" and two custom scopes, "read" (`test-api/read`)
and "write" (`test-api/write`). The scopes are assigned to a client application below.

#### UserPoolClient

This defines an OAuth client application. It outputs a client id that is used in
the Vue.js application during the authentication flow.

We allow only the `code` OAuth flow, which is more secure (Amplify.js
automatically uses PKCE with this flow).

We defined the allowed OAuth scopes that can be requested. `openid` is required
in order to get an ID token, and `profile` can be used to retrieve user profile
information using the access token (e.g. from the API). We also allow the custom
scopes created above. These are used in our API authorizer below.

We define the allowed callback urls to point to the local Vue.js application. If
you were deploying the client application elsewhere, this would need to be
adjusted.

#### AdminsGroup

This creates a User Pool Group called "admins" that users can be assigned to.

#### TestApi

This creates a REST API that the client can make requests to with the access
token returned from Cognito.

We define a Cognito User Pool authorizer that will validate the access token
against our user pool and add token details to the request event.

We define CORS configuration, including adding the proper CORS header to any
failed response from the Authenticator.

The resources, methods, and detailed authorization parameters are defined in the
Lambda function below.

#### LambdaExecutionRole

This is a simple IAM role that gives the lambda permission to create CloudWatch
logs. If your lambda needed access to other resources, you would need to adjust
this role to give the appropriate permissions.

#### Function

This defines a very simple lambda function. The code is inline. It does the following:

* If the request path is "/admin" and the user is not a member of the "admins"
  group, return a 403 (Forbidden) response.
* Otherwise, return a 200 (OK) response with the request event data.
* If an error occurs, return a 500 (Server Error) response with the error
  message.

The function is then invoked by the following API requests:

* `GET /user` and `GET /admin`, which require the `test-api/read` scope
* `POST /user` and `POST /admin`, which require the `test-api/write` scope

When these requests are made, API Gateway will invoke the authorizer. The
authorizer will check that the access token (from the `Authorization` header) is
valid and contains the required scope(s). If not, a gateway response will be
returned and the Lambda function will not be invoked. If the token is valid, its
payload will be added to the request event and can be used by the Lambda as
desired.

OAuth scope checking is performed by the authorizer. Group membership checking
is performed by the Lambda function. The user's groups are added to the request
event by the authorizer.

## Vue.js Client Application

The `npm run deploy` task that provisions the AWS resources also writes a `.env.local`
file to the project root. This file contains environment variables to define the
following values from the CloudFormation stack:

* AWS region
* User Pool Id
* User Pool Client Id
* Hosted UI Domain
* Test API Endpoint

### src/main.js

This starts up the Vue application. It reads the environment variables loaded
from `.env.local`. It uses these to configure the Amplify `Auth` and `API`
packages.

In the API configuraiton, it defines a callback to automatically add the user's
access token to all requests.

It then initializes the app by calling the `cognito/init` Vuex action (see
below) to read the current user information (if any) from local storage. It then
starts the Vue application.

### src/store/cognito/index.js

This is a very simple Vuex module to track the currently signed in user (if any) and
associated session/tokens.

It defines a `user` state that is `null` if no user is signed in, or a `CognitoUser`
object if a user is signed in.

It defines three actions:

* `init` - This initializes the state at app startup, by loading the
  user/session (if any) from Local Storage. It also sets up event listeners to
  update the state based on events fired by Amplify during the authentication
  flows (sign in, sign out).
* `fetchSession` - This retrieves the session information from local storage and
  automatically refreshes the ID and access tokens if they are expired.
* `fetchJwtToken` - This retreives the access token (refreshing if expired) as a
  JWT token suitable for passing to the API.

### src/components/Home.vue

This is the main application page. It uses the `user` and `sesion` state from
the Vuex module to determine if a user is signed in and to get the token
details.

It handles sign in and sign out by calling the Amplify `Auth.federatedSignIn()`
and `Auth.signOut()` methods. The event handlers defined in the `cognito/init`
action will take care of updating the state as the user signs in and out.

It handles API calls using the Amplify `API.get` and `API.post` methods. The
configuration in `src/main.js` automatically adds the access token to the
request.
