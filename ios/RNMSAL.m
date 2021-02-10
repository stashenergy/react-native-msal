#import "RNMSAL.h"
#import "React/RCTConvert.h"
#import "React/RCTLog.h"
#import <MSAL/MSAL.h>

#import "UIViewController+RNMSALUtils.h"

@implementation RNMSAL

RCT_EXPORT_MODULE()

MSALPublicClientApplication *application;

- (dispatch_queue_t)methodQueue
{
    return dispatch_get_main_queue();
}

RCT_REMAP_METHOD(createPublicClientApplication,
                 config:(NSDictionary*)config
                 resolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject)
{
    @try {
        NSError *msalError = nil;

        // Required
        NSDictionary* auth = [RCTConvert NSDictionary:config[@"auth"]];
        NSString* clientId = [RCTConvert NSString:auth[@"clientId"]];

        // Optional
        NSString* authority = [RCTConvert NSString:auth[@"authority"]];
        NSArray<NSString*> * knownAuthorities = [RCTConvert NSStringArray:auth[@"knownAuthorities"]];
        NSString* redirectUri = [RCTConvert NSString:auth[@"redirectUri"]];

        MSALPublicClientApplicationConfig *applicationConfig = [[MSALPublicClientApplicationConfig alloc] initWithClientId:clientId];
        if (authority) {
            MSALAuthority *msalAuthority = [MSALAuthority authorityWithURL:[NSURL URLWithString:authority] error:&msalError];
            if (msalError) {
                @throw(msalError);
            }
            applicationConfig.authority = msalAuthority;
        }

        if (knownAuthorities) {
            NSMutableArray<MSALAuthority*> * msalKnownAuthorities = [NSMutableArray arrayWithCapacity:1];
            for (NSString *authorityString in knownAuthorities) {
                MSALAuthority *a = [MSALAuthority authorityWithURL:[NSURL URLWithString:authorityString] error:&msalError];
                if (msalError) {
                    @throw(msalError);
                }
                [msalKnownAuthorities addObject:a];
            }
            applicationConfig.knownAuthorities = msalKnownAuthorities;
        }

        if (redirectUri) {
            applicationConfig.redirectUri = redirectUri;
        }

        application = [[MSALPublicClientApplication alloc] initWithConfiguration:applicationConfig error:&msalError];

        if (msalError) {
            @throw(msalError);
        }

        resolve(nil);
    } @catch (NSError *error) {
        reject([[NSString alloc] initWithFormat:@"%d", (int)error.code], error.description, error);
    }
}

RCT_REMAP_METHOD(acquireToken,
                 interactiveParams:(NSDictionary*)params
                 resolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject)
{
    @try {
        // Required parameters
        NSArray<NSString *> *scopes = [RCTConvert NSStringArray:params[@"scopes"]];

        // Optional parameters
        NSString *authority = [RCTConvert NSString:params[@"authority"]];
        NSUInteger promptType = [RCTConvert NSUInteger:params[@"promptType"]];
        NSString *loginHint = [RCTConvert NSString:params[@"loginHint"]];
        NSDictionary<NSString *,NSString *> *extraQueryParameters = [RCTConvert NSDictionary:params[@"extraQueryParameters"]];
        NSArray<NSString *> *extraScopesToConsent = [RCTConvert NSStringArray:params[@"extraScopesToConsent"]];
        NSDictionary * webviewParameters = [RCTConvert NSDictionary:params[@"webviewParameters"]];
        NSUInteger webviewType = [RCTConvert NSUInteger:webviewParameters[@"ios_webviewType"]];
        NSInteger presentationStyle = [RCTConvert NSInteger:webviewParameters[@"ios_presentationStyle"]];
        BOOL prefersEphemeralWebBrowserSession = [RCTConvert BOOL:webviewParameters[@"ios_prefersEphemeralWebBrowserSession"]];

        // Configure interactive token parameters
        UIViewController *viewController = [UIViewController currentViewController];
        MSALWebviewParameters *webParameters = [[MSALWebviewParameters alloc] initWithAuthPresentationViewController:viewController];
        webParameters.webviewType = webviewType;
        webParameters.presentationStyle = presentationStyle;
        if (@available(iOS 13.0, *)) {
            webParameters.prefersEphemeralWebBrowserSession = prefersEphemeralWebBrowserSession;
        }

        MSALInteractiveTokenParameters *interactiveParams = [[MSALInteractiveTokenParameters alloc] initWithScopes:scopes webviewParameters:webParameters];
        interactiveParams.promptType = promptType;
        interactiveParams.loginHint = loginHint;
        interactiveParams.extraQueryParameters = extraQueryParameters;
        interactiveParams.extraScopesToConsent = extraScopesToConsent;
        if (authority) {
            interactiveParams.authority = [MSALAuthority authorityWithURL:[NSURL URLWithString:authority] error:nil];
        }

        // Send request
        [application acquireTokenWithParameters:interactiveParams completionBlock:^(MSALResult * _Nullable result, NSError * _Nullable error) {
            if (!error) {
                resolve([self MSALResultToDictionary:result withAuthority:authority]);
            } else {
                reject([[NSString alloc] initWithFormat:@"%d", (int)error.code], error.description, error);
            }
        }];
    } @catch (NSError *error) {
        reject([[NSString alloc] initWithFormat:@"%d", (int)error.code], error.description, error);
    }
}

RCT_REMAP_METHOD(acquireTokenSilent,
                 silentParams:(NSDictionary*)params
                 resolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject)
{
    @try {
        NSError *msalError = nil;

        // Required parameters
        NSArray<NSString *> *scopes = [RCTConvert NSStringArray:params[@"scopes"]];
        NSDictionary * accountIn = [RCTConvert NSDictionary:params[@"account"]];
        NSString *accountIdentifier = [RCTConvert NSString:accountIn[@"identifier"]];

        // Optional parameters
        NSString *authority = [RCTConvert NSString:params[@"authority"]];
        BOOL forceRefresh = [RCTConvert BOOL:params[@"forceRefresh"]];

        MSALAccount *account = [application accountForIdentifier:accountIdentifier error:&msalError];

        if (msalError) {
            @throw(msalError);
        }

        // Configure interactive token parameters
        MSALSilentTokenParameters *silentParams = [[MSALSilentTokenParameters alloc] initWithScopes:scopes account:account];
        silentParams.forceRefresh = forceRefresh;
        if (authority) {
            silentParams.authority = [MSALAuthority authorityWithURL:[NSURL URLWithString:authority] error:nil];
        }

        // Send request
        [application acquireTokenSilentWithParameters:silentParams completionBlock:^(MSALResult * _Nullable result, NSError * _Nullable error) {
            if (!error) {
                resolve([self MSALResultToDictionary:result withAuthority:authority]);
            } else {
                reject([[NSString alloc] initWithFormat:@"%d", (int)error.code], error.description, error);
            }
        }];
    } @catch (NSError *error) {
        reject([[NSString alloc] initWithFormat:@"%d", (int)error.code], error.description, error);
    }
}

RCT_REMAP_METHOD(getAccounts,
                 resolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject)
{
    @try {
        NSError *msalError = nil;
        NSArray *_accounts = [application allAccounts:&msalError];

        if (msalError) {
            @throw msalError;
        }

        NSMutableArray * accounts = [NSMutableArray arrayWithCapacity:1];
        for (MSALAccount *account in _accounts) {
            [accounts addObject:[self MSALAccountToDictionary:account]];
        }

        resolve(accounts);
    } @catch (NSError* error) {
        reject([[NSString alloc] initWithFormat:@"%d", (int)error.code], error.description, error);
    }
}

RCT_REMAP_METHOD(getAccount,
                 accoundIdentifier:(NSString*)accountIdentifier
                 resolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject)
{
    @try {
        NSError *msalError = nil;
        MSALAccount *account = [application accountForIdentifier:accountIdentifier error:&msalError];

        if (msalError) {
            @throw msalError;
        }

        resolve([self MSALAccountToDictionary:account]);
    } @catch(NSError *error) {
        reject([[NSString alloc] initWithFormat:@"%d", (int)error.code], error.description, error);
    }
}

RCT_REMAP_METHOD(removeAccount,
                 account:(NSDictionary*)account
                 resolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject)
{
    @try {
        NSError *msalError = nil;

        // Required parameters
        NSString *accountIdentifier = [RCTConvert NSString:account[@"identifier"]];

        MSALAccount *account = [application accountForIdentifier:accountIdentifier error:&msalError];

        if (msalError) {
            @throw msalError;
        }

        BOOL res = [application removeAccount:account error:&msalError];

        if (msalError) {
            @throw msalError;
        }

        resolve(res ? @YES : @NO);

    } @catch(NSError *error) {
        reject([[NSString alloc] initWithFormat:@"%d", (int)error.code], error.description, error);
    }
}

RCT_REMAP_METHOD(signout,
                 signoutParams:(NSDictionary*)params
                 resolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject)
{
    @try {
        NSError *msalError = nil;

        // Required parameters
        NSDictionary * accountIn = [RCTConvert NSDictionary:params[@"account"]];
        NSString *accountIdentifier = [RCTConvert NSString:accountIn[@"identifier"]];

        // Optional parameters
        BOOL signoutFromBrowser = [RCTConvert BOOL:params[@"signoutFromBrowser"]];
        NSDictionary * webviewParameters = [RCTConvert NSDictionary:params[@"webviewParameters"]];
        BOOL prefersEphemeralWebBrowserSession = [RCTConvert BOOL:webviewParameters[@"ios_prefersEphemeralWebBrowserSession"]];

        MSALAccount *account = [application accountForIdentifier:accountIdentifier error:&msalError];

        if (msalError) {
            @throw msalError;
        }

        UIViewController *viewController = [UIViewController currentViewController];
        MSALWebviewParameters *webParameters = [[MSALWebviewParameters alloc] initWithAuthPresentationViewController:viewController];
        if (@available(iOS 13.0, *)) {
            webParameters.prefersEphemeralWebBrowserSession = prefersEphemeralWebBrowserSession;
        }

        MSALSignoutParameters *signoutParameters = [[MSALSignoutParameters alloc] initWithWebviewParameters:webParameters];
        signoutParameters.signoutFromBrowser = signoutFromBrowser;

        [application signoutWithAccount:account signoutParameters:signoutParameters completionBlock:^(BOOL success, NSError * _Nullable error) {
            if (!error) {
                resolve(success ? @YES : @NO);
            } else {
                reject([[NSString alloc] initWithFormat:@"%d", (int)error.code], error.description, error);
            }
        }];

    } @catch(NSError *error) {
        reject([[NSString alloc] initWithFormat:@"%d", (int)error.code], error.description, error);
    }
}

- (NSDictionary*)MSALResultToDictionary:(MSALResult*)result withAuthority:(NSString*)authority
{
    NSMutableDictionary *dict = [NSMutableDictionary dictionaryWithCapacity:1];

    [dict setObject:result.accessToken forKey:@"accessToken"];
    [dict setObject:[NSNumber numberWithDouble:[result.expiresOn timeIntervalSince1970]] forKey:@"expiresOn"];
    [dict setObject:(result.idToken ?: [NSNull null]) forKey:@"idToken"];
    [dict setObject:result.scopes forKey:@"scopes"];
    [dict setObject:(authority ?: application.configuration.authority.url.absoluteString) forKey:@"authority"];
    [dict setObject:(result.tenantProfile.tenantId ?: [NSNull null]) forKey:@"tenantId"];
    [dict setObject:[self MSALAccountToDictionary:result.account] forKey:@"account"];
    return [dict mutableCopy];
}

- (NSDictionary*)MSALAccountToDictionary:(MSALAccount*)account
{
    NSMutableDictionary *dict = [NSMutableDictionary dictionaryWithCapacity:1];
    [dict setObject:account.identifier forKey:@"identifier"];
    [dict setObject:(account.username ?: [NSNull null]) forKey:@"username"];
    [dict setObject:account.environment forKey:@"environment"];
    [dict setObject:(account.accountClaims ?: [NSNull null]) forKey:@"claims"];
    [dict setObject:account.homeAccountId.tenantId forKey:@"tenantId"];
    return [dict mutableCopy];
}

@end
