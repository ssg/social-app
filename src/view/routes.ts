import React from 'react'
import {IconProp} from '@fortawesome/fontawesome-svg-core'
import {Home} from './screens/Home'
import {Search} from './screens/Search'
import {Notifications} from './screens/Notifications'
import {NotFound} from './screens/NotFound'
import {PostThread} from './screens/PostThread'
import {PostUpvotedBy} from './screens/PostUpvotedBy'
import {PostRepostedBy} from './screens/PostRepostedBy'
import {Profile} from './screens/Profile'
import {ProfileFollowers} from './screens/ProfileFollowers'
import {ProfileFollows} from './screens/ProfileFollows'
import {Settings} from './screens/Settings'
import {Debug} from './screens/Debug'
import {Log} from './screens/Log'

export type ScreenParams = {
  navIdx: string
  params: Record<string, any>
  visible: boolean
}
export type Route = [React.FC<ScreenParams>, string, IconProp, RegExp]
export type MatchResult = {
  Com: React.FC<ScreenParams>
  defaultTitle: string
  icon: IconProp
  params: Record<string, any>
  isNotFound?: boolean
}

const r = (pattern: string) => new RegExp('^' + pattern + '([?]|$)', 'i')
export const routes: Route[] = [
  [Home, 'Home', 'house', r('/')],
  [Search, 'Search', 'magnifying-glass', r('/search')],
  [Notifications, 'Notifications', 'bell', r('/notifications')],
  [Settings, 'Settings', 'bell', r('/settings')],
  [Profile, 'User', ['far', 'user'], r('/profile/(?<name>[^/]+)')],
  [
    ProfileFollowers,
    'Followers',
    'users',
    r('/profile/(?<name>[^/]+)/followers'),
  ],
  [ProfileFollows, 'Follows', 'users', r('/profile/(?<name>[^/]+)/follows')],
  [
    PostThread,
    'Post',
    ['far', 'message'],
    r('/profile/(?<name>[^/]+)/post/(?<rkey>[^/]+)'),
  ],
  [
    PostUpvotedBy,
    'Liked by',
    'heart',
    r('/profile/(?<name>[^/]+)/post/(?<rkey>[^/]+)/upvoted-by'),
  ],
  [
    PostRepostedBy,
    'Reposted by',
    'retweet',
    r('/profile/(?<name>[^/]+)/post/(?<rkey>[^/]+)/reposted-by'),
  ],
  [Debug, 'Debug', 'house', r('/sys/debug')],
  [Log, 'Log', 'house', r('/sys/log')],
]

export function match(url: string): MatchResult {
  for (const [Com, defaultTitle, icon, pattern] of routes) {
    const res = pattern.exec(url)
    if (res) {
      // TODO: query params
      return {Com, defaultTitle, icon, params: res.groups || {}}
    }
  }
  return {
    Com: NotFound,
    defaultTitle: 'Not found',
    icon: 'magnifying-glass',
    params: {},
    isNotFound: true,
  }
}
