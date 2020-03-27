#import "RNMSAL.h"
#import "React/RCTConvert.h"
#import "React/RCTLog.h"
#import <MSAL/MSAL.h>

#import "UIViewController+Utils.h"

@implementation RNMSAL

RCT_EXPORT_MODULE()

- (dispatch_queue_t)methodQueue
{
    return dispatch_get_main_queue();
}

RCT_REMAP_METHOD(acquireToken,
                 interactiveParams:(NSDictionary*)params
                 resolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject)
{
    @try {
        NSError *msalError = nil;

        // Required parameters; Creating application/web view parameters will not work without these.
        NSString *clientId = [RCTConvert NSString:params[@"clientId"]];
        NSString *authority = [RCTConvert NSString:params[@"authority"]];
        NSArray<NSString *> *scopes = [RCTConvert NSStringArray:params[@"scopes"]];

        // Optional parameters which have default values, so we don't have to check if nil
        NSUInteger promptType = [RCTConvert NSUInteger:params[@"promptType"]];
        NSString *loginHint = [RCTConvert NSString:params[@"loginHint"]];
        NSDictionary<NSString*,NSString*> *extraQueryParameters = [RCTConvert NSDictionary:params[@"extraQueryParameters"]];
        NSArray<NSString *> *extraScopesToConsent = [RCTConvert NSStringArray:params[@"extraScopesToConsent"]];

        MSALPublicClientApplication *application = [RNMSAL createClientApplicationWithClientId:clientId authority:authority error:&msalError];

        if (msalError) {
            @throw(msalError);
        }

        // Configure interactive token parameters
        UIViewController *viewController = [UIViewController currentViewController];
        MSALWebviewParameters *webParameters = [[MSALWebviewParameters alloc] initWithParentViewController:viewController];
        MSALInteractiveTokenParameters *interactiveParams = [[MSALInteractiveTokenParameters alloc] initWithScopes:scopes webviewParameters:webParameters];
        interactiveParams.promptType = promptType;
        interactiveParams.loginHint = loginHint;
        interactiveParams.extraQueryParameters = extraQueryParameters;
        interactiveParams.extraScopesToConsent = extraScopesToConsent;

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
        NSString *clientId = [RCTConvert NSString:params[@"clientId"]];
        NSString *authority = [RCTConvert NSString:params[@"authority"]];
        NSArray<NSString *> *scopes = [RCTConvert NSStringArray:params[@"scopes"]];
        NSString *accountIdentifier = [RCTConvert NSString:params[@"accountIdentifier"]];

        // Optional parameters which have default values, so we don't have to check if nil
        BOOL forceRefresh = [RCTConvert BOOL:params[@"forceRefresh"]];

        MSALPublicClientApplication *application = [RNMSAL createClientApplicationWithClientId:clientId authority:authority error:&msalError];

        if (msalError) {
            @throw(msalError);
        }

        MSALAccount *account = [application accountForIdentifier:accountIdentifier error:&msalError];

        if (msalError) {
            @throw(msalError);
        }

        // Configure interactive token parameters
        MSALSilentTokenParameters *silentParams = [[MSALSilentTokenParameters alloc] initWithScopes:scopes account:account];
        silentParams.forceRefresh = forceRefresh;

        // Send request
        [application acquireTokenSilentWithParameters:silentParams completionBlock:^(MSALResult * _Nullable result, NSError * _Nullable error) {
            if (!error) {
                resolve([self MSALResultToDictionary:result withAuthority:authority]);
            } else {
//                if ([error.domain isEqual:MSALErrorDomain] && error.code == MSALErrorInteractionRequired /*-50002*/) {
//                    // Maybe do something? Or let React Native code handle it?
//                }
                reject([[NSString alloc] initWithFormat:@"%d", (int)error.code], error.description, error);
            }
        }];
    } @catch (NSError *error) {
        reject([[NSString alloc] initWithFormat:@"%d", (int)error.code], error.description, error);
    }
}

RCT_REMAP_METHOD(removeAccount,
                 removeParams:(NSDictionary*)params
                 resolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject)
{
    @try {
        NSError *msalError = nil;

        // Required parameters
        NSString *authority = [RCTConvert NSString:params[@"authority"]];
        NSString *clientId = [RCTConvert NSString:params[@"clientId"]];
        NSString *accountIdentifier = [RCTConvert NSString:params[@"accountIdentifier"]];

        MSALPublicClientApplication* application = [RNMSAL createClientApplicationWithClientId:clientId authority:authority error:&msalError];

        if (msalError) {
            @throw msalError;
        }

        MSALAccount *account = [application accountForIdentifier:accountIdentifier error:&msalError];

        if (msalError) {
            @throw msalError;
        }

        [application removeAccount:account error:&msalError];

        if (msalError) {
            @throw msalError;
        }

        resolve([NSNull null]);

    } @catch(NSError *error) {
        reject([[NSString alloc] initWithFormat:@"%d", (int)error.code], error.description, error);
    }
}

RCT_REMAP_METHOD(signoutWithAccount,
                 signoutParams:(NSDictionary*)params
                 resolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject)
{
    @try {
        NSError *msalError = nil;

        // Required parameters
        NSString *authority = [RCTConvert NSString:params[@"authority"]];
        NSString *clientId = [RCTConvert NSString:params[@"clientId"]];
        NSString *accountIdentifier = [RCTConvert NSString:params[@"accountIdentifier"]];

        MSALPublicClientApplication* application = [RNMSAL createClientApplicationWithClientId:clientId authority:authority error:&msalError];

        if (msalError) {
            @throw msalError;
        }

        MSALAccount *account = [application accountForIdentifier:accountIdentifier error:&msalError];

        if (msalError) {
            @throw msalError;
        }
        
        UIViewController *viewController = [UIViewController currentViewController];
        MSALWebviewParameters *webParameters = [[MSALWebviewParameters alloc] initWithParentViewController:viewController];
        MSALSignoutParameters *signoutParameters = [[MSALSignoutParameters alloc] initWithWebviewParameters:webParameters];

        [application signoutWithAccount:account signoutParameters:signoutParameters completionBlock:^(BOOL success, NSError * _Nullable error) {
            if (!error) {
                resolve([NSNull null]);
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
    [dict setObject:[NSNumber numberWithDouble:[result.expiresOn timeIntervalSince1970] * 1000] forKey:@"expiresOn"];
    [dict setObject:(result.idToken ?: [NSNull null]) forKey:@"idToken"];
    [dict setObject:result.scopes forKey:@"scopes"];
    [dict setObject:authority forKey:@"authority"];
    [dict setObject:(result.tenantProfile.tenantId ?: [NSNull null]) forKey:@"tenantId"];
    [dict setObject:[self MSALAccountToDictionary:result.account] forKey:@"account"];
    return [dict mutableCopy];
}

- (NSDictionary*)MSALAccountToDictionary:(MSALAccount*)account
{
    NSMutableDictionary *dict = [NSMutableDictionary dictionaryWithCapacity:1];
    [dict setObject:account.identifier forKey:@"identifier"];
    [dict setObject:(account.username ?: [NSNull null]) forKey:@"username"];
    return [dict mutableCopy];
}

+ (MSALPublicClientApplication* )createClientApplicationWithClientId:(NSString*)clientId
                                                           authority:(NSString*)authority
                                                               error:(NSError* __autoreleasing*)error
{
    NSError *_error;
    NSURL *authorityUrl = [NSURL URLWithString:authority];
    MSALAuthority *msalAuthority = [MSALAuthority authorityWithURL:authorityUrl error:&_error];

    MSALPublicClientApplicationConfig *applicationConfig = [[MSALPublicClientApplicationConfig alloc] initWithClientId:clientId];
    applicationConfig.authority = msalAuthority;
    applicationConfig.knownAuthorities = @[msalAuthority];

    MSALPublicClientApplication *clientApplication = [[MSALPublicClientApplication alloc] initWithConfiguration:applicationConfig error:&_error];

    if (_error != nil)
    {
        *error = _error;
    }

    return clientApplication;
}

@end
