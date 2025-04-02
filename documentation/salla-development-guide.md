# Welcome 👋

Welcome to Salla Partners' documentation. Here, you will discover a comprehensive collection of guidelines for developing Apps and Themes for Salla Online Stores.
This resource is designed to support both developers and business owners who aim to integrate with the Salla Platform.
Whether you're starting a new project or improving your current e-commerce solution, this collection provides essential insights and instructions. Designed to simplify your integration with Salla, these guidelines cover everything from technical requirements to seamless execution, ensuring a smoother development process.
Salla empowers its e-commerce platform for developers while allowing merchants to establish, operate, and manage their online stores with no technical hassle. Moreover, it grants them the ability to enable (or disable) the connection with any logistics company and/or payment gateway with a click of a button.
Note
Visit the Salla Partners Blog to check out the latest updates on the Salla developers community.
📝 Salla Documentations
Documentation	Description
Salla Merchant API	Salla Merchant APIs are a suite of RESTful endpoints purpose-built for secure, fast, and easy access to Merchant data. Developers can build their Apps by consuming Salla's standard APIs, scale their Apps to encompass a mass base of over 60,000 online stores, and publish their innovations to one central hub, the Salla App Store.
Read about Salla APIs Docs here

Apps API	The Apps API enables the use of functionalities within the Salla Partners Portal, such as App Settings and Subscriptions, to customize and enhance your applications usage for Salla Merchants. Additionally, discover the App Events that will be sent from the Salla Partners Portal concerning any activities related to your app.
Salla Shipping and Fulfillment API	Salla Shipping and Fulfillment API enable you to manage and track Salla Store's shipments and orders seamlessly. With this API, you can integrate with a Salla Store's shipping process to make shipping as well as order fulfillment more efficient and streamlined.
Salla CLI	Salla CLI is a tool designed for developers to create Salla Apps and Themes. Once the App or Theme has been developed, it can go through the publication process to be featured in the Salla App Store. This process typically involves testing, quality assurance, and verification of the App or Theme to ensure that it meets the necessary standards and guidelines. Once the App or Theme has been approved, it can be published in the Salla App Store and made available for installation in any of the Salla Merchant Stores. This gives the flexibility for merchants and other users who use the Salla Platform to be able to easily install and customize their store with a variety of apps or themes that can match their needs.
Twilight Engine	Twilight enables developers to create a memorable experience for the Salla Store's look and feel for the benefit of merchants and their customers. Developers can create themes for merchant stores to suit the uniqueness of each store on the Salla Platform. With custom themes, developers will have a much easier time adapting the merchant's store to the store's growing needs as time goes on. This documentation covers several topics, from creating a complete theme for Salla's Store with easy steps to changing multiple items in the store with your own style.
Twilight SDK	Twilight comes with a JavaScript SDK for the Salla storefront APIs. This is to provide the developers with helper methods, or REST API endpoints, that allow communication between the frontend and backend.
Twilight Web Components	Twilight comes with a ready-designed and styled set of web components for Salla stores. For example, ready components to display the login form, product availability section, search bar, localization menu, and many more
⚒️ Resources
Utilize the following materials to familiarize yourself with the Merchant APIs: a compilation of curated blogs, a list of frequently asked questions, and a community of developers that is always willing to offer assistance:
Salla Partners Resources
Salla Developer Blog
Frequently Asked Questions
Global Developer Community
💡 Contact Support
Contact support either at support@salla.dev or the Global Developers Community on Telegram to get help from our team of in-house experts.
🔗 Service Status
Check current Salla service status from Salla Status.

---

# Get Started

Salla Merchant APIs are a suite of RESTful endpoints, purpose-built for secure, fast, and easy access to Merchant data. Developers can build their Apps by consuming Salla’s standard APIs, scale their Apps to encompass a mass base of over 60,000 online stores, and publish their innovations to one central hub, the Salla App Store. Learn more about creating your first Salla App by following this article.
Base URI
All API URLs referenced in the documentation have the following base: https://api.salla.dev/admin/v2
List of Salla's Merchant APIs
These endpoints include a suite range of APIs for:
Order Management
Abandoned Carts
Track and manage abandoned shopping carts.
Order Assignments
Assign orders to specific employees or branches.
Order Histories
Track and manage the history of orders.
Order Invoices
Generate and manage order invoices.
Order Items
Manage individual items within an order.
Order Reservations
Handle order reservations and related actions.
Order Statuses
Manage different statuses for orders.
Order Tags
Assign and manage tags for orders.
Orders
Handle order management and details.
Exports
Export data related to products, orders, and other entities.
Product Management
Customer Management
Marketing and Sales
Store Configuration
Shipment Integration
Financial Management
Localization
✅ Requirements
In order to make developers' interactions with Salla APIs easier, and for a more seamless, professional experience, the bare minimum requirements are as follows:

Basic understanding of programming, API consumption, webhooks calling, and JSON schema.
Authentication & Authorization using the OAuth2.0 security protocol.
Verified Salla Partners account.
💻 APIs Powered By OAuth2.0 With Salla Partners
Salla Partners, backed by the OAuth2.0 security protocol, allows for scoped access to the Merchants' store. Developers use their account on the Partners Portal to mark the scopes they want to obtain, which is based on their own App’s logic. Those marked app scopes will appear for the Merchant when requesting access, and if access is authorized, the developer can use the access token for a period of 14 days with the ability to refresh it using the refresh token within a 1-month timeline. Read more about the OAuth implementation via these articles here and here.
🔗 Webhooks
Webhooks are an automated way for a server to talk to another server, allowing application developers to perform actions based on certain events. They provide an efficient and secure means of receiving near-real-time notifications from other services like payment processors, shipping providers and more. Salla provides two sets of events:
App Events: Automatic events sent to your webhook server that are related to your Salla App, which include Store Authorization, App Installed, App Subscription Started, App Settings Updated, and more!
Store Events: Events you can subscribe to from the Partners Portal where only the events you want will be sent to the Webhook Server URL set on the Portal. Such events are explained further below:
Orders
Receive updates on order activities.
Products
Get notifications about product-related events.
Shippings
Be informed of shipping-related changes.
Shipments
Receive alerts for shipment status updates.
Customers
Stay notified about customer activities.
Categories
Get updates for category changes.
Brand
Receive information on brand-related events.
Store
Be notified of store-related occurrences.
Cart
Get alerts on cart activities.
Invoice
Receive updates concerning invoices.
Special Offer
Be informed of special offer events.
Miscellaneous
Get notified about other general updates, such Reviews.
Salla also supports conditional webhooks, where you can write rules specific for a webhook you subscribed to. Read more on how to use such a feature here.
🚫 Rate Limit
Rate Limit regulates the number of API requests a client/developer can send per second. This helps protect API resources from abuse and overuse, and ensures that the API service is available to all customers who need it. When consuming Salla APIs, and to ensure fairness and stability for all the developers, Rate Limit are set to all the API endpoints.
🌐 Language Support
Some specific API endpoints have support for multiple languages, which can be achieved via Accept Language and Content Language Header values. Read more on how to utilize the Multi-Language Support feature in Salla APIs in this article.
🕹 Test it out
To get going quickly, we recommend using an API collaboration tool called Postman. You can use the link below to import our collection of endpoints.


📝 ChangeLog
Introducing a new endpoint? Updating an existing one? Deprecating or even announcing a breakchange? All is found in the ChangeLog page as well as the API ChangeLog Telegram Channel. The Salla APIs ChangeLog allows users to view new releases, updates, and critical changes to all Salla's APIs. This provides an excellent way for Salla Developers to stay up-to-date with the latest changes that are occurring on Salla.
👥 Community
Salla Developer Community is a vibrant and active community of developers who discuss topics around Salla Products such as Salla Partners, Salla APIs, Salla Open Source Projects, Twilight, and more. This space is found to connect with developers who are enthusiastic about creating amazing apps and themes as well as providing ultimate, end to end solutions to Salla Merchants. The knowledgbase portal is made for blogs and tutorials that target developers in using Salla Products. Be part of the community and join the Telegram group from here.

---

# Create Your First App

Salla has made it easier for developers worldwide to reach its audience of over 60,000 active retailers. Achieve more and make money by offering your services to many Merchants or by engaging them in high-touch customer interactions. You can do more, as we explained in a previous article.
Note
Developers can access a rich list of Salla's Partners resources using the dedicated API documentation, which provides in-depth access methods to Salla customers, stores, and more.
With the Partners Portal, you can create Apps, test on demo stores, release them on the Salla Apps Marketplace and get paid.
Information
The Salla Partner Portal gives more capabilities for developers to design, develop, build, ship, and connect their apps with the Salla E-commerce portal.
As we will be unraveling in this article, the portal will be much more effortless to workaround.
Create Salla App
To start, make sure to have a verified Salla Partners account on https://salla.partners.
Login to your account on https://salla.partners using your credentials. Once logged in you will be redirected to the main page.
From the left menu, can click on "My Apps". This will land on the Apps page where you can create your first app.
Note
With Salla App Store, you can have two types of Apps:
Public App: your App can go into public usage and display for those users who browse the Salla App Store. The Merchants can view your App's details and may download/purchase your App.
Private App: privately built and developed apps for integration to either larger scaled or individual Merchants. The Apps won't be displayed or accessed from the Salla App Store homepage search results and more.
In this step, you will need to choose your App's type either Public or Private.
Note
Shipping App can be a Public or Private App, you will be able to choose the App category in the next section.
Afterward, start entering the basic information of your App:
Item	Description
Icon	The App icon image, should have Minimum width : 250 pixels, height : 250 pixels. And the Width to high ratio : 1 : 1 .
Name	The App name should be provided in English and Arabic
Category	Shipping Apps for Shipping services Apps., General App for other than Shipping App
Description	Describe your App in 50 characters
App Website	The App website URL link
Support Email	The App support email address
Following is a complete example for App Basic information:
Now you can click on "Create App".
🥳You have successfully created your first App on Salla Partners Portal.
Note
Getting here, means the App was created. In order to publish you will need to continue reading.
App Details
After creating the App, you will be redirected to the App details page. App Details page is where you will find the App deatils inlcuding App Keys, App Scope, Webhooks Notifications App Trusted IP's, App Settings, App Snippet, Custom Plans, DNS Management, App Testing, App Testing, App Publishing. Each section will be explained in the following parts.
1- App Keys
The App keys details are required to authorize your App via Merchants. Such credentials include:
Client ID
Client Secret Key with an option to generate a new Client secret key
OAuth Modes, either Easy Mode as in-house authorization or Custom Mode.
2- App Scope
After that, you will come to the "App Scope" section. This section specifies your app's scope to protect your app by identifying and restricting access to certain features and services.
3- Webhooks and Notifications
Next, you will have the "Webhooks/Notifications". Webhooks are one way that Apps can send automated messages or information to other apps. You can use that to be notified whenever events occur in stores, such as "create an order", "register a new customer", and others. Scrolling down, you will outlook more options:
Adding your Webhook URL to where you will be receiving the events you choose to listen to
Get your Webhook Secret key with the option to generate a new one
Stream App Events
Add Store Events
a. App Events
For App Events, your webhook will automatically receive the events when a merchant triggers an action on your app, such as:
App Installed
App Updated
App Trial Started
App Trial Ended
App Subscription Started
App Subscription Ended
App Subscription Renewed
App Rated
b. Store Events
For adding Store Events, Salla has listed out events you can listen to with each having its own attributes, such as:
Orders
Products
Customers
Categories
Brands
Stores
Miscellaneous
4- App Trusted IP
In this section, you can add a trusted IPs for your App for more secure communication between the App and Salla API

5- App Snippets
The App snippets can be added in this section. Click on "View Snippets" to start adding.
Read more about App Snippets here.


6- App Settings
In this section you can edit the App settings, including buliding the App Settings and Settings Validation URL

you can follow the steps in this article for detailed guidance.


7- Custom Plans
This feature enables you to create unique plans and features tailored to your specific needs.

Read more about Custom Plans here.


8- DNS Management
Managing DNS (Domain Name System) records for a Salla Store involves configuring the settings that enable the store’s domain name to be associated with its corresponding IP address, which helps to ensure that visitors can access the store using the desired domain name.

More about DNS Management here


9- App Testing
In this section you can test your App using a demo store, the demo store will provide a real life experience of an actual store where you can test your App features.

Follow the steps of creating a demo store here


App Publishing
App publishing allows your App to be displayed in Salla Apps Store for all Salla Merchants.
To publish your App, scroll down on the App Details page and click on the "Start Publishing your App" button, to begin the process.
The publishing process consists of six sections, Basic Information, App Configurations, App Features, Pricing, Contact Information and Service Trial.
Read more about publishing Salla App here.


With that said, we covered the Salla Partner Portal fully, with all its procedures to create your first App on the portal. Follow up with your email and portal notifications for further understanding of the portal.
Your Gateway to Success
With the steps mentioned above, you will create your first App on Salla with ease and a smooth process.
Time for you to elevate your work, experience, and ability and have a solid reputation with passive income that could be higher than expected, as we have discussed.
If you are facing any issues or have any further questions, be part of the Global Developer Community on Telegram

---

# Authorization

OAuth is a widely adopted authorization framework that allows you to consent to an App interacting with another on your behalf without having to reveal Merchant's sensitive data, such as passwords.
If you are building integrations that require access to Salla on behalf of other Salla Merchants, you should utilize OAuth 2.0 Protocol for Salla. You can use OAuth in gaining access to Merchants' stores with either Easy Mode or Custom Mode, using access tokens via the Apps built on Salla Partners Portal, which will be published on
Salla App Store.
Salla OAuth Format
All calls to the Merchant Public APIs require an Authorization header in this format:
Authorization: Bearer <ACCESS_TOKEN>
What You will Need Before You Start:
1
First Step
Open and verify account on Salla Partners.
2
Second Step
Either use a sample App you created previously or build a new one from the scratch.
3
Third Step
Choose an OAuth method, Easy Mode or Custom Mode Authorization.
4
Fourth Step
Set up the scopes of your App to specify the needed access level.
5
Fifth Step
Generate a demo store, so no sensitive data is compromised.
6
Sixth Step
Install the App on the demo store for real-world mockup test.
Salla OAuth Benefits
🔐 Authorized Access
Apps are given authorized access, which means they can only access resources that the Merchant has authenticated.
⛓️‍💥 Revoke Access
The App's authorized access can be revoked at any time by the Merchant by disconnecting the App from the dashboard on Salla Partners.
⌛️ Time Limit
OAuth 2.0 access tokens have a time limit. Merchant data will be compromised only until the access token is valid if the App encounters a security breach.
Salla’s OAuth2.0 Flow
The OAuth 2.0 authorization flow is the initial step in installing an App on the Salla platform. By requiring the merchant to grant permission for the App to access their data within specific scope, this process helps to ensure that the store's data is safe and private. The OAuth 2.0 authorization procedure can be started by one of the following URLs:
The Authorization URL: https://accounts.salla.sa/oauth2/auth
The Installation URL: https://s.salla.sa/apps/install/{app-id}
The authorization Flow
The OAuth 2.0 authentication flow for installing an App on a Salla Store includes crucial URLs and endpoints that enable permission granting, code-to-token exchange, redirection, and token refreshing. The process involves the merchant's redirection to the Salla Authorization Server, login, granting permission, and obtaining an access token for API requests and accessing store data.
The following table summarize these and endpoints:
URL	Description
Authorization Endpoint	https://accounts.salla.sa/oauth2/auth
This URL initiates the process of obtaining the merchant's permission for the App to access their store data on Salla.
Token Endpoint	https://accounts.salla.sa/oauth2/token
After the merchant grants permission, the App exchanges the authorization code for an access token at this endpoint.
Redirect URI	https://client-app.com/callback
Once the authentication process is complete, the authorization server redirects the user's browser to the registered redirect URI.
Refresh Token Endpoint	https://accounts.salla.sa/oauth2/token
If a refresh token is granted, this endpoint allows the client to obtain a new access token when the current one expires.
User Info Endpoint	https://accounts.salla.sa/oauth2/user/info
Once the authentication process is completed successfully, the Merchant details can be received via this endpoint.
To use the Authorization Endpoint https://accounts.salla.sa/oauth2/auth in your code, you will typically need to make an HTTP request to that URL.
In addition to the base URLs mentioned above, OAuth 2.0 also uses query parameters to pass information during the authentication process. These query parameters serve different purposes and are included in the URLs when making requests to the authorization and token endpoints. Here are some common query parameters used in OAuth 2.0:
Query Parameter	Description	Example
client_id	Identifies the client application making the request, which values can be fetched from your application on the Salla Partners Portal.	1311508470xxx
client_secret	Identifies the client application making the request, which values can be fetched from your application on the Salla Partners Portal.	362985662xxx
response_type	Specifies the desired response type from the authorization server.	code
redirect_uri	Indicates the URI for user redirection after completing the authorization process.	https://your-app.com/callback-url
scope	Specifies the requested permissions or access levels.	offline_access
state	Used to maintain state between the authorization request and the callback to prevent cross-site request forgery attacks.	1234xxxx
code	The authorization code returned by the authorization endpoint.	xxxxxxxx
grant_type	Specifies the type of grant being used to authenticate the client.	authorization_code
Including the client ID as a query parameter
It is common practice to include the client ID as a query parameter in the authorization URL for OAuth 2.0 authentication. This inclusion allows the authorization server to associate the authentication request with the specific client, ensuring client identification and authentication during the process. Here's an example of how the client ID can be included in the authorization URL:
https://accounts.salla.sa/oauth2/auth?client_id=your_client_id&response_type=code&redirect_uri=https://client-app.com/callback&scope=read write&state=random_value
In the example above, client_id=your_client_id is appended to the authorization URL, where your_client_id should be replaced with the actual client ID issued by the authorization server.
Including the client ID as a query parameter in the authorization URL ensures authentication and identification of the client during OAuth 2.0. If the App has been previously approved, scope approval steps may be skipped, streamlining the process.
The installation URL
On the other hand, the installation URL allows for the immediate installation of the App to the merchant store. Unlike the typical authorization URL, the installation URL simplifies the app installation process by providing a direct URL with the app-id as a parameter. This URL can be used to initiate the app installation process. When the merchant clicks on the installation URL, the App will be automatically installed into their Salla Store.
The following diagram explains the flow of OAuth 2.0 in Salla, which will eventually result in access token generation.
Types of OAuth 2.0 in Salla
On Salla Partners Portal, and when you are creating your App, inside the App page details within the App Keys section, you will be provided with two methods for the OAuth protocol:
Easy Mode, which is a simplified version of the protocol that requires minimal setup.
Custom Mode, which allows for more advanced, manual configuration and the use of callback URLs.
Easy Mode (Recommended)
One of the foremost options of authorization via OAuth 2.0 in Salla Partners is Easy Mode Authorization. Utilizing Salla’s easy mode option, you can get the “access token” in one step automatically. It allows you to listen to the event, app.store.authorize, and then the process of generating the “access token” will be handled automatically at Salla‘s side back to you via the Webhook URL specified in the Webhooks/Notificationsyour of your App.
By selecting the Easy Mode Authorization option, Salla will handle everything, including extracting the authorization code and providing the client id and secret key together with the auth code to generate an access token. In the end, you will receive all of the above data in the form of a payload that contains a new access token generated for you, as the life validity of access tokens with Salla is 2 weeks.
The payload you will be receiving should look something like this:
{
  "event": "app.store.authorize",
  "merchant": 1234918345,
  "created_at": "2021-10-05 16:41:07",
  "data": {
    "access_token": "kG7eCGY0QlrgNZK1zFQmRIifReqsKJ9GJquPvsnJhho.l5Msr8jD5GBxxxx",
    "expires": 1634661667,
    "refresh_token": "WYQz6bMeaonMZ6WjhrkMTRb7fSkrAVpLH5n1V0_X9eU.e5Gqz1ks8Q8dHxxxx",
    "scope": "settings.read offline_access",
    "token_type": "bearer"
  }
}


App Update
In the easy mode, when the Merchant updates the app, Salla sends you the app.updated event. After that, Salla sends you the app store.authorized event, which provides you with the new access token and refresh token. This information will be delivered to you via webhook. Accordingly, you are required to update the access token and refresh token in your database.
WARNING
The expires variable is returned as a unix timestamp value for the app event app.store.authorize.
Custom Mode
When implementing an OAuth flow or any other third-party API that needs to redirect to the App after authentication or authorization, a callback URL should be set. The App will use this URL to reroute back to the App after the login and App scopes' permission procedures are finished. This cycle of authentication is called Custom Mode authentication.
Custom Mode Use Cases:
App for online grocery stores that redirect users back to the store after they log in with their Google account.
App for onlines store that redirects customers back to the product page after they sign up for a newsletter
App for bookstores that redirects customers back to their reading list after they rate a book.
There are two steps that we need to follow in order to successfully set up a Custom Mode OAuth in Salla:
1. User Authorization
A Merchant has to authorize your App, with the set of App scopes, to be able to proceed with the process of obtaining the access token. Direct the Merchant to the callback URL you used while setting up your App on Salla Partner Portal. If this is the first time that you are requesting authorization from a Merchant, the merchant will be asked to log in to his/her Salla Store.
To obtain the access token for your App, the Merchant needs to authorize it with the App scopes.
Once the Merchant has logged in to their Salla Store account, they will be prompted by Salla to authorize access to your App. The merchant will be asked to grant authorization for your App to access their store data with the defined scopes.


If the access has been authorized, the user will be redirected to the Callback URL with the authorization code in the code query parameter, which you can fetch to continue the process of obtaining the access token:
https://yourapp.com/callback?code={code-value}&scope={app-scopes}+offline_access&state={state-value}
2. Access Token Generation
When the Merchant authorizes the App, Salla returns the Merchant to your Callback URL with a code parameter containing an authorization code. Use the code in your access token request, which is a POST request with the required parameters to the token endpoint.
Access Token Request
Access Token Response
Easily run the request straight from Postman by providing the required data to generate an access token


WARNING
Easy Mode is the only way allowed for published apps on the Salla App Store. Since Postman uses custom mode, you can implement that in your app for testing purposes only.
Body Definition
The following enlists the values that are sent to the User Authorization endpoint to generate an access token:
AccessToken
client_id
string 
required
A unique identifier assigned to an application or service that interacts with another service or platform
client_secret
string 
required
A Salla Partners App Client Secret Key is a confidential security credential that is used to authenticate your application with the Salla platform.
grant_type
string 
required
Acredential that allows a client application to access protected resources on behalf of a user using authorization_code
code
string 
required
Code fetched at authorization
scope
string 
required
The specific permissions granted to a client application when it uses an access token to access protected resources on behalf of a user using offline_access.
redirect_uri
string 
required
Your application’s callback URI



Important Notes

• Access tokens expire after 2 weeks (14 days).
• If you want to generate the refresh token, set the scope value as offline_access. E.G: scope = offline_access.
• The expires variable is returned as seconds timestamp value
• Upon obtaining the access token, developers can utilize the User Info endpoint URL, https://accounts.salla.sa/oauth2/user/info, to retrieve the Merchant details and store them alongside the access tokens.

Refresh Access Token
A typical reason for refreshing a token is that the original access token has expired, which lasts for only 14 days (2 weeks). If you would like to request a new access token, you may do so by sending Salla’s authorization server a token refresh request. Refresh tokens are single-use only, meaning they become invalid after the first use.
Every time a developer uses a refresh token to request a new access token, a new refresh token is issued, and the previous token is invalidated. This mechanism adds an extra layer of security, making it more difficult for attackers to use stolen refresh tokens. A refresh token lasts for 1 month, and attempting to use it twice invalidates the associated access token.
Warning: Refresh Token Reuse
Reusing refresh tokens in parallel processes or making multiple simultaneous refresh requests can lead to complete authentication failure. When a refresh token is used more than once, Salla's OAuth server will:
Invalidate the refresh token
Revoke all access tokens obtained with it
Reject all subsequent authentication attempts using that refresh token
Requires the Merchant to reinstall the application from the Salla App Store for you to regain access to their data.
This security measure is implemented in accordance with RFC 6819 Section 5.2.2.3 to prevent replay attacks.
Recommended Implementation: To prevent refresh token reuse in your application, implement a mutex/locking mechanism for token refresh operations
Body Definition
The following enlists the values that are sent to the Token endpoint to Refreshing Access Tokens:
Refresh Access Token Request
Refresh Access Token Response
Easily run the request straight from Postman by providing the required data to generate an access token




Refresh tokens expire after 1 month. The latest refresh token must always be used for the next refresh request. 
The expires variable
Access Token Usage Example
Now you may use the access token to make requests, on behalf of the Merchant, from the resource server via the API (base endpoint url: https://api.salla.dev/admin/v2/). For more information about making API requests, the full API documentation is available here.
With the access token and the authroized App scopes to the App, you may start consuming any of Salla's API endpoints, such as fetching a list of brands
IP Whitelisting
IP whitelisting is a security feature that restricts access to an App to only the IP addresses that are included on the whitelist. This can be used to restrict unwanted access and protect critical data from potential compromise.
It works by denying all IP addresses, except for those specifically listed as "whitelisted," thereby limiting the access to only approved users. This way, developers can better protect their private data from potential outside threats, such as hackers and malware, by reducing the attack surface area.
IP Whitelisting can also be used for other purposes such as controlling bandwidth usage or limiting access to certain services. You may reach the App setup page by going to the Partners Dashboard and selecting the "My Apps" tab:
From this page, you can add the permitted IP addresses in the following area, which is labeled "App Trusted IPs":


NOTE
Get additional information about App Trusted IPs by visiting this article.
Open-Source Libraries
Salla developed various clients and OAuth-specific libraries, such as:
PHP Client | OAuth2 Merchant
JavaScript Client | Passport Strategy
Laravel Starter Kit | OAuth Controller
These open-source libraries, powered by Salla, are here to assist in bootstrapping your development journey with Salla by providing code snippets easily accessible, readable, and maintainable by Salla’s own experts as well as the Global Community of developers.

---
