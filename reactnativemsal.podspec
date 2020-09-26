require "json"

package = JSON.parse(File.read(File.join(__dir__, "package.json")))

Pod::Spec.new do |s|
  s.name         = "reactnativemsal"
  s.version      = package["version"]
  s.summary      = package["description"]
  s.homepage     = package["homepage"]
  s.license      = package["license"]
  s.authors      = package["author"]

  s.platforms    = { :ios => "10.0" }
  s.source       = { :git => "https://github.com/stashenergy/react-native-msal.git", :tag => "v#{s.version}" }

  s.source_files = "ios/**/*.{h,m}"

  s.dependency "React-Core"
  s.dependency "MSAL"
end
