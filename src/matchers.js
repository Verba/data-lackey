import UrlPattern from 'url-pattern'


const DEFAULT_PATTERN_OPTS = {
  segmentNameStartChar: '$',
  segmentValueCharset:  'a-zA-Z0-9\\-,_%~\\.!\\*\\(\\)',
}

// Matchers that use the `UrlPattern` library directly
class BaseUrlPatternMatcher {

  constructor (urlPattern) {
    this.urlPattern = urlPattern
  }

  matches (jobURI) {
    return this.urlPattern.match(jobURI)
  }

  params (jobURI) {
    const p = this.urlPattern.match(jobURI)
    if (!p) throw `possible bug: pattern found but does not match jobURI ${jobURI}`

    return p // whatever the match returns we pass as params
  }

}

export class ParameterizedStringMatcher extends BaseUrlPatternMatcher {
  constructor (pattern, ruleOptions) {
    super(new UrlPattern(pattern,
                         {
                           ...DEFAULT_PATTERN_OPTS,
                           ...(ruleOptions.patternOpts || {}),
                         }))
  }
}

export class RegExpMatcher extends BaseUrlPatternMatcher {
  constructor (pattern, ruleOptions) {
    super(new UrlPattern(pattern, ruleOptions.groupNames))
  }
}

/*
In this matcher, a pattern is simple string that must be matched at the beginning
to apply the rule. eg. `/posts` `users`.

It can also have "required" params, in which case we build a regular expression that
looks for those urls, ie. `/posts` with an `id` parameter would have a regular expression
 of `^/posts?.*\bid=.*`.

The job URI is built by alphabetically appending the params as query parameters.
 */
export class UriWithParamsMatcher {
  constructor (pattern, requiredParams) {
    if (requiredParams.length)
      pattern += '\\?.*' + requiredParams.sort().map(p => `\\b${p}=.*`).join('&')

    this.regExp = new RegExp(`^${pattern}`)
  }

  matches (jobURI) {
    return this.regExp.exec(jobURI)
  }

  params (jobURI) {
    if (!this.matches(jobURI)) throw `possible bug: pattern found but does not match jobURI ${jobURI}`

    // dig out parameters from the URL
    return jobURI.split('?')[1].split('&').map(e => e.split('=')).reduce((m, s) => (m[s[0]] = decodeURIComponent(s[1]), m), {})
  }

}

